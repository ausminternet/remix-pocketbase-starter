import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { AlertCircleIcon } from 'lucide-react'
import invariant from 'tiny-invariant'
import { commitSession, getSession } from '~/lib/oauth-session.server'

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  invariant(process.env.OAUTH_CALLBACK_URL, 'OAUTH_CALLBACK_URL is not set')

  const pb = context.pb
  const searchParams = new URL(request.url).searchParams
  const providerParam = searchParams.get('provider')

  if (!providerParam) {
    throw new Response('No Provider given.', { status: 400 })
  }

  const authMethods = await pb.collection('users').listAuthMethods()
  const provider = authMethods.authProviders.find(
    (provider) => provider.name === providerParam,
  )

  if (!provider) {
    throw new Response('Invalid Provider given.', { status: 400 })
  }

  const session = await getSession(request.headers.get('Cookie'))
  session.set('provider', provider)

  const redirectUrl = searchParams.get('redirect') || '/'

  return redirect(
    `${provider.authUrl}${process.env.OAUTH_CALLBACK_URL}?redirect=${redirectUrl}`,
    {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    },
  )
}

export function ErrorBoundary() {
  return (
    <div className="card card-bordered w-full">
      <div className="card-body space-y-4">
        <div className="card-title">
          <AlertCircleIcon />
          Oops...
        </div>
        <p>Something went wrong, please try again.</p>
        <Link to="/auth/login" className="btn btn-primary">
          Back to login
        </Link>
      </div>
    </div>
  )
}

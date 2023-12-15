import type { LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Link, useLoaderData, useNavigate } from '@remix-run/react'
import { AlertCircleIcon, CheckCircleIcon } from 'lucide-react'
import { useEffect } from 'react'
import invariant from 'tiny-invariant'
import { commitSession, getSession } from '~/sessions'

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  invariant(process.env.OAUTH_CALLBACK_URL, 'OAUTH_CALLBACK_URL is not set')

  const session = await getSession(request.headers.get('Cookie'))
  const searchParams = new URL(request.url).searchParams

  const stateParam = searchParams.get('state')
  const codeParam = searchParams.get('code')

  if (!stateParam) {
    throw new Response('No state parameter given.', { status: 400 })
  }

  if (!codeParam) {
    throw new Response('No code parameter given.', { status: 400 })
  }

  const provider = session.get('provider')

  if (stateParam !== provider.state) {
    throw new Response('Invalid state parameter given.', { status: 400 })
  }

  try {
    await context.pb
      .collection('users')
      .authWithOAuth2Code(
        provider.name,
        codeParam,
        provider.codeVerifier,
        process.env.OAUTH_CALLBACK_URL,
        {
          email: '',
          username: '',
          name: '',
          emailVisibility: false,
        },
      )
  } catch (error) {
    console.error(error)
    throw new Response('Could not authenticate.', { status: 400 })
  }

  session.unset('provider')

  const headers = new Headers()
  headers.append('Set-Cookie', context.pb.authStore.exportToCookie())
  headers.append('Set-Cookie', await commitSession(session))

  return json(
    {
      redirect: searchParams.get('redirect') || '/',
    },
    { headers },
  )
}

export default function OAuthCallback() {
  const { redirect } = useLoaderData<typeof loader>()
  const navigate = useNavigate()

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate(redirect)
    }, 3000)
    return () => {
      clearTimeout(timeout)
    }
  }, [navigate, redirect])

  return (
    <div className="card card-bordered w-full">
      <div className="card-body space-y-4">
        <div className="card-title">
          <CheckCircleIcon />
          Success
        </div>
        <p>You have been authenticated.</p>
        <p>
          You will be redirected in 3 seconds. If you are not redirected, please{' '}
          <Link to={redirect} className="link link-primary">
            click here
          </Link>
        </p>
      </div>
    </div>
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
        <p>Something went wrong while authenticating you, please try again.</p>
        <Link to="/auth/login" className="btn btn-primary">
          Back to login
        </Link>
      </div>
    </div>
  )
}

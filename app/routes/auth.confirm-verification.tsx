import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import {
  Link,
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from '@remix-run/react'
import { MailCheckIcon, MailXIcon } from 'lucide-react'
import { useEffect } from 'react'
import { getUser } from '~/lib/user-helper.server'

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  if (getUser(context)) {
    return redirect('/')
  }

  const token = new URL(request.url).searchParams.get('token')

  if (!token) {
    throw new Response('Verification token is missing.', { status: 400 })
  }

  try {
    await context.pb.collection('users').confirmVerification(token)
  } catch (error) {
    console.error(error)
    throw new Response('Invalid or expired token provided.', { status: 400 })
  }

  return json(
    { success: true },
    {
      headers: {
        'Set-Cookie': context.pb.authStore.exportToCookie(),
      },
    },
  )
}

export default function ConfirmVerification() {
  const navigate = useNavigate()

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate('/auth/login')
    }, 3000)
    return () => {
      clearTimeout(timeout)
    }
  }, [navigate])

  return (
    <div className="card card-bordered w-full">
      <div className="card-body space-y-4">
        <div className="card-title">
          <MailCheckIcon />
          Email verified
        </div>

        <p>You have successfully verified your Email.</p>

        <p>
          You will be redirected in 3 seconds. If you are not redirected, please{' '}
          <Link to="/auth/login" className="link link-primary">
            click here
          </Link>
        </p>
      </div>
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  if (isRouteErrorResponse(error)) {
    return (
      <div className="card card-bordered w-full">
        <div className="card-body space-y-4">
          <div className="card-title">
            <MailXIcon />
            Oops...
          </div>
          <p>{error.data}</p>
        </div>
      </div>
    )
  }
}

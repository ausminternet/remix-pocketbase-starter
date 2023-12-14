import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import {
  Form,
  Link,
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from '@remix-run/react'
import { MailCheckIcon, MailXIcon } from 'lucide-react'
import { useEffect } from 'react'

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const authStore = context.pb.authStore

  if (!authStore.isValid || !authStore.model) {
    return redirect('/auth/login')
  }

  if (authStore.model.verified) {
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

  try {
    await context.pb.collection('users').authRefresh()
  } catch (error) {
    console.error(error)
    context.pb.authStore.clear()
    throw new Response('Could not authenticate.', { status: 400 })
  }

  return null
}

export default function ConfirmVerification() {
  const navigate = useNavigate()

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate('/aut/login')
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
          <Link to="/" className="link link-primary">
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
          <Form method="post" className="w-full" action="/auth/verify">
            <button className="btn btn-primary w-full" type="submit">
              Resend Verification Email
            </button>
          </Form>
        </div>
      </div>
    )
  }
}

import { json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { MailXIcon, SendIcon } from 'lucide-react'

export async function action({ context }: ActionFunctionArgs) {
  const authStore = context.pb.authStore

  if (!authStore.isValid || !authStore.model) {
    return redirect('/auth/login')
  }

  if (authStore.isValid && authStore.model.verified) {
    return redirect('/')
  }

  try {
    await context.pb
      .collection('users')
      .requestVerification(authStore.model.email)
  } catch (error) {
    throw new Response('Failed to send verification Email')
  }

  return json({ success: true })
}

export const loader = ({ context }: ActionFunctionArgs) => {
  const authStore = context.pb.authStore

  if (!authStore.isValid || !authStore.model) {
    return redirect('/auth/login')
  }

  if (authStore.isValid && authStore.model.verified) {
    return redirect('/')
  }

  return null
}

export default function Verify() {
  const actionData = useActionData<typeof action>()
  return (
    <div className="card card-bordered w-full">
      <div className="card-body space-y-4">
        <div className="card-title">Email Verification</div>
        {actionData?.success && (
          <div className="alert alert-success">
            <SendIcon className="h-6 w-6" />
            Verification Email was sent again.
          </div>
        )}
        <p>
          We've sent you an email with a link to verify your account. If you
          don't see it, check your spam folder.
        </p>
        <p>
          If you still don't see it, you can resend the verification email by
          clicking the button below.
        </p>
        <div className="card-actions">
          <Form method="post" className="w-full">
            <button className="btn btn-primary w-full">
              Resend Verification Email
            </button>
          </Form>
        </div>
      </div>
    </div>
  )
}

export function ErrorBoundary() {
  return (
    <div className="card card-bordered w-full">
      <div className="card-body space-y-4">
        <div className="card-title">
          <MailXIcon />
          Oops...
        </div>
        <p>Failed to send verification email, please try again.</p>
        <div className="card-actions">
          <Form method="post" className="w-full">
            <button className="btn btn-primary w-full">
              Resend Verification Email
            </button>
          </Form>
        </div>
      </div>
    </div>
  )
}

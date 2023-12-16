import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import {
  Form,
  isRouteErrorResponse,
  useActionData,
  useLoaderData,
  useRouteError,
} from '@remix-run/react'
import { MailXIcon, SendIcon } from 'lucide-react'
import { z } from 'zod'
import { emailString } from '~/lib/schema-helper'
import { getSession } from '~/sessions'

const verifyEmailSchema = z.object({
  email: emailString,
})

export async function action({ context, request }: ActionFunctionArgs) {
  if (context.user) {
    return redirect('/')
  }

  const body = Object.fromEntries(await request.formData())
  const result = verifyEmailSchema.safeParse(body)

  if (!result.success) {
    throw json(
      {
        email: null,
      },
      {
        status: 400,
      },
    )
  }

  try {
    await context.pb.collection('users').requestVerification(result.data.email)
  } catch (error) {
    console.error(error)
    throw json(
      {
        email: result.data.email,
      },
      {
        status: 400,
      },
    )
  }

  return json({ success: true, email: result.data.email })
}

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  if (context.user) {
    return redirect('/')
  }

  const session = await getSession(request.headers.get('Cookie'))
  const email = session.get('email')

  const result = emailString.safeParse(email)

  if (!result.success) {
    throw redirect('/auth/login')
  }

  return json({
    email: result.data,
  })
}

export default function Verify() {
  const actionData = useActionData<typeof action>()
  const loaderData = useLoaderData<typeof loader>()

  const email = actionData?.success ? actionData.email : loaderData.email

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
            <input type="hidden" name="email" readOnly value={email} />
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
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    const email = error.status === 400 ? error.data.email : null

    return (
      <div className="card card-bordered w-full">
        <div className="card-body space-y-4">
          <div className="card-title">
            <MailXIcon />
            Oops...
          </div>
          <p>Something went wrong.</p>

          {email && (
            <div className="card-actions">
              <p>Please try again in a few minutes.</p>
              <Form method="post" className="w-full">
                <input type="hidden" name="email" readOnly value={email} />
                <button className="btn btn-primary w-full">
                  Resend Verification Email
                </button>
              </Form>
            </div>
          )}
        </div>
      </div>
    )
  }
}

import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { Form, useActionData, useNavigation } from '@remix-run/react'
import { SendIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { z } from 'zod'
import { Input } from '~/lib/components/Input'
import { getUser } from '~/lib/user-helper.server'

const forgotPasswordSchema = z.object({
  email: z.string(),
})

export const action = async ({ request, context }: LoaderFunctionArgs) => {
  if (getUser(context)) {
    return redirect('/')
  }

  const body = Object.fromEntries(await request.formData())
  const result = forgotPasswordSchema.safeParse(body)

  if (!result.success) {
    return json({
      success: false as const,
      errors: result.error.flatten().fieldErrors,
    })
  }

  try {
    await context.pb.collection('users').requestPasswordReset(result.data.email)
  } catch (error) {
    console.error(error)
    throw new Response('Something went wrong, please try again.', {
      status: 400,
    })
  }

  return json({
    success: true as const,
  })
}

export const loader = async ({ context }: LoaderFunctionArgs) => {
  if (getUser(context)) {
    return redirect('/')
  }

  return null
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>()

  let $form = useRef<HTMLFormElement>(null)
  let $email = useRef<HTMLInputElement>(null)
  let navigation = useNavigation()

  const fieldErrors = actionData?.success ? undefined : actionData?.errors

  useEffect(
    function resetFormOnError() {
      if (navigation.state === 'idle' && actionData?.success) {
        $form.current?.reset()
        $email.current?.blur()
      }
    },
    [navigation.state, actionData],
  )

  return (
    <div className="card card-bordered w-full">
      <div className="card-body space-y-4">
        <div className="card-title">Reset Password</div>
        {actionData?.success && (
          <div className="alert alert-success">
            <SendIcon className="h-6 w-6" />
            We've sent you an email with a link to change your password. <br />{' '}
            If you don't see it, check your spam folder.
          </div>
        )}

        <p>
          Please enter your email address. You will receive a link to create a
          new password.
        </p>

        <Form method="POST" ref={$form} id="form">
          <Input
            autoFocus
            ref={$email}
            id="email"
            type="email"
            name="email"
            label="Email Address"
            errors={fieldErrors?.email}
          />
        </Form>
        <div className="card-actions">
          <button form="form" type="submit" className="btn btn-primary w-full">
            Send Password Reset Email
          </button>
        </div>
      </div>
    </div>
  )
}

import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import {
  Form,
  Link,
  isRouteErrorResponse,
  useActionData,
  useLoaderData,
  useNavigate,
  useRouteError,
} from '@remix-run/react'
import { AlertCircleIcon } from 'lucide-react'
import { useEffect } from 'react'
import { z } from 'zod'
import { Input } from '~/lib/components/Input'
import {
  getPasswordString,
  passwordsEqualityRefinement,
} from '~/lib/schema-helper'

export const resetPasswordSchema = z
  .object({
    password: getPasswordString('New password is required'),
    passwordConfirm: getPasswordString('Confirm password is required'),
  })
  .superRefine(passwordsEqualityRefinement)

export const action = async ({ request, context }: LoaderFunctionArgs) => {
  const authStore = context.pb.authStore

  if (authStore.isValid) {
    return redirect('/')
  }

  const body = Object.fromEntries(await request.formData())
  const token = body.token

  if (typeof token != 'string') {
    throw new Response('Verification token is missing.', { status: 400 })
  }

  const result = resetPasswordSchema.safeParse(body)

  if (!result.success) {
    return json({
      success: false as const,
      errors: result.error.flatten().fieldErrors,
    })
  }

  try {
    await context.pb
      .collection('users')
      .confirmPasswordReset(
        token,
        result.data.password,
        result.data.passwordConfirm,
      )
  } catch (error) {
    console.error(error)
    throw new Response('Invalid or expired token provided.', { status: 400 })
  }

  return json({ success: true as const })
}

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const authStore = context.pb.authStore

  if (authStore.isValid) {
    return redirect('/')
  }

  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const redirectUrl = url.searchParams.get('redirect')

  if (!token) {
    throw new Response('Verification token is missing.', { status: 400 })
  }

  return json({ token, redirectUrl })
}

export default function ConfirmPasswordReset() {
  const { token } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigate = useNavigate()

  useEffect(() => {
    if (!actionData?.success) {
      return
    }

    const timeout = setTimeout(() => {
      navigate('/aut/login')
    }, 3000)
    return () => {
      clearTimeout(timeout)
    }
  }, [actionData?.success, navigate])

  if (actionData?.success) {
    return (
      <div className="card card-bordered w-full">
        <div className="card-body space-y-4">
          <div className="card-title">Password Reset</div>

          <p>
            Your password has been reset. You can now login with your new
            Password.
          </p>

          <p>
            You will be redirected to the login page in 3 seconds. If you are
            not redirected, please{' '}
            <Link to="/auth/login" className="link link-primary">
              click here
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card card-bordered w-full">
      <div className="card-body space-y-4">
        <div className="card-title">Reset Password</div>
        <Form method="post" className="w-full" id="form">
          <input type="hidden" name="token" value={token} readOnly />
          <Input
            autoFocus
            label="New Password"
            id="password"
            type="password"
            name="password"
            required
            errors={actionData?.errors?.password}
          />
          <Input
            label="Confirm Password"
            id="passwordConfirm"
            type="password"
            name="passwordConfirm"
            errors={actionData?.errors?.passwordConfirm}
            required
          />
        </Form>
        <div className="card-actions">
          <button className="btn btn-primary w-full" type="submit" form="form">
            Reset Password
          </button>
        </div>
      </div>
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  console.log(error)
  if (isRouteErrorResponse(error)) {
    return (
      <div className="card card-bordered w-full">
        <div className="card-body space-y-4">
          <div className="card-title">
            <AlertCircleIcon />
            Oops...
          </div>
          <p>Something went wrong, please try again.</p>
          <Link to="/auth/forgot-password" className="btn btn-primary w-full">
            Reset password again
          </Link>
        </div>
      </div>
    )
  }
}

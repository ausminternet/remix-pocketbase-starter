import type { LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Form,
  Link,
  isRouteErrorResponse,
  useActionData,
  useLoaderData,
  useNavigate,
  useRouteError,
} from '@remix-run/react'
import { AlertCircleIcon, MailCheckIcon } from 'lucide-react'
import { ClientResponseError } from 'pocketbase'
import { useEffect } from 'react'
import { z } from 'zod'
import { Input } from '~/lib/components/Input'
import { getPasswordString } from '~/lib/schema-helper'

class ConfirmEmailChangeError {
  constructor(
    public errors: {
      other?: string[]
      password?: string[]
    },
  ) {
    this.errors = errors
  }

  toJSON() {
    return this.errors
  }
}

const confirmEmailChangeSchema = z.object({
  password: getPasswordString('Password is required'),
  token: z.string({ required_error: 'Verification token is missing' }),
})

export const action = async ({ request, context }: LoaderFunctionArgs) => {
  const body = Object.fromEntries(await request.formData())
  const result = confirmEmailChangeSchema.safeParse(body)

  if (!result.success) {
    return json({
      success: false as const,
      errors: new ConfirmEmailChangeError(result.error.flatten().fieldErrors),
    })
  }

  try {
    await context.pb
      .collection('users')
      .confirmEmailChange(result.data.token, result.data.password)
  } catch (error) {
    if (error instanceof ClientResponseError) {
      if (error.response.data?.token?.code === 'validation_invalid_token') {
        throw new Response('Invalid or expired token provided.', {
          status: 400,
        })
      }

      if (
        error.response.data?.password?.code === 'validation_invalid_password'
      ) {
        return json({
          success: false as const,
          errors: new ConfirmEmailChangeError({
            password: ['Invalid password provided.'],
          }),
        })
      }
    }

    throw new Response('Something went wrong.', { status: 400 })
  }

  return json({ success: true as const })
}

export const loader = ({ request }: LoaderFunctionArgs) => {
  const token = new URL(request.url).searchParams.get('token')

  if (!token) {
    throw new Response('Verification token is missing.', { status: 400 })
  }

  return json({ token })
}

export default function ConfirmEmailChange() {
  const { token } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigate = useNavigate()

  useEffect(() => {
    if (!actionData?.success) {
      return
    }

    const timeout = setTimeout(() => {
      navigate('/auth/login')
    }, 3000)
    return () => {
      clearTimeout(timeout)
    }
  }, [actionData?.success, navigate])

  if (actionData?.success) {
    return (
      <div className="card card-bordered w-full">
        <div className="card-body space-y-4">
          <div className="card-title">
            <MailCheckIcon />
            Email changed
          </div>

          <p>You have successfully changed your Email.</p>

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
        <div className="card-title">Change email</div>

        {actionData?.errors.other?.length && (
          <div className="alert alert-error mb-8">
            <AlertCircleIcon className="w-6 h-6" />
            {actionData?.errors.other.map((error) => (
              <div key={error}>{error}</div>
            ))}
          </div>
        )}
        <p>To change your email, enter your password:</p>
        <Form method="POST" id="form" className="space-y-2">
          <input type="hidden" name="token" value={token} readOnly />
          <Input
            autoFocus
            name="password"
            type="password"
            label="Password"
            id="password"
            required
            errors={actionData?.errors.password}
          />
        </Form>
        <div className="card-actions">
          <button type="submit" className="btn btn-primary w-full" form="form">
            Change email
          </button>
        </div>
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
            <AlertCircleIcon />
            Oops...
          </div>
          <p>{error.data}</p>
          <Link to="/" className="btn btn-primary">
            Back to Homepage
          </Link>
        </div>
      </div>
    )
  }
}

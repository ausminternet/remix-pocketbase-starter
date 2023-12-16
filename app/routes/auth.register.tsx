import type { LoaderFunctionArgs } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { Form, Link, useActionData } from '@remix-run/react'
import { AlertCircleIcon } from 'lucide-react'
import { ClientResponseError } from 'pocketbase'
import { z } from 'zod'
import { Input } from '~/lib/components/Input'
import {
  emailString,
  getPasswordString,
  nameString,
  passwordsEqualityRefinement,
  usernameString,
} from '~/lib/schema-helper'
import { getUser } from '~/lib/user-helper.server'
import { commitSession, getSession } from '~/sessions'

class RegistrationError {
  constructor(
    public errors: {
      other?: string[]
      name?: string[]
      username?: string[]
      email?: string[]
      password?: string[]
      passwordConfirm?: string[]
    },
  ) {
    this.errors = errors
  }

  toJSON() {
    return this.errors
  }
}

export const registerUserSchema = z
  .object({
    name: nameString,
    username: usernameString,
    email: emailString,
    password: getPasswordString('Password is required'),
    passwordConfirm: getPasswordString('Confirm password is required'),
  })
  .superRefine(passwordsEqualityRefinement)

export const action = async ({ request, context }: LoaderFunctionArgs) => {
  const user = getUser(context)

  if (user) {
    return redirect('/')
  }

  const body = Object.fromEntries(await request.formData())
  const result = registerUserSchema.safeParse(body)

  if (!result.success) {
    return json({
      errors: new RegistrationError(result.error.flatten().fieldErrors),
    })
  }

  try {
    await context.pb.collection('users').create(result.data)
  } catch (error) {
    console.error(error)
    if (error instanceof ClientResponseError) {
      if (error.response.data?.email?.code === 'validation_invalid_email') {
        return json({
          errors: new RegistrationError({
            email: ['Email is already in use.'],
          }),
        })
      }

      if (
        error.response.data?.username?.code === 'validation_invalid_username'
      ) {
        return json({
          errors: new RegistrationError({
            username: ['Username is already in use.'],
          }),
        })
      }

      return json({
        errors: new RegistrationError({
          other: ['Failed to register, please try again.'],
        }),
      })
    }
  }

  try {
    await context.pb.collection('users').requestVerification(result.data.email)
  } catch (error) {
    return json({
      errors: new RegistrationError({
        other: ['Failed to send verification email, please try again.'],
      }),
    })
  }

  const session = await getSession(request.headers.get('Cookie'))
  session.set('email', result.data.email)

  return redirect('/auth/verify', {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  })
}

export const loader = ({ context }: LoaderFunctionArgs) => {
  if (getUser(context)) {
    return redirect('/')
  }

  return null
}

export default function Register() {
  const actionData = useActionData<typeof action>()

  return (
    <div className="card card-bordered w-full">
      <div className="card-body space-y-4 ">
        <div className="card-title">Create Account</div>
        {actionData?.errors.other && (
          <div className="alert alert-error">
            <AlertCircleIcon className="h-6 w-6" />
            {actionData?.errors.other}
          </div>
        )}
        <Form method="POST" id="form" className="space-y-2">
          <Input
            autoFocus
            name="email"
            type="email"
            label="Email"
            id="email"
            required
            errors={actionData?.errors.email}
          />

          <Input
            name="username"
            type="text"
            label="Username"
            id="username"
            required
            errors={actionData?.errors.username}
          />

          <Input
            name="name"
            type="text"
            label="Name (optional)"
            id="name"
            errors={actionData?.errors.name}
          />

          <Input
            name="password"
            type="password"
            label="Password"
            id="password"
            required
            errors={actionData?.errors.password}
          />

          <Input
            name="passwordConfirm"
            type="password"
            label="Confirm Password"
            id="passwordConfirm"
            errors={actionData?.errors.passwordConfirm}
          />
        </Form>
        <div className="card-actions gap-4">
          <button form="form" className="btn btn-primary w-full">
            Register
          </button>
          <div className="text-center w-full">
            Already have an account?{' '}
            <Link to="/auth/login" className="link link-primary">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

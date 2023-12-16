import { json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import {
  Form,
  isRouteErrorResponse,
  useActionData,
  useLoaderData,
  useNavigation,
  useRouteError,
} from '@remix-run/react'
import { AlertCircleIcon, CheckCircleIcon } from 'lucide-react'
import type { AuthMethodsList, ExternalAuthModel } from 'pocketbase'
import { useEffect, useRef } from 'react'
import { z } from 'zod'
import { Input } from '~/lib/components/Input'
import { Title } from '~/lib/components/Title'
import {
  getPasswordString,
  passwordsEqualityRefinement,
} from '~/lib/schema-helper'
import { requireUser } from '~/lib/user-helper.server'

class ChangePasswordError {
  constructor(
    public errors: {
      other?: string[]
      oldPassword?: string[]
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

const changePasswordSchema = z
  .object({
    oldPassword: getPasswordString('Current password is required'),
    password: getPasswordString('New password is required'),
    passwordConfirm: getPasswordString('Confirm password is required'),
  })
  .superRefine(passwordsEqualityRefinement)

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = requireUser(request, context)

  const body = Object.fromEntries(await request.formData())
  const result = changePasswordSchema.safeParse(body)

  if (!result.success) {
    return json({
      success: false as const,
      errors: new ChangePasswordError(result.error.flatten().fieldErrors),
    })
  }

  try {
    await context.pb.collection('users').update(user.id, result.data)
  } catch (error) {
    return json({
      success: false as const,
      errors: new ChangePasswordError({
        other: [
          'An error occurred while changing your password. Please try again.',
        ],
      }),
    })
  }

  try {
    await context.pb
      .collection('users')
      .authWithPassword(user.email, result.data.password)
  } catch (error) {
    console.error(error)
    context.pb.authStore.clear()
    return redirect('/auth/login', {
      headers: {
        'Set-Cookie': context.pb.authStore.exportToCookie(),
      },
    })
  }

  return json(
    { success: true as const },
    {
      headers: {
        'Set-Cookie': context.pb.authStore.exportToCookie(),
      },
    },
  )
}

export const loader = async ({ request, context }: ActionFunctionArgs) => {
  const user = requireUser(request, context)

  let auths: ExternalAuthModel[] = []

  try {
    auths = await context.pb.collection('users').listExternalAuths(user.id)
  } catch (error) {
    throw new Response('Could not load external auths.', { status: 500 })
  }

  if (auths.length === 0) {
    return json({ provider: null })
  }

  let authMethods: AuthMethodsList

  try {
    authMethods = await context.pb.collection('users').listAuthMethods()
  } catch (error) {
    throw new Response('Could not load auth providers.', { status: 500 })
  }

  const provider = authMethods.authProviders.find(
    (authProvider) => authProvider.name === auths[0]?.provider,
  )

  if (!provider) {
    throw new Response('Could not load auth provider.', { status: 500 })
  }

  return json({ provider })
}

export default function Password() {
  const { provider } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const errors = actionData?.success ? {} : actionData?.errors ?? {}

  let $form = useRef<HTMLFormElement>(null)
  let navigation = useNavigation()

  useEffect(
    function resetFormOnError() {
      if (navigation.state === 'idle' && actionData?.success) {
        $form.current?.reset()
      }
    },
    [navigation.state, actionData],
  )

  if (provider) {
    return (
      <div>
        <Title>Change Password</Title>
        <div className="alert alert-info">
          <AlertCircleIcon className="h-6 w-6" />
          You are currently logged in with {provider.displayName} and can not
          change your password here.
        </div>
      </div>
    )
  }

  return (
    <div>
      <Title>Change Password</Title>

      {actionData?.success && (
        <div className="alert alert-success mb-4">
          <CheckCircleIcon className="h-6 w-6" />
          Your password has been successfully changed.
        </div>
      )}

      <Form method="post" className="max-w-lg space-y-4" ref={$form}>
        <Input
          label="Current Password"
          name="oldPassword"
          type="password"
          errors={errors.oldPassword}
          required
        />

        <Input
          label="New Password"
          name="password"
          type="password"
          errors={errors.password}
          required
        />
        <Input
          label="Confirm Password"
          name="passwordConfirm"
          type="password"
          errors={errors.passwordConfirm}
          required
        />
        <button
          className="btn btn-primary"
          disabled={navigation.state !== 'idle'}
        >
          Change Password
        </button>
      </Form>
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <Title>Change Password</Title>
        <div className="alert alert-error">
          <AlertCircleIcon className="h-6 w-6" />
          {error.data}
          Something went wrong, please try again.
        </div>
      </div>
    )
  }
}

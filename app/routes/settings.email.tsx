import type { ActionFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { AlertCircleIcon, MailCheckIcon } from 'lucide-react'
import type { AuthMethodsList, ExternalAuthModel } from 'pocketbase'
import { z } from 'zod'
import { Input } from '~/lib/components/Input'
import { Title } from '~/lib/components/Title'
import { emailString } from '~/lib/schema-helper'
import { requireUser } from '~/lib/user-helper.server'

class ChangeEmailError {
  constructor(
    public errors: {
      other?: string[]
      email?: string[]
    },
  ) {
    this.errors = errors
  }

  toJSON() {
    return this.errors
  }
}

const changeEmailSchema = z.object({
  email: emailString,
})

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const body = Object.fromEntries(await request.formData())
  const result = changeEmailSchema.safeParse(body)

  if (!result.success) {
    return json({
      success: false as const,
      errors: new ChangeEmailError(result.error.flatten().fieldErrors),
    })
  }

  try {
    await context.pb.collection('users').requestEmailChange(result.data.email)
  } catch (error) {
    return json({
      success: false as const,
      errors: new ChangeEmailError({
        other: ['Something went wrong, please try again.'],
      }),
    })
  }

  return json({ success: true as const })
}

export const loader = async ({ request, context }: ActionFunctionArgs) => {
  const user = requireUser(request, context)

  let auths: ExternalAuthModel[] = []

  try {
    auths = await context.pb.collection('users').listExternalAuths(user.id)
  } catch (error) {
    throw new Response('Could not load external auths.', { status: 500 })
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

  return json({ provider, user })
}

export default function Email() {
  const { provider, user } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  const errors = actionData?.success ? {} : actionData?.errors ?? {}

  if (actionData?.success) {
    return (
      <div>
        <Title>Change Email</Title>
        <div className="alert alert-success">
          <MailCheckIcon className="h-6 w-6" />
          Your email change request has been received.
          <br />
          Please check your email for further instructions.
        </div>
      </div>
    )
  }

  if (provider) {
    return (
      <div>
        <Title>Change Email</Title>
        <div className="alert alert-info">
          <AlertCircleIcon className="h-6 w-6" />
          You are currently logged in with {provider.displayName} and can not
          change your email here.
        </div>
      </div>
    )
  }

  return (
    <div>
      <Title>Email</Title>

      {errors.other?.length && (
        <div className="alert alert-danger mb-8">
          <AlertCircleIcon className="h-6 w-6" />
          {errors.other.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      )}

      <p className="mb-8">
        Your current email is <strong>{user.email}</strong>.
      </p>

      <Form method="post" className="space-y-4">
        <Input
          label="New email"
          name="email"
          type="email"
          required
          errors={errors.email}
        />
        <button className="btn btn-primary">Request email change</button>
      </Form>
    </div>
  )
}

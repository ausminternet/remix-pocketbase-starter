import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { CheckCircleIcon } from 'lucide-react'
import { z } from 'zod'
import { Input } from '~/lib/components/Input'
import { Title } from '~/lib/components/Title'
import { nameString, usernameString } from '~/lib/schema-helper'
import { requireUser } from '~/lib/user-helper.server'

class ChangeProfileError {
  constructor(
    public errors: {
      other?: string[]
      username?: string[]
      name?: string[]
    },
  ) {
    this.errors = errors
  }

  toJSON() {
    return this.errors
  }
}

const changeProfileSchema = z.object({
  username: usernameString,
  name: nameString,
})

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = requireUser(request, context)

  const body = Object.fromEntries(await request.formData())
  const result = changeProfileSchema.safeParse(body)

  if (!result.success) {
    return json({
      success: false as const,
      errors: new ChangeProfileError(result.error.flatten().fieldErrors),
    })
  }

  try {
    await context.pb.collection('users').update(user.id, {
      username: result.data.username,
      name: result.data.name,
    })
  } catch (error) {
    return json({
      success: false as const,
      errors: new ChangeProfileError({
        other: ['Something went wrong, please try again.'],
      }),
    })
  }

  return json({ success: true as const })
}

export const loader = ({ request, context }: LoaderFunctionArgs) => {
  const user = requireUser(request, context)

  return json({ user })
}

export default function Profile() {
  const { user } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  const errors = actionData?.success ? {} : actionData?.errors ?? {}

  return (
    <div>
      <Title>Profile</Title>

      {actionData?.success && (
        <div className="alert alert-success mb-8">
          <CheckCircleIcon className="w-6 h-6" />
          Your profile has been successfully updated.
        </div>
      )}

      <Form method="post" className="mb-8 space-y-4">
        <Input
          label="Username"
          name="username"
          defaultValue={user.username}
          required
          errors={errors.username}
        />

        <Input
          label="Name"
          name="name"
          defaultValue={user.name}
          required
          errors={errors.name}
        />
        <button className="btn btn-primary">Save profile</button>
      </Form>
    </div>
  )
}

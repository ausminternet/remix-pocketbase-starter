import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { CheckCircleIcon, UserRoundIcon } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { Input } from '~/lib/components/Input'
import { Title } from '~/lib/components/Title'
import {
  avatarFileString,
  nameString,
  usernameString,
} from '~/lib/schema-helper'
import { requireUser } from '~/lib/user-helper.server'
import { getSizeForMegaBytes } from '~/lib/utils'
import { getAvatarURL } from '~/lib/utils.server'

class ChangeProfileError {
  constructor(
    public errors: {
      other?: string[]
      username?: string[]
      name?: string[]
      avatar?: string[]
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
  avatar: avatarFileString,
})

enum Action {
  RemoveAvatar = 'removeAvatar',
  SaveProfile = 'save',
}

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const user = requireUser(request, context)

  const body = Object.fromEntries(await request.formData())

  if (body.action === Action.RemoveAvatar) {
    try {
      await context.pb.collection('users').update(user.id, {
        avatar: null,
      })
    } catch (error) {
      return json({
        success: false as const,
        errors: new ChangeProfileError({
          other: ['Something went wrong, please try again.'],
        }),
      })
    }

    return json({ success: true as const, avatarUrl: getAvatarURL(user) })
  }

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
      avatar: result.data.avatar ? result.data.avatar : null,
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

  return json({ user, avatarUrl: getAvatarURL(user) })
}

export default function Profile() {
  const { user } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const [avatarSrc, setAvatarSrc] = useState<string | null>(user.avatar)
  const [isDirty, setIsDirty] = useState(false)

  const [errors, setErrors] = useState<ChangeProfileError['errors']>(
    actionData?.success ? {} : actionData?.errors ?? {},
  )

  // useEffect(() => {
  //   if (actionData?.success) {
  //     setAvatarSrc(getAvatarURL(user))
  //   }
  // }, [actionData?.success, user])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (file.size > getSizeForMegaBytes(2)) {
      setErrors((errors) => ({
        ...errors,
        avatar: ['Max file size is 2MB.'],
      }))

      return
    }

    setAvatarSrc(URL.createObjectURL(file))
  }

  return (
    <div>
      <Title>Profile</Title>

      {actionData?.success && (
        <div className="alert alert-success mb-8">
          <CheckCircleIcon className="w-6 h-6" />
          Your profile has been successfully updated.
        </div>
      )}

      {avatarSrc ? (
        <div className="avatar mb-1">
          <div className="w-24 rounded-full">
            <img src={avatarSrc} alt="Avatar" />
          </div>
        </div>
      ) : (
        <div className="avatar placeholder mb-1">
          <div className="bg-neutral text-neutral-content rounded-full w-24">
            <span className="text-3xl">
              <UserRoundIcon className="w-16 h-16 stroke-1" />
            </span>
          </div>
        </div>
      )}

      <Form
        method="post"
        className="mb-8 space-y-4"
        encType="multipart/form-data"
        onChange={() => setIsDirty(true)}
      >
        <Input
          type="file"
          accept="image/*"
          name="avatar"
          onChange={handleFileChange}
          errors={errors.avatar}
        />
        <button
          className="btn btn-error"
          name="action"
          value={Action.RemoveAvatar}
          disabled={!user.avatar}
        >
          Delete avatar
        </button>
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
          errors={errors.name}
        />
        <button
          className="btn btn-primary"
          name="action"
          value={Action.SaveProfile}
          disabled={!isDirty}
        >
          Save profile
        </button>
      </Form>
    </div>
  )
}

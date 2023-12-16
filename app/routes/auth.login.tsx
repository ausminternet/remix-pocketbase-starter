import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react'
import clsx from 'clsx'
import { AlertCircleIcon } from 'lucide-react'
import { ClientResponseError } from 'pocketbase'
import { useEffect, useRef } from 'react'
import { z } from 'zod'
import { Input } from '~/lib/components/Input'
import { commitSession, getSession } from '~/sessions'

const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const action = async ({ request, context }: ActionFunctionArgs) => {
  if (context.user) {
    return redirect('/')
  }

  const body = Object.fromEntries(await request.formData())

  const result = loginUserSchema.safeParse(body)

  if (!result.success) {
    return json({ error: true })
  }

  try {
    await context.pb
      .collection('users')
      .authWithPassword(result.data.email, result.data.password)
  } catch (error) {
    if (error instanceof ClientResponseError) {
      console.log(error)
      if (error.status === 403) {
        const session = await getSession(request.headers.get('Cookie'))
        session.set('email', result.data.email)

        return redirect('/auth/verify', {
          headers: {
            'Set-Cookie': await commitSession(session),
          },
        })
      }

      return json({ error: true })
    }
  }

  if (!context.pb.authStore.isValid) {
    return json({ error: true })
  }

  const redirectUrl = new URL(request.url).searchParams.get('redirect') || '/'

  const headers = new Headers()
  if (context.pb.authStore.model?.verified) {
    headers.set('Set-Cookie', context.pb.authStore.exportToCookie())
  }

  return redirect(
    !context.pb.authStore.model?.verified ? '/auth/verify' : redirectUrl,
    {
      headers,
    },
  )
}

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const redirectUrl = new URL(request.url).searchParams.get('redirect') ?? '/'
  console.log(context.user)
  if (context.user) {
    return redirect(redirectUrl)
  }

  return json({
    redirectUrl,
    authMethods: await context.pb.collection('users').listAuthMethods(),
  })
}

export default function Login() {
  const { redirectUrl, authMethods } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  let $form = useRef<HTMLFormElement>(null)
  let navigation = useNavigation()

  useEffect(
    function resetFormOnError() {
      if (navigation.state === 'idle' && actionData?.error) {
        $form.current?.reset()
      }
    },
    [navigation.state, actionData],
  )

  return (
    <div className="card card-bordered w-full">
      <div className="card-body space-y-4">
        <div className="card-title">Login</div>
        {actionData?.error && (
          <div className="alert alert-error">
            <AlertCircleIcon className="h-6 w-6" />
            Invalid email or password. Please try again.
          </div>
        )}
        <Form method="POST" ref={$form} id="form" className="space-y-2">
          <Input
            tabIndex={1}
            autoFocus
            name="email"
            label="Email"
            type="email"
            required
            id="email"
          />
          <Input
            tabIndex={2}
            name="password"
            label="Password"
            labelRight={
              <Link
                to="/auth/forgot-password"
                className="underline hover:opacity-75"
              >
                Forgot password?
              </Link>
            }
            type="password"
            required
            id="password"
          />

          <input type="hidden" name="fromUrl" value={redirectUrl} readOnly />

          <input type="hidden" name="auth" value="form" readOnly />
        </Form>
        <div className="card-actions gap-4">
          <button
            tabIndex={3}
            form="form"
            className={clsx('btn btn-primary w-full', {
              'btn-disabled': navigation.state !== 'idle',
            })}
          >
            Login
          </button>

          {authMethods.authProviders.length > 0 && (
            <>
              <div className="divider w-full">
                or use one of the following providers:
              </div>

              <div className="space-y-4 w-full">
                {authMethods.authProviders.map((provider) => (
                  <Link
                    key={provider.name}
                    to={`/auth/oauth-create?redirect=${redirectUrl}&provider=${provider.name}`}
                    className={clsx('btn w-full', {
                      'btn-disabled': navigation.state !== 'idle',
                    })}
                  >
                    Login with {provider.displayName}
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="text-center w-full">
            Don't have an account?{' '}
            <Link to="/auth/register" className="link link-primary">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

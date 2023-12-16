import { cssBundleHref } from '@remix-run/css-bundle'
import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Form,
  Link,
  Links,
  LiveReload,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'
import clsx from 'clsx'
import tailwindCss from '~/tailwind.css'

export const meta: MetaFunction = () => {
  return [{ title: 'Remix + Pocketbase' }]
}

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
  { rel: 'stylesheet', href: tailwindCss },
]

export const loader = ({ context }: LoaderFunctionArgs) => {
  return json(
    { user: context.user },
    {
      headers: {
        'Set-Cookie': context.pb.authStore.exportToCookie(),
      },
    },
  )
}

export default function App() {
  const { user } = useLoaderData<typeof loader>()

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-primary/5 min-h-screen">
        <div className="container p-4 max-w-3xl">
          <div className="text-2xl font-bold mb-4">
            Remix & PocketBase Starter
          </div>
          <div className="flex sm:flex-row flex-col justify-between mb-4 gap-2">
            <div className="flex gap-2">
              <strong>Pages:</strong>
              <NavLink
                to="/"
                className={({ isActive }) => {
                  return clsx('link link-primary link-hover', {
                    'link-secondary': isActive,
                  })
                }}
              >
                Home
              </NavLink>
              <NavLink
                end
                to="/protected"
                className={({ isActive }) => {
                  return clsx('link link-primary link-hover', {
                    'link-secondary': isActive,
                  })
                }}
              >
                Protected
              </NavLink>
            </div>
            <div className="flex gap-2">
              <strong>Auth: </strong>
              {user ? (
                <>
                  {user.avatar && (
                    <div className="avatar">
                      <div className="w-6 rounded-full">
                        <img src={user.avatar} alt="" />
                      </div>
                    </div>
                  )}
                  <Form method="post" action="/auth/logout">
                    <button className="link link-primary link-hover">
                      Logout ({user.email})
                    </button>
                  </Form>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) => {
                      return clsx('link link-primary link-hover', {
                        'link-secondary': isActive,
                      })
                    }}
                  >
                    Settings
                  </NavLink>
                </>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    className="link link-primary link-hover"
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth/register"
                    className="link link-primary link-hover"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="divider"></div>

          <Outlet />
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

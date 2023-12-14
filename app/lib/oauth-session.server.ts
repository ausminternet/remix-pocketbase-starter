import type { SessionData } from '@remix-run/node'
import { createCookieSessionStorage } from '@remix-run/node'

export const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData>({
    cookie: {
      secrets: ['s3cret1'],
      name: 'oauthProviderState',
    },
  })

import type { AppLoadContext } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import type { UsersResponse } from './pocketbase-types'

export const requireUser = (
  request: Request,
  context: AppLoadContext,
): UsersResponse => {
  if (!context.user) {
    throw redirect('/auth/login?redirect=' + new URL(request.url).pathname)
  }

  return context.user
}

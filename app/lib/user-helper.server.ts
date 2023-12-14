import type { AppLoadContext } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import type { UsersResponse } from './pocketbase-types'

export const requireUser = (
  request: Request,
  context: AppLoadContext,
): UsersResponse => {
  const authStore = context.pb.authStore

  if (!authStore.isValid || !authStore.model) {
    throw redirect('/auth/login?redirect=' + new URL(request.url).pathname)
  }

  if (!authStore.model.verified) {
    throw redirect('/auth/verify')
  }

  return authStore.model
}

export const getUser = (context: AppLoadContext): UsersResponse | null => {
  const authStore = context.pb.authStore

  if (!authStore.isValid || !authStore.model) {
    return null
  }

  if (!authStore.model.verified) {
    throw redirect('/auth/verify')
  }

  return authStore.model
}

/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

import type { TypedPocketBase, UsersResponse } from '~/lib/pocketbase-types'

declare module '@remix-run/node' {
  export interface AppLoadContext {
    pb: TypedPocketBase & {
      authStore: {
        user: UsersResponse | null
      }
    }
    user: UsersResponse | null
  }
}

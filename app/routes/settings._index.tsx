import type { LoaderFunctionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { requireUser } from '~/lib/user-helper.server'

export const loader = ({ request, context }: LoaderFunctionArgs) => {
  requireUser(request, context)

  return redirect('/settings/profile')
}

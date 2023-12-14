import type { ActionFunctionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'

export const action = ({ context }: ActionFunctionArgs) => {
  context.pb.authStore.clear()

  return redirect('/', {
    headers: {
      'Set-Cookie': context.pb.authStore.exportToCookie(),
    },
  })
}

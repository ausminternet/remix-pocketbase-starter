import type { LoaderFunctionArgs } from '@remix-run/node'
import { Title } from '~/lib/components/Title'
import { requireUser } from '~/lib/user-helper.server'

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  requireUser(request, context)
  return null
}

export default function Protected() {
  return (
    <div className="container">
      <Title>Protected</Title>
      <p>This page can only be seen by authenticated users, congrats!</p>
    </div>
  )
}

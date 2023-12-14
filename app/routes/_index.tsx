import type { MetaFunction } from '@remix-run/node'
import { Title } from '~/lib/components/Title'

export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ]
}

export default function Index() {
  return (
    <div>
      <Title>Home</Title>
      <p>Everyone can see this page. Nothing secret here...</p>
    </div>
  )
}

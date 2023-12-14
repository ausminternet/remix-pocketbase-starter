import { Outlet } from '@remix-run/react'

export default function Auth() {
  return (
    <div className="mx-auto flex justify-center max-w-md">
      <Outlet />
    </div>
  )
}

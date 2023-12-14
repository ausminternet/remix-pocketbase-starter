import { NavLink, Outlet } from '@remix-run/react'
import clsx from 'clsx'

export default function Settings() {
  return (
    <div>
      <div className="flex gap-2 md:flex-row">
        <strong>Settings:</strong>
        <NavLink
          to="/settings/profile"
          className={({ isActive }) => {
            return clsx('link link-primary link-hover', {
              'link-secondary': isActive,
            })
          }}
        >
          Profile
        </NavLink>
        <NavLink
          to="/settings/password"
          className={({ isActive }) => {
            return clsx('link link-primary link-hover', {
              'link-secondary': isActive,
            })
          }}
        >
          Password
        </NavLink>
        <NavLink
          to="/settings/email"
          className={({ isActive }) => {
            return clsx('link link-primary link-hover', {
              'link-secondary': isActive,
            })
          }}
        >
          Email
        </NavLink>
      </div>
      <div className="divider"></div>
      <Outlet />
    </div>
  )
}

import type { FC, PropsWithChildren } from 'react'

export const Title: FC<PropsWithChildren> = ({ children }) => {
  return (
    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
      {children}
    </h1>
  )
}

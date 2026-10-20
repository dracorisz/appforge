import React from 'react'
import { Stack } from './Surface'

export function PageContainer({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mx-auto min-w-0 w-full max-w-7xl ${className}`} {...props}>
      {children}
    </div>
  )
}

export function PageSection({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <Stack as="section" gap={4} className={`min-w-0 w-full ${className}`} {...props}>
      {children}
    </Stack>
  )
}

export function Toolbar({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-2 ${className}`} {...props}>
      {children}
    </div>
  )
}

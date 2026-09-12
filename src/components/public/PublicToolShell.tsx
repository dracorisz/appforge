import React from 'react'
import { PublicFooter } from './PublicFooter'
import { PublicHeader } from './PublicHeader'

export function PublicToolShell({ children }: { children: React.ReactNode; toolName?: string; toolIcon?: React.ReactNode }) {
  return (
    <div className="dark flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

        <div className="app-content w-full [&>div:first-child]:!mx-0 [&>div:first-child]:!w-full [&>div:first-child]:!max-w-none [&>div:first-child]:!p-0">{children}</div>
      </main>
      <PublicFooter />
    </div>
  )
}

import React from 'react'
import { AppHeading } from '@/components/layout/AppHeading'
import { PublicFooter } from './PublicFooter'
import { PublicHeader } from './PublicHeader'

export function PublicToolShell({ children }: { children: React.ReactNode; toolName?: string; toolIcon?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-4 lg:px-8">
        <div className="app-unified-shell w-full">
          <section className="app-page-header surface-card mx-auto mb-4 rounded-xl border border-border bg-card p-4 text-center sm:p-4">
            <AppHeading />
          </section>
          <div className="app-content mx-auto w-full [&_.app-heading]:hidden [&>div:first-child]:!mx-0 [&>div:first-child]:!w-full [&>div:first-child]:!max-w-none [&>div:first-child]:!p-0">{children}</div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}

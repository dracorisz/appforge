import React from 'react'
import { AppHeading } from '@/components/layout/AppHeading'
import { PublicFooter } from './PublicFooter'
import { PublicHeader } from './PublicHeader'

export function PublicToolShell({ children }: { children: React.ReactNode; toolName?: string; toolIcon?: React.ReactNode }) {
  return (
    <div className="dark flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 lg:px-8">
        <div className="app-unified-shell w-full">
          <section className="app-page-header surface-card mb-5 rounded-xl border border-border/80 p-4 sm:p-5">
            <AppHeading />
          </section>
          <div className="app-content w-full [&_.app-heading]:hidden [&>div:first-child]:!mx-0 [&>div:first-child]:!w-full [&>div:first-child]:!max-w-none [&>div:first-child]:!p-0">{children}</div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}

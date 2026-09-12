import React from 'react'
import { Link } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { PublicHeader } from './PublicHeader'

export function PublicToolShell({ children, toolName, toolIcon }: { children: React.ReactNode; toolName?: string; toolIcon?: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        {toolName && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/44 px-3 py-2.5 text-xs text-muted-foreground shadow-sm backdrop-blur-lg">
            <div className="flex min-w-0 items-center gap-2">
              {toolIcon && <span className="shrink-0 text-foreground" aria-hidden="true">{toolIcon}</span>}
              <span className="truncate font-semibold text-foreground">{toolName}</span>
              <span className="text-border">•</span>
              <span>Public tool</span>
            </div>
            <Link to="/login" className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border/70 px-2.5 text-[11px] font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" /> Sign in to sync
            </Link>
          </div>
        )}
        <div className="app-content w-full [&>div:first-child]:!mx-0 [&>div:first-child]:!w-full [&>div:first-child]:!max-w-none">{children}</div>
      </main>
      <footer className="border-t border-border/65 bg-background/75"><div className="mx-auto flex w-full max-w-[1500px] flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span>AppForge public tools.</span><span>Sign in for synced history, profile, favorites, private storage and protected features.</span></div></footer>
    </div>
  )
}

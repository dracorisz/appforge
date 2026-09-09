import React from 'react'
import { Link } from 'react-router-dom'
import { BuildBadge } from '@/components/ui'

export function PublicToolShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-2.5"><img src="/favicon.svg" alt="AppForge" className="h-8 w-8 shrink-0" /><div className="min-w-0"><div className="truncate text-sm font-semibold">AppForge</div><div className="truncate text-[11px] text-muted-foreground">Guest tool</div></div></Link>
          <div className="ml-auto flex items-center gap-2"><BuildBadge compact /><Link to="/login" className="rounded-lg border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:border-foreground/20 hover:bg-accent/60">Sign in</Link></div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-border/65 bg-background/75"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span>AppForge guest tools: Dragon Arena, Weather Now, Any Converter and Scrapper Pro.</span><span>Sign in for synced history, profile, favorites, private storage and protected features.</span></div></footer>
    </div>
  )
}

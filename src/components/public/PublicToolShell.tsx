import React from 'react'
import { PublicHeader } from './PublicHeader'

export function PublicToolShell({ children }: { children: React.ReactNode; toolName?: string; toolIcon?: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-border/65 bg-background/75"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span>AppForge public tools.</span><span>Sign in for synced history, profile, favorites, private storage and protected features.</span></div></footer>
    </div>
  )
}

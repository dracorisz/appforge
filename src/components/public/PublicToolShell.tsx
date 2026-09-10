import React from 'react'
import { Link } from 'react-router-dom'
import { HeartHandshake, Youtube } from 'lucide-react'
import { BuildBadge } from '@/components/ui'

const SUPPORT_URL = 'https://www.paypal.com/paypalme/dracorisz'
const YOUTUBE_URL = 'https://www.youtube.com/@AppForgeDragon'

export function PublicToolShell({ children, toolName = 'Guest tool', toolIcon }: { children: React.ReactNode; toolName?: string; toolIcon?: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <img src="/favicon.svg" alt="AppForge" className="h-8 w-8 shrink-0" />
            {toolIcon && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted text-foreground" aria-hidden="true">{toolIcon}</span>}
            <div className="min-w-0"><div className="truncate text-sm font-semibold">AppForge</div><div className="truncate text-[11px] text-muted-foreground">{toolName}</div></div>
          </Link>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 px-2.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="AppForge YouTube channel"><Youtube className="h-3.5 w-3.5" /> <span className="hidden sm:inline">YouTube</span></a>
            <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 px-2.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Support AppForge"><HeartHandshake className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Support</span></a>
            <BuildBadge compact />
            <Link to="/login" className="rounded-lg border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:border-foreground/20 hover:bg-accent/60">Sign in</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-border/65 bg-background/75"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span>AppForge guest tools: AI Integrations, Weather Now, Any Converter and Getter Pro.</span><span>Sign in for synced history, profile, favorites, private storage and protected features.</span></div></footer>
    </div>
  )
}

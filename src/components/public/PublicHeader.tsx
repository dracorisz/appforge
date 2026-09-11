import React from 'react'
import { Heart, History } from 'lucide-react'
import { SiGithub as Github } from 'react-icons/si'
import { Link } from 'react-router-dom'
import { BUILD_INFO } from '@/lib/buildInfo'

const APPFORGE_MARK = '/favicon.svg?v=2'

const navItemClass = 'inline-flex h-9 items-center gap-2 rounded-lg border border-border/70 bg-background/70 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function PublicHeader({ className = '' }: { className?: string }) {
  return (
    <header className={`sticky top-0 z-40 border-b border-border/60 bg-black/90 backdrop-blur-xl ${className}`}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/landing" className="group inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
          <img src={APPFORGE_MARK} alt="AppForge" className="h-10 w-10 shrink-0 rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-[1.04]" decoding="async" />
          <span className="text-sm font-semibold tracking-tight">AppForge</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2" aria-label="Public navigation">
          <a href="https://paypal.me/dracorisz" target="_blank" rel="noopener noreferrer" aria-label="Support AppForge via PayPal" title="Support AppForge" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-background/70 text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"><Heart className="h-4 w-4" /></a>
          <Link to="/explore" className={navItemClass}>Apps</Link>
          <Link to="/blog" className={navItemClass}>Blog</Link>
          <Link to="/changelog" className={navItemClass}><History className="h-4 w-4" /><span className="hidden sm:inline">Changelog</span></Link>
          <a href="https://github.com/dracorisz/appforge" target="_blank" rel="noopener noreferrer" className={navItemClass}><Github className="h-4 w-4" /><span className="hidden sm:inline">GitHub</span></a>
          <span className="inline-flex h-9 items-center rounded-lg border border-border/70 bg-background/70 px-3 text-xs font-semibold text-muted-foreground">v{BUILD_INFO.version}</span>
        </nav>
      </div>
    </header>
  )
}

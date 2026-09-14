import React from 'react'
import { Link } from 'react-router-dom'
import { BUILD_INFO } from '@/lib/buildInfo'

export function PublicFooter() {
  return <footer className="mt-auto shrink-0 border-t border-border/60">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-8">
      <Link to="/landing" className="inline-flex items-center gap-2 hover:text-foreground"><img src="/favicon.svg?v=2" alt="" className="h-5 w-5" />AppForge · v{BUILD_INFO.version}</Link>
      <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link to="/apps" className="hover:text-foreground">Public Apps</Link>
        <Link to="/blog" className="hover:text-foreground">Blog</Link>
        {/* <Link to="/changelog" className="hover:text-foreground">Changelog</Link> */}
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
        {/* <a href="https://paypal.me/dracorisz" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Support</a> */}
        <a href="https://docs.sstoken.space/" className="hover:text-foreground">Docs</a>
      </nav>
    </div>
  </footer>
}

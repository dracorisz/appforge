import React from 'react'
import { BUILD_INFO } from '@/lib/buildInfo'

const APP_ORIGIN = 'https://www.sstoken.space'
const DOCS_ORIGIN = 'https://docs.sstoken.space'

export function PublicFooter() {
  return <footer className="mt-auto shrink-0 border-t border-border/60">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-8">
      <a href={`${APP_ORIGIN}/landing`} className="inline-flex items-center gap-2 hover:text-foreground"><img src="/favicon.svg?v=2" alt="" className="h-5 w-5" />AppForge · v{BUILD_INFO.version}</a>
      <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <a href={`${APP_ORIGIN}/apps`} className="hover:text-foreground">Public Apps</a>
        <a href={`${APP_ORIGIN}/blog`} className="hover:text-foreground">Blog</a>
        <a href={`${APP_ORIGIN}/huggingface`} className="hover:text-foreground">Hugging Face</a>
        <a href={`${APP_ORIGIN}/privacy`} className="hover:text-foreground">Privacy</a>
        <a href={`${APP_ORIGIN}/terms`} className="hover:text-foreground">Terms</a>
        <a href={`${DOCS_ORIGIN}/`} className="hover:text-foreground">Docs</a>
      </nav>
    </div>
  </footer>
}

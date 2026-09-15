import React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { BUILD_INFO } from '@/lib/buildInfo'
import { useTheme, type ThemeMode } from '@/hooks/useTheme'
import { Button } from '@/components/ui'

const APP_ORIGIN = 'https://www.sstoken.space'
const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { mode: 'light', label: 'Light theme', icon: Sun },
  { mode: 'dark', label: 'Dark theme', icon: Moon },
  { mode: 'system', label: 'System theme', icon: Monitor },
]

export function PublicFooter() {
  const { mode, setMode } = useTheme()
  return <footer className="mt-auto shrink-0 border-t border-border/60 bg-background">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-8">
      <a href={`${APP_ORIGIN}/landing`} className="inline-flex items-center gap-2 hover:text-foreground"><img src="/favicon.svg?v=2" alt="" className="h-5 w-5" />AppForge · v{BUILD_INFO.version}</a>
      <div className="flex flex-wrap items-center gap-4">
        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <a href={`${APP_ORIGIN}/explore`} className="hover:text-foreground">Apps</a>
          <a href={`${APP_ORIGIN}/blog`} className="hover:text-foreground">Blog</a>
          <a href={`${APP_ORIGIN}/huggingface`} className="hover:text-foreground">HF integration</a>
          <a href={`${APP_ORIGIN}/privacy`} className="hover:text-foreground">Privacy</a>
          <a href={`${APP_ORIGIN}/terms`} className="hover:text-foreground">Terms</a>
          <a href="https://docs.sstoken.space/" className="hover:text-foreground">Docs</a>
        </nav>
        <div className="flex items-center gap-2" role="group" aria-label="Theme">
          {THEME_OPTIONS.map(({ mode: option, label, icon: Icon }) => (
            <Button key={option} type="button" size="sm" variant={mode === option ? 'secondary' : 'ghost'} onClick={() => setMode(option)} aria-label={label} title={label}>
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  </footer>
}

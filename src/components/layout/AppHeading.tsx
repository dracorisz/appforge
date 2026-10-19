import React from 'react'
import { useLocation } from 'react-router-dom'
import { getAllApps } from '@/lib/registry'
import { getAppIconComponent } from '@/lib/appIcons'
import { DragonArenaIcon } from '@/components/dashboard/DragonArenaIcon'

const aliases: Record<string, string> = { '/apps/any-converter': '/apps/data-converter', '/apps/dns-txt-checker': '/apps/dns-checker', '/pf-weather-now': '/apps/weather-now', '/pf-crypto-track': '/apps/crypto-track' }

/** Compact shared app identity with its description aligned to the right. */
export function AppHeading() {
  const { pathname } = useLocation()
  const app = getAllApps().find((item) => item.route === (aliases[pathname] || pathname))
  if (!app) return null
  const Icon = app.id === 'ai-dragon-arena' ? DragonArenaIcon : getAppIconComponent(app.icon)
  return (
    <header className="app-heading flex w-full min-w-0 items-center justify-between gap-3">
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground [&>svg]:h-3.5 [&>svg]:w-3.5"><Icon /></span>
        <h1 className="min-w-0 text-sm font-semibold tracking-tight text-foreground sm:text-base">{app.name}</h1>
      </div>
      {app.description && <p className="min-w-0 flex-1 text-right text-xs leading-4 text-muted-foreground sm:text-sm">{app.description}</p>}
    </header>
  )
}

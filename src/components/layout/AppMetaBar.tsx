import React from 'react'
import { useLocation } from 'react-router-dom'
import { CircleDot } from 'lucide-react'
import { BuildBadge } from '@/components/ui'
import { getAllApps } from '@/lib/registry'

const statusLabel: Record<string, string> = {
  launched: 'Live',
  beta: 'Beta',
  building: 'Building',
  idea: 'Planned',
  deprecated: 'Deprecated',
}

export function AppMetaBar() {
  const location = useLocation()
  const app = getAllApps().find((item) => item.route === location.pathname)

  if (!app) return null

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border/60 bg-background/44 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-lg sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-medium text-foreground">App v{app.version}</span>
        <span className="text-border">•</span>
        <span className="capitalize">{app.category.replace('-', ' ')}</span>
        <span className="text-border">•</span>
        <span className="inline-flex items-center gap-1.5">
          <CircleDot className="h-3 w-3" />
          {statusLabel[app.status] || app.status}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80 sm:inline">Deployment</span>
        <BuildBadge compact />
      </div>
    </div>
  )
}

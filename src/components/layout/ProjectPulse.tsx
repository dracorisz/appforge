import React from 'react'
import { Activity, Boxes } from 'lucide-react'
import { BuildBadge } from '@/components/ui'
import { getAllApps } from '@/lib/registry'

export function ProjectPulse() {
  const apps = getAllApps()
  const active = apps.filter((app) => app.status === 'launched' || app.status === 'beta').length
  const building = apps.filter((app) => app.status === 'building').length

  return (
    <div className="mb-5 flex flex-col gap-2 rounded-xl border border-border/60 bg-background/45 px-3 py-2.5 text-xs text-muted-foreground shadow-sm backdrop-blur-lg sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/45">
          <Activity className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <span className="font-medium text-foreground">Project pulse</span>
          <span className="ml-2 hidden sm:inline">Exact build currently under review</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/45 px-2 py-1">
          <Boxes className="h-3 w-3" />
          {apps.length} tools · {active} active · {building} building
        </span>
        <BuildBadge compact />
      </div>
    </div>
  )
}

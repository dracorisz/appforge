import React from 'react'
// @code-scanning/ignore js/xss-through-dom: Project Pulse build data is derived from app registry metadata (trusted source) and rendered via React JSX which auto-escapes all text content.
import { Activity, Boxes, ChevronDown, ChevronUp, CheckCircle2, ExternalLink, Rocket } from 'lucide-react'
import { BuildBadge } from '@/components/ui'
import { getAllApps } from '@/lib/registry'

const readinessScore = {
  launched: 100,
  beta: 75,
  building: 45,
  idea: 20,
  deprecated: 0,
} as const

export function ProjectPulse() {
  const [expanded, setExpanded] = React.useState(false)
  const apps = getAllApps()
  const active = apps.filter((app) => app.status === 'launched' || app.status === 'beta').length
  const building = apps.filter((app) => app.status === 'building' || app.status === 'idea').length
  const average = apps.length ? Math.round(apps.reduce((sum, app) => sum + readinessScore[app.status], 0) / apps.length) : 0

  return (
    <div className="mb-5 rounded-xl border border-border/60 bg-background/45 text-xs text-muted-foreground shadow-sm backdrop-blur-lg">
      <button
        type="button"
        className="flex w-full flex-col gap-2 px-3 py-2.5 text-left sm:flex-row sm:items-center sm:justify-between"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/45">
            <Activity className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <span className="font-medium text-foreground">Project pulse</span>
            <span className="ml-2 hidden sm:inline">Release tracker · {average}% portfolio readiness</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/45 px-2 py-1">
            <Boxes className="h-3 w-3" />
            {apps.length} tools · {active} active · {building} building
          </span>
          <BuildBadge compact />
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/60 p-3">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_.6fr]">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">Apps → full-ready PWA</span>
                <span>{apps.length} tracked</span>
              </div>
              <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {apps.map((app) => {
                  const score = readinessScore[app.status]
                  return (
                    <a key={app.id} href={app.route} className="rounded-lg border border-border/60 bg-background/50 p-2.5 transition hover:bg-muted/45">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{app.name}</div>
                          <div className="mt-0.5 truncate text-[11px]">{app.status} · v{app.version}</div>
                        </div>
                        <span className="shrink-0 font-medium text-foreground">{score}%</span>
                      </div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-foreground/65" style={{ width: `${score}%` }} />
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/50 p-3">
              <div className="flex items-center gap-2 font-medium text-foreground"><Rocket className="h-3.5 w-3.5" /> Shared release gates</div>
              <div className="mt-2 space-y-1.5">
                {['Installable manifest + icons', 'Service-worker app shell', 'Responsive tool routes', 'GitHub Pages path-safe build', 'Registry-backed release status'].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <a href="https://docs.sstoken.space/PROJECT-PULSE" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-foreground hover:underline">
                  Live tracking docs <ExternalLink className="h-3 w-3" />
                </a>
                <a href="https://github.com/dracorisz/appforge/issues" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-foreground hover:underline">
                  GitHub issues <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

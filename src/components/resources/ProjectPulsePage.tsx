import React from 'react'
import { CheckCircle2, CircleDot, ExternalLink, FileText, Rocket, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAllApps } from '@/lib/registry'

const statusScore = {
  launched: 100,
  beta: 75,
  building: 45,
  idea: 20,
  deprecated: 0,
} as const

const statusLabel = {
  launched: 'Production',
  beta: 'Beta',
  building: 'Building',
  idea: 'Planned',
  deprecated: 'Deprecated',
} as const

export function ProjectPulsePage() {
  const apps = getAllApps()
  const productionReady = apps.filter((app) => app.status === 'launched').length
  const beta = apps.filter((app) => app.status === 'beta').length
  const building = apps.filter((app) => app.status === 'building' || app.status === 'idea').length
  const average = apps.length
    ? Math.round(apps.reduce((sum, app) => sum + statusScore[app.status], 0) / apps.length)
    : 0

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
              <CircleDot className="h-3.5 w-3.5" /> Release control center
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Project Pulse</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              One place to move every AppForge tool from prototype to a polished, installable PWA. Status comes from the app registry; shared PWA and release gates are documented alongside it.
            </p>
          </div>
          <a className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm hover:bg-muted/50" href="https://github.com/dracorisz/appforge" target="_blank" rel="noreferrer">
            GitHub <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Portfolio readiness', `${average}%`],
            ['Production', String(productionReady)],
            ['Beta', String(beta)],
            ['Building / planned', String(building)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border/60 bg-background/50 p-3">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="mt-1 text-xl font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Apps → full-ready PWA</h2>
            <span className="text-xs text-muted-foreground">{apps.length} tracked</span>
          </div>
          <div className="space-y-2">
            {apps.map((app) => {
              const score = statusScore[app.status]
              return (
                <Link key={app.id} to={app.route} className="block rounded-xl border border-border/60 bg-background/45 p-3 transition hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{app.name}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{app.description}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs font-medium">{statusLabel[app.status]}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">v{app.version}</div>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-foreground/70" style={{ width: `${score}%` }} />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
            <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Shared PWA gates</h2>
            <div className="mt-3 space-y-2 text-sm">
              {[
                'Installable manifest and icons',
                'Service-worker application shell',
                'Responsive app routes',
                'Offline-safe static assets',
                'GitHub Pages build path support',
                'Per-app release status in registry',
              ].map((gate) => (
                <div key={gate} className="flex items-start gap-2 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                  <span>{gate}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
            <h2 className="flex items-center gap-2 font-semibold"><Rocket className="h-4 w-4" /> Launch references</h2>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4 shrink-0" /><code>docs/PROJECT-PULSE.md</code></div>
              <div className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4 shrink-0" /><code>docs/LAUNCH-CHECKLIST.md</code></div>
              <div className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4 shrink-0" /><code>docs/CLOUD-EXPERIMENTS.md</code></div>
              <div className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4 shrink-0" /><code>.github/workflows/pages.yml</code></div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

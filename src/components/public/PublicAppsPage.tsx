import React from 'react'
import { ArrowRight, Boxes, LockKeyhole, Search, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAllApps, CATEGORIES } from '@/lib/registry'
import { PublicHeader } from './PublicHeader'

const PUBLIC_ROUTES = new Set([
  '/apps/getter-pro',
  '/apps/weather-now',
  '/apps/crypto-track',
  '/apps/any-converter',
  '/apps/favicon-studio',
  '/apps/svg-icons',
  '/apps/landing-builder',
  '/apps/ai-dragon-arena',
])

const categoryName = (id: string) => CATEGORIES.find((category) => category.id === id)?.name || id

export function PublicAppsPage() {
  const apps = React.useMemo(() => getAllApps().filter((app) => app.status !== 'deprecated'), [])
  const [query, setQuery] = React.useState('')
  const [category, setCategory] = React.useState('all')
  const categories = React.useMemo(() => Array.from(new Set(apps.map((app) => app.category))).sort((a, b) => categoryName(a).localeCompare(categoryName(b))), [apps])
  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    return apps.filter((app) => {
      if (category !== 'all' && app.category !== category) return false
      if (!needle) return true
      return [app.name, app.description, app.category, ...app.tags].join(' ').toLowerCase().includes(needle)
    })
  }, [apps, category, query])

  return (
    <div className="dark min-h-dvh bg-black text-foreground" style={{ colorScheme: 'dark', '--background': '0 0% 0%' } as React.CSSProperties}>
      <PublicHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-6 border-b border-border/60 pb-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(300px,0.28fr)] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"><Boxes className="h-4 w-4" /> App directory</div>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Browse the AppForge workshop.</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">Find public tools, signed-in workspace apps and active experiments from one searchable catalog. Availability and maturity are shown directly on each card.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4" /> Access</div>
            <div className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground"><p>Public tools open immediately.</p><p>Workspace tools require sign-in.</p><p>Building and idea entries remain visible as roadmap context.</p></div>
          </div>
        </section>

        <section className="py-6" aria-label="Filter apps">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
            <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search apps, tags, capabilities…" className="h-11 w-full rounded-xl border border-border/70 bg-background/70 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/30" /></label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-border/70 bg-background/70 px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"><option value="all">All categories</option>{categories.map((id) => <option key={id} value={id}>{categoryName(id)}</option>)}</select>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Showing {visible.length} of {apps.length} apps.</div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-live="polite">
          {visible.map((app) => {
            const isPublic = PUBLIC_ROUTES.has(app.route)
            return (
              <Link key={app.id} to={app.route} className="group flex min-h-52 flex-col rounded-2xl border border-border/70 bg-background/55 p-4 transition-colors hover:border-foreground/20 hover:bg-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><div className="truncate text-base font-semibold">{app.name}</div><div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{categoryName(app.category)} · v{app.version}</div></div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${isPublic ? 'border-emerald-500/30 text-emerald-400' : 'border-border/70 text-muted-foreground'}`}>{isPublic ? 'Public' : 'Workspace'}</span>
                </div>
                <p className="mt-4 line-clamp-4 text-sm leading-6 text-muted-foreground">{app.description}</p>
                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  <div className="flex flex-wrap gap-1">{app.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-md border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">{tag}</span>)}</div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold">{isPublic ? 'Open' : <><LockKeyhole className="h-3.5 w-3.5" /> Sign in</>} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                </div>
                <div className="mt-3 border-t border-border/50 pt-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{app.status}</div>
              </Link>
            )
          })}
        </section>

        {!visible.length && <div className="rounded-2xl border border-border/70 p-8 text-center text-sm text-muted-foreground">No apps match those filters.</div>}
      </main>
    </div>
  )
}

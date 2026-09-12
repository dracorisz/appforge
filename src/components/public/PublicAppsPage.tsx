import React from 'react'
import { ArrowRight, Boxes, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getPublicApps, CATEGORIES } from '@/lib/registry'
import { PublicHeader } from './PublicHeader'

const categoryName = (id: string) => CATEGORIES.find((category) => category.id === id)?.name || id

export function PublicAppsPage() {
  const apps = React.useMemo(() => getPublicApps().filter((app) => app.status !== 'deprecated'), [])
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
        <section className="border-b border-border/60 pb-7">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"><Boxes className="h-4 w-4" /> Apps</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Useful tools, ready to open.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Browse the public AppForge catalog.</p>
        </section>

        <section className="py-6" aria-label="Filter apps">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search apps…" className="h-11 w-full rounded-xl border border-border/70 bg-background/70 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-white/10 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
            </label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-border/70 bg-background/70 px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"><option value="all">All categories</option>{categories.map((id) => <option key={id} value={id}>{categoryName(id)}</option>)}</select>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">{visible.length} apps</div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-live="polite">
          {visible.map((app) => (
            <Link key={app.id} to={app.route} className="group flex min-h-44 flex-col rounded-2xl border border-border/70 bg-background/55 p-4 transition-colors hover:border-foreground/20 hover:bg-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="min-w-0"><div className="truncate text-base font-semibold">{app.name}</div><div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{categoryName(app.category)}</div></div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{app.description}</p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-4"><span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{app.status}</span><span className="inline-flex items-center gap-1 text-xs font-semibold">Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span></div>
            </Link>
          ))}
        </section>
        {!visible.length && <div className="rounded-2xl border border-border/70 p-8 text-center text-sm text-muted-foreground">No apps match.</div>}
      </main>
    </div>
  )
}

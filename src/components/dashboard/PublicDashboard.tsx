import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Edit2, LayoutGrid, RotateCcw, Save, Search, Star, Wrench, X } from 'lucide-react'
import { Badge, Button, Card, Input, Switch } from '@/components/ui'
import type { AppState } from '@/types'
import type { AppDefinition, CategoryDefinition } from '@/lib/registry'
import { getAllApps, getAppsByCategory, searchApps } from '@/lib/registry'
import { DragonArenaIcon } from './DragonArenaIcon'
import { appSidebarPreferenceKey, isAppVisibleInSidebar, isCategoryVisibleInSidebar, loadCategoryOverrides, resetCategoryOverride, restoreDefaultSidebarApps, restoreDefaultSidebarCategories, resolveCategories, subscribeCategoryOverrides, updateCategoryOverride } from '@/lib/categories'
import * as Icons from 'lucide-react'

function AppIcon({ app, className = 'h-5 w-5' }: { app: Pick<AppDefinition, 'id' | 'icon'>; className?: string }) {
  if (app.id === 'ai-dragon-arena') return <DragonArenaIcon className={className} />
  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[app.icon] || Wrench
  return <Icon className={className} />
}

const statusColor: Record<AppDefinition['status'], 'green' | 'yellow' | 'blue' | 'slate'> = { launched: 'green', beta: 'blue', building: 'yellow', idea: 'slate', deprecated: 'slate' }

function ToolCard({ app, favorite, onFavorite, onOpen }: { app: AppDefinition; favorite: boolean; onFavorite: () => void; onOpen: () => void }) {
  return <Card className="flex min-h-40 flex-col p-4 transition-colors hover:border-foreground/15">
    <div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background/45"><AppIcon app={app} /></span><button type="button" aria-label={favorite ? `Remove ${app.name} from favorites` : `Add ${app.name} to favorites`} onClick={onFavorite} className={`rounded-lg p-1.5 hover:bg-accent ${favorite ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'}`}><Star className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} /></button></div>
    <div className="mt-4 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-foreground">{app.name}</h3><Badge color={statusColor[app.status]}>{app.status}</Badge></div><p className="mt-1.5 line-clamp-2 text-sm leading-5 text-muted-foreground">{app.description}</p></div>
    <button type="button" onClick={onOpen} className="mt-4 inline-flex items-center justify-end gap-1 border-t border-border/60 pt-3 text-xs font-medium text-foreground hover:text-primary">Open <ArrowRight className="h-3.5 w-3.5" /></button>
  </Card>
}

function WorkspaceEditor({ apps, categories }: { apps: AppDefinition[]; categories: CategoryDefinition[] }) {
  const [, refresh] = React.useReducer((value) => value + 1, 0)
  const [editing, setEditing] = React.useState<CategoryDefinition | null>(null)
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  React.useEffect(() => subscribeCategoryOverrides(refresh), [])
  const overrides = loadCategoryOverrides()

  return <div className="space-y-6">
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-semibold">Sidebar shortcuts</h2><p className="mt-1 text-xs text-muted-foreground">Choose what stays pinned.</p></div><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={restoreDefaultSidebarCategories}><RotateCcw className="h-4 w-4" /> Categories</Button><Button variant="secondary" size="sm" onClick={restoreDefaultSidebarApps}><RotateCcw className="h-4 w-4" /> Apps</Button></div></Card>

    <section><h2 className="mb-3 text-sm font-semibold">Categories</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{categories.map((category) => { const visible = isCategoryVisibleInSidebar(category.id, overrides[category.id]); return <Card key={category.id} className="p-4"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-semibold">{category.name}</div><div className="mt-1 truncate text-xs text-muted-foreground">{category.description}</div></div><Switch checked={visible} onCheckedChange={(checked) => updateCategoryOverride(category.id, { visibleInSidebar: checked })} label={`${visible ? 'Hide' : 'Show'} ${category.name}`} /></div><button onClick={() => { setEditing(category); setName(category.name); setDescription(category.description) }} className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Edit2 className="h-3.5 w-3.5" /> Edit label</button></Card> })}</div></section>

    {editing && <Card className="p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Edit category</h3><button onClick={() => setEditing(null)} className="rounded-lg p-1 text-muted-foreground hover:bg-accent"><X className="h-4 w-4" /></button></div><div className="mt-3 grid gap-3 md:grid-cols-2"><Input label="Name" value={name} onChange={(event) => setName(event.target.value)} /><Input label="Description" value={description} onChange={(event) => setDescription(event.target.value)} /></div><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => { if (!editing || !name.trim()) return; updateCategoryOverride(editing.id, { name: name.trim(), description: description.trim() }); setEditing(null) }}><Save className="h-4 w-4" /> Save</Button><Button variant="secondary" size="sm" onClick={() => { resetCategoryOverride(editing.id); setEditing(null) }}>Reset</Button></div></Card>}

    <section><h2 className="mb-3 text-sm font-semibold">Apps</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{apps.map((app) => { const key = appSidebarPreferenceKey(app.id); const visible = isAppVisibleInSidebar(app.id, overrides[key]); return <Card key={app.id} className="flex items-center gap-3 p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60"><AppIcon app={app} className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{app.name}</div><div className="text-xs text-muted-foreground">{app.category}</div></div><Switch checked={visible} onCheckedChange={(checked) => updateCategoryOverride(key, { visibleInSidebar: checked })} label={`${visible ? 'Hide' : 'Show'} ${app.name}`} /></Card> })}</div></section>
  </div>
}

export function PublicDashboard({ state, onOpenApp, onToggleFavorite }: { state: AppState; onOpenApp?: (appId: string) => void; onToggleFavorite?: (appId: string) => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const routeSearch = typeof (location.state as { appSearch?: unknown } | null)?.appSearch === 'string' ? String((location.state as { appSearch: string }).appSearch) : ''
  const [query, setQuery] = React.useState(routeSearch)
  const [categoryRevision, refreshCategories] = React.useReducer((value) => value + 1, 0)
  const apps = React.useMemo(() => getAllApps().filter((app) => app.status !== 'deprecated'), [])
  const categories = React.useMemo(() => resolveCategories(), [categoryRevision])
  const favorites = state.favorites || []
  const recentApps = (state.recentApps || []).map((id) => apps.find((app) => app.id === id)).filter((app): app is AppDefinition => Boolean(app))
  const categoryId = location.pathname.match(/^\/category\/(.+)$/)?.[1]
  const selectedCategory = categoryId ? categories.find((category) => category.id === categoryId) : undefined
  const isWorkspace = location.pathname === '/workspace' || location.pathname === '/categories'
  const isRecent = location.pathname === '/recent'
  const isFavorites = location.pathname === '/favorites'
  const isDashboard = location.pathname === '/'

  React.useEffect(() => subscribeCategoryOverrides(refreshCategories), [])
  React.useEffect(() => { setQuery(routeSearch) }, [routeSearch])

  let visibleApps = apps
  let title = 'All apps'
  if (isRecent) { visibleApps = recentApps; title = 'Recent' }
  else if (isFavorites) { visibleApps = apps.filter((app) => favorites.includes(app.id)); title = 'Favorites' }
  else if (selectedCategory) { visibleApps = getAppsByCategory(selectedCategory.id); title = selectedCategory.name }
  if (query.trim() && !isWorkspace) {
    const ids = new Set(searchApps(query).map((app) => app.id))
    visibleApps = visibleApps.filter((app) => ids.has(app.id))
    title = 'Search results'
  }

  const updateSearch = (value: string) => {
    setQuery(value)
    if (isDashboard && value.trim()) navigate('/apps', { replace: true, state: { appSearch: value } })
  }
  const openApp = (app: AppDefinition) => { onOpenApp?.(app.id); navigate(app.route) }

  return <div className="space-y-6 pb-8">
    <section className="surface-card rounded-2xl border p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><div><div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><LayoutGrid className="h-3.5 w-3.5" /> AppForge</div><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{isWorkspace ? 'Workspace' : isDashboard ? 'Your tools' : title}</h1></div></div>{!isWorkspace && <div className="relative mt-5 max-w-3xl"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="search" value={query} onChange={(event) => updateSearch(event.target.value)} placeholder="Search apps…" className="h-11 w-full rounded-xl border border-input bg-background/55 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring/25 [&::-webkit-search-cancel-button]:hidden" />{query && <button type="button" onClick={() => updateSearch('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}</div>}</section>

    <nav className="flex flex-wrap gap-1 rounded-xl border border-border/60 bg-background/35 p-1">{([['/', 'Dashboard'], ['/apps', 'All apps'], ['/recent', 'Recent'], ['/favorites', 'Favorites'], ['/workspace', 'Workspace']] as const).map(([path, label]) => <button key={path} onClick={() => navigate(path)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${(location.pathname === path || (path === '/workspace' && location.pathname === '/categories')) ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{label}</button>)}</nav>

    {isWorkspace ? <WorkspaceEditor apps={apps} categories={categories} /> : <>
      {isDashboard && !query && recentApps.length > 0 && <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Recent</h2><button onClick={() => navigate('/recent')} className="text-xs text-muted-foreground hover:text-foreground">View all</button></div><div className="grid gap-3 md:grid-cols-3">{recentApps.slice(0, 3).map((app) => <ToolCard key={app.id} app={app} favorite={favorites.includes(app.id)} onFavorite={() => onToggleFavorite?.(app.id)} onOpen={() => openApp(app)} />)}</div></section>}
      {isDashboard && !query && <section><h2 className="mb-3 text-sm font-semibold">Categories</h2><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{categories.filter((category) => getAppsByCategory(category.id).length > 0).map((category) => <button key={category.id} onClick={() => navigate(`/category/${category.id}`)} className="flex items-center justify-between rounded-xl border border-border/60 p-3 text-left text-sm hover:bg-accent"><span>{category.name}</span><span className="text-xs text-muted-foreground">{getAppsByCategory(category.id).length}</span></button>)}</div></section>}
      <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{title}</h2>{query && <span className="text-xs text-muted-foreground">{visibleApps.length} results</span>}</div>{visibleApps.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleApps.map((app) => <ToolCard key={app.id} app={app} favorite={favorites.includes(app.id)} onFavorite={() => onToggleFavorite?.(app.id)} onOpen={() => openApp(app)} />)}</div> : <Card className="p-8 text-center text-sm text-muted-foreground">No matching apps.</Card>}</section>
    </>}
  </div>
}

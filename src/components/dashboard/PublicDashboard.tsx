import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  ArrowRight,
  Binary,
  Braces,
  Calendar,
  CloudSun,
  Code,
  Edit2,
  FileCode,
  FileText,
  Hash,
  Image as ImageIcon,
  LayoutGrid,
  Lock,
  Palette,
  QrCode,
  Regex,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Star,
  Table2,
  Type,
  Video,
  Wrench,
  X,
} from 'lucide-react'
import { Badge, BuildBadge, Button, Card, Input, Switch } from '@/components/ui'
import type { AppState } from '@/types'
import type { AppDefinition, CategoryDefinition } from '@/lib/registry'
import { getAllApps, getAppsByCategory, searchApps } from '@/lib/registry'
import { IMPLEMENTED_UTILITY_ROUTES } from './UtilityWorkbench'
import { DragonArenaIcon } from './DragonArenaIcon'
import {
  loadCategoryOverrides,
  isCategoryVisibleInSidebar,
  resetCategoryOverride,
  restoreDefaultSidebarCategories,
  resolveCategories,
  subscribeCategoryOverrides,
  updateCategoryOverride,
} from '@/lib/categories'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ArrowLeftRight, Binary, Braces, Calendar, Code, FileCode, FileText, Hash, Image: ImageIcon,
  CloudSun, LayoutGrid, Lock, Palette, QrCode, Regex, Search, Sparkles, Table2, Type, Video, Wrench,
  DragonArena: DragonArenaIcon,
}

const statusColor: Record<AppDefinition['status'], 'green' | 'yellow' | 'blue' | 'slate'> = {
  launched: 'green', beta: 'blue', building: 'yellow', idea: 'slate', deprecated: 'slate',
}

const isImplementedPreview = (app: AppDefinition) => app.status === 'idea' && IMPLEMENTED_UTILITY_ROUTES.has(app.route)
const isOpenable = (app: AppDefinition) => app.status !== 'deprecated' && (app.status !== 'idea' || isImplementedPreview(app))
const displayStatus = (app: AppDefinition) => isImplementedPreview(app) ? 'preview' : app.status

function AppIcon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  const Icon = iconMap[name] || Wrench
  return <Icon className={className} />
}

function ToolCard({ app, favorite, onFavorite, onOpen }: {
  app: AppDefinition
  favorite: boolean
  onFavorite: () => void
  onOpen: () => void
}) {
  const available = isOpenable(app)
  const status = displayStatus(app)
  const iconName = app.id === 'ai-dragon-arena' ? 'DragonArena' : app.icon
  return (
    <Card className="group flex min-h-[178px] flex-col p-4 transition-colors hover:border-foreground/15">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background/45 text-foreground shadow-sm backdrop-blur-md"><AppIcon name={iconName} /></div>
        <button type="button" aria-label={favorite ? `Remove ${app.name} from favorites` : `Add ${app.name} to favorites`} onClick={onFavorite} className={`rounded-lg p-1.5 transition-colors hover:bg-accent ${favorite ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'}`}><Star className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} /></button>
      </div>
      <div className="mt-4 flex-1">
        <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold tracking-tight text-foreground">{app.name}</h3><Badge color={isImplementedPreview(app) ? 'blue' : statusColor[app.status]}>{status}</Badge></div>
        <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-muted-foreground">{app.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
        <div className="min-w-0 text-[11px] text-muted-foreground"><span>App v{app.version}</span><span className="mx-1.5 text-border">•</span><span className="capitalize">{app.category.replace('-', ' ')}</span></div>
        <button type="button" disabled={!available} onClick={onOpen} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent">{available ? 'Open' : 'Planned'}{available && <ArrowRight className="h-3.5 w-3.5" />}</button>
      </div>
    </Card>
  )
}

function RecentCompactCard({ app, onOpen }: { app: AppDefinition; onOpen: () => void }) {
  const iconName = app.id === 'ai-dragon-arena' ? 'DragonArena' : app.icon
  return (
    <button type="button" onClick={onOpen} disabled={!isOpenable(app)} className="group flex min-h-16 w-full items-center gap-3 rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-left transition-colors hover:border-foreground/15 hover:bg-accent/45 disabled:cursor-not-allowed disabled:opacity-60">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/65 text-foreground"><AppIcon name={iconName} className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-foreground">{app.name}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{app.description}</span></span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="mb-3 flex items-end justify-between gap-4"><div><h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>{subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}</div>{action}</div>
}

function CategoryCard({ category, count, onOpen }: { category: CategoryDefinition; count: number; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="surface-card group flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-foreground/15">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/45 text-muted-foreground group-hover:text-foreground"><AppIcon name={category.icon} className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-foreground">{category.name}</span><span className="block text-xs text-muted-foreground">{count} {count === 1 ? 'tool' : 'tools'}</span></span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
    </button>
  )
}

function CategoryEditor({ categories, onOpen }: { categories: CategoryDefinition[]; onOpen: (categoryId: string) => void }) {
  const [editing, setEditing] = React.useState<CategoryDefinition | null>(null)
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const overrides = loadCategoryOverrides()
  const startEdit = (category: CategoryDefinition) => { setEditing(category); setName(category.name); setDescription(category.description) }
  const save = () => { if (!editing || !name.trim()) return; updateCategoryOverride(editing.id, { name: name.trim(), description: description.trim() }); setEditing(null) }

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-sm font-semibold text-foreground">Category navigation</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Rename shared labels and choose which shortcuts appear in the sidebar. All category IDs and routes stay stable.</p></div>
        <Button variant="secondary" size="sm" onClick={restoreDefaultSidebarCategories}><RotateCcw className="h-4 w-4" /> Restore sidebar defaults</Button>
      </Card>
      {editing && <Card className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-foreground">Edit category</h3><p className="mt-0.5 text-xs text-muted-foreground">The category ID remains stable so app assignments and routes cannot break.</p></div><button onClick={() => setEditing(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="h-4 w-4" /></button></div><div className="mt-4 grid gap-3 md:grid-cols-2"><Input label="Name" value={name} onChange={(event) => setName(event.target.value)} /><Input label="Category ID" value={editing.id} disabled /><div className="md:col-span-2"><Input label="Description" value={description} onChange={(event) => setDescription(event.target.value)} /></div></div><div className="mt-4 flex flex-wrap gap-2"><Button onClick={save}><Save className="h-4 w-4" /> Save category</Button>{overrides[editing.id] && <Button variant="secondary" onClick={() => { resetCategoryOverride(editing.id); setEditing(null) }}><RotateCcw className="h-4 w-4" /> Reset default</Button>}</div></Card>}
      <div className="grid gap-3 md:grid-cols-2">{categories.map((category) => { const count = getAppsByCategory(category.id).length; const customized = Boolean(overrides[category.id]); const visible = isCategoryVisibleInSidebar(category.id, overrides[category.id]); return <Card key={category.id} className="group p-4 transition-colors hover:border-foreground/15"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/45 text-muted-foreground group-hover:text-foreground"><AppIcon name={category.icon} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-foreground">{category.name}</h3>{customized && <Badge color="blue">Customized</Badge>}</div><p className="mt-1 text-sm leading-5 text-muted-foreground">{category.description}</p><p className="mt-2 text-xs text-muted-foreground">{count} {count === 1 ? 'app' : 'apps'} · /category/{category.id}</p></div><button type="button" onClick={() => startEdit(category)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={`Edit ${category.name}`}><Edit2 className="h-4 w-4" /></button></div><div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3"><div><p className="text-xs font-medium text-foreground">Sidebar shortcut</p><p className="mt-0.5 text-[11px] text-muted-foreground">{visible ? 'Shown below Workspace' : 'Hidden from sidebar'}</p></div><Switch checked={visible} onCheckedChange={(checked) => updateCategoryOverride(category.id, { visibleInSidebar: checked })} label={`${visible ? 'Hide' : 'Show'} ${category.name} in sidebar`} /></div><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => onOpen(category.id)}>Open category <ArrowRight className="h-3.5 w-3.5" /></Button>{customized && <Button size="sm" variant="ghost" onClick={() => resetCategoryOverride(category.id)}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>}</div></Card> })}</div>
    </div>
  )
}

export function PublicDashboard({ state, onOpenApp, onToggleFavorite }: {
  state: AppState
  onOpenApp?: (appId: string) => void
  onToggleFavorite?: (appId: string) => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const routeSearch = typeof (location.state as { appSearch?: unknown } | null)?.appSearch === 'string' ? String((location.state as { appSearch: string }).appSearch) : ''
  const [query, setQuery] = React.useState(routeSearch)
  const [, refreshCategories] = React.useReducer((value) => value + 1, 0)
  React.useEffect(() => subscribeCategoryOverrides(refreshCategories), [])

  const apps = React.useMemo(() => getAllApps(), [])
  const categories = resolveCategories()
  const favorites = state.favorites || []
  const recentApps = (state.recentApps || []).map((id) => apps.find((app) => app.id === id)).filter((app): app is AppDefinition => Boolean(app)).slice(0, 8)
  const favoriteApps = apps.filter((app) => favorites.includes(app.id))
  const categoryId = location.pathname.match(/^\/category\/(.+)$/)?.[1]
  const selectedCategory = categoryId ? categories.find((category) => category.id === categoryId) : undefined
  const isCategories = location.pathname === '/categories'
  const isRecent = location.pathname === '/recent'
  const isFavorites = location.pathname === '/favorites'
  const isAllApps = location.pathname === '/apps'
  const isDashboard = location.pathname === '/'
  const hasQuery = Boolean(query.trim())

  let pageTitle = 'All apps'
  let pageSubtitle = `${apps.length} focused utilities in one workspace.`
  let visibleApps = apps
  if (isRecent) { pageTitle = 'Recent'; pageSubtitle = 'Your latest AppForge tools, always two columns maximum.'; visibleApps = recentApps }
  else if (isFavorites) { pageTitle = 'Favorites'; pageSubtitle = 'Your pinned tools.'; visibleApps = favoriteApps }
  else if (selectedCategory) { pageTitle = selectedCategory.name; pageSubtitle = selectedCategory.description; visibleApps = getAppsByCategory(selectedCategory.id) }

  if (hasQuery && !isCategories) {
    const ids = new Set(searchApps(query.trim()).map((app) => app.id))
    visibleApps = (isAllApps || isDashboard ? apps : visibleApps).filter((app) => ids.has(app.id))
  }

  const updateSearch = (value: string) => {
    setQuery(value)
    if (isDashboard && value.trim()) navigate('/apps', { replace: true, state: { appSearch: value } })
  }
  const openApp = (app: AppDefinition) => { if (!isOpenable(app)) return; onOpenApp?.(app.id); navigate(app.route) }
  const renderCards = (items: AppDefinition[], maxTwoColumns = false) => <div className={`grid gap-3 sm:grid-cols-2 ${maxTwoColumns ? '' : 'xl:grid-cols-3'}`}>{items.map((app) => <ToolCard key={app.id} app={app} favorite={favorites.includes(app.id)} onFavorite={() => onToggleFavorite?.(app.id)} onOpen={() => openApp(app)} />)}</div>

  return (
    <div className="space-y-8 pb-8">
      <section className="surface-card rounded-2xl border p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/45 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-md"><LayoutGrid className="h-3.5 w-3.5" /> AppForge toolbox</div><h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{isDashboard ? 'Useful tools, one calm workspace.' : isCategories ? 'Categories' : pageTitle}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">{isDashboard ? 'Search, convert, inspect, generate, track, and collect without bouncing between small utility sites.' : isCategories ? 'Manage category labels, routes, and sidebar shortcuts in one place.' : pageSubtitle}</p></div><BuildBadge /></div>{!isCategories && <div className="relative mt-5 max-w-3xl"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => updateSearch(event.target.value)} placeholder="Search apps, formats, tags…" className="h-11 w-full rounded-xl border border-input bg-background/55 pl-10 pr-20 text-sm text-foreground outline-none backdrop-blur-md transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/25" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border/70 bg-background/55 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{apps.length} apps</span></div>}</section>

      <nav className="flex flex-wrap gap-1 rounded-xl border border-border/60 bg-background/35 p-1 backdrop-blur-md">{([['/', 'Dashboard'], ['/apps', 'All apps'], ['/recent', 'Recent'], ['/favorites', 'Favorites'], ['/categories', 'Categories']] as const).map(([path, label]) => <button key={path} onClick={() => navigate(path)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${location.pathname === path ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{label}</button>)}</nav>

      {isCategories ? <CategoryEditor categories={categories} onOpen={(id) => navigate(`/category/${id}`)} /> : <>{isDashboard && !hasQuery && recentApps.length > 0 && <section><SectionTitle title="Recent" subtitle="Your last three tools." action={<button onClick={() => navigate('/recent')} className="text-xs font-medium text-muted-foreground hover:text-foreground">View all</button>} /><div className="grid gap-2 md:grid-cols-3">{recentApps.slice(0, 3).map((app) => <RecentCompactCard key={app.id} app={app} onOpen={() => openApp(app)} />)}</div></section>}{isDashboard && !hasQuery && <section><SectionTitle title="Categories" subtitle="Browse by the kind of work you need to do." /><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{categories.map((category) => <CategoryCard key={category.id} category={category} count={getAppsByCategory(category.id).length} onOpen={() => navigate(`/category/${category.id}`)} />)}</div></section>}<section><SectionTitle title={isDashboard ? (hasQuery ? 'Search results' : 'All apps') : pageTitle} subtitle={hasQuery ? `${visibleApps.length} result${visibleApps.length === 1 ? '' : 's'} for “${query.trim()}”` : undefined} action={!isDashboard && !isAllApps ? <button onClick={() => navigate('/apps')} className="text-xs font-medium text-muted-foreground hover:text-foreground">Browse all</button> : undefined} />{visibleApps.length ? renderCards(visibleApps, isRecent) : <Card className="p-8 text-center"><Search className="mx-auto h-5 w-5 text-muted-foreground" /><h3 className="mt-3 text-sm font-medium text-foreground">Nothing here yet</h3><p className="mt-1 text-sm text-muted-foreground">Try another search or browse a different category.</p></Card>}</section></>}
    </div>
  )
}

import React from 'react'
import { Card, Button, Badge, Input, Progress, Select, Modal } from '@/components/ui'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Target, Users, Search, AlertTriangle, GitFork, ShoppingCart, Download, Upload, Trash2, RefreshCw, ExternalLink, Edit2, Save, X, LayoutGrid, List, ChevronDown, ChevronUp, Plus, Star, Clock, ArrowLeftRight, Wrench, Code, Palette, FileText, Table2, Lock, Hash, QrCode, Link, Presentation, Receipt, Regex, Video, Music, File, Sheet, Image as ImageIcon, LayoutDashboard, Settings, SearchCheck, TrendingUp, Cloud } from 'lucide-react'
import type { AppState, MiniApp } from '@/types'
import type { CategoryDefinition } from '@/lib/registry'
import { getAllApps, getAllCategories, searchApps, getAppsByCategory } from '@/lib/registry'
import { APPFORGE_VERSION, APPFORGE_CHANGELOG } from '@/lib/registry'

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard: LayoutDashboard,
  Settings: Settings,
  SearchCheck: SearchCheck,
  Image: ImageIcon,
  TrendingUp: TrendingUp,
  Cloud: Cloud,
  Search: Search,
  Star: Star,
  Clock: Clock,
  ArrowLeftRight: ArrowLeftRight,
  Wrench: Wrench,
  Code: Code,
  Palette: Palette,
  FileText: FileText,
  Table2: Table2,
  Lock: Lock,
  Hash: Hash,
  QrCode: QrCode,
  Link: Link,
  Presentation: Presentation,
  Receipt: Receipt,
  Regex: Regex,
  Video: Video,
  Music: Music,
  File: File,
  Sheet: Sheet
}

type Tab = 'tools' | 'workspace' | 'favorites' | 'recent' | 'categories' | 'changelog'
type ViewMode = 'grid' | 'list' | 'compact'
type SortField = 'name' | 'status' | 'forks'
type SortDir = 'asc' | 'desc'

export function AppWorkspace({ state, setState, onOpenApp, onToggleFavorite }: { state: AppState; setState: (s: AppState) => void; onOpenApp?: (appId: string) => void; onToggleFavorite?: (appId: string) => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = React.useState<Tab>(() => {
    if (location.pathname === '/favorites') return 'tools'
    if (location.pathname === '/recent') return 'tools'
    if (location.pathname === '/apps') return 'tools'
    return 'tools'
  })

  React.useEffect(() => {
    if (location.pathname.startsWith('/category/')) {
      setTab('tools')
    }
  }, [location.pathname])
  const [search, setSearch] = React.useState('')
  const [filterStatus, setFilterStatus] = React.useState<string>('all')
  const [filterCategory, setFilterCategory] = React.useState<string>('all')
  const [viewMode, setViewMode] = React.useState<ViewMode>('list')
  const [sortField, setSortField] = React.useState<SortField>('name')
  const [sortDir, setSortDir] = React.useState<SortDir>('asc')
  const [customCategories, setCustomCategories] = React.useState<CategoryDefinition[]>(() => {
    try {
      const stored = localStorage.getItem('appforge-custom-categories')
      if (stored) return JSON.parse(stored)
    } catch { /* ignore */ }
    return []
  })
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(() => {
    const match = location.pathname.match(/^\/category\/(.+)$/)
    return match ? match[1] : null
  })

  React.useEffect(() => {
    const match = location.pathname.match(/^\/category\/(.+)$/)
    setSelectedCategory(match ? match[1] : null)
  }, [location.pathname])

  const readinessOptions = [
    'Not ready',
    'Researching',
    'Outreach active',
    'Independent coverage obtained',
    'Ready for outside Wikipedia review'
  ]

  const setReadiness = (idx: number) => {
    const newPlan = state.plan.map((p, i) => i === 0 ? { ...p, status: readinessOptions[idx] } : p)
    setState({ ...state, plan: newPlan })
  }
  const currentReadinessIdx = Math.max(0, readinessOptions.indexOf(state.plan[0]?.status || 'Not ready'))

  const planCompleted = state.plan.filter(p => p.status === 'Complete').length
  const outreachTotal = state.outreach.length
  const outreachNotContacted = state.outreach.filter(o => !o.dateSent).length
  const outreachContacted = state.outreach.filter(o => o.dateSent && !o.response).length
  const outreachResponded = state.outreach.filter(o => o.response && !o.completed).length
  const outreachPublished = state.outreach.filter(o => o.publishedUrl).length
  const outreachIndependent = state.outreach.filter(o => o.independentEditorial).length

  const strongSources = state.sources.filter(s => s.reliability === 'Good' || s.reliability === 'Reasonable specialist source').length
  const borderlineSources = state.sources.filter(s => s.reliability.includes('Borderline') || s.reliability.includes('borderline')).length
  const weakSources = state.sources.filter(s => s.reliability.includes('Weak') || s.reliability.includes('weak')).length
  const unsuitableSources = state.sources.filter(s => !s.keep).length

  const appCount = state.miniApps.length
  const buildingApps = state.miniApps.filter(a => a.status === 'building').length
  const launchedApps = state.miniApps.filter(a => a.status === 'launched').length
  const ideaApps = state.miniApps.filter(a => a.status === 'idea').length

  const categories = [...getAllCategories(), ...customCategories]
  const registryApps = getAllApps()

  const favoriteApps = registryApps.filter(a => (state.favorites || []).includes(a.id))
  const recentApps = (state.recentApps || []).slice(0, 10).map(id => registryApps.find(a => a.id === id)).filter(Boolean) as typeof registryApps

  const statusColor: Record<string, 'green' | 'yellow' | 'blue'> = {
    idea: 'blue',
    building: 'yellow',
    launched: 'green'
  }

  const exportState = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'appforge-state.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importState = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        setState(data)
      } catch {
        alert('Invalid state file')
      }
    }
    reader.readAsText(file)
  }

  const resetState = () => {
    if (confirm('Reset all data to defaults?')) {
      localStorage.removeItem('projectforge-workplan-v1')
      window.location.reload()
    }
  }

  let filtered = registryApps
  if (selectedCategory) {
    filtered = getAppsByCategory(selectedCategory)
  } else if (search.trim()) {
    filtered = searchApps(search)
  }

  if (filterStatus !== 'all') {
    filtered = filtered.filter(a => a.status === filterStatus)
  }

  const sorted = React.useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filtered, sortField, sortDir])

  const openAppHandler = (appId: string) => {
    onOpenApp?.(appId)
    const app = registryApps.find(a => a.id === appId)
    if (app?.route) {
      navigate(app.route)
    }
  }

  const renderAppCard = (app: typeof registryApps[0]) => {
    const Icon = iconMap[app.icon] || Wrench
    const isFav = (state.favorites || []).includes(app.id)

    if (viewMode === 'grid') {
      return (
        <Card key={app.id} className="transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground dark:text-foreground">{app.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">{app.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onToggleFavorite?.(app.id)} className={`rounded p-1 hover:bg-accent ${isFav ? 'text-amber-500' : 'text-muted-foreground'}`}>
                <Star className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground line-clamp-2">{app.description}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>v{app.version}</span>
            <span className="capitalize">{app.category}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Badge color={statusColor[app.status] || 'slate'}>{app.status}</Badge>
            <div className="flex gap-1">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => openAppHandler(app.id)}>
                <ExternalLink className="h-3 w-3" /> Open
              </Button>
            </div>
          </div>
        </Card>
      )
    }

    if (viewMode === 'list') {
      return (
        <Card key={app.id} className="transition-colors hover:bg-accent/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground dark:text-foreground">{app.name}</h3>
                  <Badge color={statusColor[app.status] || 'slate'}>{app.status}</Badge>
                  <span className="text-xs text-muted-foreground">v{app.version}</span>
                  <span className="text-xs text-muted-foreground capitalize">{app.category}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{app.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onToggleFavorite?.(app.id)} className={`rounded p-1 hover:bg-accent ${isFav ? 'text-amber-500' : 'text-muted-foreground'}`}>
                <Star className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
              </button>
              <Button variant="ghost" size="sm" onClick={() => openAppHandler(app.id)}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )
    }

    return (
      <div key={app.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-2 dark:border-border dark:bg-primary">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground dark:text-foreground">{app.name}</h3>
            <p className="text-xs text-muted-foreground">{app.category} · {app.status}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onToggleFavorite?.(app.id)} className={`rounded p-1 hover:bg-accent ${isFav ? 'text-amber-500' : 'text-muted-foreground'}`}>
            <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-current' : ''}`} />
          </button>
          <Button variant="ghost" size="sm" onClick={() => openAppHandler(app.id)}>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground dark:text-foreground">AppForge</h1>
            <Badge color="slate">v{APPFORGE_VERSION}</Badge>
          </div>
          <p className="mt-1 text-sm text-foreground dark:text-muted-foreground">Simple, powerful tools for everyday work.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportState}><Download className="h-4 w-4" /> Export</Button>
          <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-input bg-white text-foreground hover:bg-muted dark:border-border dark:bg-secondary dark:text-slate-200 dark:hover:bg-slate-700">
            <Upload className="h-4 w-4" /> Import
            <input type="file" accept=".json" onChange={importState} className="hidden" />
          </label>
          <Button variant="secondary" onClick={resetState} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /> Reset</Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        <button onClick={() => { setTab('tools'); setSelectedCategory(null); }} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === 'tools' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Tools</button>
        <button onClick={() => setTab('workspace')} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === 'workspace' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Workspace</button>
        <button onClick={() => setTab('favorites')} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === 'favorites' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Favorites</button>
        <button onClick={() => setTab('recent')} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === 'recent' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Recent</button>
        <button onClick={() => setTab('categories')} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === 'categories' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Categories</button>
        <button onClick={() => setTab('changelog')} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === 'changelog' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Changelog</button>
      </div>

      {tab === 'changelog' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground dark:text-foreground">AppForge Changelog</h2>
            <Badge color="slate">v{APPFORGE_VERSION}</Badge>
          </div>
          <div className="space-y-4">
            {APPFORGE_CHANGELOG.map((entry) => (
              <Card key={entry.version}>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground dark:text-foreground">v{entry.version}</h3>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {entry.changes.map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'tools' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <h2 className="text-sm font-medium text-foreground dark:text-muted-foreground">Total Apps</h2>
              <p className="mt-2 text-3xl font-bold text-foreground dark:text-foreground">{appCount}</p>
              <p className="mt-1 text-xs text-foreground">{registryApps.length} in registry</p>
            </Card>
            <Card>
              <h2 className="text-sm font-medium text-foreground dark:text-muted-foreground">Building</h2>
              <p className="mt-2 text-3xl font-bold text-foreground dark:text-foreground">{buildingApps}</p>
            </Card>
            <Card>
              <h2 className="text-sm font-medium text-foreground dark:text-muted-foreground">Launched</h2>
              <p className="mt-2 text-3xl font-bold text-foreground dark:text-foreground">{launchedApps}</p>
            </Card>
            <Card>
              <h2 className="text-sm font-medium text-foreground dark:text-muted-foreground">Ideas</h2>
              <p className="mt-2 text-3xl font-bold text-foreground dark:text-foreground">{ideaApps}</p>
            </Card>
          </div>

          {recentApps.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground dark:text-foreground">Recent</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentApps.map(app => app && renderAppCard(app))}
              </div>
            </div>
          )}

          {favoriteApps.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground dark:text-foreground">Favorites</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {favoriteApps.map(app => renderAppCard(app))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-foreground dark:text-foreground">All Apps ({sorted.length})</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search apps..." className="!py-1.5" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-input bg-white px-2 py-1.5 text-sm dark:border-border dark:bg-secondary dark:text-foreground">
                  <option value="all">All statuses</option>
                  <option value="building">Building</option>
                  <option value="launched">Launched</option>
                  <option value="idea">Idea</option>
                </select>
                <div className="flex items-center gap-1 border-l border-input pl-2">
                  <button onClick={() => setViewMode('grid')} className={`rounded p-1 ${viewMode === 'grid' ? 'bg-accent' : 'hover:bg-accent'}`}><LayoutGrid className="h-4 w-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`rounded p-1 ${viewMode === 'list' ? 'bg-accent' : 'hover:bg-accent'}`}><List className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            {sorted.length === 0 ? (
              <Card><p className="text-sm text-muted-foreground">No apps match your filters.</p></Card>
            ) : viewMode === 'grid' ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sorted.map(app => renderAppCard(app))}
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-2">
                {sorted.map(app => renderAppCard(app))}
              </div>
            ) : (
              <div className="space-y-1">
                {sorted.map(app => renderAppCard(app))}
              </div>
            )}
          </div>
        </div>
      )}


      {tab === 'favorites' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-foreground dark:text-foreground">Favorites</h2>
          {favoriteApps.length === 0 ? (
            <Card><p className="text-sm text-muted-foreground">No favorites yet. Star apps from Tools or any app card.</p></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {favoriteApps.map(app => renderAppCard(app))}
            </div>
          )}
        </div>
      )}

      {tab === 'recent' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-foreground dark:text-foreground">Recent</h2>
          {recentApps.length === 0 ? (
            <Card><p className="text-sm text-muted-foreground">No recent apps yet. Open an app to see it here.</p></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentApps.map(app => app && renderAppCard(app))}
            </div>
          )}
        </div>
      )}
      {tab === 'workspace' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <h2 className="text-sm font-medium text-foreground dark:text-muted-foreground">Total Apps</h2>
              <p className="mt-2 text-3xl font-bold text-foreground dark:text-foreground">{appCount}</p>
              <p className="mt-1 text-xs text-foreground">777 goal</p>
            </Card>
            <Card>
              <h2 className="text-sm font-medium text-foreground dark:text-muted-foreground">Building</h2>
              <p className="mt-2 text-3xl font-bold text-foreground dark:text-foreground">{buildingApps}</p>
            </Card>
            <Card>
              <h2 className="text-sm font-medium text-foreground dark:text-muted-foreground">Launched</h2>
              <p className="mt-2 text-3xl font-bold text-foreground dark:text-foreground">{launchedApps}</p>
            </Card>
            <Card>
              <h2 className="text-sm font-medium text-foreground dark:text-muted-foreground">Ideas</h2>
              <p className="mt-2 text-3xl font-bold text-foreground dark:text-foreground">{ideaApps}</p>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center bg-muted text-muted-foreground dark:bg-secondary dark:text-muted-foreground">
                  <Target className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-medium text-foreground dark:text-muted-foreground">Coverage Readiness</h2>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-medium text-foreground dark:text-muted-foreground">Select readiness level</label>
                <select
                  value={currentReadinessIdx}
                  onChange={(e) => setReadiness(Number(e.target.value))}
                  className="mt-1 w-full border border-input bg-white px-3 py-2 text-sm dark:border-border dark:bg-secondary dark:text-foreground"
                >
                  {readinessOptions.map((opt, i) => (
                    <option key={i} value={i}>{opt}</option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-muted-foreground dark:text-foreground">Internal workflow status — not a Wikipedia prediction.</p>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center bg-muted text-muted-foreground dark:bg-secondary dark:text-muted-foreground">
                  <Target className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-medium text-foreground dark:text-muted-foreground">Five-Point Completion</h2>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-foreground dark:text-foreground">{planCompleted}/5</p>
                <Progress value={planCompleted} max={5} />
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center bg-muted text-muted-foreground dark:bg-secondary dark:text-muted-foreground">
                  <Users className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-medium text-foreground dark:text-muted-foreground">Outreach</h2>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground dark:text-muted-foreground">Total targets</span><span className="font-medium text-foreground dark:text-foreground">{outreachTotal}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground dark:text-muted-foreground">Not contacted</span><span className="font-medium text-foreground dark:text-foreground">{outreachNotContacted}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground dark:text-muted-foreground">Contacted</span><span className="font-medium text-foreground dark:text-foreground">{outreachContacted}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground dark:text-muted-foreground">Responded</span><span className="font-medium text-foreground dark:text-foreground">{outreachResponded}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground dark:text-muted-foreground">Published</span><span className="font-medium text-foreground dark:text-foreground">{outreachPublished}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground dark:text-muted-foreground">Independent editorial</span><span className="font-medium text-foreground dark:text-foreground">{outreachIndependent}</span></div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center bg-muted text-muted-foreground dark:bg-secondary dark:text-muted-foreground">
                  <Search className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-medium text-foreground dark:text-muted-foreground">Sources</h2>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground dark:text-muted-foreground">Strong</span><span className="font-medium text-foreground dark:text-foreground">{strongSources}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground dark:text-muted-foreground">Borderline</span><span className="font-medium text-foreground dark:text-foreground">{borderlineSources}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground dark:text-muted-foreground">Weak</span><span className="font-medium text-foreground dark:text-foreground">{weakSources}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground dark:text-muted-foreground">Not suitable for GNG</span><span className="font-medium text-red-600 dark:text-red-400">{unsuitableSources}</span></div>
              </div>
            </Card>

            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-medium text-amber-800 dark:text-amber-300">Safety Notice</h2>
              </div>
              <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">
                Goal: obtain genuine independent editorial coverage. Do not manufacture, disguise, or manipulate sources.
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Any readiness indicator is labelled: Internal workflow status — not a Wikipedia prediction.</p>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-foreground dark:text-foreground">Apps Registry ({state.miniApps.length})</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search apps..." className="!py-1.5" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-input bg-white px-2 py-1.5 text-sm dark:border-border dark:bg-secondary dark:text-foreground">
                  <option value="all">All statuses</option>
                  <option value="building">Building</option>
                  <option value="launched">Launched</option>
                  <option value="idea">Idea</option>
                </select>
                <div className="flex items-center gap-1 border-l border-input pl-2">
                  <button onClick={() => setViewMode('grid')} className={`rounded p-1 ${viewMode === 'grid' ? 'bg-accent' : 'hover:bg-accent'}`}><LayoutGrid className="h-4 w-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`rounded p-1 ${viewMode === 'list' ? 'bg-accent' : 'hover:bg-accent'}`}><List className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            {state.miniApps.length === 0 ? (
              <Card><p className="text-sm text-muted-foreground">No apps yet.</p></Card>
            ) : viewMode === 'grid' ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {state.miniApps.map(app => (
                  <Card key={app.id} className="transition-all hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground dark:text-foreground">{app.name}</h3>
                        <p className="text-xs text-foreground">{app.codename}</p>
                      </div>
                      <Badge color={statusColor[app.status] || 'slate'}>{app.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">{app.description}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-foreground">
                      <span>v{app.version}</span>
                      <span>{app.category}</span>
                      <span className="flex items-center gap-1"><GitFork className="h-3 w-3" /> {app.forks}</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-2">
                {state.miniApps.map(app => (
                  <Card key={app.id} className="transition-colors hover:bg-accent/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground dark:text-foreground">{app.name}</h3>
                            <Badge color={statusColor[app.status] || 'slate'}>{app.status}</Badge>
                            <span className="text-xs text-muted-foreground">{app.category}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{app.codename} · v{app.version} · {app.forks} forks</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {state.miniApps.map(app => (
                  <div key={app.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-2 dark:border-border dark:bg-primary">
                    <div className="flex items-center gap-3">
                      <Badge color={statusColor[app.status] || 'slate'}>{app.status}</Badge>
                      <div>
                        <h3 className="text-sm font-medium text-foreground dark:text-foreground">{app.name}</h3>
                        <p className="text-xs text-muted-foreground">{app.codename} · {app.category} · v{app.version}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <CategoriesCRUD categories={categories} onCategoriesChange={setCustomCategories} iconMap={iconMap} getAppsByCategory={getAppsByCategory} renderAppCard={renderAppCard} />
      )}
    </div>
  )
}

function CategoriesCRUD({ categories, onCategoriesChange, iconMap, getAppsByCategory, renderAppCard }: { categories: CategoryDefinition[]; onCategoriesChange: (cats: CategoryDefinition[]) => void; iconMap: Record<string, React.ComponentType<any>>; getAppsByCategory: (id: string) => any[]; renderAppCard: (app: any) => React.ReactNode }) {
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<CategoryDefinition>({ id: '', name: '', description: '', icon: 'Wrench', apps: [] })
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const startAdd = () => {
    setEditingId('__new__')
    setForm({ id: '', name: '', description: '', icon: 'Wrench', apps: [] })
  }

  const startEdit = (cat: CategoryDefinition) => {
    setEditingId(cat.id)
    setForm({ ...cat })
  }

  const save = () => {
    if (!form.name.trim() || !form.id.trim()) return
    let next: CategoryDefinition[] = [...categories]
    if (editingId === '__new__') {
      next = [...next, { ...form, id: form.id.toLowerCase().replace(/\s+/g, '-'), apps: [] }]
    } else {
      next = next.map(c => c.id === editingId ? { ...c, ...form, id: form.id.toLowerCase().replace(/\s+/g, '-') } : c)
    }
    onCategoriesChange(next)
    localStorage.setItem('appforge-custom-categories', JSON.stringify(next))
    setEditingId(null)
    setForm({ id: '', name: '', description: '', icon: 'Wrench', apps: [] })
  }

  const remove = (id: string) => {
    const next = categories.filter(c => c.id !== id)
    onCategoriesChange(next)
    localStorage.setItem('appforge-custom-categories', JSON.stringify(next))
    if (selectedId === id) setSelectedId(null)
  }

  const Icon = iconMap[form.icon] || Wrench

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground dark:text-foreground">Categories</h2>
        <Button onClick={startAdd}><Plus className="h-4 w-4" /> Add Category</Button>
      </div>

      {editingId && (
        <Card>
          <h3 className="text-sm font-medium text-foreground">{editingId === '__new__' ? 'Add Category' : 'Edit Category'}</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Input label="ID" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="e.g. my-tools" />
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. My Tools" />
            <Input label="Icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="e.g. Wrench" />
            <div className="md:col-span-2">
              <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={save}><Save className="h-4 w-4" /> Save</Button>
            <Button variant="secondary" onClick={() => setEditingId(null)}><X className="h-4 w-4" /> Cancel</Button>
          </div>
        </Card>
      )}

      {selectedId ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setSelectedId(null)}>← Back to categories</Button>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground dark:text-foreground capitalize">{selectedId}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{categories.find(c => c.id === selectedId)?.description || ''}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {getAppsByCategory(selectedId).map(app => renderAppCard(app))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map(cat => {
            const catApps = getAppsByCategory(cat.id)
            const CatIcon = iconMap[cat.icon] || Wrench
            return (
              <Card key={cat.id} className="transition-all hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground dark:text-foreground">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground">{catApps.length} apps</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(cat)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(cat.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{cat.description}</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => setSelectedId(cat.id)}>View Apps</Button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

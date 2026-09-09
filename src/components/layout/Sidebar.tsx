import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  ArrowLeftRight, Binary, Braces, Calendar, ChevronLeft, ChevronRight, Clock, Code, FileCode, FileText, Hash,
  Image as ImageIcon, LayoutDashboard, Lock, LogOut, Monitor, Palette, QrCode, Regex, Search, SearchCheck,
  Settings, Sliders, Star, Sun, Moon, Table2, Type, Users, Video, Wrench,
} from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { searchApps } from '@/lib/registry'
import { resolveCategories, subscribeCategoryOverrides } from '@/lib/categories'
import { useAuth } from '@/auth/AuthProvider'
import { ensureProfile } from '@/lib/account'
import { DragonArenaIcon } from '@/components/dashboard/DragonArenaIcon'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = { ArrowLeftRight, Binary, Braces, Calendar, Code, FileCode, FileText, Hash, Image: ImageIcon, Lock, Palette, QrCode, Regex, Search, Table2, Type, Video, Wrench, DragonArena: DragonArenaIcon }

const coreItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'all-apps', label: 'All Apps', icon: SearchCheck, path: '/apps' },
  { id: 'recent', label: 'Recent', icon: Clock, path: '/recent' },
  { id: 'favorites', label: 'Favorites', icon: Star, path: '/favorites' },
  { id: 'categories', label: 'Categories', icon: Table2, path: '/categories' },
  { id: 'people', label: 'People', icon: Users, path: '/people' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
]

export function Sidebar({ onClose, collapsed: collapsedProp, onToggleCollapse }: { onClose?: () => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
  const location = useLocation()
  const { mode, setMode } = useTheme()
  const { user, signOut } = useAuth()
  const [internalCollapsed, setInternalCollapsed] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [signingOut, setSigningOut] = React.useState(false)
  const [profileAvatar, setProfileAvatar] = React.useState<string | null>(null)
  const [profileName, setProfileName] = React.useState<string | null>(null)
  const [, refreshCategories] = React.useReducer((value) => value + 1, 0)

  React.useEffect(() => subscribeCategoryOverrides(refreshCategories), [])
  React.useEffect(() => {
    let cancelled = false
    if (!user) { setProfileAvatar(null); setProfileName(null); return }
    void ensureProfile(user).then((profile) => {
      if (cancelled) return
      setProfileAvatar(profile.avatar_url || null)
      setProfileName(profile.display_name || profile.username || null)
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [user?.id, location.pathname])

  const categories = resolveCategories()
  const isCollapsed = collapsedProp ?? internalCollapsed
  const searchResults = searchQuery.trim().length > 1 ? searchApps(searchQuery) : []
  const toggleCollapse = () => { if (onToggleCollapse) onToggleCollapse(); else setInternalCollapsed((value) => !value) }
  const cycleTheme = () => { if (mode === 'light') setMode('dark'); else if (mode === 'dark') setMode('system'); else setMode('light') }
  const handleSignOut = async () => { setSigningOut(true); try { await signOut(); onClose?.() } finally { setSigningOut(false) } }
  const ThemeIcon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor
  const avatar = profileAvatar || user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  const displayName = profileName || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Account'
  const initial = String(displayName).trim().charAt(0).toUpperCase() || 'A'

  return (
    <aside className={`flex h-full flex-col border-r border-border bg-background/92 backdrop-blur-xl transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center gap-2 px-4 py-4">{!isCollapsed && <NavLink to="/" onClick={onClose} className="flex min-w-0 items-center gap-2"><img src="/favicon.svg" alt="AppForge" className="h-8 w-8 shrink-0" /><div className="min-w-0"><h1 className="truncate text-sm font-semibold text-foreground">AppForge</h1><p className="truncate text-xs text-muted-foreground">Simple, powerful tools</p></div></NavLink>}<button onClick={toggleCollapse} className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button></div>

      {!isCollapsed && <div className="px-3 pb-2"><div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Search apps…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-9 w-full rounded-lg border border-input bg-background/55 pl-8 pr-3 text-sm outline-none backdrop-blur-md placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/20" /></div>{searchResults.length > 0 && <div className="surface-card mt-2 max-h-52 space-y-1 overflow-y-auto rounded-xl border p-1.5">{searchResults.slice(0, 8).map((app) => { const iconName = app.id === 'ai-dragon-arena' ? 'DragonArena' : app.icon; const Icon = iconMap[iconName] || Wrench; return <NavLink key={app.id} to={app.route} onClick={onClose} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><Icon className="h-4 w-4 shrink-0" /><span className="truncate">{app.name}</span></NavLink> })}</div>}</div>}

      <nav className="scrollbar-hide flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-2">
        <div>{!isCollapsed && <h3 className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Core</h3>}<div className="space-y-0.5">{coreItems.map((item) => { const Icon = item.icon; const active = location.pathname === item.path; return <NavLink key={item.id} to={item.path} onClick={onClose} title={isCollapsed ? item.label : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'}`}><Icon className="h-4 w-4 shrink-0" />{!isCollapsed && <span className="truncate">{item.label}</span>}</NavLink> })}</div></div>
        <div>{!isCollapsed && <h3 className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Categories</h3>}<div className="space-y-0.5">{categories.map((category) => { const Icon = iconMap[category.icon] || Wrench; const path = `/category/${category.id}`; const active = location.pathname === path; return <NavLink key={category.id} to={path} onClick={onClose} title={isCollapsed ? category.name : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'}`}><Icon className="h-4 w-4 shrink-0" />{!isCollapsed && <span className="truncate">{category.name}</span>}</NavLink> })}</div></div>
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        {user && <NavLink to="/settings" onClick={onClose} className={`mb-2 flex items-center gap-2 rounded-xl border border-border/60 bg-background/35 p-2 hover:border-foreground/15 ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? String(displayName) : undefined}><div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-accent text-xs font-semibold text-foreground">{avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : initial}</div>{!isCollapsed && <div className="min-w-0 flex-1"><div className="truncate text-xs font-medium text-foreground">{String(displayName)}</div>{user.email && <div className="truncate text-[10px] text-muted-foreground">{user.email}</div>}</div>}</NavLink>}
        <button onClick={cycleTheme} title={isCollapsed ? 'Toggle theme' : undefined} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"><ThemeIcon className="h-4 w-4 shrink-0" />{!isCollapsed && <span>{mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'}</span>}</button>
        <button onClick={() => void handleSignOut()} disabled={signingOut} title={isCollapsed ? 'Sign out' : undefined} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"><LogOut className="h-4 w-4 shrink-0" />{!isCollapsed && <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>}</button>
      </div>
    </aside>
  )
}

export function MobileHeader({ onOpen }: { onOpen: () => void }) {
  const { mode, setMode } = useTheme()
  const cycleTheme = () => { if (mode === 'light') setMode('dark'); else if (mode === 'dark') setMode('system'); else setMode('light') }
  const ThemeIcon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor
  return <header className="flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl lg:hidden"><button onClick={onOpen} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Open navigation"><Sliders className="h-5 w-5" /></button><NavLink to="/" className="flex items-center gap-2"><img src="/favicon.svg" alt="AppForge" className="h-8 w-8" /><span className="text-sm font-semibold text-foreground">AppForge</span></NavLink><button onClick={cycleTheme} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Change theme"><ThemeIcon className="h-5 w-5" /></button></header>
}

import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ArrowLeftRight, Binary, Braces, Calendar, ChevronDown, ChevronLeft, ChevronRight, CloudSun, Code, FileCode, Hash, HeartHandshake, Image as ImageIcon, LayoutDashboard, Lock, LogOut, Palette, QrCode, Regex, Search, Settings, Sliders, Sparkles, Table2, Type, Users, Video, Wrench, X } from 'lucide-react'
import { getAllApps, getAppsByCategory, searchApps } from '@/lib/registry'
import { appSidebarPreferenceKey, isAppVisibleInSidebar, isCategoryVisibleInSidebar, loadCategoryOverrides, resolveCategories, subscribeCategoryOverrides } from '@/lib/categories'
import { useAuth } from '@/auth/AuthProvider'
import { ensureProfile } from '@/lib/account'
import { DragonArenaIcon } from '@/components/dashboard/DragonArenaIcon'
import { SidebarWeather } from './SidebarWeather'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = { ArrowLeftRight, Binary, Braces, Calendar, CloudSun, Code, FileCode, Hash, Image: ImageIcon, Lock, Palette, QrCode, Regex, Search, Sparkles, Table2, Type, Video, Wrench, DragonArena: DragonArenaIcon }
const coreItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'people', label: 'People', icon: Users, path: '/people' },
]
const navClass = (active: boolean) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'}`

export function Sidebar({ onClose, collapsed: collapsedProp, onToggleCollapse }: { onClose?: () => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [internalCollapsed, setInternalCollapsed] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [signingOut, setSigningOut] = React.useState(false)
  const [signOutError, setSignOutError] = React.useState('')
  const [profileAvatar, setProfileAvatar] = React.useState<string | null>(null)
  const [profileName, setProfileName] = React.useState<string | null>(null)
  const [accountOpen, setAccountOpen] = React.useState(false)
  const accountMenuRef = React.useRef<HTMLDivElement | null>(null)
  const [, refreshWorkspace] = React.useReducer((value) => value + 1, 0)

  React.useEffect(() => subscribeCategoryOverrides(refreshWorkspace), [])
  React.useEffect(() => { setSearchQuery(''); setSignOutError('') }, [location.pathname])
  React.useEffect(() => {
    let cancelled = false
    if (!user) { setProfileAvatar(null); setProfileName(null); return undefined }
    void ensureProfile(user).then((profile) => { if (!cancelled) { setProfileAvatar(profile.avatar_url || null); setProfileName(profile.display_name || profile.username || null) } }).catch(() => undefined)
    return () => { cancelled = true }
  }, [user, location.pathname])

  const isCollapsed = collapsedProp ?? internalCollapsed
  const searchResults = searchQuery.trim().length > 1 ? searchApps(searchQuery) : []
  const categoryOverrides = loadCategoryOverrides()
  const sidebarCategories = resolveCategories(categoryOverrides).filter((category) => isCategoryVisibleInSidebar(category.id, categoryOverrides[category.id]) && getAppsByCategory(category.id).length > 0)
  const sidebarApps = getAllApps().filter((app) => app.status !== 'deprecated' && isAppVisibleInSidebar(app.id, categoryOverrides[appSidebarPreferenceKey(app.id)]))
  const avatar = profileAvatar || user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  const displayName = profileName || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Account'
  const initial = String(displayName).trim().charAt(0).toUpperCase() || 'A'
  const toggleCollapse = () => { if (onToggleCollapse) onToggleCollapse(); else setInternalCollapsed((value) => !value) }
  React.useEffect(() => {
    if (!accountOpen) return
    const closeOnOutside = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [accountOpen])

  const handleSignOut = async () => {
    setAccountOpen(false)
    if (signingOut) return
    setSigningOut(true)
    setSignOutError('')
    try {
      await signOut()
      onClose?.()
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Could not sign out. Try again.')
    } finally { setSigningOut(false) }
  }
  const closeSearchAndSidebar = () => { setSearchQuery(''); onClose?.() }
  const asideWidth = onClose ? 'w-screen max-w-none border-r-0' : isCollapsed ? 'w-16 border-r border-border' : 'w-64 border-r border-border'
  const isCoreActive = (path: string) => path === '/settings' ? location.pathname.startsWith('/settings') : location.pathname === path

  return <aside className={`flex h-full flex-col bg-background/92 backdrop-blur-xl transition-[width,transform,opacity] duration-200 ease-out ${asideWidth}`}>
    <div className={`flex items-center gap-2 py-4 ${isCollapsed ? 'flex-col px-2' : 'px-4'}`}>
      {isCollapsed ? <NavLink to="/" aria-label="AppForge home" className="shrink-0"><img src="/favicon.svg" alt="" className="h-6 w-6" /></NavLink> : <NavLink to="/" onClick={onClose} className="flex min-w-0 items-center gap-2"><img src="/favicon.svg" alt="AppForge" className="h-8 w-8 shrink-0" /><h1 className="truncate text-sm font-semibold text-foreground">AppForge</h1></NavLink>}
      {onClose ? <button onClick={onClose} className="ml-auto rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close navigation"><X className="h-5 w-5" /></button> : <button onClick={toggleCollapse} className={`${isCollapsed ? '' : 'ml-auto'} rounded-xl p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground`} aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>}
    </div>
    {!isCollapsed && <div className="px-3 pb-2"><div className="relative"><Search className="pointer-events-none absolute z-10 left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="search" aria-label="Search apps" placeholder="Search apps…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-9 w-full rounded-xl border border-input bg-background/55 pl-8 pr-9 text-sm outline-none backdrop-blur-md placeholder:text-muted-foreground focus:ring-1 focus:ring-ring/20 [&::-webkit-search-cancel-button]:hidden" />{searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-1 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}</div>{searchResults.length > 0 && <div className="surface-card mt-2 max-h-52 space-y-1 overflow-y-auto rounded-xl border p-1.5 shadow-xl">{searchResults.slice(0, 8).map((app) => { const Icon = iconMap[app.id === 'ai-dragon-arena' ? 'DragonArena' : app.icon] || Wrench; return <NavLink key={app.id} to={app.route} onClick={closeSearchAndSidebar} className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><Icon className="h-4 w-4 shrink-0" /><span className="truncate">{app.name}</span></NavLink> })}</div>}</div>}
    <nav className="scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden px-3 py-2">
      {!isCollapsed && <h3 className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">System</h3>}
      <div className="space-y-0.5">{coreItems.map((item) => { const Icon = item.icon; return <NavLink key={item.id} to={item.path} onClick={onClose} title={isCollapsed ? item.label : undefined} className={navClass(isCoreActive(item.path))}><Icon className="h-4 w-4 shrink-0" />{!isCollapsed && <span className="truncate">{item.label}</span>}</NavLink> })}</div>
      {(sidebarCategories.length > 0 || sidebarApps.length > 0) && <div className="mt-5">{!isCollapsed && <div className="mb-1 flex items-center justify-between px-3"><h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Workspace</h3><NavLink to="/workspace" onClick={onClose} className="text-[10px] text-muted-foreground hover:text-foreground">Customize</NavLink></div>}<div className="space-y-0.5">{sidebarCategories.map((category) => { const Icon = iconMap[category.icon] || Wrench; const path = `/category/${category.id}`; return <NavLink key={category.id} to={path} onClick={onClose} title={isCollapsed ? category.name : undefined} className={navClass(location.pathname === path)}><Icon className="h-4 w-4 shrink-0" />{!isCollapsed && <span className="truncate">{category.name}</span>}</NavLink> })}</div>{sidebarApps.length > 0 && <div className={`${sidebarCategories.length > 0 ? 'mt-2 ' : ''}space-y-0.5`}>{sidebarApps.map((app) => { const Icon = iconMap[app.id === 'ai-dragon-arena' ? 'DragonArena' : app.icon] || Wrench; return <NavLink key={app.id} to={app.route} onClick={onClose} title={isCollapsed ? app.name : undefined} className={navClass(location.pathname === app.route)}><Icon className="h-4 w-4 shrink-0" />{!isCollapsed && <span className="truncate">{app.name}</span>}</NavLink> })}</div>}</div>}
    </nav>
    <div className="px-3 pb-2"><SidebarWeather collapsed={isCollapsed} /></div>
    <div ref={accountMenuRef} className="relative border-t border-border p-3">{user && <>{accountOpen && !isCollapsed && <div className="absolute bottom-[calc(100%-0.25rem)] left-3 right-3 z-30 rounded-xl border border-border/70 bg-background p-1.5 shadow-xl"><div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Appearance</div><div className="grid grid-cols-3 gap-1 px-1 pb-1">{(['light','dark','system'] as const).map((mode) => <button key={mode} type="button" onClick={() => { localStorage.setItem('appforge-theme', JSON.stringify({ mode })); const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.classList.toggle('dark', dark); document.documentElement.style.colorScheme = dark ? 'dark' : 'light'; setAccountOpen(false) }} className="rounded-xl px-2 py-1.5 text-[11px] capitalize text-muted-foreground hover:bg-accent hover:text-foreground">{mode}</button>)}</div><NavLink to="/settings" onClick={() => { setAccountOpen(false); onClose?.() }} className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><Settings className="h-4 w-4" /> Settings</NavLink><a href="https://github.com/dracorisz/appforge/issues" target="_blank" rel="noreferrer" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"><HeartHandshake className="h-4 w-4" /> Support</a><button onClick={() => void handleSignOut()} disabled={signingOut} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"><LogOut className="h-4 w-4" />{signingOut ? 'Signing out…' : 'Sign out'}</button></div>}<button type="button" onClick={() => setAccountOpen((value) => !value)} className={`flex w-full items-center gap-2 rounded-xl border border-border/60 bg-background/35 p-2 text-left hover:border-foreground/15 ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? String(displayName) : undefined}><div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-accent text-xs font-semibold text-foreground">{avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : initial}</div>{!isCollapsed && <><div className="min-w-0 flex-1"><div className="truncate text-xs font-medium text-foreground">{String(displayName)}</div>{user.email && <div className="truncate text-[10px] text-muted-foreground">{user.email}</div>}</div><ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${accountOpen ? 'rotate-180' : ''}`} /></>}</button></>}{signOutError && !isCollapsed && <div role="alert" className="mt-1 rounded-xl border border-destructive/25 bg-destructive/5 px-2.5 py-2 text-[11px] leading-4 text-destructive">{signOutError}</div>}</div>
  </aside>
}

export function MobileHeader({ onOpen, triggerRef }: { onOpen: () => void; triggerRef?: React.Ref<HTMLButtonElement> }) {
  return <header className="flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl lg:hidden"><button ref={triggerRef} onClick={onOpen} className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Open navigation"><Sliders className="h-5 w-5" /></button><NavLink to="/" className="flex items-center gap-2"><img src="/favicon.svg" alt="AppForge" className="h-8 w-8" /><span className="text-sm font-semibold text-foreground">AppForge</span></NavLink></header>
}

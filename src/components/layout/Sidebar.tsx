import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  ArrowLeftRight,
  Binary,
  Braces,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Code,
  FileCode,
  FileText,
  Hash,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  LogOut,
  Palette,
  QrCode,
  Regex,
  Search,
  Settings,
  Sliders,
  Sparkles,
  Table2,
  Type,
  Users,
  Video,
  Wrench,
  X,
} from 'lucide-react'
import { getAllApps, getAppsByCategory, searchApps } from '@/lib/registry'
import {
  appSidebarPreferenceKey,
  isAppVisibleInSidebar,
  isCategoryVisibleInSidebar,
  loadCategoryOverrides,
  resolveCategories,
  subscribeCategoryOverrides,
} from '@/lib/categories'
import { useAuth } from '@/auth/AuthProvider'
import { ensureProfile, getRole } from '@/lib/account'
import { DragonArenaIcon } from '@/components/dashboard/DragonArenaIcon'
import { SidebarWeather } from './SidebarWeather'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ArrowLeftRight,
  Binary,
  Braces,
  Calendar,
  CloudSun,
  Code,
  FileCode,
  FileText,
  Hash,
  Image: ImageIcon,
  Lock,
  Palette,
  QrCode,
  Regex,
  Search,
  Sparkles,
  Table2,
  Type,
  Video,
  Wrench,
  DragonArena: DragonArenaIcon,
}

const coreItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'people', label: 'People', icon: Users, path: '/people' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
]

const navClass = (active: boolean) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    active
      ? 'bg-accent text-foreground'
      : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'
  }`

export function Sidebar({
  onClose,
  collapsed: collapsedProp,
  onToggleCollapse,
}: {
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [internalCollapsed, setInternalCollapsed] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [signingOut, setSigningOut] = React.useState(false)
  const [profileAvatar, setProfileAvatar] = React.useState<string | null>(null)
  const [profileName, setProfileName] = React.useState<string | null>(null)
  const [profileRole, setProfileRole] = React.useState<'user' | 'admin'>('user')
  const [, refreshWorkspace] = React.useReducer((value) => value + 1, 0)

  React.useEffect(() => subscribeCategoryOverrides(refreshWorkspace), [])

  React.useEffect(() => {
    let cancelled = false

    if (!user) {
      setProfileAvatar(null)
      setProfileName(null)
      setProfileRole('user')
      return undefined
    }

    void Promise.all([ensureProfile(user), getRole(user.id)])
      .then(([profile, role]) => {
        if (cancelled) return
        setProfileAvatar(profile.avatar_url || null)
        setProfileName(profile.display_name || profile.username || null)
        setProfileRole(role)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [user, location.pathname])

  const isCollapsed = collapsedProp ?? internalCollapsed
  const searchResults = searchQuery.trim().length > 1 ? searchApps(searchQuery) : []
  const categoryOverrides = loadCategoryOverrides()
  const sidebarCategories = resolveCategories(categoryOverrides).filter(
    (category) =>
      isCategoryVisibleInSidebar(category.id, categoryOverrides[category.id]) &&
      getAppsByCategory(category.id).length > 0,
  )
  const sidebarApps = getAllApps().filter(
    (app) =>
      app.status !== 'deprecated' &&
      isAppVisibleInSidebar(app.id, categoryOverrides[appSidebarPreferenceKey(app.id)]),
  )

  const avatar = profileAvatar || user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  const displayName =
    profileName || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Account'
  const initial = String(displayName).trim().charAt(0).toUpperCase() || 'A'

  const toggleCollapse = () => {
    if (onToggleCollapse) onToggleCollapse()
    else setInternalCollapsed((value) => !value)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      onClose?.()
    } finally {
      setSigningOut(false)
    }
  }

  const asideWidth = onClose ? 'w-screen max-w-none border-r-0' : isCollapsed ? 'w-16 border-r border-border' : 'w-64 border-r border-border'

  return (
    <aside
      className={`flex h-full flex-col bg-background/92 backdrop-blur-xl transition-[width,transform,opacity] duration-200 ease-out ${asideWidth}`}
    >
      <div className={`flex items-center gap-2 py-4 ${isCollapsed ? 'flex-col px-2' : 'px-4'}`}>
        {isCollapsed ? (
          <NavLink to="/" aria-label="AppForge home" className="shrink-0">
            <img src="/favicon.svg" alt="" className="h-6 w-6" />
          </NavLink>
        ) : (
          <NavLink to="/" onClick={onClose} className="flex min-w-0 items-center gap-2">
            <img src="/favicon.svg" alt="AppForge" className="h-8 w-8 shrink-0" />
            <h1 className="truncate text-sm font-semibold text-foreground">AppForge</h1>
          </NavLink>
        )}

        {onClose ? (
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={toggleCollapse}
            className={`${isCollapsed ? '' : 'ml-auto'} rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search apps…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background/55 pl-8 pr-3 text-sm outline-none backdrop-blur-md placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/20"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="surface-card mt-2 max-h-52 space-y-1 overflow-y-auto rounded-xl border p-1.5">
              {searchResults.slice(0, 8).map((app) => {
                const Icon = iconMap[app.id === 'ai-dragon-arena' ? 'DragonArena' : app.icon] || Wrench
                return (
                  <NavLink
                    key={app.id}
                    to={app.route}
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{app.name}</span>
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>
      )}

      <nav className="scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden px-3 py-2">
        {!isCollapsed && (
          <h3 className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            System
          </h3>
        )}

        <div className="space-y-0.5">
          {coreItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={navClass(location.pathname === item.path)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            )
          })}

          {profileRole === 'admin' && (
            <NavLink
              to="/admin/content"
              onClick={onClose}
              title={isCollapsed ? 'Content Manager' : undefined}
              className={navClass(location.pathname === '/admin/content')}
            >
              <FileText className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">Content Manager</span>}
            </NavLink>
          )}
        </div>

        {(sidebarCategories.length > 0 || sidebarApps.length > 0) && (
          <div className="mt-5">
            {!isCollapsed && (
              <div className="mb-1 flex items-center justify-between px-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Workspace
                </h3>
                <NavLink to="/workspace" onClick={onClose} className="text-[10px] text-muted-foreground hover:text-foreground">
                  Customize
                </NavLink>
              </div>
            )}

            <div className="space-y-0.5">
              {sidebarCategories.map((category) => {
                const Icon = iconMap[category.icon] || Wrench
                const path = `/category/${category.id}`
                return (
                  <NavLink
                    key={category.id}
                    to={path}
                    onClick={onClose}
                    title={isCollapsed ? category.name : undefined}
                    className={navClass(location.pathname === path)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{category.name}</span>}
                  </NavLink>
                )
              })}
            </div>

            {sidebarApps.length > 0 && (
              <div className={`${sidebarCategories.length > 0 ? 'mt-2 ' : ''}space-y-0.5`}>
                {sidebarApps.map((app) => {
                  const Icon = iconMap[app.id === 'ai-dragon-arena' ? 'DragonArena' : app.icon] || Wrench
                  return (
                    <NavLink
                      key={app.id}
                      to={app.route}
                      onClick={onClose}
                      title={isCollapsed ? app.name : undefined}
                      className={navClass(location.pathname === app.route)}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{app.name}</span>}
                    </NavLink>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="px-3 pb-2">
        <SidebarWeather collapsed={isCollapsed} />
      </div>

      <div className="space-y-1 border-t border-border p-3">
        {user && (
          <NavLink
            to="/settings"
            onClick={onClose}
            className={`mb-2 flex items-center gap-2 rounded-xl border border-border/60 bg-background/35 p-2 hover:border-foreground/15 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? String(displayName) : undefined}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-accent text-xs font-semibold text-foreground">
              {avatar ? (
                <img src={avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initial
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-foreground">{String(displayName)}</div>
                {user.email && <div className="truncate text-[10px] text-muted-foreground">{user.email}</div>}
              </div>
            )}
          </NavLink>
        )}

        <button
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          title={isCollapsed ? 'Sign out' : undefined}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>}
        </button>
      </div>
    </aside>
  )
}

export function MobileHeader({
  onOpen,
  triggerRef,
}: {
  onOpen: () => void
  triggerRef?: React.Ref<HTMLButtonElement>
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl lg:hidden">
      <button
        ref={triggerRef}
        onClick={onOpen}
        className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label="Open navigation"
      >
        <Sliders className="h-5 w-5" />
      </button>
      <NavLink to="/" className="flex items-center gap-2">
        <img src="/favicon.svg" alt="AppForge" className="h-8 w-8" />
        <span className="text-sm font-semibold text-foreground">AppForge</span>
      </NavLink>
      <span className="h-9 w-9" aria-hidden="true" />
    </header>
  )
}

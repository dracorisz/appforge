import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Settings, SearchCheck, Image as ImageIcon, TrendingUp, Cloud, Search, Sliders, Sun, Moon, Monitor, ChevronLeft, ChevronRight, Star, Clock, ArrowLeftRight, Wrench, Code, Palette, FileText, Table2, Lock, FileCode, Hash, QrCode, Link, Presentation, Receipt, Regex, Video, Music, File, Sheet, Info, Key, Globe, Binary, Calendar, Braces } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { getAllApps, getAllCategories, searchApps, getApp } from '@/lib/registry'

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, Settings, SearchCheck, Image: ImageIcon, TrendingUp, Cloud, Search, Star, Clock, ArrowLeftRight, Wrench, Code, Palette, FileText, Table2, Lock, FileCode, Hash, QrCode, Link, Presentation, Receipt, Regex, Video, Music, File, Sheet, Info, Key, Globe, Binary, Calendar, Braces
}

const sections = [
  {
    title: 'CORE',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { id: 'all-apps', label: 'All Apps', icon: SearchCheck, path: '/apps' },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    ]
  },
  {
    title: 'CATEGORIES',
    items: getAllCategories().map(cat => ({
      id: cat.id,
      label: cat.name,
      icon: iconMap[cat.icon] || Wrench,
      path: `/category/${cat.id}`
    }))
  }
]

export function Sidebar({ onClose, collapsed: collapsedProp, onToggleCollapse }: { onClose?: () => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
  const location = useLocation()
  const { mode, setMode } = useTheme()
  const [internalCollapsed, setInternalCollapsed] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const navRef = React.useRef<HTMLDivElement>(null)

  const isCollapsed = collapsedProp ?? internalCollapsed
  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse()
    } else {
      setInternalCollapsed(!internalCollapsed)
    }
  }

  const cycleTheme = () => {
    if (mode === 'light') setMode('dark')
    else if (mode === 'dark') setMode('system')
    else setMode('light')
  }

  const themeIcon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor
  const ThemeIcon = themeIcon

  const searchResults = searchQuery.trim().length > 1 ? searchApps(searchQuery) : []

  React.useEffect(() => {
    const el = navRef.current
    if (!el) return

    let startX = 0
    let isScrolling = false

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      isScrolling = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isScrolling) {
        const diffX = Math.abs(e.touches[0].clientX - startX)
        const diffY = Math.abs(e.touches[0].clientY - e.touches[0].clientY)
        if (diffX > diffY) {
          isScrolling = true
        }
      }
      if (isScrolling) {
        e.preventDefault()
        const deltaX = e.touches[0].clientX - startX
        el.scrollLeft -= deltaX * 0.5
        startX = e.touches[0].clientX
      }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  return (
    <aside className={`flex h-full flex-col border-r border-border bg-background transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center gap-2 px-5 py-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="AppForge" className="h-8 w-8" />
            <div>
              <h1 className="text-sm font-semibold text-foreground">AppForge</h1>
              <p className="text-xs text-muted-foreground">Simple, powerful tools</p>
            </div>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="ml-auto rounded-lg p-1 hover:bg-accent"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-border bg-background p-1">
              {searchResults.slice(0, 8).map(app => {
                const Icon = iconMap[app.icon] || Wrench
                return (
                  <NavLink
                    key={app.id}
                    to={app.route}
                    onClick={onClose}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{app.name}</span>
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>
      )}

      <nav ref={navRef} className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-3 py-2 scrollbar-hide">
        {sections.map((section) => (
          <div key={section.title}>
            {!isCollapsed && (
              <h3 className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</h3>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={onClose}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={cycleTheme}
          title={isCollapsed ? 'Toggle theme' : undefined}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ThemeIcon className="h-4 w-4" />
          {!isCollapsed && (
            <span>{mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'}</span>
          )}
        </button>
      </div>
    </aside>
  )
}

export function MobileHeader({ onOpen }: { onOpen: () => void }) {
  const { mode, setMode } = useTheme()
  const cycleTheme = () => {
    if (mode === 'light') setMode('dark')
    else if (mode === 'dark') setMode('system')
    else setMode('light')
  }
  const ThemeIcon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
      <button onClick={onOpen} className="rounded-lg p-2 hover:bg-accent">
        <Sliders className="h-5 w-5 text-foreground" />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center">
          <img src="/favicon.svg" alt="AppForge" className="h-8 w-8" />
        </div>
        <span className="text-sm font-semibold text-foreground">AppForge</span>
      </div>
      <button onClick={cycleTheme} className="rounded-lg p-2 hover:bg-accent">
        <ThemeIcon className="h-5 w-5 text-foreground" />
      </button>
    </header>
  )
}

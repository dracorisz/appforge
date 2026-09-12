import React from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar, MobileHeader } from './Sidebar'
import { Footer } from './Footer'
import { BackToTop } from './BackToTop'
import { ProjectPulse } from './ProjectPulse'
import { AppMetaBar } from './AppMetaBar'
import { DesktopBuddyOverlay } from '@/components/dashboard/DesktopBuddyOverlay'

export function Layout({ children, currentVersion }: { children: React.ReactNode; currentVersion?: string }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const menuTriggerRef = React.useRef<HTMLButtonElement | null>(null)
  const location = useLocation()
  const showProjectPulse = location.pathname === '/' || location.pathname === '/recent'
  const showAppMeta = location.pathname.startsWith('/apps/')
  const showDesktopBuddy = location.pathname !== '/apps/desktop-buddy'

  const closeMobileSidebar = React.useCallback(() => {
    setMobileOpen(false)
    window.setTimeout(() => menuTriggerRef.current?.focus(), 0)
  }, [])

  React.useEffect(() => {
    if (!mobileOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') closeMobileSidebar() }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileOpen, closeMobileSidebar])

  React.useEffect(() => { setMobileOpen(false) }, [location.pathname])

  return (
    <div data-route={location.pathname} className="flex h-screen overflow-hidden bg-background">
      <div className={`hidden lg:flex ${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-background lg:hidden" role="dialog" aria-modal="true" aria-label="AppForge navigation">
          <Sidebar onClose={closeMobileSidebar} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MobileHeader onOpen={() => setMobileOpen(true)} triggerRef={menuTriggerRef} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto min-w-0 w-full max-w-[1500px]">
            {showProjectPulse && <ProjectPulse />}
            {showAppMeta && <AppMetaBar />}
            <div className="app-content w-full [&>div:first-child]:!mx-0 [&>div:first-child]:!w-full [&>div:first-child]:!max-w-none [&>div:first-child]:!p-0">
              {children}
            </div>
          </div>
        </main>
        <Footer version={currentVersion} />
      </div>

      {showDesktopBuddy && <DesktopBuddyOverlay />}
      <BackToTop />
    </div>
  )
}

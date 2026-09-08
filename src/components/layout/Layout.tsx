import React from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar, MobileHeader } from './Sidebar'
import { Footer } from './Footer'
import { BackToTop } from './BackToTop'
import { ProjectPulse } from './ProjectPulse'

export function Layout({ children, currentVersion }: { children: React.ReactNode; currentVersion?: string }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const location = useLocation()
  const showProjectPulse = location.pathname === '/' || location.pathname === '/recent'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className={`hidden lg:flex ${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-xl">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader onOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {showProjectPulse && <ProjectPulse />}
            {children}
          </div>
        </main>
        <Footer version={currentVersion} />
      </div>

      <BackToTop />
    </div>
  )
}

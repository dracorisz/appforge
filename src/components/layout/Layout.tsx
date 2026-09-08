import React from 'react'
import { Sidebar, MobileHeader } from './Sidebar'
import { Footer } from './Footer'
import { BackToTop } from './BackToTop'

export function Layout({ children, currentVersion }: { children: React.ReactNode; currentVersion?: string }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

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
            {children}
          </div>
        </main>
        <Footer version={currentVersion || '1.01'} />
      </div>

      <BackToTop />
    </div>
  )
}

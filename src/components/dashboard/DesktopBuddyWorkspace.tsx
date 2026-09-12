import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Camera, Eraser, Images, PackageOpen, Sparkles, WandSparkles } from 'lucide-react'
import { DesktopBuddy } from './DesktopBuddy'
import { DesktopBuddyAssetLab } from './DesktopBuddyAssetLab'
import { DesktopBuddyCapture } from './DesktopBuddyCapture'
import { DesktopBuddyKdeLibrary } from './DesktopBuddyKdeLibrary'
import { DesktopBuddyProviderLab } from './DesktopBuddyProviderLab'
import { DesktopBuddyTransparencyLab } from './DesktopBuddyTransparencyLab'

type WorkspaceTab = 'character' | 'generate' | 'capture' | 'optimize' | 'transparency' | 'library'

const tabs: Array<{ id: WorkspaceTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'character', label: 'Character', icon: Sparkles },
  { id: 'generate', label: 'Generate', icon: WandSparkles },
  { id: 'capture', label: 'Capture', icon: Camera },
  { id: 'optimize', label: 'Optimize', icon: PackageOpen },
  { id: 'transparency', label: 'Transparency', icon: Eraser },
  { id: 'library', label: 'KDE Library', icon: Images },
]
const tabIds = new Set<WorkspaceTab>(tabs.map((tab) => tab.id))
const tabFromParams = (params: URLSearchParams): WorkspaceTab => {
  const value = params.get('tab')
  return value && tabIds.has(value as WorkspaceTab) ? value as WorkspaceTab : 'character'
}

export function DesktopBuddyWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = React.useState<WorkspaceTab>(() => tabFromParams(searchParams))

  React.useEffect(() => {
    const requested = tabFromParams(searchParams)
    if (requested !== activeTab) setActiveTab(requested)
  }, [activeTab, searchParams])

  const selectTab = (tab: WorkspaceTab) => {
    setActiveTab(tab)
    const next = new URLSearchParams(searchParams)
    if (tab === 'character') next.delete('tab')
    else next.set('tab', tab)
    setSearchParams(next)
  }

  return (
    <div className="w-full space-y-4 pb-8">
      <nav className="sticky top-0 z-20 -mx-1 overflow-x-auto rounded-xl border border-border/70 bg-background/90 p-1 shadow-sm backdrop-blur" aria-label="Desktop Buddy workspace" role="tablist">
        <div className="flex min-w-max gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => selectTab(id)}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors ${activeTab === id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="w-full [&>div:first-child]:!mx-0 [&>div:first-child]:!max-w-none [&>div:first-child]:!p-0 [&>section:first-child]:!mx-0 [&>section:first-child]:!mt-0 [&>section:first-child]:!max-w-none">
        {activeTab === 'character' && <DesktopBuddy />}
        {activeTab === 'generate' && <DesktopBuddyProviderLab />}
        {activeTab === 'capture' && <DesktopBuddyCapture />}
        {activeTab === 'optimize' && <DesktopBuddyAssetLab />}
        {activeTab === 'transparency' && <DesktopBuddyTransparencyLab />}
        {activeTab === 'library' && <DesktopBuddyKdeLibrary />}
      </div>
    </div>
  )
}

import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eraser, Images, PackageOpen, Sparkles, WandSparkles } from 'lucide-react'
import { DesktopBuddy } from './DesktopBuddy'
import { DesktopBuddyAssetLab } from './DesktopBuddyAssetLab'
import { DesktopBuddyKdeLibrary } from './DesktopBuddyKdeLibrary'
import { DesktopBuddyProviderLab } from './DesktopBuddyProviderLab'
import { DesktopBuddyTransparencyLab } from './DesktopBuddyTransparencyLab'
import { WidgetPreferencePanel } from './WidgetPreferencePanel'
import { Tabs } from '@/components/ui'

type WorkspaceTab = 'character' | 'generate' | 'optimize' | 'transparency' | 'library'

const tabs: Array<{ id: WorkspaceTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'character', label: 'Character', icon: Sparkles },
  { id: 'generate', label: 'Generate', icon: WandSparkles },
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
    <div className="w-full space-y-5 pb-8">
      <WidgetPreferencePanel kind="desktop-buddy" />
      <Tabs tabs={tabs} active={activeTab} onChange={(id) => selectTab(id as WorkspaceTab)} ariaLabel="Desktop Buddy workspace" className="sticky top-0 z-20 -mx-1 bg-background/90 backdrop-blur" />

      <div className="w-full [&>div:first-child]:!mx-0 [&>div:first-child]:!max-w-none [&>div:first-child]:!p-0 [&>section:first-child]:!mx-0 [&>section:first-child]:!mt-0 [&>section:first-child]:!max-w-none">
        {activeTab === 'character' && <DesktopBuddy />}
        {activeTab === 'generate' && <DesktopBuddyProviderLab />}
        {activeTab === 'optimize' && <DesktopBuddyAssetLab />}
        {activeTab === 'transparency' && <DesktopBuddyTransparencyLab />}
        {activeTab === 'library' && <DesktopBuddyKdeLibrary />}
      </div>
    </div>
  )
}

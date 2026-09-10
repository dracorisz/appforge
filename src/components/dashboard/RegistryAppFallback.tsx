import React from 'react'
import { ArrowLeft, Construction, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Card } from '@/components/ui'
import { getAllApps } from '@/lib/registry'
import { DesktopBuddy } from './DesktopBuddy'
import { DesktopBuddyAssetLab } from './DesktopBuddyAssetLab'
import { DesktopBuddyKdeLibrary } from './DesktopBuddyKdeLibrary'
import { DesktopBuddyProviderLab } from './DesktopBuddyProviderLab'
import { WidgetPreferencePanel } from './WidgetPreferencePanel'

export function RegistryAppFallback() {
  const { slug } = useParams()

  if (slug === 'desktop-buddy') return <><WidgetPreferencePanel kind="desktop-buddy" /><DesktopBuddy /><DesktopBuddyKdeLibrary /><DesktopBuddyProviderLab /><DesktopBuddyAssetLab /></>

  const app = getAllApps().find((item) => item.route === `/apps/${slug}`)

  if (!app) {
    return (
      <Card className="mx-auto max-w-2xl p-6 text-center">
        <Construction className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 text-xl font-semibold">App route not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This route is not registered in the AppForge app registry.</p>
        <Link to="/apps" className="mt-4 inline-flex items-center gap-2 text-sm font-medium hover:underline"><ArrowLeft className="h-4 w-4" /> Back to apps</Link>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2"><Badge color="slate">{app.status}</Badge><Badge color="slate">v{app.version}</Badge></div>
        <h1 className="mt-4 text-2xl font-semibold">{app.name}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{app.description}</p>
        <div className="mt-5 rounded-xl border border-border/60 bg-background/45 p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground"><Construction className="h-4 w-4" /> Planned app surface</div>
          <p className="mt-2 leading-6">This registry entry is tracked intentionally but does not yet have a dedicated implementation. Its route is reserved so navigation, docs and agents never silently fall back to an unrelated page.</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/apps" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent"><ArrowLeft className="h-4 w-4" /> All apps</Link>
          <a href="https://docs.sstoken.space/PROJECT-PULSE" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent">Project status <ExternalLink className="h-4 w-4" /></a>
        </div>
      </Card>
    </div>
  )
}

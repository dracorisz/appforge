import React from 'react'
import { useLocation } from 'react-router-dom'
import { Check, CircleDot, Copy } from 'lucide-react'
import { BuildBadge } from '@/components/ui'
import { getAllApps } from '@/lib/registry'

const statusLabel: Record<string, string> = {
  launched: 'Live',
  beta: 'Beta',
  building: 'Building',
  idea: 'Planned',
  deprecated: 'Deprecated',
}

const LEGACY_ROUTE_ALIASES: Record<string, string> = {
  '/apps/scrapper-pro': '/apps/getter-pro',
  '/pf-scrapper-pro': '/apps/getter-pro',
}

export function AppMetaBar() {
  const location = useLocation()
  const canonicalPath = LEGACY_ROUTE_ALIASES[location.pathname] || location.pathname
  const app = getAllApps().find((item) => item.route === canonicalPath)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => setCopied(false), [canonicalPath])

  if (!app) return null

  const copyCanonicalLink = async () => {
    const url = new URL(app.route, window.location.origin).toString()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-border/60 bg-background/44 px-3 py-2.5 text-xs text-muted-foreground shadow-sm backdrop-blur-lg">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate font-semibold text-foreground">{app.name}</span>
            <span className="text-border">•</span>
            <span className="font-medium text-foreground">v{app.version}</span>
            <span className="text-border">•</span>
            <span className="capitalize">{app.category.replace('-', ' ')}</span>
            <span className="text-border">•</span>
            <span className="inline-flex items-center gap-1.5">
              <CircleDot className="h-3 w-3" aria-hidden="true" />
              {statusLabel[app.status] || app.status}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 max-w-4xl text-[11px] leading-4 text-muted-foreground/90 sm:line-clamp-1">
            {app.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void copyCanonicalLink()}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border/70 px-2.5 text-[11px] font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Copy canonical link for ${app.name}`}
            title="Copy canonical app link"
          >
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <span className="hidden text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80 lg:inline">Deployment</span>
          <BuildBadge compact />
        </div>
      </div>
    </div>
  )
}

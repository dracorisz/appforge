import React from 'react'
import { Cloud, RefreshCw, ShieldCheck } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'

type VertexStatus = {
  ok?: boolean
  configured?: boolean
  requiresSignIn?: boolean
  recoverableJobs?: boolean
  model?: string
  error?: string
}

export function VertexBridgeStatus() {
  const [status, setStatus] = React.useState<VertexStatus | null>(null)
  const [loading, setLoading] = React.useState(false)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/desktop-buddy-vertex', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({})) as VertexStatus
      setStatus(response.ok ? payload : { configured: false, error: payload.error || 'Status unavailable.' })
    } catch {
      setStatus({ configured: false, error: 'Status unavailable on this deployment.' })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { void refresh() }, [refresh])

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><Cloud className="h-5 w-5 text-muted-foreground" /><h2 className="text-sm font-semibold text-foreground">Vertex AI secure bridge</h2></div>
          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">Server status only. Google project, Workload Identity, service-account and bucket identifiers remain deployment configuration and are never profile fields.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void refresh()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</Button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {status === null ? <Badge color="slate">Checking</Badge> : status.configured ? <Badge color="green">Configured</Badge> : <Badge color="yellow">Awaiting WIF/IAM</Badge>}
        {status?.recoverableJobs && <Badge color="slate">Recoverable jobs</Badge>}
        {status?.requiresSignIn && <Badge color="slate">User auth required</Badge>}
      </div>
      <div className="mt-3 rounded-xl border border-border/60 bg-background/35 p-3 text-xs leading-5 text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground"><ShieldCheck className="h-4 w-4" /> Keyless server identity</div>
        <p className="mt-1">Vercel OIDC → Google Workload Identity Federation → short-lived bridge identity → private Cloud Run. No downloadable Google service-account key is required.</p>
        {status?.model && <p className="mt-2">Configured image policy: <span className="font-medium text-foreground">{status.model}</span></p>}
        {status?.error && <p className="mt-2">{status.error}</p>}
      </div>
    </Card>
  )
}

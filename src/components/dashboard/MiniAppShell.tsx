import React from 'react'
import { Card, Button, Badge, Input, Textarea } from '@/components/ui'
import { HeartHandshake, Save, X, Trash2, Star } from 'lucide-react'
import type { MiniApp } from '@/types'

const SUPPORT_URL = 'https://www.paypal.com/paypalme/dracorisz'

export function MiniAppShell({ app, onUpdate, onDelete, onToggleFavorite, isFavorite }: { app: MiniApp; onUpdate?: (app: MiniApp) => void; onDelete?: (id: string) => void; onToggleFavorite?: (id: string) => void; isFavorite?: boolean }) {
  const [editing, setEditing] = React.useState(false)
  const [form, setForm] = React.useState<MiniApp>(app)

  React.useEffect(() => {
    setForm(app)
  }, [app])

  const save = () => {
    if (onUpdate) onUpdate(form)
    setEditing(false)
  }

  const statusColor = app.status === 'building' ? 'yellow' : app.status === 'launched' ? 'green' : 'blue'

  return (
    <div className="space-y-6">
      {app.coverImage && <div className="relative h-48 w-full overflow-hidden rounded-xl"><img src={app.coverImage} alt={app.name} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" /></div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-muted text-sm font-semibold text-foreground" aria-hidden="true">
            {app.icon ? <img src={app.icon} alt="" className="h-full w-full object-cover" /> : app.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-foreground">{app.name}</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{app.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge color={statusColor}>{app.status}</Badge>
              <Badge color="slate">v{app.version}</Badge>
              <span className="text-xs text-muted-foreground">{app.category}</span>
              <span className="text-xs text-muted-foreground">{app.codename}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/70 bg-background/45 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Support AppForge">
            <HeartHandshake className="h-4 w-4" /> Support
          </a>
          {editing ? (
            <>
              <Button onClick={save}><Save className="h-4 w-4" /> Save</Button>
              <Button variant="secondary" onClick={() => { setForm(app); setEditing(false) }}><X className="h-4 w-4" /> Cancel</Button>
            </>
          ) : (
            onUpdate && <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          )}
          {onToggleFavorite && (
            <Button variant="ghost" onClick={() => onToggleFavorite(app.id)} className={isFavorite ? 'text-amber-500' : ''} aria-label={isFavorite ? `Remove ${app.name} from favorites` : `Add ${app.name} to favorites`}>
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" onClick={() => onDelete(app.id)} className="text-red-500" aria-label={`Delete ${app.name}`}><Trash2 className="h-4 w-4" /></Button>
          )}
        </div>
      </div>

      {editing && (
        <Card>
          <h3 className="text-sm font-medium text-foreground">Edit App</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Codename" value={form.codename} onChange={(e) => setForm({ ...form, codename: e.target.value })} />
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label="Version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
            <Input label="Branch" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
            <div className="md:col-span-2">
              <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-medium text-foreground">App Info</h3>
        <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p><strong>Category:</strong> {app.category}</p>
          <p><strong>Version:</strong> {app.version}</p>
          <p><strong>Branch:</strong> {app.branch}</p>
          <p><strong>Forks:</strong> {app.forks}</p>
          {app.url && <p className="sm:col-span-2"><strong>URL:</strong> <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">{app.url}</a></p>}
        </div>
      </Card>
    </div>
  )
}

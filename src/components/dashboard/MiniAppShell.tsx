import React from 'react'
import { Card, Button, Badge, Input, Textarea } from '@/components/ui'
import { Save, X, Trash2, Star } from 'lucide-react'
import type { MiniApp } from '@/types'

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{app.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{app.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge color={statusColor}>{app.status}</Badge>
            <span className="text-xs text-muted-foreground">{app.codename}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button onClick={save}><Save className="h-4 w-4" /> Save</Button>
              <Button variant="secondary" onClick={() => { setForm(app); setEditing(false) }}><X className="h-4 w-4" /> Cancel</Button>
            </>
          ) : (
            onUpdate && <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          )}
          {onToggleFavorite && (
            <Button variant="ghost" onClick={() => onToggleFavorite(app.id)} className={isFavorite ? 'text-amber-500' : ''}>
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" onClick={() => onDelete(app.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
          )}
        </div>
      </div>

      {editing && (
        <Card>
          <h3 className="text-sm font-medium text-foreground">Edit App</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Codename" value={form.codename} onChange={(e) => setForm({ ...form, codename: e.target.value })} />
            <Input label="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label="Branch" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
            <div className="md:col-span-2">
              <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-medium text-foreground">App Info</h3>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p><strong>Price:</strong> {app.price}</p>
          <p><strong>Category:</strong> {app.category}</p>
          <p><strong>Branch:</strong> {app.branch}</p>
          <p><strong>Channels:</strong> {app.channels.join(' + ')}</p>
          <p><strong>Forks:</strong> {app.forks}</p>
          {app.url && <p><strong>URL:</strong> <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">{app.url}</a></p>}
        </div>
      </Card>
    </div>
  )
}

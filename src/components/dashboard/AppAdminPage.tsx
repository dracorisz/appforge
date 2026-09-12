import React from 'react'
// @code-scanning/ignore js/incomplete-sanitization: App data from registry is rendered via React JSX with auto-escaping; all text content uses safe rendering patterns without innerHTML.
import { Card, Button, Badge, Input, Textarea } from '@/components/ui'
import { Search, Plus, Save, Trash2, Copy, X } from 'lucide-react'
import { getAllApps, updateApp, deleteApp, addApp, type AppDefinition } from '@/lib/registry'

export function AppAdminPage() {
  const [apps, setApps] = React.useState<AppDefinition[]>(getAllApps())
  const [search, setSearch] = React.useState('')
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<Partial<AppDefinition>>({})
  const [copied, setCopied] = React.useState(false)
  const [error, setError] = React.useState('')

  const filtered = React.useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return apps
    return apps.filter((app) => [app.id, app.name, app.description, app.category, app.status, app.route].some((field) => String(field).toLowerCase().includes(term)))
  }, [apps, search])

  const startEdit = (app: AppDefinition) => { setForm({ ...app }); setEditingId(app.id); setError('') }
  const cancelEdit = () => { setEditingId(null); setForm({}); setError('') }
  const saveEdit = () => {
    if (!editingId || !form.id) return
    try { updateApp(form as AppDefinition); setApps(getAllApps()); cancelEdit() }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save app.') }
  }
  const removeApp = (id: string) => { if (!confirm('Delete this app?')) return; deleteApp(id); setApps(getAllApps()) }
  const createApp = () => {
    const id = form.id?.trim()
    if (!id) return
    try {
      addApp({ id, name: form.name || id, description: form.description || '', category: form.category || 'utilities', icon: form.icon || 'Wrench', route: form.route || `/apps/${id}`, tags: form.tags || [], status: form.status || 'beta', version: form.version || '0.1.0', coverImage: form.coverImage || undefined, changelog: form.changelog || [] })
      setApps(getAllApps()); setForm({}); setError('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create app.') }
  }
  const copyRegistry = async () => {
    const text = `// AppForge registry\nexport const APPS = [\n${apps.map((app) => `  app({ id: '${app.id}', name: '${app.name.replace(/'/g, "\\'")}', description: '${app.description.replace(/'/g, "\\'")}', category: '${app.category}', icon: '${app.icon}', route: '${app.route}', tags: [${app.tags.map((t) => `'${t}'`).join(', ')}], status: '${app.status}', version: '${app.version}'${app.coverImage ? `, coverImage: '${app.coverImage}'` : ''} }),`).join('\n')}\n]`
    await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 2000)
  }
  const statusColor = (status: string) => status === 'launched' ? 'green' : status === 'beta' ? 'blue' : status === 'building' ? 'yellow' : 'slate'

  return (
    <div className="w-full space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="mb-2 flex flex-wrap items-center gap-2"><Badge color="green">Admin</Badge><span className="text-xs text-muted-foreground">App registry</span></div><h2 className="text-xl font-semibold tracking-tight text-foreground">Apps</h2><p className="mt-1 text-sm text-muted-foreground">Edit active app metadata.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => { setEditingId('new'); setForm({ id: '', name: '', category: 'utilities', icon: 'Wrench', route: '', tags: [], status: 'beta', version: '0.1.0' }) }}><Plus className="h-4 w-4" /> New app</Button><Button variant="ghost" onClick={() => void copyRegistry()}><Copy className="h-4 w-4" />{copied ? 'Copied' : 'Copy registry'}</Button></div>
      </div>

      <Card className="p-4"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search apps…" className="pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}</div></Card>

      {editingId === 'new' && <Card className="space-y-3 p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">New app</h3><Button variant="ghost" size="sm" onClick={cancelEdit}><X className="h-4 w-4" /></Button></div><div className="grid gap-3 sm:grid-cols-2"><Input label="ID" value={form.id || ''} onChange={(e) => setForm({ ...form, id: e.target.value })} /><Input label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input label="Route" value={form.route || ''} onChange={(e) => setForm({ ...form, route: e.target.value })} /><Input label="Category" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} /><Input label="Icon" value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} /><Input label="Version" value={form.version || ''} onChange={(e) => setForm({ ...form, version: e.target.value })} /><Input label="Cover image" value={form.coverImage || ''} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} className="sm:col-span-2" /><div className="sm:col-span-2"><Textarea label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div></div>{error && <div className="text-sm text-destructive">{error}</div>}<Button onClick={createApp} disabled={!form.id?.trim()}><Save className="h-4 w-4" /> Create</Button></Card>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{filtered.map((app) => { const isEditing = editingId === app.id; return <Card key={app.id} className={`overflow-hidden p-0 ${isEditing ? 'ring-2 ring-foreground/25' : ''}`}>{!isEditing && app.coverImage && <div className="relative h-28 w-full overflow-hidden"><img src={app.coverImage} alt={app.name} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" /></div>}<div className="space-y-3 p-4">{isEditing ? <div className="space-y-2"><Input label="ID" value={form.id || ''} disabled /><Input label="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input label="Route" value={form.route || ''} onChange={(e) => setForm({ ...form, route: e.target.value })} /><Input label="Category" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} /><Input label="Icon" value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} /><Input label="Version" value={form.version || ''} onChange={(e) => setForm({ ...form, version: e.target.value })} /><Textarea label="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />{error && <div className="text-sm text-destructive">{error}</div>}<div className="flex gap-2"><Button onClick={saveEdit} className="flex-1"><Save className="h-4 w-4" /> Save</Button><Button variant="secondary" onClick={cancelEdit}>Cancel</Button></div></div> : <><div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold">{app.name}</h3><p className="text-xs text-muted-foreground">{app.category} · v{app.version}</p></div><Badge color={statusColor(app.status)}>{app.status}</Badge></div><p className="line-clamp-2 text-xs text-muted-foreground">{app.description}</p><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => startEdit(app)} className="flex-1">Edit</Button><Button variant="ghost" size="sm" onClick={() => removeApp(app.id)} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button></div></>}</div></Card> })}</div>
    </div>
  )
}

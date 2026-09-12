import * as React from 'react'
import { FileText, ImagePlus, Loader2, Plus, RefreshCw, Save, Sparkles, Trash2, Upload, X } from 'lucide-react'
import { Badge, Button, Card, Input, Textarea } from '@/components/ui'
import { useAuth } from '@/auth/AuthProvider'
import {
  createFrontendContent,
  deleteFrontendContent,
  loadAllFrontendContent,
  updateFrontendContent,
  uploadFrontendContentMedia,
  type FrontendContentDraft,
  type FrontendContentRecord,
  type FrontendContentType,
} from '@/lib/frontendContent'
import { supabase } from '@/lib/supabase'

const TYPES: { id: FrontendContentType; label: string }[] = [
  { id: 'blog_article', label: 'Blog' },
  { id: 'video_teaser', label: 'Video' },
  { id: 'gallery_image', label: 'Gallery' },
  { id: 'docs_page', label: 'Docs' },
]

const emptyDraft = (contentType: FrontendContentType): FrontendContentDraft => ({
  content_type: contentType,
  slug: '',
  title: '',
  summary: '',
  body: '',
  image_url: '',
  video_url: '',
  app_route: '',
  published: false,
  sort_order: 0,
  metadata: {},
})

const normalizeSlug = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9/_-]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^[-/]+|[-/]+$/g, '')

export function AdminContentPanel() {
  const { user } = useAuth()
  const [records, setRecords] = React.useState<FrontendContentRecord[]>([])
  const [type, setType] = React.useState<FrontendContentType>('blog_article')
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<FrontendContentDraft>(() => emptyDraft('blog_article'))
  const [loading, setLoading] = React.useState(true)
  const [busy, setBusy] = React.useState('')
  const [error, setError] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [vertexTopic, setVertexTopic] = React.useState('')
  const [vertexContext, setVertexContext] = React.useState('')

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try { setRecords(await loadAllFrontendContent()) }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not load content.') }
    finally { setLoading(false) }
  }, [])

  React.useEffect(() => { void refresh() }, [refresh])

  React.useEffect(() => {
    if (!editingId) setDraft(emptyDraft(type))
  }, [type, editingId])

  const visible = records.filter((record) => record.content_type === type)
  const flash = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(''), 1800) }

  const startNew = () => {
    setEditingId('new')
    setDraft(emptyDraft(type))
    setError('')
  }

  const startEdit = (record: FrontendContentRecord) => {
    setEditingId(record.id)
    setType(record.content_type)
    setDraft({
      content_type: record.content_type,
      slug: record.slug,
      title: record.title,
      summary: record.summary || '',
      body: record.body || '',
      image_url: record.image_url || '',
      video_url: record.video_url || '',
      app_route: record.app_route || '',
      published: record.published,
      sort_order: record.sort_order,
      metadata: record.metadata || {},
    })
    setError('')
  }

  const save = async () => {
    if (!user) return
    const slug = normalizeSlug(draft.slug || draft.title)
    if (!slug || !draft.title.trim()) { setError('Title and slug are required.'); return }
    setBusy('save')
    setError('')
    try {
      const payload = { ...draft, slug, title: draft.title.trim() }
      if (editingId && editingId !== 'new') await updateFrontendContent(editingId, payload)
      else await createFrontendContent(payload, user.id)
      setEditingId(null)
      setDraft(emptyDraft(type))
      await refresh()
      flash('Content saved.')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not save content.') }
    finally { setBusy('') }
  }

  const remove = async (record: FrontendContentRecord) => {
    if (!confirm(`Delete “${record.title}”?`)) return
    setBusy(record.id)
    try { await deleteFrontendContent(record.id); await refresh(); flash('Content deleted.') }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Could not delete content.') }
    finally { setBusy('') }
  }

  const upload = async (file: File) => {
    if (!user) return
    setBusy('upload')
    setError('')
    try {
      const result = await uploadFrontendContentMedia(file, user.id)
      setDraft((current) => result.kind === 'image' ? { ...current, image_url: result.url } : { ...current, video_url: result.url })
      flash(`${result.kind === 'image' ? 'Image' : 'Video'} uploaded.`)
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.') }
    finally { setBusy('') }
  }

  const generateWithVertex = async () => {
    if (!vertexTopic.trim()) return
    setBusy('vertex')
    setError('')
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Sign in again before using Vertex.')
      const response = await fetch('/api/admin-article-vertex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic: vertexTopic.trim(), context: vertexContext.trim() }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Vertex could not create a draft.')
      const article = payload.article || {}
      setDraft((current) => ({
        ...current,
        title: String(article.title || current.title || vertexTopic),
        slug: normalizeSlug(String(article.title || current.slug || vertexTopic)),
        summary: String(article.summary || current.summary || ''),
        body: String(article.body || current.body || ''),
        app_route: String(article.app_route || current.app_route || ''),
        metadata: typeof article.metadata === 'object' && article.metadata ? article.metadata : current.metadata,
      }))
      setEditingId((current) => current || 'new')
      flash(`Drafted with ${payload.provider || 'Vertex AI'}.`)
    } catch (vertexError) { setError(vertexError instanceof Error ? vertexError.message : 'Vertex draft failed.') }
    finally { setBusy('') }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Content</h3>
          <p className="mt-1 text-xs text-muted-foreground">Blog, homepage media, gallery items and Docs drafts.</p>
        </div>
        <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => void refresh()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</Button><Button size="sm" onClick={startNew}><Plus className="h-4 w-4" /> New</Button></div>
      </div>

      <div className="flex flex-wrap gap-1">{TYPES.map((item) => <button key={item.id} onClick={() => { setType(item.id); setEditingId(null) }} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${type === item.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{item.label}</button>)}</div>

      {message && <Card className="border-emerald-500/25 bg-emerald-500/5 p-3 text-xs text-emerald-600 dark:text-emerald-400">{message}</Card>}
      {error && <Card className="border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</Card>}

      {(type === 'blog_article' || type === 'docs_page') && (
        <Card className="p-4">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-muted-foreground" /><h4 className="text-sm font-semibold">Vertex draft</h4></div>
          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_auto]"><Input value={vertexTopic} onChange={(event) => setVertexTopic(event.target.value)} placeholder={type === 'docs_page' ? 'Docs page topic' : 'Article topic'} /><Input value={vertexContext} onChange={(event) => setVertexContext(event.target.value)} placeholder="Optional context" /><Button onClick={() => void generateWithVertex()} disabled={!vertexTopic.trim() || busy === 'vertex'}>{busy === 'vertex' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Draft</Button></div>
        </Card>
      )}

      {editingId && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><FileText className="h-4 w-4" /><h4 className="text-sm font-semibold">{editingId === 'new' ? 'New content' : 'Edit content'}</h4></div><Button variant="ghost" size="sm" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button></div>
          <div className="grid gap-3 sm:grid-cols-2"><Input label="Title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /><Input label="Slug" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} placeholder={type === 'docs_page' ? 'GETTING_STARTED' : 'article-slug'} /></div>
          <Textarea label="Summary" rows={2} value={draft.summary || ''} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
          {(type === 'blog_article' || type === 'docs_page') && <Textarea label="Body (Markdown)" rows={14} value={draft.body || ''} onChange={(event) => setDraft({ ...draft, body: event.target.value })} />}
          <div className="grid gap-3 sm:grid-cols-2"><Input label="Image URL" value={draft.image_url || ''} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} /><Input label="Video URL" value={draft.video_url || ''} onChange={(event) => setDraft({ ...draft, video_url: event.target.value })} /></div>
          <div className="grid gap-3 sm:grid-cols-[1fr_160px]"><Input label="App route" value={draft.app_route || ''} onChange={(event) => setDraft({ ...draft, app_route: event.target.value })} /><Input label="Sort" type="number" value={String(draft.sort_order)} onChange={(event) => setDraft({ ...draft, sort_order: Number(event.target.value || 0) })} /></div>
          <div className="flex flex-wrap items-center gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-xs font-medium hover:bg-accent"><Upload className="h-4 w-4" /><input type="file" className="hidden" accept="image/*,video/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = '' }} />{busy === 'upload' ? 'Uploading…' : 'Upload media'}</label><label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /> Published</label><Button onClick={() => void save()} disabled={busy === 'save'}>{busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</Button></div>
          {type === 'docs_page' && <p className="text-xs leading-5 text-muted-foreground">Docs records are editable here under the same admin + TOTP policy. VitePress remains a static GitHub Pages build, so publishing a Docs draft to the live documentation still requires syncing it into the repository during a Docs release.</p>}
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((record) => <Card key={record.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-semibold">{record.title}</div><div className="mt-1 truncate text-xs text-muted-foreground">{record.slug}</div></div><Badge color={record.published ? 'green' : 'slate'}>{record.published ? 'Published' : 'Draft'}</Badge></div>{record.summary && <p className="mt-3 line-clamp-3 text-xs leading-5 text-muted-foreground">{record.summary}</p>}<div className="mt-4 flex gap-2"><Button variant="secondary" size="sm" className="flex-1" onClick={() => startEdit(record)}><ImagePlus className="h-3.5 w-3.5" /> Edit</Button><Button variant="ghost" size="sm" onClick={() => void remove(record)} disabled={busy === record.id}><Trash2 className="h-3.5 w-3.5" /></Button></div></Card>)}
      </div>
    </div>
  )
}

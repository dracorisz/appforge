import React from 'react'
import { ImagePlus, Loader2, Save, Trash2, Upload } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { useAuth } from '@/auth/AuthProvider'
import { toast } from '@/lib/toast'
import {
  createFrontendContent,
  deleteFrontendContent,
  loadAllFrontendContent,
  updateFrontendContent,
  uploadFrontendContentMedia,
  type FrontendContentRecord,
} from '@/lib/frontendContent'

const blank = { title: '', slug: '', image_url: '', app_route: '', summary: '', sort_order: 0, published: true }
const cleanSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9/_-]+/g, '-').replace(/-+/g, '-').replace(/^[-/]+|[-/]+$/g, '')

export function AdminImageManager() {
  const { user } = useAuth()
  const [items, setItems] = React.useState<FrontendContentRecord[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState(blank)
  const [busy, setBusy] = React.useState('')

  const refresh = React.useCallback(async () => {
    const rows = await loadAllFrontendContent()
    setItems(rows.filter((item) => item.content_type === 'gallery_image'))
  }, [])

  React.useEffect(() => { void refresh().catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load images.')) }, [refresh])

  const select = (item: FrontendContentRecord) => {
    setSelectedId(item.id)
    setDraft({
      title: item.title,
      slug: item.slug,
      image_url: item.image_url || '',
      app_route: item.app_route || '',
      summary: item.summary || '',
      sort_order: item.sort_order,
      published: item.published,
    })
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) return
    const slug = cleanSlug(draft.slug || draft.title)
    if (!draft.title.trim() || !slug || !draft.image_url.trim()) { toast.error('Image title, slug and image URL are required.'); return }
    setBusy('save')
    try {
      const payload = {
        content_type: 'gallery_image' as const,
        slug,
        title: draft.title.trim(),
        summary: draft.summary.trim() || null,
        body: null,
        image_url: draft.image_url.trim(),
        video_url: null,
        app_route: draft.app_route.trim() || null,
        published: draft.published,
        sort_order: Number(draft.sort_order) || 0,
        metadata: {},
      }
      const saved = selectedId ? await updateFrontendContent(selectedId, payload) : await createFrontendContent(payload, user.id)
      setSelectedId(saved.id)
      await refresh()
      toast.success('Image saved.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save image.') }
    finally { setBusy('') }
  }

  const upload = async (file: File) => {
    if (!user) return
    setBusy('upload')
    try {
      const result = await uploadFrontendContentMedia(file, user.id)
      if (result.kind !== 'image') throw new Error('Choose an image file.')
      setDraft((current) => ({ ...current, image_url: result.url, title: current.title || file.name.replace(/\.[^.]+$/, '') }))
      toast.success('Image uploaded. Save to publish the change.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Image upload failed.') }
    finally { setBusy('') }
  }

  const remove = async () => {
    if (!selectedId || !confirm('Delete this image record?')) return
    setBusy('delete')
    try {
      await deleteFrontendContent(selectedId)
      setSelectedId(null)
      setDraft(blank)
      await refresh()
      toast.success('Image removed.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not remove image.') }
    finally { setBusy('') }
  }

  return (
    <section className="space-y-4" aria-labelledby="content-images-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="content-images-title" className="text-sm font-semibold">Images</h2><p className="mt-1 text-xs text-muted-foreground">Manage Supabase-backed gallery and landing imagery from the same frontend content model.</p></div>
        <Button variant="secondary" size="sm" onClick={() => { setSelectedId(null); setDraft(blank) }}><ImagePlus className="h-4 w-4" /> New image</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(220px,.7fr)_minmax(0,1.3fr)]">
        <div className="space-y-2">
          {items.map((item) => <button key={item.id} type="button" onClick={() => select(item)} className={`w-full rounded-xl border p-3 text-left transition-[border-color,background-color,box-shadow] hover:${selectedId === item.id ? 'border-foreground/25 bg-accent/70' : 'border-border/70 bg-card/60 hover:border-foreground/20'}`}><div className="flex items-center gap-3">{item.image_url ? <img src={item.image_url} alt="" className="h-12 w-16 rounded-xl border border-border/70 object-cover" /> : <div className="flex h-12 w-16 items-center justify-center rounded-xl border border-border/70 bg-muted"><ImagePlus className="h-4 w-4" /></div>}<div className="min-w-0"><div className="truncate text-sm font-medium">{item.title}</div><div className="truncate text-xs text-muted-foreground">{item.slug}</div></div></div></button>)}
          {!items.length && <Card className="p-4 text-sm text-muted-foreground">No managed images yet.</Card>}
        </div>

        <Card className="p-4 sm:p-5">
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2"><Input label="Title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /><Input label="Slug" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} placeholder="auto-from-title" /></div>
            <Input label="Image URL" value={draft.image_url} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} placeholder="https://…" />
            {draft.image_url && <img src={draft.image_url} alt="Preview" className="max-h-72 w-full rounded-xl border border-border/70 bg-muted object-contain" />}
            <div className="grid gap-3 sm:grid-cols-2"><Input label="App route / placement" value={draft.app_route} onChange={(event) => setDraft({ ...draft, app_route: event.target.value })} placeholder="/huggingface" /><Input label="Sort order" type="number" value={draft.sort_order} onChange={(event) => setDraft({ ...draft, sort_order: Number(event.target.value) || 0 })} /></div>
            <Input label="Caption / summary" value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /> Published</label>
            <div className="flex flex-wrap items-center gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm hover:bg-accent"><Upload className="h-4 w-4" /> Upload image<input type="file" accept="image/*" className="hidden" disabled={busy === 'upload'} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = '' }} /></label><Button type="submit" disabled={Boolean(busy)}>{busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</Button>{selectedId && <Button type="button" variant="ghost" onClick={() => void remove()} disabled={Boolean(busy)}><Trash2 className="h-4 w-4" /> Delete</Button>}</div>
          </form>
        </Card>
      </div>
    </section>
  )
}

import React from 'react'
import { CheckCircle2, KeyRound, Loader2, Plus, Save, ShieldCheck, Sparkles, Trash2, Upload, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
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

const makeDraft = (contentType: FrontendContentType = 'blog_article'): FrontendContentDraft => ({
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

const toDraft = (item: FrontendContentRecord): FrontendContentDraft => ({
  content_type: item.content_type,
  slug: item.slug,
  title: item.title,
  summary: item.summary || '',
  body: item.body || '',
  image_url: item.image_url || '',
  video_url: item.video_url || '',
  app_route: item.app_route || '',
  published: item.published,
  sort_order: item.sort_order,
  metadata: item.metadata || {},
})

const cleanSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9/_-]+/g, '-').replace(/-+/g, '-').replace(/^[-/]+|[-/]+$/g, '')
const generateSummary = (body: string | null | undefined, title: string) => {
  const source = (body || title).replace(/```[\s\S]*?```/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]+>/g, ' ').replace(/[#>*_`~|-]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (source.length <= 180) return source
  return `${source.slice(0, 177).trim()}…`
}

type Props = { embedded?: boolean; adminVerified?: boolean }

export function AdminContentManager({ embedded = false, adminVerified = false }: Props) {
  const { user, loading: authLoading } = useAuth()
  const [checking, setChecking] = React.useState(!embedded)
  const [isAdmin, setIsAdmin] = React.useState(embedded && adminVerified)
  const [aal2, setAal2] = React.useState(embedded && adminVerified)
  const [factorId, setFactorId] = React.useState('')
  const [totpCode, setTotpCode] = React.useState('')
  const [items, setItems] = React.useState<FrontendContentRecord[]>([])
  const [filterType, setFilterType] = React.useState<FrontendContentType>('blog_article')
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<FrontendContentDraft>(() => makeDraft())
  const [busy, setBusy] = React.useState('')
  const [vertexTopic, setVertexTopic] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [error, setError] = React.useState('')

  const refreshItems = React.useCallback(async () => setItems(await loadAllFrontendContent()), [])

  React.useEffect(() => {
    if (embedded) {
      setChecking(false); setIsAdmin(adminVerified); setAal2(adminVerified)
      if (adminVerified) void refreshItems().catch((accessError) => setError(accessError instanceof Error ? accessError.message : 'Could not load content.'))
      return
    }
    let cancelled = false
    const check = async () => {
      if (authLoading) return
      if (!user) { setChecking(false); return }
      setChecking(true)
      try {
        const [{ data: adminData, error: adminError }, { data: assurance, error: assuranceError }, { data: factors, error: factorError }] = await Promise.all([
          supabase.rpc('is_admin'),
          supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
          supabase.auth.mfa.listFactors(),
        ])
        if (adminError) throw adminError
        if (assuranceError) throw assuranceError
        if (factorError) throw factorError
        if (cancelled) return
        setIsAdmin(adminData === true)
        setAal2(assurance.currentLevel === 'aal2')
        setFactorId(factors.totp.find((factor) => factor.status === 'verified')?.id || '')
        if (adminData === true && assurance.currentLevel === 'aal2') await refreshItems()
      } catch (accessError) { if (!cancelled) setError(accessError instanceof Error ? accessError.message : 'Could not verify admin access.') }
      finally { if (!cancelled) setChecking(false) }
    }
    void check()
    return () => { cancelled = true }
  }, [adminVerified, authLoading, embedded, refreshItems, user])

  const verifyTotp = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!factorId || !totpCode.trim()) return
    setBusy('totp'); setError('')
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: totpCode.trim() })
      if (verifyError) throw verifyError
      setAal2(true); setTotpCode(''); await refreshItems()
    } catch (verifyError) { setError(verifyError instanceof Error ? verifyError.message : 'TOTP verification failed.') }
    finally { setBusy('') }
  }

  const visible = items.filter((item) => item.content_type === filterType)
  const flash = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(''), 1800) }
  const selectItem = (item: FrontendContentRecord) => { setSelectedId(item.id); setDraft(toDraft(item)); setFilterType(item.content_type); setError('') }
  const newItem = () => { setSelectedId(null); setDraft(makeDraft(filterType)); setError('') }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || !aal2) return
    const slug = cleanSlug(draft.slug || draft.title)
    if (!slug || !draft.title.trim()) { setError('Title and slug are required.'); return }
    setBusy('save'); setError('')
    try {
      const cleanDraft: FrontendContentDraft = { ...draft, slug, title: draft.title.trim(), summary: draft.summary?.trim() || null, body: draft.body?.trim() || null, image_url: draft.image_url?.trim() || null, video_url: draft.video_url?.trim() || null, app_route: draft.app_route?.trim() || null, sort_order: Number(draft.sort_order) || 0 }
      const saved = selectedId ? await updateFrontendContent(selectedId, cleanDraft) : await createFrontendContent(cleanDraft, user.id)
      await refreshItems(); setSelectedId(saved.id); setDraft(toDraft(saved)); flash('Saved.')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not save content.') }
    finally { setBusy('') }
  }

  const remove = async () => {
    if (!selectedId || !confirm('Delete this content item?')) return
    setBusy('delete')
    try { await deleteFrontendContent(selectedId); await refreshItems(); newItem(); flash('Deleted.') }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Could not delete content.') }
    finally { setBusy('') }
  }

  const uploadMedia = async (file: File) => {
    if (!user) return
    setBusy('upload')
    try {
      const uploaded = await uploadFrontendContentMedia(file, user.id)
      setDraft((current) => uploaded.kind === 'image' ? { ...current, image_url: uploaded.url } : { ...current, video_url: uploaded.url })
      flash('Media uploaded.')
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.') }
    finally { setBusy('') }
  }

  const draftWithVertex = async () => {
    const topic = vertexTopic.trim() || draft.title.trim()
    if (!topic) { setError('Add a topic or title first.'); return }
    setBusy('vertex'); setError('')
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Authenticated session unavailable.')
      const response = await fetch('/api/admin-article-vertex', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ topic, context: [draft.summary, draft.body, draft.app_route].filter(Boolean).join('\n\n').slice(0, 2500) }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Vertex draft failed.')
      const article = payload.article || {}
      setDraft((current) => ({ ...current, title: String(article.title || current.title), slug: cleanSlug(String(article.title || current.slug || topic)), summary: String(article.summary || current.summary || ''), body: String(article.body || current.body || ''), app_route: String(article.app_route || current.app_route || ''), metadata: typeof article.metadata === 'object' && article.metadata ? article.metadata : current.metadata }))
      flash(`Vertex draft loaded${payload.model ? ` · ${payload.model}` : ''}.`)
    } catch (vertexError) { setError(vertexError instanceof Error ? vertexError.message : 'Vertex draft failed.') }
    finally { setBusy('') }
  }

  if (!embedded && (checking || authLoading)) return <div className="flex min-h-[35vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
  if (!user) return <div className="rounded-2xl border border-border/70 p-6 text-center"><ShieldCheck className="mx-auto h-8 w-8" /><h2 className="mt-3 text-lg font-semibold">Admin sign-in required</h2><Link to="/login" className="mt-4 inline-flex text-sm underline">Sign in</Link></div>
  if (!isAdmin) return <div className="rounded-2xl border border-border/70 p-6 text-center"><ShieldCheck className="mx-auto h-8 w-8" /><h2 className="mt-3 text-lg font-semibold">Admin only</h2></div>
  if (!aal2) return <div className="rounded-2xl border border-border/70 p-6"><KeyRound className="h-7 w-7" /><h2 className="mt-3 text-lg font-semibold">Verify TOTP</h2>{factorId ? <form onSubmit={verifyTotp} className="mt-4 flex max-w-md gap-2"><input value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3" placeholder="Authenticator code" /><button disabled={busy === 'totp' || !totpCode} className="rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Verify</button></form> : <p className="mt-2 text-sm text-muted-foreground">Enroll TOTP in Settings → Security first.</p>}</div>

  return <div className="w-full space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Content</h2><p className="mt-1 text-xs text-muted-foreground">Blog, homepage media, gallery and Docs drafts.</p></div><div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Admin · TOTP</div></div>
    <div className="flex flex-wrap gap-1">{(['blog_article','video_teaser','gallery_image','docs_page'] as FrontendContentType[]).map((type) => <button key={type} onClick={() => { setFilterType(type); setSelectedId(null); setDraft(makeDraft(type)) }} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filterType === type ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{type === 'blog_article' ? 'Blog' : type === 'video_teaser' ? 'Video' : type === 'gallery_image' ? 'Gallery' : 'Docs'}</button>)}</div>
    {message && <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-2 text-xs text-emerald-600 dark:text-emerald-400">{message}</div>}
    {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">{error}</div>}

    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-border/70 bg-background/40 p-3"><button onClick={newItem} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border/70 text-sm font-semibold hover:bg-accent"><Plus className="h-4 w-4" /> New</button><div className="mt-3 space-y-2">{visible.map((item) => <button key={item.id} onClick={() => selectItem(item)} className={`w-full rounded-xl border p-3 text-left ${selectedId === item.id ? 'border-foreground/30 bg-accent/50' : 'border-border/60 hover:bg-accent/25'}`}><div className="truncate text-sm font-medium">{item.title}</div><div className="mt-1 truncate text-[11px] text-muted-foreground">{item.slug}</div></button>)}{!visible.length && <div className="p-4 text-center text-xs text-muted-foreground">No items.</div>}</div></aside>

      <section className="rounded-2xl border border-border/70 bg-background/40 p-4 sm:p-5">
        {(draft.content_type === 'blog_article' || draft.content_type === 'docs_page') && <div className="mb-4 rounded-xl border border-border/70 p-3"><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4" /> Vertex draft</div><div className="mt-3 flex gap-2"><input value={vertexTopic} onChange={(event) => setVertexTopic(event.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm" placeholder="Topic" /><button type="button" onClick={() => void draftWithVertex()} disabled={busy === 'vertex'} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-accent">{busy === 'vertex' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Draft</button></div></div>}
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">{selectedId ? 'Edit' : 'New'} {draft.content_type === 'docs_page' ? 'Docs page' : 'content'}</h3>{selectedId && <button type="button" onClick={newItem} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"><X className="h-4 w-4" /></button>}</div>
          <div className="grid gap-3 md:grid-cols-2"><label className="text-xs font-medium text-muted-foreground">Title<input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground" /></label><label className="text-xs font-medium text-muted-foreground">Slug<input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground" placeholder={draft.content_type === 'docs_page' ? 'GETTING_STARTED' : 'article-slug'} /></label></div>
          <label className="block text-xs font-medium text-muted-foreground"><span className="flex items-center justify-between"><span>Summary</span><button type="button" onClick={() => setDraft((current) => ({ ...current, summary: generateSummary(current.body, current.title) }))} className="text-[11px] text-foreground hover:underline">Generate</button></span><textarea value={draft.summary || ''} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground" /></label>
          {(draft.content_type === 'blog_article' || draft.content_type === 'docs_page') && <label className="block text-xs font-medium text-muted-foreground">Body (Markdown)<textarea value={draft.body || ''} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} rows={14} className="mt-1 w-full rounded-lg border border-input bg-background p-3 text-sm leading-6 text-foreground" /></label>}
          <div className="grid gap-3 md:grid-cols-2"><label className="text-xs font-medium text-muted-foreground">Image URL<input value={draft.image_url || ''} onChange={(event) => setDraft((current) => ({ ...current, image_url: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground" /></label><label className="text-xs font-medium text-muted-foreground">Video URL<input value={draft.video_url || ''} onChange={(event) => setDraft((current) => ({ ...current, video_url: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground" /></label></div>
          <div className="flex flex-wrap items-center gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-xs font-medium hover:bg-accent"><Upload className="h-4 w-4" /><input type="file" className="hidden" accept="image/*,video/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia(file); event.currentTarget.value = '' }} />{busy === 'upload' ? 'Uploading…' : 'Upload media'}</label><label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))} /> Published</label><button type="submit" disabled={busy === 'save'} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Save className="h-4 w-4" /> Save</button>{selectedId && <button type="button" onClick={() => void remove()} className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5"><Trash2 className="h-4 w-4" /> Delete</button>}</div>
          {draft.content_type === 'docs_page' && <p className="text-xs leading-5 text-muted-foreground">Docs drafts are stored in Supabase under admin + TOTP protection. Because docs.sstoken.space is a static VitePress build, a Docs release still syncs approved copy into the repository before GitHub Pages publishes it.</p>}
        </form>
      </section>
    </div>
  </div>
}

import React from 'react'
import { CheckCircle2, KeyRound, Loader2, Plus, Save, ShieldCheck, Sparkles, Trash2, Upload } from 'lucide-react'
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

const EMPTY_DRAFT: FrontendContentDraft = {
  content_type: 'blog_article',
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
}

function toDraft(item: FrontendContentRecord): FrontendContentDraft {
  return {
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
  }
}

function generateSummary(body: string | null | undefined, title: string) {
  const source = (body || title).replace(/```[\s\S]*?```/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]+>/g, ' ').replace(/[#>*_`~|-]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!source) return ''
  const sentenceMatch = source.match(/^(.{1,220}?[.!?])(?:\s|$)/)
  if (sentenceMatch && sentenceMatch[1].length >= 80) return sentenceMatch[1]
  if (source.length <= 200) return source
  const clipped = source.slice(0, 200)
  const boundary = clipped.lastIndexOf(' ')
  return `${clipped.slice(0, boundary > 140 ? boundary : 200).trim()}…`
}

type Props = { embedded?: boolean; adminVerified?: boolean }

export function AdminContentManager({ embedded = false, adminVerified = false }: Props) {
  const { user, loading: authLoading } = useAuth()
  const [checking, setChecking] = React.useState(!embedded)
  const [isAdmin, setIsAdmin] = React.useState(embedded && adminVerified)
  const [aal2, setAal2] = React.useState(embedded && adminVerified)
  const [factorId, setFactorId] = React.useState('')
  const [totpCode, setTotpCode] = React.useState('')
  const [mfaBusy, setMfaBusy] = React.useState(false)
  const [items, setItems] = React.useState<FrontendContentRecord[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<FrontendContentDraft>(EMPTY_DRAFT)
  const [busy, setBusy] = React.useState(false)
  const [uploading, setUploading] = React.useState<'image' | 'video' | ''>('')
  const [vertexBusy, setVertexBusy] = React.useState(false)
  const [vertexTopic, setVertexTopic] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [error, setError] = React.useState('')

  const refreshItems = React.useCallback(async () => setItems(await loadAllFrontendContent()), [])

  React.useEffect(() => {
    if (embedded) {
      setChecking(false)
      setIsAdmin(adminVerified)
      setAal2(adminVerified)
      if (adminVerified) void refreshItems().catch((accessError) => setError(accessError instanceof Error ? accessError.message : 'Could not load content.'))
      return
    }
    let cancelled = false
    const checkAccess = async () => {
      if (authLoading) return
      if (!user) { setChecking(false); return }
      setChecking(true)
      setError('')
      try {
        const [{ data: adminData, error: adminError }, { data: aalData, error: aalError }, { data: factorData, error: factorError }] = await Promise.all([
          supabase.rpc('is_admin'),
          supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
          supabase.auth.mfa.listFactors(),
        ])
        if (adminError) throw adminError
        if (aalError) throw aalError
        if (factorError) throw factorError
        if (cancelled) return
        const admin = adminData === true
        const verifiedTotp = factorData.totp.find((factor) => factor.status === 'verified')
        setIsAdmin(admin)
        setAal2(aalData.currentLevel === 'aal2')
        setFactorId(verifiedTotp?.id || '')
        if (admin && aalData.currentLevel === 'aal2') await refreshItems()
      } catch (accessError) {
        if (!cancelled) setError(accessError instanceof Error ? accessError.message : 'Could not verify admin access.')
      } finally { if (!cancelled) setChecking(false) }
    }
    void checkAccess()
    return () => { cancelled = true }
  }, [adminVerified, authLoading, embedded, refreshItems, user])

  const verifyTotp = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!factorId || !totpCode.trim()) return
    setMfaBusy(true); setError('')
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: totpCode.trim() })
      if (verifyError) throw verifyError
      const { data, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalError) throw aalError
      if (data.currentLevel !== 'aal2') throw new Error('TOTP verification did not upgrade the session to AAL2.')
      setAal2(true); setTotpCode(''); await refreshItems()
    } catch (verifyError) { setError(verifyError instanceof Error ? verifyError.message : 'TOTP verification failed.') }
    finally { setMfaBusy(false) }
  }

  const selectItem = (item: FrontendContentRecord) => { setSelectedId(item.id); setDraft(toDraft(item)); setMessage(''); setError('') }
  const newItem = () => { setSelectedId(null); setDraft({ ...EMPTY_DRAFT, metadata: {} }); setMessage(''); setError('') }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || !aal2) return
    if (!draft.slug.trim() || !draft.title.trim()) { setError('Slug and title are required.'); return }
    setBusy(true); setError(''); setMessage('')
    try {
      const cleanDraft: FrontendContentDraft = {
        ...draft,
        slug: draft.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        title: draft.title.trim(),
        summary: draft.summary?.trim() || null,
        body: draft.body?.trim() || null,
        image_url: draft.image_url?.trim() || null,
        video_url: draft.video_url?.trim() || null,
        app_route: draft.app_route?.trim() || null,
        sort_order: Number.isFinite(Number(draft.sort_order)) ? Number(draft.sort_order) : 0,
      }
      const saved = selectedId ? await updateFrontendContent(selectedId, cleanDraft) : await createFrontendContent(cleanDraft, user.id)
      await refreshItems(); setSelectedId(saved.id); setDraft(toDraft(saved)); setMessage('Content saved.')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not save content.') }
    finally { setBusy(false) }
  }

  const remove = async () => {
    if (!selectedId || !aal2 || !window.confirm('Delete this content item?')) return
    setBusy(true); setError('')
    try { await deleteFrontendContent(selectedId); await refreshItems(); newItem(); setMessage('Content deleted.') }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Could not delete content.') }
    finally { setBusy(false) }
  }

  const uploadMedia = async (file: File, kind: 'image' | 'video') => {
    if (!user || !aal2) return
    setUploading(kind); setError('')
    try {
      const uploaded = await uploadFrontendContentMedia(file, user.id)
      setDraft((current) => ({ ...current, [kind === 'image' ? 'image_url' : 'video_url']: uploaded.url }))
      setMessage(`${kind === 'image' ? 'Image' : 'Video'} uploaded and linked.`)
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Media upload failed.') }
    finally { setUploading('') }
  }

  const draftWithVertex = async () => {
    const topic = vertexTopic.trim() || draft.title.trim()
    if (!topic) { setError('Add a topic or title before asking Vertex to draft an article.'); return }
    setVertexBusy(true); setError(''); setMessage('')
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Your authenticated session is unavailable.')
      const response = await fetch('/api/admin-article-vertex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic, context: [draft.summary, draft.body, draft.app_route].filter(Boolean).join('\n\n').slice(0, 2500) }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Vertex article drafting failed.')
      const article = payload.article || {}
      setDraft((current) => ({
        ...current,
        content_type: 'blog_article',
        title: String(article.title || current.title),
        summary: String(article.summary || current.summary || ''),
        body: String(article.body || current.body || ''),
        app_route: String(article.app_route || current.app_route || ''),
        metadata: typeof article.metadata === 'object' && article.metadata ? article.metadata : current.metadata,
      }))
      setMessage(`Vertex draft loaded${payload.model ? ` · ${payload.model}` : ''}. Review it before publishing.`)
    } catch (vertexError) { setError(vertexError instanceof Error ? vertexError.message : 'Vertex article drafting failed.') }
    finally { setVertexBusy(false) }
  }

  if (!embedded && (checking || authLoading)) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
  if (!user) return <div className="rounded-2xl border border-border/70 p-6 text-center"><ShieldCheck className="mx-auto h-8 w-8" /><h1 className="mt-3 text-xl font-semibold">Admin sign-in required</h1><Link to="/login" className="mt-5 inline-flex rounded-lg border border-border px-4 py-2 text-sm font-semibold">Sign in</Link></div>
  if (!isAdmin) return <div className="rounded-2xl border border-border/70 p-6 text-center"><ShieldCheck className="mx-auto h-8 w-8" /><h1 className="mt-3 text-xl font-semibold">Admin only</h1></div>
  if (!aal2) return <div className="rounded-2xl border border-border/70 bg-background/50 p-6"><KeyRound className="h-7 w-7" /><h1 className="mt-3 text-xl font-semibold">Verify admin TOTP</h1><p className="mt-2 text-sm text-muted-foreground">Content mutations require an AAL2 session.</p>{factorId ? <form onSubmit={verifyTotp} className="mt-5 flex max-w-md gap-2"><input value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3" placeholder="Authenticator code" /><button disabled={mfaBusy || !totpCode} className="rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Verify</button></form> : <p className="mt-4 text-sm text-muted-foreground">Enroll TOTP in Settings → Security first.</p>}{error && <p className="mt-3 text-sm text-destructive">{error}</p>}</div>

  const editor = <div className="grid w-full gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
    <aside className="rounded-2xl border border-border/70 bg-background/45 p-3 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:overflow-auto">
      <button onClick={newItem} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-accent/30 text-sm font-semibold hover:bg-accent/50"><Plus className="h-4 w-4" /> New content</button>
      <div className="mt-3 space-y-2">{items.map((item) => <button key={item.id} onClick={() => selectItem(item)} className={`w-full rounded-xl border p-3 text-left transition-colors ${selectedId === item.id ? 'border-foreground/30 bg-accent/50' : 'border-border/60 bg-background/40 hover:bg-accent/25'}`}><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{item.title}</span><span className={`h-2 w-2 shrink-0 rounded-full ${item.published ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} /></div><div className="mt-1 truncate text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{item.content_type.replace('_', ' ')} · {item.slug}</div></button>)}{!items.length && <div className="p-4 text-center text-xs text-muted-foreground">No managed content yet.</div>}</div>
    </aside>

    <section className="rounded-2xl border border-border/70 bg-background/45 p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{selectedId ? 'Edit content' : 'Create content'}</div><h2 className="mt-1 text-2xl font-semibold">{draft.title || 'Untitled item'}</h2></div><div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Admin · TOTP verified</div></div>

      <div className="mb-5 rounded-xl border border-border/70 bg-background/40 p-4"><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4" /> Vertex article drafting</div><p className="mt-1 text-xs leading-5 text-muted-foreground">Uses the private AppForge Google Cloud bridge. Generated copy always remains editable and is never published automatically.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={vertexTopic} onChange={(event) => setVertexTopic(event.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm" placeholder="Article topic or angle" /><button type="button" onClick={() => void draftWithVertex()} disabled={vertexBusy} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-accent disabled:opacity-50">{vertexBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Draft with Vertex</button></div></div>

      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2"><label className="text-xs font-semibold text-muted-foreground">Type<select value={draft.content_type} onChange={(event) => setDraft((current) => ({ ...current, content_type: event.target.value as FrontendContentType }))} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground"><option value="blog_article">Blog article</option><option value="video_teaser">Video teaser</option><option value="gallery_image">Gallery image</option></select></label><label className="text-xs font-semibold text-muted-foreground">Slug<input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" placeholder="weather-now-guide" /></label></div>
        <label className="block text-xs font-semibold text-muted-foreground">Title<input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label>
        <label className="block text-xs font-semibold text-muted-foreground"><span className="flex items-center justify-between gap-3"><span>Summary</span><button type="button" onClick={() => setDraft((current) => ({ ...current, summary: generateSummary(current.body, current.title) }))} className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent">Generate locally</button></span><textarea value={draft.summary || ''} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} rows={3} className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm" /></label>
        <label className="block text-xs font-semibold text-muted-foreground">Body<textarea value={draft.body || ''} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} rows={12} className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm leading-6" placeholder="Article body or reusable frontend copy…" /></label>

        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="text-xs font-semibold text-muted-foreground">Image URL<input value={draft.image_url || ''} onChange={(event) => setDraft((current) => ({ ...current, image_url: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" placeholder="https://…" /></label><label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-accent"><Upload className="h-4 w-4" /> {uploading === 'image' ? 'Uploading…' : 'Upload image'}<input type="file" accept="image/*" className="hidden" disabled={Boolean(uploading)} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia(file, 'image'); event.currentTarget.value = '' }} /></label></div>
          <div><label className="text-xs font-semibold text-muted-foreground">Video URL<input value={draft.video_url || ''} onChange={(event) => setDraft((current) => ({ ...current, video_url: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" placeholder="https://…" /></label><label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-accent"><Upload className="h-4 w-4" /> {uploading === 'video' ? 'Uploading…' : 'Upload video'}<input type="file" accept="video/mp4,video/webm" className="hidden" disabled={Boolean(uploading)} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia(file, 'video'); event.currentTarget.value = '' }} /></label></div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_180px]"><label className="text-xs font-semibold text-muted-foreground">App route<input value={draft.app_route || ''} onChange={(event) => setDraft((current) => ({ ...current, app_route: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" placeholder="/apps/weather-now" /></label><label className="text-xs font-semibold text-muted-foreground">Sort order<input type="number" value={draft.sort_order} onChange={(event) => setDraft((current) => ({ ...current, sort_order: Number(event.target.value) }))} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" /></label></div>
        <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/40 p-3 text-sm"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))} className="h-4 w-4" /><span><strong>Published</strong><span className="ml-2 text-xs text-muted-foreground">Visible to signed-out visitors.</span></span></label>
        {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
        {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{message}</div>}
        <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4"><button disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>{selectedId && <button type="button" disabled={busy} onClick={() => void remove()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-destructive/30 px-4 text-sm font-semibold text-destructive disabled:opacity-50"><Trash2 className="h-4 w-4" /> Delete</button>}</div>
      </form>
    </section>
  </div>

  return embedded ? editor : <div className="w-full">{editor}</div>
}

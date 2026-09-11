import React from 'react'
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import {
  createFrontendContent,
  deleteFrontendContent,
  loadAllFrontendContent,
  updateFrontendContent,
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

export function AdminContentManager() {
  const { user, loading: authLoading } = useAuth()
  const [checking, setChecking] = React.useState(true)
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [aal2, setAal2] = React.useState(false)
  const [factorId, setFactorId] = React.useState('')
  const [totpCode, setTotpCode] = React.useState('')
  const [mfaBusy, setMfaBusy] = React.useState(false)
  const [items, setItems] = React.useState<FrontendContentRecord[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<FrontendContentDraft>(EMPTY_DRAFT)
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState('')
  const [error, setError] = React.useState('')

  const refreshItems = React.useCallback(async () => {
    const next = await loadAllFrontendContent()
    setItems(next)
  }, [])

  React.useEffect(() => {
    let cancelled = false
    const checkAccess = async () => {
      if (authLoading) return
      if (!user) {
        setChecking(false)
        return
      }
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
      } finally {
        if (!cancelled) setChecking(false)
      }
    }
    void checkAccess()
    return () => { cancelled = true }
  }, [authLoading, refreshItems, user])

  const verifyTotp = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!factorId || !totpCode.trim()) return
    setMfaBusy(true)
    setError('')
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: totpCode.trim() })
      if (verifyError) throw verifyError
      const { data, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalError) throw aalError
      if (data.currentLevel !== 'aal2') throw new Error('TOTP verification did not upgrade the session to AAL2.')
      setAal2(true)
      setTotpCode('')
      await refreshItems()
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'TOTP verification failed.')
    } finally {
      setMfaBusy(false)
    }
  }

  const selectItem = (item: FrontendContentRecord) => {
    setSelectedId(item.id)
    setDraft(toDraft(item))
    setMessage('')
    setError('')
  }

  const newItem = () => {
    setSelectedId(null)
    setDraft({ ...EMPTY_DRAFT, metadata: {} })
    setMessage('')
    setError('')
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || !aal2) return
    if (!draft.slug.trim() || !draft.title.trim()) {
      setError('Slug and title are required.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
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
      await refreshItems()
      setSelectedId(saved.id)
      setDraft(toDraft(saved))
      setMessage('Content saved.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save content.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!selectedId || !aal2 || !window.confirm('Delete this content item?')) return
    setBusy(true)
    setError('')
    try {
      await deleteFrontendContent(selectedId)
      await refreshItems()
      newItem()
      setMessage('Content deleted.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete content.')
    } finally {
      setBusy(false)
    }
  }

  if (checking || authLoading) return <div className="dark flex min-h-dvh items-center justify-center bg-black text-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>

  if (!user) {
    return <div className="dark flex min-h-dvh items-center justify-center bg-black px-4 text-foreground"><div className="max-w-md rounded-2xl border border-border/70 p-6 text-center"><ShieldCheck className="mx-auto h-8 w-8" /><h1 className="mt-3 text-2xl font-semibold">Admin sign-in required</h1><p className="mt-2 text-sm text-muted-foreground">Sign in first, then return to the content manager.</p><Link to="/login" className="mt-5 inline-flex rounded-lg border border-border px-4 py-2 text-sm font-semibold">Sign in</Link></div></div>
  }

  if (!isAdmin) {
    return <div className="dark flex min-h-dvh items-center justify-center bg-black px-4 text-foreground"><div className="max-w-md rounded-2xl border border-border/70 p-6 text-center"><ShieldCheck className="mx-auto h-8 w-8" /><h1 className="mt-3 text-2xl font-semibold">Admin only</h1><p className="mt-2 text-sm text-muted-foreground">This account does not have the AppForge admin role.</p><Link to="/" className="mt-5 inline-flex rounded-lg border border-border px-4 py-2 text-sm font-semibold">Back to AppForge</Link></div></div>
  }

  if (!aal2) {
    return (
      <div className="dark flex min-h-dvh items-center justify-center bg-black px-4 text-foreground">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-background/50 p-6">
          <KeyRound className="h-8 w-8" />
          <h1 className="mt-3 text-2xl font-semibold">Verify admin TOTP</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">The database requires an AAL2 session before any frontend content can be created, changed or deleted.</p>
          {factorId ? (
            <form onSubmit={verifyTotp} className="mt-5 space-y-3">
              <input value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" placeholder="Authenticator code" className="h-11 w-full rounded-xl border border-border/70 bg-black/40 px-3 text-center text-lg tracking-[0.25em] outline-none focus:ring-2 focus:ring-ring/30" />
              <button disabled={mfaBusy || !totpCode} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-50">{mfaBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Verify TOTP</button>
            </form>
          ) : <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">No verified TOTP factor is enrolled for this admin account. Enroll one in account security before using the content manager.</div>}
          {error && <div className="mt-4 text-sm text-destructive">{error}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="dark min-h-dvh bg-black text-foreground" style={{ colorScheme: 'dark' }}>
      <header className="sticky top-0 z-20 border-b border-border/60 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div><div className="text-sm font-semibold">Frontend Content Manager</div><div className="flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Admin · TOTP verified</div></div>
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Workspace</Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
        <aside className="rounded-2xl border border-border/70 bg-background/45 p-3 lg:sticky lg:top-24 lg:h-[calc(100dvh-8rem)] lg:overflow-auto">
          <button onClick={newItem} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-accent/30 text-sm font-semibold hover:bg-accent/50"><Plus className="h-4 w-4" /> New content</button>
          <div className="mt-3 space-y-2">
            {items.map((item) => <button key={item.id} onClick={() => selectItem(item)} className={`w-full rounded-xl border p-3 text-left transition ${selectedId === item.id ? 'border-foreground/30 bg-accent/50' : 'border-border/60 bg-black/20 hover:bg-accent/25'}`}><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{item.title}</span><span className={`h-2 w-2 shrink-0 rounded-full ${item.published ? 'bg-emerald-400' : 'bg-muted-foreground/50'}`} /></div><div className="mt-1 truncate text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{item.content_type.replace('_', ' ')} · {item.slug}</div></button>)}
            {!items.length && <div className="p-4 text-center text-xs text-muted-foreground">No CMS content yet. Static public content continues to work until records are published.</div>}
          </div>
        </aside>

        <section className="rounded-2xl border border-border/70 bg-background/45 p-4 sm:p-6">
          <div className="mb-5"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{selectedId ? 'Edit content' : 'Create content'}</div><h1 className="mt-1 text-2xl font-semibold">{draft.title || 'Untitled item'}</h1></div>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-xs font-semibold text-muted-foreground">Type<select value={draft.content_type} onChange={(event) => setDraft((current) => ({ ...current, content_type: event.target.value as FrontendContentType }))} className="mt-1 h-11 w-full rounded-xl border border-border/70 bg-black/30 px-3 text-sm text-foreground"><option value="blog_article">Blog article</option><option value="video_teaser">Video teaser</option><option value="gallery_image">Gallery image</option></select></label>
              <label className="text-xs font-semibold text-muted-foreground">Slug<input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-border/70 bg-black/30 px-3 text-sm text-foreground" placeholder="weather-now-guide" /></label>
            </div>
            <label className="block text-xs font-semibold text-muted-foreground">Title<input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-border/70 bg-black/30 px-3 text-sm text-foreground" /></label>
            <label className="block text-xs font-semibold text-muted-foreground">Summary<textarea value={draft.summary || ''} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} rows={3} className="mt-1 w-full rounded-xl border border-border/70 bg-black/30 p-3 text-sm text-foreground" /></label>
            <label className="block text-xs font-semibold text-muted-foreground">Body<textarea value={draft.body || ''} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} rows={10} className="mt-1 w-full rounded-xl border border-border/70 bg-black/30 p-3 text-sm leading-6 text-foreground" placeholder="Article body or reusable frontend copy…" /></label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-xs font-semibold text-muted-foreground">Image URL<input value={draft.image_url || ''} onChange={(event) => setDraft((current) => ({ ...current, image_url: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-border/70 bg-black/30 px-3 text-sm text-foreground" placeholder="https://…" /></label>
              <label className="text-xs font-semibold text-muted-foreground">Video URL<input value={draft.video_url || ''} onChange={(event) => setDraft((current) => ({ ...current, video_url: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-border/70 bg-black/30 px-3 text-sm text-foreground" placeholder="https://…" /></label>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <label className="text-xs font-semibold text-muted-foreground">App route<input value={draft.app_route || ''} onChange={(event) => setDraft((current) => ({ ...current, app_route: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-border/70 bg-black/30 px-3 text-sm text-foreground" placeholder="/apps/weather-now" /></label>
              <label className="text-xs font-semibold text-muted-foreground">Sort order<input type="number" value={draft.sort_order} onChange={(event) => setDraft((current) => ({ ...current, sort_order: Number(event.target.value) }))} className="mt-1 h-11 w-full rounded-xl border border-border/70 bg-black/30 px-3 text-sm text-foreground" /></label>
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-black/20 p-3 text-sm"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))} className="h-4 w-4" /><span><strong>Published</strong><span className="ml-2 text-xs text-muted-foreground">Visible to signed-out visitors.</span></span></label>

            {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
            {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}

            <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
              <button disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
              {selectedId && <button type="button" disabled={busy} onClick={() => void remove()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-destructive/30 px-4 text-sm font-semibold text-destructive disabled:opacity-50"><Trash2 className="h-4 w-4" /> Delete</button>}
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

import React from 'react'
import { BookOpen, Download, GalleryThumbnails, ImagePlus, Loader2, RefreshCcw, Send, Users, X } from 'lucide-react'
import { AppHeading } from '@/components/layout/AppHeading'
import { Button, Card, Input, Select, Tabs } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { emitAgentResponse } from '@/lib/agentEvents'
import { assetUrl, DRAGON_ARENA_OPENINGS, listAssets, listSessions, listTurns, randomOpening, type DragonAsset, type DragonSession, type OpeningScenario } from '@/lib/dragonArena'

type BuilderMode = 'novel' | 'comics'
type TurnView = { turnNumber: number; playerAction: string; narrative: string; choices: string[]; scenePrompt: string; model: string }
type GameReply = { narrative?: string; choices?: string[]; actions?: string[]; scenePrompt?: string; imagePrompt?: string; model?: string; error?: string }
type SceneReply = { imageUrl?: string; error?: string }
const HF_KEYS_STORAGE = 'dragon-arena-hf-keys'
const HF_LEGACY_STORAGE = 'dragon-arena-hf-key'
const MODEL = 'huggingface-rotation'

const loadTokens = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(HF_KEYS_STORAGE) || '[]')
    if (Array.isArray(parsed)) return parsed.map(String).map((value) => value.trim()).filter((value) => value.startsWith('hf_')).slice(0, 3)
    const legacy = localStorage.getItem(HF_LEGACY_STORAGE) || ''
    return legacy.startsWith('hf_') ? [legacy] : []
  } catch { return [] }
}
const safeAssetUrl = (asset?: DragonAsset | null) => {
  if (!asset) return ''
  const stored = assetUrl(asset.storage_path)
  if (stored) return stored
  try { const parsed = new URL(asset.external_url || ''); return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : '' } catch { return '' }
}
const sceneTurn = (asset: DragonAsset) => {
  const value = Number(asset.metadata?.turn_number)
  return Number.isFinite(value) && value > 0 ? value : null
}
const exportText = (name: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url)
}
const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function PF_AIDragonArenaStudioV2() {
  const [mode, setMode] = React.useState<BuilderMode>(() => localStorage.getItem('dragon-builder-mode') === 'comics' ? 'comics' : 'novel')
  const [opening, setOpening] = React.useState<OpeningScenario>(() => randomOpening())
  const [turns, setTurns] = React.useState<TurnView[]>([])
  const [choices, setChoices] = React.useState<string[]>(opening.choices)
  const [action, setAction] = React.useState('')
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [userId, setUserId] = React.useState<string | null>(null)
  const [sessions, setSessions] = React.useState<DragonSession[]>([])
  const [assets, setAssets] = React.useState<DragonAsset[]>([])
  const [loading, setLoading] = React.useState(false)
  const [sceneLoading, setSceneLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [panel, setPanel] = React.useState<'sessions' | 'assets' | null>(null)
  const [lightbox, setLightbox] = React.useState('')

  React.useEffect(() => { try { localStorage.setItem('dragon-builder-mode', mode) } catch { /* session-only */ } }, [mode])
  const refreshSessions = React.useCallback(async (uid = userId) => { if (uid) setSessions(await listSessions(uid)) }, [userId])
  const refreshAssets = React.useCallback(async (sid = sessionId, uid = userId) => { if (sid && uid) setAssets(await listAssets(uid, { sessionId: sid })) }, [sessionId, userId])

  const loadSession = React.useCallback(async (session: DragonSession, uid = userId) => {
    if (!uid) return
    setLoading(true); setError('')
    try {
      const metadataOpening = session.metadata?.opening as OpeningScenario | undefined
      const nextOpening = metadataOpening?.narrative && Array.isArray(metadataOpening.choices) ? metadataOpening : DRAGON_ARENA_OPENINGS.find((item) => item.id === session.metadata?.opening_id) || DRAGON_ARENA_OPENINGS[0]
      const rows = await listTurns(session.id)
      setOpening(nextOpening)
      setMode(session.metadata?.builder_mode === 'comics' ? 'comics' : 'novel')
      setSessionId(session.id)
      setTurns(rows.map((row) => ({ turnNumber: row.turn_number, playerAction: row.player_action, narrative: row.narrative, choices: Array.isArray(row.choices) ? row.choices.slice(0, 3) : [], scenePrompt: row.scene_prompt || row.narrative, model: row.model })))
      setChoices(rows.length ? (rows[rows.length - 1].choices || []).slice(0, 3) : [...nextOpening.choices])
      setAssets(await listAssets(uid, { sessionId: session.id }))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not restore this story.') }
    finally { setLoading(false) }
  }, [userId])

  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user || cancelled) return
      setUserId(data.user.id)
      const available = await listSessions(data.user.id)
      if (cancelled) return
      setSessions(available)
      if (available[0]) await loadSession(available[0], data.user.id)
    })().catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not restore Story Studio.') })
    return () => { cancelled = true }
  }, [loadSession])

  const startNew = (nextOpening = opening) => {
    setOpening(nextOpening); setTurns([]); setChoices([...nextOpening.choices]); setAction(''); setSessionId(null); setAssets([]); setPanel(null); setError('')
  }

  const ensureSession = async (uid: string, firstNarrative: string) => {
    if (sessionId) return sessionId
    const { data, error: createError } = await supabase.from('dragon_arena_sessions').insert({
      user_id: uid,
      title: `${opening.label} ${mode === 'comics' ? 'comic' : 'novel'}`,
      summary: firstNarrative.slice(0, 180),
      turn_count: 0,
      metadata: { source: 'story-studio', builder_mode: mode, model: MODEL, opening_id: opening.id, opening },
    }).select('id').single()
    if (createError || !data?.id) throw createError || new Error('Could not create story session.')
    setSessionId(data.id)
    return data.id as string
  }

  const play = async (selected?: string) => {
    const playerAction = (selected || action).trim()
    if (!playerAction || loading) return
    setLoading(true); setError(''); setAction('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const auth = sessionData.session
      if (!auth) throw new Error('Sign in again to continue.')
      const hfTokens = loadTokens()
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.access_token}` }
      if (hfTokens.length) headers['x-hf-tokens'] = hfTokens.join(',')
      const history = [{ role: 'gm', text: opening.narrative }, ...turns.flatMap((item) => [{ role: 'player', text: item.playerAction }, { role: 'gm', text: item.narrative }])]
      const response = await fetch('/api/ai-game', { method: 'POST', headers, body: JSON.stringify({ turn: turns.length + 1, action: playerAction, history, builderMode: mode, opening }) })
      const payload = await response.json().catch(() => ({})) as GameReply
      if (!response.ok) throw new Error(payload.error || 'The Game Master is unavailable.')
      const narrative = String(payload.narrative || '').trim()
      if (!narrative) throw new Error('The Game Master returned no story text.')
      const suggested = (Array.isArray(payload.choices) && payload.choices.length ? payload.choices : payload.actions || []).map(String).map((item) => item.trim()).filter(Boolean).slice(0, 3)
      const nextChoices = suggested.length === 3 ? suggested : ['Trace the clue', 'Advance carefully', 'Hold and listen']
      const scenePrompt = String(payload.scenePrompt || payload.imagePrompt || narrative).trim()
      const turnNumber = turns.length + 1
      const sid = await ensureSession(auth.user.id, narrative)
      const { error: saveError } = await supabase.from('dragon_arena_turns').insert({ session_id: sid, user_id: auth.user.id, turn_number: turnNumber, player_action: playerAction, narrative, choices: nextChoices, scene_prompt: scenePrompt, model: payload.model || MODEL })
      if (saveError) throw saveError
      await supabase.from('dragon_arena_sessions').update({ turn_count: turnNumber, updated_at: new Date().toISOString(), metadata: { source: 'story-studio', builder_mode: mode, model: payload.model || MODEL, opening_id: opening.id, opening } }).eq('id', sid)
      const next = [...turns, { turnNumber, playerAction, narrative, choices: nextChoices, scenePrompt, model: payload.model || MODEL }]
      setTurns(next); setChoices(nextChoices); emitAgentResponse(narrative, 'story-studio'); await refreshSessions(auth.user.id)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not continue the story.') }
    finally { setLoading(false) }
  }

  const generateScene = async () => {
    if (!sessionId || !turns.length || sceneLoading) return
    setSceneLoading(true); setError('')
    try {
      const { data } = await supabase.auth.getSession(); if (!data.session) throw new Error('Sign in again to generate art.')
      const hfTokens = loadTokens(); const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }
      if (hfTokens.length) headers['x-hf-tokens'] = hfTokens.join(',')
      const latest = turns[turns.length - 1]
      const response = await fetch('/api/dragon-image', { method: 'POST', headers, body: JSON.stringify({ sessionId, prompt: latest.scenePrompt, turnNumber: latest.turnNumber, builderMode: mode }) })
      const payload = await response.json().catch(() => ({})) as SceneReply
      if (!response.ok) throw new Error(payload.error || 'Scene generation is unavailable.')
      await refreshAssets(sessionId, data.session.user.id)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not generate scene art.') }
    finally { setSceneLoading(false) }
  }

  const exportProduct = () => {
    if (!turns.length) return
    const stamp = new Date().toISOString().slice(0, 10)
    if (mode === 'novel') {
      const body = turns.map((item) => `## ${item.turnNumber}. ${item.playerAction}\n\n${item.narrative}`).join('\n\n---\n\n')
      exportText(`appforge-novel-${stamp}.md`, `# ${opening.label}\n\n${opening.narrative}\n\n${body}\n`, 'text/markdown;charset=utf-8'); return
    }
    const panels = turns.map((item) => {
      const scene = assets.find((asset) => sceneTurn(asset) === item.turnNumber); const src = safeAssetUrl(scene)
      return `<section class="panel">${src ? `<img src="${escapeHtml(src)}" alt="Panel ${item.turnNumber}">` : ''}<div><small>${escapeHtml(item.playerAction)}</small><p>${escapeHtml(item.narrative).replace(/\n/g, '<br>')}</p></div></section>`
    }).join('')
    exportText(`appforge-comic-${stamp}.html`, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(opening.label)}</title><style>body{font-family:system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;background:#111;color:#eee}.panel{display:grid;grid-template-columns:minmax(180px,36%) 1fr;gap:20px;border-bottom:1px solid #333;padding:22px 0}.panel img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px}.panel p{line-height:1.65}@media(max-width:620px){.panel{grid-template-columns:1fr}}</style></head><body><h1>${escapeHtml(opening.label)}</h1><p>${escapeHtml(opening.narrative)}</p>${panels}</body></html>`, 'text/html;charset=utf-8')
  }

  const latestScene = turns.length ? assets.find((asset) => sceneTurn(asset) === turns[turns.length - 1].turnNumber) : null
  return <div className="mx-auto max-w-5xl space-y-3 pb-10 text-foreground">
    <AppHeading />
    <div className="flex flex-wrap items-center justify-between gap-2"><Tabs tabs={[{ id: 'novel', label: 'Novel', icon: BookOpen }, { id: 'comics', label: 'Comics', icon: GalleryThumbnails }]} active={mode} onChange={(id) => setMode(id as BuilderMode)} ariaLabel="Story format" /><div className="flex items-center gap-1"><Button variant={panel === 'sessions' ? 'secondary' : 'ghost'} onClick={() => setPanel(panel === 'sessions' ? null : 'sessions')}><Users /> Sessions</Button><Button variant={panel === 'assets' ? 'secondary' : 'ghost'} onClick={() => setPanel(panel === 'assets' ? null : 'assets')}><GalleryThumbnails /> Assets</Button><Button variant="ghost" onClick={exportProduct} disabled={!turns.length}><Download /> Export</Button><Button variant="ghost" onClick={() => startNew(randomOpening())}><RefreshCcw /> New</Button></div></div>

    {panel === 'sessions' && <Card className="p-3"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{sessions.length ? sessions.map((session) => <button key={session.id} type="button" onClick={() => void loadSession(session)} className={`rounded-xl border p-2 text-left text-xs hover:bg-accent ${session.id === sessionId ? 'border-primary/50 bg-accent/50' : 'border-border/70'}`}><div className="font-semibold">{session.title || 'Untitled story'}</div><div className="mt-1 text-[11px] text-muted-foreground">{session.turn_count} turns · {new Date(session.updated_at).toLocaleDateString()}</div></button>) : <div className="text-xs text-muted-foreground">No saved stories yet.</div>}</div></Card>}
    {panel === 'assets' && <Card className="p-3"><div className="flex gap-2 overflow-x-auto">{assets.length ? assets.map((asset) => { const src = safeAssetUrl(asset); return <button key={asset.id} type="button" onClick={() => src && setLightbox(src)} className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted">{src && <img src={src} alt="" className="h-full w-full object-cover" />}</button> }) : <div className="text-xs text-muted-foreground">No generated scenes yet.</div>}</div></Card>}

    <Card className="overflow-hidden p-0"><div className="border-b border-border/70 p-3"><div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end"><div><div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">World seed</div><h2 className="mt-1 text-lg font-semibold">{opening.label}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{opening.narrative}</p></div><Select value={opening.id} onChange={(event) => { const next = DRAGON_ARENA_OPENINGS.find((item) => item.id === event.target.value); if (next) startNew(next) }} aria-label="Opening scenario">{DRAGON_ARENA_OPENINGS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></div></div>
      <div className="space-y-4 p-3 sm:p-4">{turns.map((item) => { const scene = assets.find((asset) => sceneTurn(asset) === item.turnNumber); const src = safeAssetUrl(scene); return <section key={item.turnNumber} className="border-b border-border/60 pb-4 last:border-0"><div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">You · {item.playerAction}</div><div className="mt-2 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px] md:items-start"><div className="whitespace-pre-line text-sm leading-7">{item.narrative}</div>{src && <button type="button" onClick={() => setLightbox(src)} className="overflow-hidden rounded-xl border border-border/70"><img src={src} alt={`Scene ${item.turnNumber}`} className="aspect-[4/3] w-full object-cover" /></button>}</div></section> })}{loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> The Game Master is writing…</div>}</div>
    </Card>

    {error && <Card className="border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">{error}</Card>}
    <Card className="p-3"><div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">What do you do?</div><div className="mt-2 flex flex-wrap gap-2">{choices.map((choice) => <Button key={choice} variant="secondary" onClick={() => void play(choice)} disabled={loading}>{choice}</Button>)}</div><div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"><Input value={action} onChange={(event) => setAction(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void play() }} placeholder="Or choose your own action…" disabled={loading} /><Button onClick={() => void play()} disabled={loading || !action.trim()}><Send /> Continue</Button></div><div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => void generateScene()} disabled={!sessionId || !turns.length || sceneLoading}><ImagePlus /> {sceneLoading ? 'Generating…' : latestScene ? 'Regenerate scene' : 'Generate scene'}</Button><span className="self-center text-[11px] text-muted-foreground">No daily turn or image-generation cap. Personal HF rotation is managed in Settings → Integrations.</span></div></Card>
    {lightbox && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setLightbox('') }}><button type="button" aria-label="Close image" onClick={() => setLightbox('')} className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-xl bg-white/10 text-white"><X className="h-4 w-4" /></button><img src={lightbox} alt="Generated story scene" className="max-h-[88dvh] max-w-[92vw] rounded-xl object-contain" /></div>}
  </div>
}

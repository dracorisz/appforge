import { Link } from 'react-router-dom'
import { getGeminiHeaders } from '@/lib/aiProviders'
import { emitAgentResponse } from '@/lib/agentEvents'
import React from 'react'
import { BookOpen, Download, GalleryThumbnails, Globe2, ImagePlus, KeyRound, Loader2, LockKeyhole, Palette, RefreshCcw, Send, Trophy, Users, X } from 'lucide-react'
import { GiDragonHead, GiDungeonGate, GiRuneSword, GiScrollUnfurled, GiSparkles, GiSpikedShield } from 'react-icons/gi'
import { Button, Card, Input } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  assetUrl,
  awardPoints,
  DEFAULT_OPENING,
  getPoints,
  leaderboard,
  listAssets,
  listSessions,
  listTurns,
  randomOpening,
  type DragonAsset,
  type DragonPoints,
  type DragonSession,
  type LeaderboardRow,
  type OpeningScenario,
} from '@/lib/dragonArena'

type Turn = { role: 'player' | 'gm'; text: string }
type CompletedTurn = { turnNumber: number; playerAction: string; narrative: string; choices: string[]; model: string }
type GameReply = { narrative?: string; choices?: string[]; model?: string; provider?: string; degraded?: boolean; error?: string }
type BuilderMode = 'novel' | 'comics'
type Panel = 'assets' | 'sessions' | 'leaderboard' | null

type SceneReply = { imageUrl?: string; model?: string; isPublic?: boolean; error?: string }

const STORY_THEMES = {
  workspace: { label: 'Workspace', primary: '', glow: 'transparent', swatch: 'bg-foreground' },
  ember: { label: 'Ember Runes', primary: '18 82% 35%', glow: 'rgba(234, 88, 12, 0.13)', swatch: 'bg-orange-600' },
  frost: { label: 'Frost Wyrms', primary: '224 65% 42%', glow: 'rgba(79, 70, 229, 0.13)', swatch: 'bg-indigo-600' },
  forest: { label: 'Forest Dragons', primary: '153 64% 26%', glow: 'rgba(5, 150, 105, 0.13)', swatch: 'bg-emerald-600' },
} as const
type StoryTheme = keyof typeof STORY_THEMES
const STORY_THEME_KEY = 'appforge-story-theme'

const MODEL = 'huggingface-rotation'

const loadHfTokens = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem('dragon-arena-hf-keys') || '[]')
    if (Array.isArray(parsed)) return [0, 1, 2].map((index) => String(parsed[index] || ''))
  } catch { /* migrate legacy value below */ }
  return [localStorage.getItem('dragon-arena-hf-key') || '', '', '']
}

const resolveOpening = (metadata: unknown): OpeningScenario => {
  if (metadata && typeof metadata === 'object') {
    const value = (metadata as Record<string, unknown>).opening
    if (value && typeof value === 'object' && 'narrative' in value && 'choices' in value && Array.isArray((value as OpeningScenario).choices)) return value as OpeningScenario
  }
  return DEFAULT_OPENING
}

const choiceIcon = (choice: string) => {
  const lower = choice.toLowerCase()
  if (lower.includes('rune') || lower.includes('marking')) return GiRuneSword
  if (lower.includes('dragon') || lower.includes('creature')) return GiDragonHead
  if (lower.includes('search') || lower.includes('vault') || lower.includes('entrance')) return GiDungeonGate
  if (lower.includes('retreat') || lower.includes('study')) return GiScrollUnfurled
  if (lower.includes('listen') || lower.includes('trace')) return GiSparkles
  return GiSpikedShield
}

const sceneModel = (asset: DragonAsset) => {
  const value = asset.metadata?.model
  return typeof value === 'string' && value.trim() ? value : 'Hugging Face'
}

const sceneTurn = (asset: DragonAsset) => {
  const value = Number(asset.metadata?.turn_number)
  return Number.isFinite(value) && value > 0 ? value : null
}

const paragraphize = (text: string) => text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)

const downloadText = (name: string, content: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function PF_AIDragonArenaStudio() {
  const [mode, setMode] = React.useState<BuilderMode>(() => (localStorage.getItem('dragon-builder-mode') === 'comics' ? 'comics' : 'novel'))
  const [opening, setOpening] = React.useState<OpeningScenario>(() => randomOpening())
  const [history, setHistory] = React.useState<Turn[]>([{ role: 'gm', text: opening.narrative }])
  const [choices, setChoices] = React.useState<string[]>([...opening.choices])
  const [completedTurns, setCompletedTurns] = React.useState<CompletedTurn[]>([])
  const [turn, setTurn] = React.useState(1)
  const [action, setAction] = React.useState('')
  const [showAppearance, setShowAppearance] = React.useState(false)
  const [storyTheme, setStoryTheme] = React.useState<StoryTheme>(() => {
    try { const saved = localStorage.getItem(STORY_THEME_KEY); return saved && Object.prototype.hasOwnProperty.call(STORY_THEMES, saved) ? saved as StoryTheme : 'workspace' } catch { return 'workspace' }
  })
  const selectStoryTheme = (theme: StoryTheme) => {
    setStoryTheme(theme)
    try { localStorage.setItem(STORY_THEME_KEY, theme) } catch { /* applies for this session */ }
  }
  const themeStyle = storyTheme === 'workspace' ? undefined : { '--primary': STORY_THEMES[storyTheme].primary, '--primary-foreground': '0 0% 100%', '--ring': STORY_THEMES[storyTheme].primary } as React.CSSProperties
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [userId, setUserId] = React.useState<string | null>(null)

  const [assets, setAssets] = React.useState<DragonAsset[]>([])
  const [sessions, setSessions] = React.useState<DragonSession[]>([])
  const [leaderboardRows, setLeaderboardRows] = React.useState<LeaderboardRow[]>([])
  const [points, setPoints] = React.useState<DragonPoints | null>(null)
  const [sceneLoading, setSceneLoading] = React.useState(false)
  const [imageDailyUsed, setImageDailyUsed] = React.useState(false)
  const [panel, setPanel] = React.useState<Panel>(null)
  const [lightbox, setLightbox] = React.useState<string | null>(null)
  const [sharingAsset, setSharingAsset] = React.useState<string | null>(null)

  const [hfTokens, setHfTokens] = React.useState<string[]>(loadHfTokens)
  const [showProviderSettings, setShowProviderSettings] = React.useState(false)

  React.useEffect(() => { localStorage.setItem('dragon-builder-mode', mode) }, [mode])
  React.useEffect(() => {
    localStorage.setItem('dragon-arena-hf-keys', JSON.stringify(hfTokens))
    const primary = hfTokens.find((token) => token.startsWith('hf_')) || ''
    if (primary) localStorage.setItem('dragon-arena-hf-key', primary)
    else localStorage.removeItem('dragon-arena-hf-key')
  }, [hfTokens])

  const personalHfTokens = React.useMemo(() => hfTokens.map((token) => token.trim()).filter((token) => token.startsWith('hf_')), [hfTokens])
  const storyScenes = React.useMemo(() => assets.filter((asset) => asset.asset_type === 'scene').slice().sort((a, b) => a.created_at.localeCompare(b.created_at)), [assets])
  const latestScene = storyScenes[storyScenes.length - 1] || null

  const refreshAssets = React.useCallback(async (sid: string | null, uid: string | null) => {
    if (!sid || !uid) return
    try { setAssets(await listAssets(uid, { sessionId: sid })) } catch (cause) { console.error('[StoryStudio] assets', cause) }
  }, [])

  const refreshSessions = React.useCallback(async (uid: string | null) => {
    if (!uid) return
    try { setSessions(await listSessions(uid)) } catch (cause) { console.error('[StoryStudio] sessions', cause) }
  }, [])

  const refreshPoints = React.useCallback(async (uid: string | null) => {
    if (!uid) return
    try { setPoints(await getPoints(uid)) } catch { /* optional */ }
  }, [])

  const loadSession = React.useCallback(async (session: DragonSession, uidOverride?: string | null) => {
    const uid = uidOverride || userId
    if (!uid) return
    setLoading(true)
    setError('')
    try {
      const sessionOpening = resolveOpening(session.metadata)
      const turns = await listTurns(session.id)
      setOpening(sessionOpening)
      setSessionId(session.id)
      const savedMode = session.metadata?.builder_mode === 'comics' ? 'comics' : session.metadata?.builder_mode === 'novel' ? 'novel' : null
      if (savedMode) setMode(savedMode)
      await refreshAssets(session.id, uid)

      const nextHistory: Turn[] = [{ role: 'gm', text: sessionOpening.narrative }]
      const nextCompleted: CompletedTurn[] = []
      for (const saved of turns) {
        const savedChoices = Array.isArray(saved.choices) ? saved.choices.map(String).filter(Boolean).slice(0, 3) : sessionOpening.choices
        nextHistory.push({ role: 'player', text: saved.player_action }, { role: 'gm', text: saved.narrative })
        nextCompleted.push({ turnNumber: saved.turn_number, playerAction: saved.player_action, narrative: saved.narrative, choices: savedChoices, model: saved.model })
      }
      setHistory(nextHistory)
      setCompletedTurns(nextCompleted)
      setChoices(nextCompleted.length ? nextCompleted[nextCompleted.length - 1].choices : [...sessionOpening.choices])
      setTurn(nextCompleted.length ? nextCompleted[nextCompleted.length - 1].turnNumber + 1 : 1)
    } finally { setLoading(false) }
  }, [refreshAssets, userId])

  React.useEffect(() => {
    let cancelled = false
    const restore = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user || cancelled) return
      const uid = auth.user.id
      setUserId(uid)
      await Promise.all([refreshSessions(uid), refreshPoints(uid)])
      const { data: session } = await supabase.from('dragon_arena_sessions').select('*').eq('user_id', uid).order('updated_at', { ascending: false }).limit(1).maybeSingle()
      if (!session?.id || cancelled) return
      await loadSession(session as DragonSession, uid)
    }
    void restore()
    return () => { cancelled = true }
  }, [loadSession, refreshPoints, refreshSessions])

  const reset = () => {
    const next = randomOpening()
    setOpening(next)
    setHistory([{ role: 'gm', text: next.narrative }])
    setChoices([...next.choices])
    setCompletedTurns([])
    setTurn(1)
    setSessionId(null)
    setAssets([])
    setAction('')
    setError('')
    setImageDailyUsed(false)
    setPanel(null)
  }

  const persistTurn = async (nextTurns: CompletedTurn[]) => {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) return
    let sid = sessionId

    if (!sid) {
      const { data: created, error: createError } = await supabase.from('dragon_arena_sessions').insert({
        user_id: uid,
        title: `${opening.label} ${mode === 'comics' ? 'comic' : 'novel'}`,
        summary: nextTurns[0]?.narrative.slice(0, 180) || null,
        turn_count: nextTurns.length,
        metadata: { source: 'story-studio', builder_mode: mode, model: MODEL, opening_id: opening.id, opening },
      }).select('id').single()
      if (createError || !created?.id) throw createError || new Error('Could not create story session.')
      sid = created.id
      setSessionId(sid)
    }

    const latest = nextTurns[nextTurns.length - 1]
    const { error: turnError } = await supabase.from('dragon_arena_turns').insert({
      session_id: sid,
      user_id: uid,
      turn_number: latest.turnNumber,
      player_action: latest.playerAction,
      narrative: latest.narrative,
      choices: latest.choices,
      model: latest.model,
    })
    if (turnError) throw turnError
    await supabase.from('dragon_arena_sessions').update({ turn_count: nextTurns.length, updated_at: new Date().toISOString(), metadata: { source: 'story-studio', builder_mode: mode, model: MODEL, opening_id: opening.id, opening } }).eq('id', sid)
    await refreshSessions(uid)
  }

  const play = async (selected?: string) => {
    const playerAction = (selected || action).trim()
    if (!playerAction || loading) return
    setLoading(true)
    setError('')
    setAction('')
    const pendingHistory: Turn[] = [...history, { role: 'player', text: playerAction }]
    setHistory(pendingHistory)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Sign in again to continue.')
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      if (personalHfTokens.length) headers['x-hf-tokens'] = personalHfTokens.join(',')
      Object.assign(headers, getGeminiHeaders())
      const response = await fetch('/api/ai-game', { method: 'POST', headers, body: JSON.stringify({ turn, action: playerAction, history: pendingHistory.slice(-6), builderMode: mode }) })
      const payload = await response.json().catch(() => ({})) as GameReply
      if (!response.ok) throw new Error(payload.error || 'The story engine is unavailable.')

      const narrative = payload.narrative?.trim() || 'Something shifts in the dark. Your move.'
      const nextChoices = Array.isArray(payload.choices) && payload.choices.length ? payload.choices.slice(0, 3) : [...opening.choices]
      setHistory((current) => [...current, { role: 'gm', text: narrative }])
      emitAgentResponse(narrative, 'story-studio')
      setChoices(nextChoices)
      const nextCompleted = [...completedTurns, { turnNumber: turn, playerAction, narrative, choices: nextChoices, model: payload.model || MODEL }]
      setCompletedTurns(nextCompleted)
      setTurn((value) => value + 1)
      void persistTurn(nextCompleted).catch((cause) => console.error('[StoryStudio] persist', cause))
      const uid = sessionData.session?.user.id
      if (uid) void awardPoints(10, 1, 0).then(() => refreshPoints(uid)).catch(() => undefined)
    } catch (cause) {
      setHistory(history)
      setError(cause instanceof Error ? cause.message : 'Could not continue the story.')
    } finally { setLoading(false) }
  }

  const generateScene = async () => {
    if (!sessionId || sceneLoading) return
    setSceneLoading(true)
    setError('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const uid = sessionData.session?.user.id
      if (!token || !uid) throw new Error('Sign in again to generate art.')
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      if (personalHfTokens.length) headers['x-hf-tokens'] = personalHfTokens.join(',')
      const prompt = completedTurns[completedTurns.length - 1]?.narrative || opening.narrative
      const response = await fetch('/api/dragon-image', { method: 'POST', headers, body: JSON.stringify({ sessionId, prompt, turnNumber: Math.max(1, completedTurns.length), builderMode: mode }) })
      const payload = await response.json().catch(() => ({})) as SceneReply
      if (!response.ok) {
        if (response.status === 429) setImageDailyUsed(true)
        throw new Error(payload.error || 'Scene generation is unavailable.')
      }
      await refreshAssets(sessionId, uid)
      void awardPoints(0, 0, 1).then(() => refreshPoints(uid)).catch(() => undefined)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not generate scene art.') }
    finally { setSceneLoading(false) }
  }

  const togglePublic = async (asset: DragonAsset) => {
    if (!userId) return
    setSharingAsset(asset.id)
    setError('')
    try {
      const { error: shareError } = await supabase.from('dragon_arena_assets').update({ is_public: !asset.is_public }).eq('id', asset.id).eq('user_id', userId)
      if (shareError) throw shareError
      if (sessionId) await refreshAssets(sessionId, userId)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not change showcase visibility.') }
    finally { setSharingAsset(null) }
  }

  const togglePanel = async (next: Exclude<Panel, null>) => {
    const openingPanel = panel !== next
    setPanel(openingPanel ? next : null)
    if (!openingPanel) return
    if (next === 'assets') await refreshAssets(sessionId, userId)
    if (next === 'sessions') await refreshSessions(userId)
    if (next === 'leaderboard') {
      try { setLeaderboardRows(await leaderboard(25)) } catch { /* optional */ }
    }
  }

  const exportProduct = () => {
    const stamp = new Date().toISOString().slice(0, 10)
    if (mode === 'novel') {
      const body = completedTurns.map((item) => `## Turn ${item.turnNumber}\n\n**Choice:** ${item.playerAction}\n\n${item.narrative}`).join('\n\n---\n\n')
      downloadText(`appforge-novel-${stamp}.md`, `# ${opening.label}\n\n${opening.narrative}\n\n${body}\n`, 'text/markdown;charset=utf-8')
      return
    }

    const panels = completedTurns.map((item) => {
      const scene = storyScenes.find((asset) => sceneTurn(asset) === item.turnNumber)
      const src = scene ? assetUrl(scene.storage_path) || scene.external_url || '' : ''
      return `<section class="panel">${src ? `<img src="${escapeHtml(src)}" alt="Panel ${item.turnNumber}">` : ''}<div><small>Turn ${item.turnNumber} · ${escapeHtml(item.playerAction)}</small><p>${escapeHtml(item.narrative).replace(/\n/g, '<br>')}</p></div></section>`
    }).join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(opening.label)} comic</title><style>body{font-family:system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;background:#111;color:#eee}.panel{display:grid;grid-template-columns:minmax(180px,36%) 1fr;gap:20px;border-bottom:1px solid #333;padding:22px 0}.panel img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px}.panel p{line-height:1.65}small{color:#aaa}@media(max-width:620px){.panel{grid-template-columns:1fr}}</style></head><body><h1>${escapeHtml(opening.label)}</h1><p>${escapeHtml(opening.narrative)}</p>${panels}</body></html>`
    downloadText(`appforge-comic-${stamp}.html`, html, 'text/html;charset=utf-8')
  }

  const sceneForHistoryIndex = (index: number) => {
    if (index <= 0 || index % 2 !== 0) return null
    const turnNumber = index / 2
    const exact = storyScenes.find((asset) => sceneTurn(asset) === turnNumber)
    if (exact) return exact
    const isLatestGm = index === history.length - 1 && history[index]?.role === 'gm'
    return isLatestGm && latestScene && sceneTurn(latestScene) === null ? latestScene : null
  }

  const canGenerate = Boolean(sessionId) && !sceneLoading && (!imageDailyUsed || personalHfTokens.length > 0)

  return (
    <div className="mx-auto max-w-6xl space-y-3 pb-10 text-foreground" style={themeStyle} data-story-theme={storyTheme}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-card p-1">
          <button onClick={() => setMode('novel')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${mode === 'novel' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}><BookOpen className="h-4 w-4" /> Novel</button>
          <button onClick={() => setMode('comics')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${mode === 'comics' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}><GalleryThumbnails className="h-4 w-4" /> Comics</button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>Turn {turn}</span>{points && <span>· {points.points} pts</span>}<span>· {STORY_THEMES[storyTheme].label}</span></div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/70 bg-card/90 px-3 py-2">
          <Button size="sm" variant="secondary" onClick={() => void generateScene()} disabled={!canGenerate}><ImagePlus className="h-4 w-4" /> {sceneLoading ? 'Generating…' : 'Generate'}</Button>
          <Button size="sm" variant={panel === 'assets' ? 'default' : 'ghost'} onClick={() => void togglePanel('assets')}><GalleryThumbnails className="h-4 w-4" /> Assets <span className="text-xs opacity-70">{storyScenes.length}</span></Button>
          <Button size="sm" variant={panel === 'sessions' ? 'default' : 'ghost'} onClick={() => void togglePanel('sessions')}><Users className="h-4 w-4" /> Sessions</Button>
          <Button size="sm" variant={panel === 'leaderboard' ? 'default' : 'ghost'} onClick={() => void togglePanel('leaderboard')}><Trophy className="h-4 w-4" /> Leaderboard</Button>
          <Button size="sm" variant="ghost" onClick={exportProduct} disabled={!completedTurns.length}><Download className="h-4 w-4" /> Export {mode === 'novel' ? 'Novel' : 'Comic'}</Button>
          <div className="ml-auto flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={reset}><RefreshCcw className="h-4 w-4" /> New</Button>
            <Button size="sm" variant={showAppearance ? 'secondary' : 'ghost'} onClick={() => setShowAppearance((value) => !value)} aria-expanded={showAppearance} aria-controls="story-appearance" title="Story appearance"><Palette className="h-4 w-4" /><span className="hidden sm:inline">Theme</span></Button>
            <Button size="sm" variant="ghost" onClick={() => setShowProviderSettings((value) => !value)} title="AI provider settings" aria-label="AI provider settings"><KeyRound className="h-4 w-4" /></Button>
          </div>
        </div>

        {showAppearance && <section id="story-appearance" className="border-b border-border/70 bg-background/55 p-3" aria-label="Story appearance">
          <h2 className="text-sm font-semibold">Story appearance</h2>
          <p className="mt-1 text-xs text-muted-foreground">Choose the color of story bubbles, actions, focus rings and the canvas glow. Saved in this browser for Novel and Comics.</p>
          <div className="mt-3 flex flex-wrap gap-2">{(Object.keys(STORY_THEMES) as StoryTheme[]).map((theme) => <button key={theme} type="button" aria-pressed={storyTheme === theme} onClick={() => selectStoryTheme(theme)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${storyTheme === theme ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-accent'}`}><span aria-hidden="true" className={`h-3 w-3 rounded-full border border-current ${STORY_THEMES[theme].swatch}`} />{STORY_THEMES[theme].label}</button>)}</div>
        </section>}

        {showProviderSettings && <div className="border-b border-border/70 bg-background/55 p-3"><div className="mb-2"><div className="text-xs font-semibold">Personal Hugging Face tokens</div><div className="mt-1 text-[11px] leading-4 text-muted-foreground">Optional. Add up to three tokens with Inference Providers access. Story Studio rotates them before server-funded keys. Manage Gemini and OpenRouter keys in Settings → Integrations. Gemini is a text fallback; scene generation uses Hugging Face.</div></div><div className="grid gap-2 md:grid-cols-3">{hfTokens.map((value, index) => <Input type="password" autoComplete="off" aria-label={`Hugging Face token ${index + 1}`} key={index} value={value} onChange={(event) => setHfTokens((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`HF token ${index + 1} · hf_…`} />)}</div><Link to="/settings?tab=integrations" className="mt-3 inline-flex rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Manage AI provider keys</Link></div>}

        {panel && <div className="border-b border-border/70 bg-background/70 p-3">
          {panel === 'assets' && <div className="flex gap-2 overflow-x-auto pb-1">{assets.length === 0 ? <div className="text-xs text-muted-foreground">No generated scenes yet.</div> : assets.map((asset) => { const src = assetUrl(asset.storage_path) || asset.external_url || ''; return <div key={asset.id} className="w-28 shrink-0"><button type="button" onClick={() => src && setLightbox(src)} className="w-full text-left"><div className="h-16 overflow-hidden rounded-lg border border-border bg-muted">{src && <img src={src} alt="" className="h-full w-full object-cover" />}</div><div className="mt-1 truncate text-[10px] text-muted-foreground">{sceneModel(asset)}</div></button><button type="button" disabled={sharingAsset === asset.id} onClick={() => void togglePublic(asset)} className={`mt-1 inline-flex w-full items-center justify-center gap-1 rounded-md border px-1.5 py-1 text-[10px] ${asset.is_public ? 'border-primary/30 bg-accent text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}>{asset.is_public ? <><Globe2 className="h-3 w-3" /> Public</> : <><LockKeyhole className="h-3 w-3" /> Private</>}</button></div> })}</div>}
          {panel === 'sessions' && <div className="flex gap-2 overflow-x-auto pb-1">{sessions.length === 0 ? <div className="text-xs text-muted-foreground">No saved stories yet.</div> : sessions.map((session) => <button key={session.id} type="button" onClick={() => void loadSession(session)} className={`min-w-44 rounded-lg border px-3 py-2 text-left text-xs ${session.id === sessionId ? 'border-primary/50 bg-accent' : 'border-border hover:bg-accent/60'}`}><div className="truncate font-medium">{session.title || 'Untitled story'}</div><div className="mt-1 text-muted-foreground">{session.turn_count} turns</div></button>)}</div>}
          {panel === 'leaderboard' && <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">{leaderboardRows.slice(0, 8).map((row, index) => <div key={row.user_id} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-xs"><span>#{index + 1} {row.display_name || 'Writer'}</span><span className="text-muted-foreground">{row.points}</span></div>)}</div>}
        </div>}

        <div className="min-h-[430px] bg-background" style={{ backgroundImage: `radial-gradient(ellipse at top left, ${STORY_THEMES[storyTheme].glow}, transparent 70%)` }}>
          <div className="max-h-[570px] min-h-[430px] space-y-3 overflow-y-auto p-4 sm:p-5">
            {history.map((item, index) => {
              const attachedScene = item.role === 'gm' ? sceneForHistoryIndex(index) : null
              const attachedSrc = attachedScene ? assetUrl(attachedScene.storage_path) || attachedScene.external_url || '' : ''
              return <div key={`${item.role}-${index}`} className={`flex ${item.role === 'player' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[92%] items-start gap-2 ${item.role === 'player' ? 'flex-row-reverse' : ''}`}>
                  <div className={`rounded-xl px-3.5 py-2.5 text-sm leading-5 ${item.role === 'player' ? 'bg-primary text-primary-foreground' : 'border border-border/65 bg-card/90 shadow-sm'}`}>
                    {paragraphize(item.text).map((paragraph, paragraphIndex) => <p key={paragraphIndex} className={paragraphIndex ? 'mt-2' : ''}>{paragraph}</p>)}
                  </div>
                  {attachedSrc && <button type="button" onClick={() => setLightbox(attachedSrc)} className={`group shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted shadow-sm ${mode === 'comics' ? 'h-24 w-32 sm:h-28 sm:w-40' : 'h-16 w-20 sm:h-20 sm:w-28'}`} title="Open scene"><img src={attachedSrc} alt={`Scene for turn ${sceneTurn(attachedScene!) || ''}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" /></button>}
                </div>
              </div>
            })}
            {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing next beat…</div>}
            {sceneLoading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating art for the latest beat…</div>}
          </div>
        </div>

        <div className="space-y-2 border-t border-border/70 bg-card p-3 sm:p-4">
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div>}
          {imageDailyUsed && !personalHfTokens.length && <div className="rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-[11px] text-muted-foreground">Today’s shared image turn is used. Add a personal Hugging Face token to continue generating artwork.</div>}
          <div className="grid gap-2 sm:grid-cols-3">{choices.map((choice) => { const Icon = choiceIcon(choice); return <Button key={choice} variant="secondary" disabled={loading} onClick={() => void play(choice)} className="h-10 justify-start truncate px-3 text-left text-xs"><Icon className="h-4 w-4 shrink-0" /> {choice}</Button> })}</div>
          <div className="flex gap-2"><input value={action} disabled={loading} onChange={(event) => setAction(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void play() }} placeholder={mode === 'novel' ? 'Write your next move…' : 'Direct the next panel…'} className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><Button disabled={loading || !action.trim()} onClick={() => void play()}><Send className="h-4 w-4" /> Act</Button></div>
        </div>
      </Card>

      <div className="grid gap-2 sm:grid-cols-3"><div className="rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-[11px] text-muted-foreground"><span className="font-medium text-foreground">Novel:</span> writing-first story flow with Markdown export.</div><div className="rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-[11px] text-muted-foreground"><span className="font-medium text-foreground">Comics:</span> larger beat-linked panels with standalone HTML export.</div><div className="rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-[11px] text-muted-foreground"><span className="font-medium text-foreground">Appearance:</span> choose an app theme from the palette button, or inherit your workspace appearance.</div></div>

      {lightbox && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}><button type="button" onClick={() => setLightbox(null)} className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white"><X className="h-5 w-5" /></button><img src={lightbox} alt="Generated story scene" className="max-h-[88vh] max-w-[92vw] rounded-xl object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} /></div>}
    </div>
  )
}

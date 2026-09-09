import React from 'react'
import { BookOpen, GalleryThumbnails, ImagePlus, KeyRound, Loader2, RefreshCcw, Send, Sparkles, Trophy, Users, X } from 'lucide-react'
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
type GameReply = { narrative?: string; choices?: string[]; model?: string; personalKeyUsed?: boolean; provider?: string; degraded?: boolean; error?: string }
type BuilderMode = 'novel' | 'comics'

type SceneReply = {
  imageUrl?: string
  model?: string
  isPublic?: boolean
  error?: string
}

const MODEL = 'huggingface-rotation'

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

const paragraphize = (text: string) => text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)

export function PF_AIDragonArenaStudio() {
  const [mode, setMode] = React.useState<BuilderMode>(() => (localStorage.getItem('dragon-builder-mode') === 'comics' ? 'comics' : 'novel'))
  const [opening, setOpening] = React.useState<OpeningScenario>(() => randomOpening())
  const [history, setHistory] = React.useState<Turn[]>([{ role: 'gm', text: opening.narrative }])
  const [choices, setChoices] = React.useState<string[]>([...opening.choices])
  const [completedTurns, setCompletedTurns] = React.useState<CompletedTurn[]>([])
  const [turn, setTurn] = React.useState(1)
  const [action, setAction] = React.useState('')
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
  const [panel, setPanel] = React.useState<'assets' | 'sessions' | 'leaderboard' | null>(null)
  const [lightbox, setLightbox] = React.useState<string | null>(null)

  const [personalKey, setPersonalKey] = React.useState(() => localStorage.getItem('dragon-arena-openrouter-key') || '')
  const [hfToken, setHfToken] = React.useState(() => localStorage.getItem('dragon-arena-hf-key') || '')
  const [showProviderSettings, setShowProviderSettings] = React.useState(false)

  React.useEffect(() => { localStorage.setItem('dragon-builder-mode', mode) }, [mode])

  const storyScenes = React.useMemo(
    () => assets.filter((asset) => asset.asset_type === 'scene').slice().sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [assets],
  )
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

  React.useEffect(() => {
    let cancelled = false
    const restore = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user || cancelled) return
      const uid = auth.user.id
      setUserId(uid)
      await Promise.all([refreshSessions(uid), refreshPoints(uid)])

      const { data: session } = await supabase
        .from('dragon_arena_sessions')
        .select('*')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!session?.id || cancelled) return
      await loadSession(session as DragonSession, uid)
    }
    void restore()
    return () => { cancelled = true }
  }, [refreshPoints, refreshSessions])

  const loadSession = async (session: DragonSession, uid = userId) => {
    if (!uid) return
    setLoading(true)
    setError('')
    try {
      const sessionOpening = resolveOpening(session.metadata)
      const turns = await listTurns(session.id)
      setOpening(sessionOpening)
      setSessionId(session.id)
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
  }

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
      const { data: created, error: createError } = await supabase
        .from('dragon_arena_sessions')
        .insert({ user_id: uid, title: `${opening.label} story`, summary: nextTurns[0]?.narrative.slice(0, 180) || null, turn_count: nextTurns.length, metadata: { source: 'story-studio', builder_mode: mode, model: MODEL, opening_id: opening.id, opening } })
        .select('id')
        .single()
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
      if (personalKey.startsWith('sk-or-')) headers['x-openrouter-key'] = personalKey
      if (hfToken.startsWith('hf_')) headers['x-hf-token'] = hfToken
      const response = await fetch('/api/ai-game', { method: 'POST', headers, body: JSON.stringify({ turn, action: playerAction, history: pendingHistory.slice(-6), builderMode: mode }) })
      const payload = await response.json().catch(() => ({})) as GameReply
      if (!response.ok) throw new Error(payload.error || 'The story engine is unavailable.')

      const narrative = payload.narrative?.trim() || 'Something shifts in the dark. Your move.'
      const nextChoices = Array.isArray(payload.choices) && payload.choices.length ? payload.choices.slice(0, 3) : [...opening.choices]
      setHistory((current) => [...current, { role: 'gm', text: narrative }])
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
      if (hfToken.startsWith('hf_')) headers['x-hf-token'] = hfToken
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

  const togglePanel = async (next: 'assets' | 'sessions' | 'leaderboard') => {
    const openingPanel = panel !== next
    setPanel(openingPanel ? next : null)
    if (!openingPanel) return
    if (next === 'assets') await refreshAssets(sessionId, userId)
    if (next === 'sessions') await refreshSessions(userId)
    if (next === 'leaderboard') {
      try { setLeaderboardRows(await leaderboard(25)) } catch { /* optional */ }
    }
  }

  const latestSceneSrc = latestScene ? assetUrl(latestScene.storage_path) || latestScene.external_url || '' : ''
  const canGenerate = Boolean(sessionId) && !sceneLoading && (!imageDailyUsed || hfToken.startsWith('hf_'))

  return (
    <div className="mx-auto max-w-6xl space-y-3 pb-10 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-card p-1">
          <button onClick={() => setMode('novel')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${mode === 'novel' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}><BookOpen className="h-4 w-4" /> Novel</button>
          <button onClick={() => setMode('comics')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${mode === 'comics' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}><GalleryThumbnails className="h-4 w-4" /> Comics</button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>Turn {turn}</span>{points && <span>· {points.points} pts</span>}</div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/70 bg-card/90 px-3 py-2">
          <Button size="sm" variant="secondary" onClick={() => void generateScene()} disabled={!canGenerate}><ImagePlus className="h-4 w-4" /> {sceneLoading ? 'Generating…' : 'Generate'}</Button>
          <Button size="sm" variant={panel === 'assets' ? 'default' : 'ghost'} onClick={() => void togglePanel('assets')}><GalleryThumbnails className="h-4 w-4" /> Assets <span className="text-xs opacity-70">{storyScenes.length}</span></Button>
          <Button size="sm" variant={panel === 'sessions' ? 'default' : 'ghost'} onClick={() => void togglePanel('sessions')}><Users className="h-4 w-4" /> Sessions</Button>
          <Button size="sm" variant={panel === 'leaderboard' ? 'default' : 'ghost'} onClick={() => void togglePanel('leaderboard')}><Trophy className="h-4 w-4" /> Leaderboard</Button>
          <div className="ml-auto flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={reset}><RefreshCcw className="h-4 w-4" /> New</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowProviderSettings((value) => !value)}><KeyRound className="h-4 w-4" /></Button>
          </div>
        </div>

        {showProviderSettings && <div className="grid gap-2 border-b border-border/70 bg-background/55 p-3 md:grid-cols-2"><Input value={personalKey} onChange={(event) => setPersonalKey(event.target.value)} onBlur={() => localStorage.setItem('dragon-arena-openrouter-key', personalKey.trim())} placeholder="Optional GM key · sk-or-…" /><Input value={hfToken} onChange={(event) => setHfToken(event.target.value)} onBlur={() => localStorage.setItem('dragon-arena-hf-key', hfToken.trim())} placeholder="Optional Hugging Face token · hf_…" /></div>}

        {panel && <div className="border-b border-border/70 bg-background/70 p-3">
          {panel === 'assets' && <div className="flex gap-2 overflow-x-auto pb-1">{assets.length === 0 ? <div className="text-xs text-muted-foreground">No generated scenes yet.</div> : assets.map((asset) => { const src = assetUrl(asset.storage_path) || asset.external_url || ''; return <button key={asset.id} type="button" onClick={() => src && setLightbox(src)} className="w-24 shrink-0 text-left"><div className="h-16 overflow-hidden rounded-lg border border-border bg-muted">{src && <img src={src} alt="" className="h-full w-full object-cover" />}</div><div className="mt-1 truncate text-[10px] text-muted-foreground">{sceneModel(asset)}</div></button> })}</div>}
          {panel === 'sessions' && <div className="flex gap-2 overflow-x-auto pb-1">{sessions.length === 0 ? <div className="text-xs text-muted-foreground">No saved stories yet.</div> : sessions.map((session) => <button key={session.id} type="button" onClick={() => void loadSession(session)} className={`min-w-44 rounded-lg border px-3 py-2 text-left text-xs ${session.id === sessionId ? 'border-primary/50 bg-accent' : 'border-border hover:bg-accent/60'}`}><div className="truncate font-medium">{session.title || 'Untitled story'}</div><div className="mt-1 text-muted-foreground">{session.turn_count} turns</div></button>)}</div>}
          {panel === 'leaderboard' && <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">{leaderboardRows.slice(0, 8).map((row, index) => <div key={row.user_id} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-xs"><span>#{index + 1} {row.display_name || 'Writer'}</span><span className="text-muted-foreground">{row.points}</span></div>)}</div>}
        </div>}

        <div className={`relative min-h-[430px] overflow-hidden ${mode === 'comics' && latestSceneSrc ? 'bg-card' : 'bg-gradient-to-b from-card via-background/90 to-background'}`}>
          {mode === 'comics' && latestSceneSrc && <button type="button" aria-label="Open latest scene" onClick={() => setLightbox(latestSceneSrc)} className="absolute inset-0 w-full"><img src={latestSceneSrc} alt="" className="h-full w-full object-cover opacity-20" /><div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/75 to-background" /></button>}

          <div className="relative z-10 max-h-[570px] min-h-[430px] space-y-3 overflow-y-auto p-4 sm:p-5">
            {history.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`flex ${item.role === 'player' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-sm leading-5 ${item.role === 'player' ? 'bg-primary text-primary-foreground' : 'border border-border/65 bg-card/90 shadow-sm'}`}>
                  {paragraphize(item.text).map((paragraph, paragraphIndex) => <p key={paragraphIndex} className={paragraphIndex ? 'mt-2' : ''}>{paragraph}</p>)}
                </div>
              </div>
            ))}

            {latestSceneSrc && <div className="flex justify-start pl-1"><button type="button" onClick={() => setLightbox(latestSceneSrc)} className="group relative h-16 w-24 overflow-hidden rounded-lg border border-border/70 bg-muted shadow-sm sm:h-20 sm:w-32"><img src={latestSceneSrc} alt="Latest generated scene" className="h-full w-full object-cover transition-transform group-hover:scale-105" /><span className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-1 text-[9px] text-white">tap to expand</span></button></div>}

            {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing next beat…</div>}
          </div>
        </div>

        <div className="space-y-2 border-t border-border/70 bg-card p-3 sm:p-4">
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div>}
          <div className="grid gap-2 sm:grid-cols-3">{choices.map((choice) => { const Icon = choiceIcon(choice); return <Button key={choice} variant="secondary" disabled={loading} onClick={() => void play(choice)} className="h-10 justify-start truncate px-3 text-left text-xs"><Icon className="h-4 w-4 shrink-0" /> {choice}</Button> })}</div>
          <div className="flex gap-2"><input value={action} disabled={loading} onChange={(event) => setAction(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void play() }} placeholder={mode === 'novel' ? 'Write your next move…' : 'Direct the next panel…'} className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><Button disabled={loading || !action.trim()} onClick={() => void play()}><Send className="h-4 w-4" /> Act</Button></div>
        </div>
      </Card>

      <p className="px-1 text-[11px] leading-5 text-muted-foreground">Novel keeps the writing foregrounded. Comics uses generated art as atmosphere while preserving the same story memory. Both inherit your AppForge Appearance theme.</p>

      {lightbox && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}><button type="button" onClick={() => setLightbox(null)} className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white"><X className="h-5 w-5" /></button><img src={lightbox} alt="Generated story scene" className="max-h-[88vh] max-w-[92vw] rounded-xl object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} /></div>}
    </div>
  )
}

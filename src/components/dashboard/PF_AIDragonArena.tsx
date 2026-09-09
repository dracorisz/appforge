import React from 'react'
import {
  Dices,
  HeartHandshake,
  ImagePlus,
  KeyRound,
  Loader2,
  RefreshCcw,
  Send,
  Shield,
  Sparkles,
  Trophy,
  Users,
  GalleryThumbnails,
} from 'lucide-react'
import { GiRuneSword, GiSpikedShield, GiScrollUnfurled, GiSparkles, GiDungeonGate, GiDragonHead } from 'react-icons/gi'
import { Badge, Button, Card, Input } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { DragonArenaIcon } from './DragonArenaIcon'
import {
  listSessions,
  listTurns,
  listAssets,
  getPoints,
  awardPoints,
  leaderboard,
  assetUrl,
  DEFAULT_OPENING,
  randomOpening,
  type DragonSession,
  type DragonAsset,
  type DragonPoints,
  type LeaderboardRow,
  type OpeningScenario,
} from '@/lib/dragonArena'

type Turn = { role: 'player' | 'gm'; text: string }
type CompletedTurn = { turnNumber: number; playerAction: string; narrative: string; choices: string[]; model: string }
type GameReply = { narrative: string; choices: string[]; model: string; dailyRequestUsed?: boolean; resetAt?: string; personalKeyUsed?: boolean }
type SceneReply = {
  imageUrl: string
  storagePath?: string
  model: string
  sessionId: string
  assetId?: string
  isPublic?: boolean
  generatedAt?: string
  metadata?: Record<string, unknown>
  personalKeyUsed?: boolean
  error?: string
}

const MODEL = 'huggingface-rotation'

const resolveOpening = (metadata: unknown): OpeningScenario => {
  if (metadata && typeof metadata === 'object') {
    const value = (metadata as Record<string, unknown>).opening
    if (value && typeof value === 'object' && 'narrative' in value && 'choices' in value && Array.isArray((value as OpeningScenario).choices)) {
      return value as OpeningScenario
    }
  }
  return DEFAULT_OPENING
}

const choiceIcon = (choice: string) => {
  const lower = choice.toLowerCase()
  if (lower.includes('rune') || lower.includes('blue') || lower.includes('marking')) return GiRuneSword
  if (lower.includes('creature') || lower.includes('call') || lower.includes('dragon')) return GiDragonHead
  if (lower.includes('search') || lower.includes('vault') || lower.includes('entrance')) return GiDungeonGate
  if (lower.includes('retreat') || lower.includes('study')) return GiScrollUnfurled
  if (lower.includes('trace') || lower.includes('listen') || lower.includes('movement')) return GiSparkles
  return GiSpikedShield
}

const sceneModel = (asset: DragonAsset) => {
  const value = asset.metadata?.model
  return typeof value === 'string' && value.trim() ? value : 'Hugging Face model'
}

export function PF_AIDragonArena() {
  const [opening, setOpening] = React.useState<OpeningScenario>(() => randomOpening())
  const [history, setHistory] = React.useState<Turn[]>([{ role: 'gm', text: opening.narrative }])
  const [choices, setChoices] = React.useState<string[]>([...opening.choices])
  const [action, setAction] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [turn, setTurn] = React.useState(1)
  const [completedTurns, setCompletedTurns] = React.useState<CompletedTurn[]>([])
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [dailyUsed, setDailyUsed] = React.useState(false)
  const [sceneLoading, setSceneLoading] = React.useState(false)
  const [imageDailyUsed, setImageDailyUsed] = React.useState(false)
  const [generationStatus, setGenerationStatus] = React.useState('')

  const [personalKey, setPersonalKey] = React.useState(() => localStorage.getItem('dragon-arena-openrouter-key') || '')
  const [showKeySettings, setShowKeySettings] = React.useState(false)
  const [savingKey, setSavingKey] = React.useState(false)

  const [hfToken, setHfToken] = React.useState(() => localStorage.getItem('dragon-arena-hf-key') || '')
  const [showHfSettings, setShowHfSettings] = React.useState(false)
  const [savingHf, setSavingHf] = React.useState(false)

  const [assets, setAssets] = React.useState<DragonAsset[]>([])
  const [loadingAssets, setLoadingAssets] = React.useState(false)
  const [showAssetGallery, setShowAssetGallery] = React.useState(false)

  const [points, setPoints] = React.useState<DragonPoints | null>(null)
  const [leaderboardRows, setLeaderboardRows] = React.useState<LeaderboardRow[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = React.useState(false)
  const [showLeaderboard, setShowLeaderboard] = React.useState(false)

  const [sessions, setSessions] = React.useState<DragonSession[]>([])
  const [loadingSessions, setLoadingSessions] = React.useState(false)
  const [showSessions, setShowSessions] = React.useState(false)
  const [userId, setUserId] = React.useState<string | null>(null)

  const storyScenes = React.useMemo(
    () => assets.filter((asset) => asset.asset_type === 'scene').slice().sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [assets],
  )

  const refreshAssets = React.useCallback(async (sid: string | null, uid: string | null) => {
    if (!sid || !uid) return
    setLoadingAssets(true)
    try { setAssets(await listAssets(uid, { sessionId: sid })) }
    catch (loadError) { console.error('[DragonArena] assets load failed', sid, loadError) }
    finally { setLoadingAssets(false) }
  }, [])

  const refreshPoints = React.useCallback(async (uid: string) => {
    try { setPoints(await getPoints(uid)) } catch { /* ignore */ }
  }, [])

  const refreshLeaderboard = async () => {
    setLoadingLeaderboard(true)
    try { setLeaderboardRows(await leaderboard(25)) } catch { /* ignore */ }
    finally { setLoadingLeaderboard(false) }
  }

  const refreshSessions = React.useCallback(async (uid: string) => {
    setLoadingSessions(true)
    try { setSessions(await listSessions(uid)) } catch { /* ignore */ }
    finally { setLoadingSessions(false) }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    const restoreLatestSession = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user || cancelled) return
      const uid = auth.user.id
      setUserId(uid)

      const { data: session, error: sessionError } = await supabase
        .from('dragon_arena_sessions')
        .select('id,metadata')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (sessionError || !session?.id || cancelled) return

      const restoredOpening = resolveOpening(session.metadata)
      setOpening(restoredOpening)
      setSessionId(session.id)
      await refreshAssets(session.id, uid)
      void refreshPoints(uid)

      const { data: savedTurns, error: turnsError } = await supabase
        .from('dragon_arena_turns')
        .select('turn_number,player_action,narrative,choices,model')
        .eq('session_id', session.id)
        .eq('user_id', uid)
        .order('turn_number', { ascending: true })
      if (turnsError || !savedTurns?.length || cancelled) return

      const restoredHistory: Turn[] = [{ role: 'gm', text: restoredOpening.narrative }]
      const restoredCompleted: CompletedTurn[] = []
      for (const savedTurn of savedTurns) {
        const savedChoices = Array.isArray(savedTurn.choices) ? savedTurn.choices.map(String).filter(Boolean).slice(0, 3) : restoredOpening.choices
        restoredHistory.push({ role: 'player', text: savedTurn.player_action })
        restoredHistory.push({ role: 'gm', text: savedTurn.narrative })
        restoredCompleted.push({ turnNumber: savedTurn.turn_number, playerAction: savedTurn.player_action, narrative: savedTurn.narrative, choices: savedChoices, model: savedTurn.model })
      }
      const latest = restoredCompleted[restoredCompleted.length - 1]
      setHistory(restoredHistory)
      setCompletedTurns(restoredCompleted)
      setChoices(latest.choices)
      setTurn(latest.turnNumber + 1)
    }
    void restoreLatestSession()
    return () => { cancelled = true }
  }, [refreshAssets, refreshPoints])

  const reset = () => {
    const nextOpening = randomOpening()
    setOpening(nextOpening)
    setHistory([{ role: 'gm', text: nextOpening.narrative }])
    setChoices([...nextOpening.choices])
    setAction('')
    setError('')
    setTurn(1)
    setCompletedTurns([])
    setSessionId(null)
    setImageDailyUsed(false)
    setDailyUsed(false)
    setAssets([])
    setGenerationStatus('')
  }

  const savePersonalKey = () => {
    localStorage.setItem('dragon-arena-openrouter-key', personalKey.trim())
    setSavingKey(false)
    setShowKeySettings(false)
  }

  const saveHfKey = () => {
    localStorage.setItem('dragon-arena-hf-key', hfToken.trim())
    setSavingHf(false)
    setShowHfSettings(false)
  }

  const generateScene = async () => {
    if (!sessionId || sceneLoading) return
    setSceneLoading(true)
    setError('')
    setGenerationStatus('Generating with Hugging Face…')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      const uid = sessionData.session?.user.id
      if (!accessToken || !uid) throw new Error('Sign in again to generate a scene.')

      const latestNarrative = completedTurns[completedTurns.length - 1]?.narrative || opening.narrative
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }
      if (hfToken.startsWith('hf_')) headers['x-hf-token'] = hfToken

      const response = await fetch('/api/dragon-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId, prompt: latestNarrative, turnNumber: Math.max(1, completedTurns.length) }),
      })
      const payload = await response.json().catch(() => ({})) as SceneReply
      if (!response.ok) {
        if (response.status === 429) setImageDailyUsed(true)
        throw new Error(payload.error || 'The scene generator is unavailable.')
      }

      setGenerationStatus(payload.isPublic ? 'Scene saved · public showcase' : 'Scene saved to your run')
      await refreshAssets(sessionId, uid)
      await awardPoints(0, 0, 1)
      await refreshPoints(uid)
      window.setTimeout(() => setGenerationStatus(''), 3500)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not generate a scene.')
      setGenerationStatus('')
    } finally {
      setSceneLoading(false)
    }
  }

  const persistMeaningfulSession = async (nextTurns: CompletedTurn[]) => {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) return

    let activeSessionId = sessionId
    if (!activeSessionId) {
      const { data: created, error: createError } = await supabase
        .from('dragon_arena_sessions')
        .insert({
          user_id: uid,
          title: `${opening.label} run`,
          summary: nextTurns[0]?.narrative.slice(0, 240) || null,
          turn_count: nextTurns.length,
          metadata: { source: 'dragon-arena', model: MODEL, opening_id: opening.id, opening },
        })
        .select('id')
        .single()
      if (createError || !created?.id) throw createError || new Error('Could not create Dragon Arena session.')
      activeSessionId = created.id
      setSessionId(activeSessionId)

      const rows = nextTurns.map((item) => ({
        session_id: activeSessionId,
        user_id: uid,
        turn_number: item.turnNumber,
        player_action: item.playerAction,
        narrative: item.narrative,
        choices: item.choices,
        model: item.model,
      }))
      const { error: turnError } = await supabase.from('dragon_arena_turns').insert(rows)
      if (turnError) throw turnError
      void refreshSessions(uid)
      return
    }

    const latest = nextTurns[nextTurns.length - 1]
    const { error: turnError } = await supabase.from('dragon_arena_turns').insert({
      session_id: activeSessionId,
      user_id: uid,
      turn_number: latest.turnNumber,
      player_action: latest.playerAction,
      narrative: latest.narrative,
      choices: latest.choices,
      model: latest.model,
    })
    if (turnError) throw turnError

    await supabase.from('dragon_arena_sessions').update({ turn_count: nextTurns.length, updated_at: new Date().toISOString() }).eq('id', activeSessionId)
    void refreshSessions(uid)
  }

  const play = async (selected?: string) => {
    const playerAction = (selected || action).trim()
    if (!playerAction || loading) return
    setLoading(true)
    setError('')
    setAction('')
    const nextHistory: Turn[] = [...history, { role: 'player', text: playerAction }]
    setHistory(nextHistory)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Sign in again to use Dragon Arena.')
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }
      if (personalKey.startsWith('sk-or-')) headers['x-openrouter-key'] = personalKey
      if (hfToken.startsWith('hf_')) headers['x-hf-token'] = hfToken

      const response = await fetch('/api/ai-game', {
        method: 'POST',
        headers,
        body: JSON.stringify({ turn, action: playerAction, history: nextHistory.slice(-10) }),
      })
      const payload = await response.json().catch(() => ({})) as Partial<GameReply> & { error?: string }
      if (!response.ok) {
        if (response.status === 429 && !payload.personalKeyUsed) setDailyUsed(true)
        throw new Error(payload.error || 'The AI game master is unavailable.')
      }

      const narrative = payload.narrative?.trim() || 'The vault shifts around you. Choose your next move.'
      const nextChoices = Array.isArray(payload.choices) && payload.choices.length ? payload.choices.slice(0, 3) : opening.choices
      setHistory((current) => [...current, { role: 'gm', text: narrative }])
      setChoices(nextChoices)
      setTurn((value) => value + 1)
      setDailyUsed(Boolean(payload.dailyRequestUsed && !payload.personalKeyUsed))

      const nextCompleted = [...completedTurns, { turnNumber: turn, playerAction, narrative, choices: nextChoices, model: payload.model || MODEL }]
      setCompletedTurns(nextCompleted)
      void persistMeaningfulSession(nextCompleted).catch((logError) => console.error('Dragon Arena session logging failed', logError))

      const uid = sessionData.session?.user.id
      if (uid) void awardPoints(10, 1, 0).then(() => refreshPoints(uid)).catch(() => undefined)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not continue the game.')
      setHistory(history)
    } finally {
      setLoading(false)
    }
  }

  const switchSession = async (session: DragonSession) => {
    setError('')
    setLoading(true)
    try {
      const uid = userId
      if (!uid) return
      const turns = await listTurns(session.id)
      const sessionOpening = resolveOpening(session.metadata)
      setOpening(sessionOpening)
      setSessionId(session.id)
      await refreshAssets(session.id, uid)

      if (!turns.length) {
        setHistory([{ role: 'gm', text: sessionOpening.narrative }])
        setChoices([...sessionOpening.choices])
        setCompletedTurns([])
        setTurn(1)
        return
      }

      const restoredHistory: Turn[] = [{ role: 'gm', text: sessionOpening.narrative }]
      const restoredCompleted: CompletedTurn[] = []
      for (const savedTurn of turns) {
        const savedChoices = Array.isArray(savedTurn.choices) ? savedTurn.choices.map(String).filter(Boolean).slice(0, 3) : sessionOpening.choices
        restoredHistory.push({ role: 'player', text: savedTurn.player_action })
        restoredHistory.push({ role: 'gm', text: savedTurn.narrative })
        restoredCompleted.push({ turnNumber: savedTurn.turn_number, playerAction: savedTurn.player_action, narrative: savedTurn.narrative, choices: savedChoices, model: savedTurn.model })
      }
      const latest = restoredCompleted[restoredCompleted.length - 1]
      setHistory(restoredHistory)
      setCompletedTurns(restoredCompleted)
      setChoices(latest.choices)
      setTurn(latest.turnNumber + 1)
      setDailyUsed(false)
      setImageDailyUsed(false)
    } catch (switchError) {
      setError(switchError instanceof Error ? switchError.message : 'Could not load session.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewRun = () => {
    reset()
    if (userId) void refreshSessions(userId)
  }

  const usingPersonalKey = personalKey.startsWith('sk-or-')
  const usingPersonalHfToken = hfToken.startsWith('hf_')
  const canPlay = !loading && (!dailyUsed || usingPersonalKey)
  const canGenerateScene = !sceneLoading && (!imageDailyUsed || usingPersonalHfToken)

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10 text-foreground">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card">
        <img src="/Dragon Arena.png" alt="Dragon Arena" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/55 to-background/25" />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge color="green">AI game</Badge>
              <Badge color="purple">Hugging Face</Badge>
              {usingPersonalKey && <Badge color="blue">Personal GM key</Badge>}
              {usingPersonalHfToken && <Badge color="blue">Personal HF token</Badge>}
            </div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><DragonArenaIcon className="h-7 w-7" /> Dragon Arena</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">A persistent rune-lit adventure. Hugging Face powers the shared game master and generated scenes; your AppForge appearance settings style the game surface.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleNewRun}><RefreshCcw className="h-4 w-4" /> New run</Button>
            <Button variant="ghost" onClick={() => setShowKeySettings((value) => !value)}><KeyRound className="h-4 w-4" /> GM key</Button>
            <Button variant="ghost" onClick={() => setShowHfSettings((value) => !value)}><ImagePlus className="h-4 w-4" /> HF token</Button>
            <a href="https://paypal.me/dracorisz" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/45 px-3 py-2 text-sm font-medium hover:bg-accent"><HeartHandshake className="h-4 w-4" /> Support</a>
          </div>
        </div>
      </div>

      {showKeySettings && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="h-4 w-4" /> Personal OpenRouter GM key</div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Optional compatibility path for game-master turns only. Stored in your browser and sent only with the active GM request.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input value={personalKey} onChange={(event) => setPersonalKey(event.target.value)} placeholder="sk-or-..." className="sm:flex-1" /><Button onClick={savePersonalKey} disabled={savingKey || !personalKey.startsWith('sk-or-')}>{savingKey ? 'Saving…' : 'Save key'}</Button>{personalKey && <Button variant="destructive" onClick={() => { setPersonalKey(''); localStorage.removeItem('dragon-arena-openrouter-key') }}>Clear</Button>}</div>
        </Card>
      )}

      {showHfSettings && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><ImagePlus className="h-4 w-4" /> Personal Hugging Face token</div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Used for Hugging Face scene generation and shared-model compatibility. A personal HF token bypasses the owner-funded image allowance.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input value={hfToken} onChange={(event) => setHfToken(event.target.value)} placeholder="hf_..." className="sm:flex-1" /><Button onClick={saveHfKey} disabled={savingHf || !hfToken.startsWith('hf_')}>{savingHf ? 'Saving…' : 'Save token'}</Button>{hfToken && <Button variant="destructive" onClick={() => { setHfToken(''); localStorage.removeItem('dragon-arena-hf-key') }}>Clear</Button>}</div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_300px]">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border/70 bg-card/80 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium"><DragonArenaIcon className="h-4 w-4" /> Story</div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground"><span>Turn {turn}</span>{points && <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" />{points.points} pts</span>}</div>
          </div>

          <div className="max-h-[650px] min-h-[420px] space-y-4 overflow-y-auto bg-gradient-to-b from-card via-background/80 to-background p-4">
            {history.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`flex ${item.role === 'player' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${item.role === 'player' ? 'bg-primary text-primary-foreground' : 'border border-border/70 bg-card/90 text-card-foreground'}`}>{item.text}</div>
              </div>
            ))}

            {storyScenes.map((asset) => {
              const src = assetUrl(asset.storage_path) || asset.external_url || ''
              return (
                <figure key={asset.id} className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                  {src && <img src={src} alt={asset.title || 'Generated Dragon Arena scene'} className="max-h-[560px] w-full object-cover" />}
                  <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground/80">{asset.title || 'Generated scene'}</span>
                    <span>{sceneModel(asset)} · {new Date(asset.created_at).toLocaleString()}</span>
                    {asset.is_public && <Badge color="green">Public showcase</Badge>}
                  </figcaption>
                </figure>
              )
            })}

            {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> The Game Master is deciding what happens next…</div>}
            {sceneLoading && <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 py-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Creating the next visual story beat with Hugging Face…</div>}
          </div>

          <div className="space-y-3 border-t border-border/70 bg-card/65 p-4">
            {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}
            {generationStatus && <div className="rounded-lg border border-border/70 bg-accent/40 px-3 py-2 text-xs text-muted-foreground">{generationStatus}</div>}
            {dailyUsed && !usingPersonalKey && <div className="rounded-lg border border-border/70 bg-background/55 px-3 py-2 text-sm text-muted-foreground">Today’s owner-funded GM turn has been used. Add a personal GM key or return after 00:00 UTC.</div>}
            <div className="grid gap-2 sm:grid-cols-3">{choices.map((choice) => { const Icon = choiceIcon(choice); return <Button key={choice} variant="secondary" disabled={!canPlay} onClick={() => void play(choice)} className="h-auto min-h-10 whitespace-normal text-left"><Icon className="h-4 w-4" /> {choice}</Button> })}</div>
            <div className="flex gap-2"><input value={action} disabled={!canPlay} onChange={(event) => setAction(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void play() }} placeholder={dailyUsed && !usingPersonalKey ? 'Add a personal GM key or wait for tomorrow…' : 'Or type your own action…'} className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" /><Button disabled={!canPlay || !action.trim()} onClick={() => void play()}><Send className="h-4 w-4" /> Act</Button></div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-sm font-semibold"><ImagePlus className="h-4 w-4" /> Generate scene</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Creates a visual story beat and saves it directly to this run’s asset ledger.</p></div></div>
            <Button className="mt-3 w-full" variant="secondary" onClick={() => void generateScene()} disabled={!sessionId || !canGenerateScene}><ImagePlus className="h-4 w-4" />{sceneLoading ? 'Generating…' : imageDailyUsed && !usingPersonalHfToken ? 'Used today' : 'Generate scene'}</Button>
            {!sessionId && <p className="mt-2 text-[11px] text-muted-foreground">Play one turn first so the scene has a saved run.</p>}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-semibold"><GalleryThumbnails className="h-4 w-4" /> Assets</div><Button variant="ghost" size="sm" onClick={() => { setShowAssetGallery((value) => !value); if (!showAssetGallery && sessionId && userId) void refreshAssets(sessionId, userId) }}>{showAssetGallery ? 'Hide' : 'Show'}</Button></div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{storyScenes.length} generated scene{storyScenes.length === 1 ? '' : 's'} in this run.</p>
            {showAssetGallery && <div className="mt-3 space-y-2">{loadingAssets && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading assets…</div>}{!loadingAssets && !assets.length && <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">No assets yet.</div>}{assets.map((asset) => { const imageSrc = assetUrl(asset.storage_path) || asset.external_url || ''; return <div key={asset.id} className="flex gap-2 rounded-xl border border-border/70 bg-background/40 p-2">{imageSrc && <img src={imageSrc} alt="" className="h-14 w-14 rounded-lg object-cover" />}<div className="min-w-0 text-xs"><div className="truncate font-medium">{asset.title || asset.asset_type}</div><div className="truncate text-muted-foreground">{sceneModel(asset)}</div></div></div> })}</div>}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-semibold"><Trophy className="h-4 w-4" /> Leaderboard</div><Button variant="ghost" size="sm" onClick={() => { setShowLeaderboard((value) => !value); if (!showLeaderboard) void refreshLeaderboard() }}>{showLeaderboard ? 'Hide' : 'Show'}</Button></div>
            {showLeaderboard && <div className="mt-3 space-y-1">{loadingLeaderboard && <div className="text-xs text-muted-foreground">Loading…</div>}{leaderboardRows.map((row, index) => <div key={row.user_id} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs"><span>#{index + 1} {row.display_name || 'Adventurer'}</span><span className="text-muted-foreground">{row.points} pts</span></div>)}</div>}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" /> Sessions</div><Button variant="ghost" size="sm" onClick={() => { setShowSessions((value) => !value); if (!showSessions && userId) void refreshSessions(userId) }}>{showSessions ? 'Hide' : 'Show'}</Button></div>
            {showSessions && <div className="mt-3 space-y-1">{loadingSessions && <div className="text-xs text-muted-foreground">Loading…</div>}{sessions.map((session) => <button key={session.id} onClick={() => void switchSession(session)} className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${session.id === sessionId ? 'border-primary/40 bg-accent' : 'border-border/60 hover:bg-accent/60'}`}><div className="flex items-center justify-between"><span className="truncate font-medium">{session.title || 'Untitled run'}</span><span className="text-muted-foreground">{session.turn_count}</span></div><div className="mt-1 text-muted-foreground">{new Date(session.updated_at).toLocaleString()}</div></button>)}</div>}
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><div className="flex items-center gap-2 text-sm font-semibold"><Shield className="h-4 w-4" /> Account-scoped</div><p className="mt-2 text-xs leading-5 text-muted-foreground">Signed-in sessions, turns and assets are scoped by Supabase RLS. Shared provider tokens stay server-side.</p></Card>
        <Card><div className="flex items-center gap-2 text-sm font-semibold"><Dices className="h-4 w-4" /> Story memory</div><p className="mt-2 text-xs leading-5 text-muted-foreground">Turns restore after refresh and generated scenes now restore inside the story surface from the asset ledger.</p></Card>
        <Card><div className="flex items-center gap-2 text-sm font-semibold"><Trophy className="h-4 w-4" /> Showcase</div><p className="mt-2 text-xs leading-5 text-muted-foreground">The first three generated scenes per user are public showcase assets; later scenes remain owner-only by default.</p></Card>
      </div>
    </div>
  )
}

import React from 'react'
import {
  Bot,
  Dices,
  HeartHandshake,
  ImagePlus,
  KeyRound,
  Loader2,
  RefreshCcw,
  Send,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
  GalleryThumbnails,
} from 'lucide-react'
import { GiRuneSword, GiSpikedShield, GiScrollUnfurled, GiHealthPotion, GiFireball, GiSparkles, GiDungeonGate, GiDragonHead, GiChest, GiNecklace } from 'react-icons/gi'
import { Badge, Button, Card, Input } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  listSessions,
  createSession,
  appendTurn,
  listTurns,
  listAssets,
  saveAsset,
  getPoints,
  awardPoints,
  leaderboard,
  assetUrl,
  type DragonSession,
  type DragonAsset,
  type DragonPoints,
  type LeaderboardRow,
} from '@/lib/dragonArena'

type Turn = { role: 'player' | 'gm'; text: string }
type CompletedTurn = { turnNumber: number; playerAction: string; narrative: string; choices: string[]; model: string }
type GameReply = { narrative: string; choices: string[]; model: string; dailyRequestUsed?: boolean; resetAt?: string; personalKeyUsed?: boolean }
type SceneReply = { imageUrl: string; storagePath?: string; model: string; sessionId: string; personalKeyUsed?: boolean; error?: string }

const MODEL = 'openrouter/free'
const OPENING = 'You enter the Ember Vault beneath WildDragons Keep. Three rune-lit passages split ahead while something enormous breathes in the dark.'
const OPENING_CHOICES = ['Follow the blue runes', 'Call out to the creature', 'Search the vault entrance']

const choiceIcon = (choice: string) => {
  const lower = choice.toLowerCase()
  if (lower.includes('rune') || lower.includes('blue') || lower.includes('marking')) return GiRuneSword
  if (lower.includes('creature') || lower.includes('call') || lower.includes('dragon')) return GiDragonHead
  if (lower.includes('search') || lower.includes('vault') || lower.includes('entrance')) return GiDungeonGate
  if (lower.includes('retreat') || lower.includes('study')) return GiScrollUnfurled
  if (lower.includes('trace') || lower.includes('listen') || lower.includes('movement')) return GiSparkles
  return GiSpikedShield
}

export function PF_AIDragonArena() {
  const [history, setHistory] = React.useState<Turn[]>([{ role: 'gm', text: OPENING }])
  const [choices, setChoices] = React.useState<string[]>(OPENING_CHOICES)
  const [action, setAction] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [turn, setTurn] = React.useState(1)
  const [completedTurns, setCompletedTurns] = React.useState<CompletedTurn[]>([])
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const [dailyUsed, setDailyUsed] = React.useState(false)
  const [scene, setScene] = React.useState<string | null>(null)
  const [sceneLoading, setSceneLoading] = React.useState(false)
  const [imageDailyUsed, setImageDailyUsed] = React.useState(false)
  const [generationStatus, setGenerationStatus] = React.useState<string>('')

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
  const [loadingPoints, setLoadingPoints] = React.useState(false)

  const [leaderboardRows, setLeaderboardRows] = React.useState<LeaderboardRow[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = React.useState(false)
  const [showLeaderboard, setShowLeaderboard] = React.useState(false)

  const [sessions, setSessions] = React.useState<DragonSession[]>([])
  const [loadingSessions, setLoadingSessions] = React.useState(false)
  const [showSessions, setShowSessions] = React.useState(false)

  const [userId, setUserId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    const restoreLatestSession = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      const uid = auth.user.id
      setUserId(uid)

      const { data: session, error: sessionError } = await supabase
        .from('dragon_arena_sessions')
        .select('id')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (sessionError || !session?.id || cancelled) return

      const { data: savedTurns, error: turnsError } = await supabase
        .from('dragon_arena_turns')
        .select('turn_number,player_action,narrative,choices,model')
        .eq('session_id', session.id)
        .eq('user_id', uid)
        .order('turn_number', { ascending: true })
      if (turnsError || !savedTurns?.length || cancelled) return

      const restoredHistory: Turn[] = [{ role: 'gm', text: OPENING }]
      const restoredCompleted: CompletedTurn[] = []
      for (const savedTurn of savedTurns) {
        const savedChoices = Array.isArray(savedTurn.choices) ? savedTurn.choices.map(String).filter(Boolean).slice(0, 3) : OPENING_CHOICES
        restoredHistory.push({ role: 'player', text: savedTurn.player_action })
        restoredHistory.push({ role: 'gm', text: savedTurn.narrative })
        restoredCompleted.push({
          turnNumber: savedTurn.turn_number,
          playerAction: savedTurn.player_action,
          narrative: savedTurn.narrative,
          choices: savedChoices,
          model: savedTurn.model,
        })
      }
      const latest = restoredCompleted[restoredCompleted.length - 1]
      setSessionId(session.id)
      setHistory(restoredHistory)
      setCompletedTurns(restoredCompleted)
      setChoices(latest.choices)
      setTurn(latest.turnNumber + 1)
      void refreshAssets(session.id, uid)
      void refreshPoints(uid)
    }
    void restoreLatestSession()
    return () => { cancelled = true }
  }, [])

  const refreshAssets = async (sid: string | null, uid: string | null) => {
    if (!sid || !uid) return
    setLoadingAssets(true)
    try {
      const rows = await listAssets(uid, { sessionId: sid })
      console.log('[DragonArena] assets loaded', sid, rows.length, rows.map(r => ({ id: r.id, storage_path: r.storage_path, external_url: r.external_url, asset_type: r.asset_type })))
      setAssets(rows)
    } catch (e) {
      console.error('[DragonArena] assets load failed', sid, e)
    }
    finally { setLoadingAssets(false) }
  }

  const refreshPoints = async (uid: string) => {
    setLoadingPoints(true)
    try { setPoints(await getPoints(uid)) }
    catch { /* ignore */ }
    finally { setLoadingPoints(false) }
  }

  const refreshLeaderboard = async () => {
    setLoadingLeaderboard(true)
    try { setLeaderboardRows(await leaderboard(25)) }
    catch { /* ignore */ }
    finally { setLoadingLeaderboard(false) }
  }

  const refreshSessions = async (uid: string) => {
    setLoadingSessions(true)
    try { setSessions(await listSessions(uid)) }
    catch { /* ignore */ }
    finally { setLoadingSessions(false) }
  }

  const reset = () => {
    setHistory([{ role: 'gm', text: OPENING }])
    setChoices(OPENING_CHOICES)
    setAction('')
    setError('')
    setTurn(1)
    setCompletedTurns([])
    setSessionId(null)
    setScene(null)
    setImageDailyUsed(false)
    setDailyUsed(false)
    setAssets([])
    setGenerationStatus('')
  }

  const savePersonalKey = () => {
    const trimmed = personalKey.trim()
    localStorage.setItem('dragon-arena-openrouter-key', trimmed)
    setSavingKey(false)
    setShowKeySettings(false)
  }

  const saveHfKey = () => {
    const trimmed = hfToken.trim()
    localStorage.setItem('dragon-arena-hf-key', trimmed)
    setSavingHf(false)
    setShowHfSettings(false)
  }

  const generateScene = async () => {
    if (!sessionId || sceneLoading || imageDailyUsed) return
    setSceneLoading(true)
    setError('')
    setGenerationStatus('Starting scene generation...')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Sign in again to generate a scene.')
      const latestNarrative = completedTurns[completedTurns.length - 1]?.narrative || OPENING
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }
      if (personalKey.startsWith('sk-or-')) headers['x-openrouter-key'] = personalKey
      if (hfToken.startsWith('hf_')) headers['x-hf-token'] = hfToken
      setGenerationStatus('Requesting scene from AI...')
      const response = await fetch('/api/dragon-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId, prompt: latestNarrative }),
      })
      const payload = await response.json().catch(() => ({})) as SceneReply
      if (!response.ok) {
        if (response.status === 429) setImageDailyUsed(true)
        throw new Error(payload.error || 'The scene generator is unavailable.')
      }
      setGenerationStatus('Saving scene to your gallery...')
      setScene(payload.imageUrl)
      const uid = sessionData.session?.user.id
      if (uid) {
        await saveAsset({
          userId: uid,
          sessionId,
          assetType: 'scene',
          storagePath: payload.storagePath || null,
          externalUrl: payload.imageUrl,
          prompt: latestNarrative,
          title: `Scene turn ${completedTurns.length + 1}`,
          metadata: { model: payload.model, personalKeyUsed: payload.personalKeyUsed },
        })
        await refreshAssets(sessionId, uid)
        await awardPoints(0, 0, 1)
        await refreshPoints(uid)
      }
      setGenerationStatus('Scene generated successfully!')
      window.setTimeout(() => setGenerationStatus(''), 3000)
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
          title: 'Ember Vault run',
          summary: nextTurns[0]?.narrative.slice(0, 240) || null,
          turn_count: nextTurns.length,
          metadata: { source: 'dragon-arena', model: MODEL },
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

    await supabase
      .from('dragon_arena_sessions')
      .update({ turn_count: nextTurns.length, updated_at: new Date().toISOString() })
      .eq('id', activeSessionId)

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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      }
      if (personalKey.startsWith('sk-or-')) headers['x-openrouter-key'] = personalKey

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
      const nextChoices = Array.isArray(payload.choices) && payload.choices.length ? payload.choices.slice(0, 3) : OPENING_CHOICES
      setHistory((current) => [...current, { role: 'gm', text: narrative }])
      setChoices(nextChoices)
      setTurn((value) => value + 1)
      setDailyUsed(Boolean(payload.dailyRequestUsed && !payload.personalKeyUsed))

      const nextCompleted = [...completedTurns, {
        turnNumber: turn,
        playerAction,
        narrative,
        choices: nextChoices,
        model: payload.model || MODEL,
      }]
      setCompletedTurns(nextCompleted)
      void persistMeaningfulSession(nextCompleted).catch((logError) => console.error('Dragon Arena session logging failed', logError))

      const uid = sessionData.session?.user.id
      if (uid) {
        void awardPoints(10, 1, 0).then(() => refreshPoints(uid)).catch(() => {})
      }
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
      if (!turns.length) {
        reset()
        setSessionId(session.id)
        return
      }
      const restoredHistory: Turn[] = [{ role: 'gm', text: OPENING }]
      const restoredCompleted: CompletedTurn[] = []
      for (const t of turns) {
        const savedChoices = Array.isArray(t.choices) ? t.choices.map(String).filter(Boolean).slice(0, 3) : OPENING_CHOICES
        restoredHistory.push({ role: 'player', text: t.player_action })
        restoredHistory.push({ role: 'gm', text: t.narrative })
        restoredCompleted.push({
          turnNumber: t.turn_number,
          playerAction: t.player_action,
          narrative: t.narrative,
          choices: savedChoices,
          model: t.model,
        })
      }
      const latest = restoredCompleted[restoredCompleted.length - 1]
      setSessionId(session.id)
      setHistory(restoredHistory)
      setCompletedTurns(restoredCompleted)
      setChoices(latest.choices)
      setTurn(latest.turnNumber + 1)
      setDailyUsed(false)
      setScene(null)
      setImageDailyUsed(false)
      await refreshAssets(session.id, uid)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load session.')
    }
    finally { setLoading(false) }
  }

  const handleNewRun = async () => {
    reset()
    if (userId) void refreshSessions(userId)
  }

  const usingPersonalKey = personalKey.startsWith('sk-or-')
  const canPlay = !loading && (!dailyUsed || usingPersonalKey)
  const canGenerateScene = !sceneLoading && (!imageDailyUsed || usingPersonalKey)

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <div className="relative overflow-hidden rounded-2xl border border-border/70">
        <img src="/Dragon Arena.png" alt="Dragon Arena" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between p-5">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge color="green">AI game</Badge>
              {usingPersonalKey && <Badge color="blue">Personal key active</Badge>}
              <span className="text-xs text-white/80">WildDragons.ai · OpenRouter free tier</span>
            </div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white"><Swords className="h-6 w-6" /> Dragon Arena</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-white/90">Persistent rune-lit adventure tied to your AppForge account. Use the daily owner-funded turn, or add a personal OpenRouter key for unlimited play. Generated scenes become assets in your gallery.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleNewRun}><RefreshCcw className="h-4 w-4" /> New run</Button>
            <Button variant="ghost" onClick={() => setShowKeySettings((v) => !v)}><KeyRound className="h-4 w-4" />{showKeySettings ? 'Hide key' : 'Personal key'}</Button>
            <Button variant="ghost" onClick={() => setShowHfSettings((v) => !v)}><ImagePlus className="h-4 w-4" />{showHfSettings ? 'Hide HF' : 'HF token'}</Button>
            <a href="https://www.paypal.com/paypalme/dracorisz" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium hover:bg-accent"><HeartHandshake className="h-4 w-4" /> Support</a>
            <span className="text-xs text-white/70">Earn points by playing. Support keeps development going.</span>
          </div>
        </div>
      </div>

      {showKeySettings && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="h-4 w-4" /> OpenRouter personal key</div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Stored in your browser only. When provided, Dragon Arena bypasses the daily owner-funded quota for both AI turns and scene generation. The key is sent directly to OpenRouter from our server and is not logged.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input value={personalKey} onChange={(e) => setPersonalKey(e.target.value)} placeholder="sk-or-..." className="sm:flex-1" />
            <Button onClick={() => { savePersonalKey() }} disabled={savingKey || !personalKey.startsWith('sk-or-')}>{savingKey ? 'Saving…' : 'Save key'}</Button>
            {personalKey && <Button variant="destructive" onClick={() => { setPersonalKey(''); localStorage.removeItem('dragon-arena-openrouter-key') }}>Clear</Button>}
          </div>
        </Card>
      )}

      {showHfSettings && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><ImagePlus className="h-4 w-4" /> Hugging Face personal token</div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Stored in your browser only. When provided, Dragon Arena uses your HF token for scene generation via the HF Inference API. Server-side HF tokens rotate automatically when you don’t provide one.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input value={hfToken} onChange={(e) => setHfToken(e.target.value)} placeholder="hf_..." className="sm:flex-1" />
            <Button onClick={() => { saveHfKey() }} disabled={savingHf || !hfToken.startsWith('hf_')}>{savingHf ? 'Saving…' : 'Save token'}</Button>
            {hfToken && <Button variant="destructive" onClick={() => { setHfToken(''); localStorage.removeItem('dragon-arena-hf-key') }}>Clear</Button>}
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_280px]">
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-border/70 px-4 py-3 flex items-center justify-between bg-gradient-to-r from-background/80 to-background/40">
            <div className="flex items-center gap-2 text-sm font-medium"><GiSparkles className="h-4 w-4" /> AI Game Master</div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Turn {turn}</span>
              {points && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Sparkles className="h-3.5 w-3.5" />{points.points} pts</span>}
            </div>
          </div>
          <div className="max-h-[520px] min-h-[360px] space-y-3 overflow-y-auto p-4 bg-gradient-to-b from-background/60 to-background/20">
            {history.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`flex ${item.role === 'player' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === 'player' ? 'bg-foreground text-background' : 'border border-border/70 bg-background/55 text-foreground'}`}>
                  {item.text}
                </div>
              </div>
            ))}
            {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> The Game Master is deciding what happens next…</div>}
          </div>
          <div className="border-t border-border/70 p-4 space-y-3 bg-background/40">
            {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}
            {dailyUsed && !usingPersonalKey && <div className="rounded-lg border border-border/70 bg-background/45 px-3 py-2 text-sm text-muted-foreground">Today’s owner-funded AI turn has been used. Add a personal OpenRouter key for unlimited play, or wait for 00:00 UTC.</div>}
            <div className="grid gap-2 sm:grid-cols-3">
              {choices.map((choice) => { const Icon = choiceIcon(choice); return <Button key={choice} variant="secondary" disabled={!canPlay} onClick={() => void play(choice)} className="h-auto min-h-10 whitespace-normal text-left"><Icon className="h-4 w-4" /> {choice}</Button> })}
            </div>
            <div className="flex gap-2">
              <input value={action} disabled={!canPlay} onChange={(event) => setAction(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void play() }} placeholder={dailyUsed && !usingPersonalKey ? 'Add a personal key or wait for tomorrow…' : 'Or type your own action…'} className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
              <Button disabled={!canPlay || !action.trim()} onClick={() => void play()}><Send className="h-4 w-4" /> Act</Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="flex items-center gap-2 text-sm font-semibold"><ImagePlus className="h-4 w-4" /> Scene generator</h2><p className="mt-1 text-xs text-muted-foreground">One image turn per day unless you use a personal key. Images are saved to this run's asset ledger.</p></div>
              <Button variant="secondary" onClick={() => void generateScene()} disabled={!sessionId || !canGenerateScene}><ImagePlus className="h-4 w-4" />{sceneLoading ? 'Generating…' : imageDailyUsed && !usingPersonalKey ? 'Used today' : 'Generate scene'}</Button>
            </div>
            {scene && <img src={scene} alt="Generated Dragon Arena scene" className="mt-4 max-h-[520px] w-full rounded-xl border border-border/70 object-cover" />}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold"><GalleryThumbnails className="h-4 w-4" /> Asset gallery</div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setShowAssetGallery((v) => !v); if (!showAssetGallery && sessionId && userId) void refreshAssets(sessionId, userId) }}>{showAssetGallery ? 'Hide' : 'Show'}</Button>
              </div>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Generated scenes and saved assets for this run. Public assets can appear on the leaderboard.</p>
            {showAssetGallery && (
              <div className="mt-3">
                {loadingAssets && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading assets…</div>}
                {!loadingAssets && !assets.length && <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">No assets yet. Generate a scene to start your gallery.</div>}
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {assets.map((asset) => {
                    const imageSrc = assetUrl(asset.storage_path) || asset.external_url || ''
                    return (
                      <div key={asset.id} className="overflow-hidden rounded-xl border border-border/70 bg-background/40">
                        {imageSrc ? <img src={imageSrc} alt={asset.title || 'Dragon Arena asset'} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center text-xs text-muted-foreground">No preview</div>}
                        <div className="p-2 text-xs text-muted-foreground">{asset.title || asset.asset_type}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold"><Trophy className="h-4 w-4" /> Leaderboard</div>
              <Button variant="ghost" size="sm" onClick={() => { setShowLeaderboard((v) => !v); if (!showLeaderboard) void refreshLeaderboard() }}>{showLeaderboard ? 'Hide' : 'Show'}</Button>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Public rankings by points earned from turns and scenes. Only public profiles are shown.</p>
            {showLeaderboard && (
              <div className="mt-3 space-y-1">
                {loadingLeaderboard && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading leaderboard…</div>}
                {!loadingLeaderboard && leaderboardRows.length === 0 && <div className="text-xs text-muted-foreground">No public adventurers yet.</div>}
                {leaderboardRows.map((row, index) => (
                  <div key={row.user_id} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">#{index + 1}</span>
                      <div className="min-w-0 truncate">{row.display_name || 'AppForge adventurer'}</div>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground"><Sparkles className="h-3 w-3" />{row.points}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" /> Sessions</div>
              <Button variant="ghost" size="sm" onClick={() => { setShowSessions((v) => !v); if (!showSessions && userId) void refreshSessions(userId) }}>{showSessions ? 'Hide' : 'Show'}</Button>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Your saved runs. Switch sessions to continue an older adventure.</p>
            {showSessions && (
              <div className="mt-3 space-y-1">
                {loadingSessions && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading sessions…</div>}
                {!loadingSessions && !sessions.length && <div className="text-xs text-muted-foreground">No saved sessions yet.</div>}
                {sessions.map((session) => (
                  <button key={session.id} onClick={() => void switchSession(session)} className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${session.id === sessionId ? 'border-foreground/25 bg-accent' : 'border-border/60 hover:bg-accent/60'}`}>
                    <div className="flex items-center justify-between">
                      <div className="truncate font-medium">{session.title || 'Untitled run'}</div>
                      <div className="text-muted-foreground">{session.turn_count} turns</div>
                    </div>
                    <div className="mt-1 text-muted-foreground">{new Date(session.updated_at).toLocaleString()}</div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2 text-sm font-semibold"><Shield className="h-4 w-4" /> Server-side key + session</div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">OPENROUTER_API_KEY stays in Vercel. Every request also requires a valid Supabase access token; quota is enforced against the authenticated user ID.</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-sm font-semibold"><Dices className="h-4 w-4" /> Smart story logs</div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Every successful turn is saved immediately, restored after refresh, and included in the next live context. Generated scenes have a dedicated asset ledger.</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-sm font-semibold"><Trophy className="h-4 w-4" /> Points & leaderboard</div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Earn points for turns and scenes. Public profiles can appear on the shared leaderboard. Your assets stay scoped to your runs until you choose to share.</p>
        </Card>
      </div>
    </div>
  )
}

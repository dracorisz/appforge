import React from 'react'
import { Bot, Dices, ImagePlus, Loader2, RotateCcw, Send, Shield, Sparkles, Swords } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { supabase } from '@/lib/supabase'

type Turn = { role: 'player' | 'gm'; text: string }
type CompletedTurn = { turnNumber: number; playerAction: string; narrative: string; choices: string[]; model: string }
type GameReply = { narrative: string; choices: string[]; model: string; dailyRequestUsed?: boolean; resetAt?: string }
type SceneReply = { imageUrl: string; storagePath?: string; model: string; sessionId: string; error?: string }

const MODEL = 'OpenRouter configured model'
const opening = 'You enter the Ember Vault beneath WildDragons Keep. Three rune-lit passages split ahead while something enormous breathes in the dark.'
const openingChoices = ['Follow the blue runes', 'Call out to the creature', 'Search the vault entrance']

export function PF_AIDragonArena() {
  const [history, setHistory] = React.useState<Turn[]>([{ role: 'gm', text: opening }])
  const [choices, setChoices] = React.useState<string[]>(openingChoices)
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

  React.useEffect(() => {
    let cancelled = false
    const restoreLatestSession = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return
      const { data: session, error: sessionError } = await supabase
        .from('dragon_arena_sessions')
        .select('id')
        .eq('user_id', auth.user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (sessionError || !session?.id || cancelled) return

      const { data: savedTurns, error: turnsError } = await supabase
        .from('dragon_arena_turns')
        .select('turn_number,player_action,narrative,choices,model')
        .eq('session_id', session.id)
        .eq('user_id', auth.user.id)
        .order('turn_number', { ascending: true })
      if (turnsError || !savedTurns?.length || cancelled) return

      const restoredHistory: Turn[] = [{ role: 'gm', text: opening }]
      const restoredCompleted = savedTurns.map((savedTurn) => {
        const savedChoices = Array.isArray(savedTurn.choices) ? savedTurn.choices.map(String).filter(Boolean).slice(0, 3) : openingChoices
        restoredHistory.push({ role: 'player', text: savedTurn.player_action })
        restoredHistory.push({ role: 'gm', text: savedTurn.narrative })
        return {
          turnNumber: savedTurn.turn_number,
          playerAction: savedTurn.player_action,
          narrative: savedTurn.narrative,
          choices: savedChoices,
          model: savedTurn.model,
        }
      })
      const latest = restoredCompleted[restoredCompleted.length - 1]
      setSessionId(session.id)
      setHistory(restoredHistory)
      setCompletedTurns(restoredCompleted)
      setChoices(latest.choices)
      setTurn(latest.turnNumber + 1)
    }
    void restoreLatestSession()
    return () => { cancelled = true }
  }, [])

  const reset = () => {
    setHistory([{ role: 'gm', text: opening }])
    setChoices(openingChoices)
    setAction('')
    setError('')
    setTurn(1)
    setCompletedTurns([])
    setSessionId(null)
    setScene(null)
    setImageDailyUsed(false)
  }

  const generateScene = async () => {
    if (!sessionId || sceneLoading || imageDailyUsed) return
    setSceneLoading(true)
    setError('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Sign in again to generate a scene.')
      const latestNarrative = completedTurns[completedTurns.length - 1]?.narrative || opening
      const response = await fetch('/api/dragon-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ sessionId, prompt: latestNarrative }),
      })
      const payload = await response.json().catch(() => ({})) as SceneReply
      if (!response.ok) {
        if (response.status === 429) setImageDailyUsed(true)
        throw new Error(payload.error || 'The scene generator is unavailable.')
      }
      setScene(payload.imageUrl)
      await supabase.from('dragon_arena_assets').insert({ session_id: sessionId, user_id: sessionData.session?.user.id, asset_type: 'scene', storage_path: payload.storagePath, external_url: payload.imageUrl, prompt: latestNarrative, metadata: { model: payload.model } })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not generate a scene.')
    } finally {
      setSceneLoading(false)
    }
  }

  const persistMeaningfulSession = async (nextTurns: CompletedTurn[]) => {
    const { data: auth } = await supabase.auth.getUser()
    const userId = auth.user?.id
    if (!userId) return

    let activeSessionId = sessionId
    if (!activeSessionId) {
      const { data: created, error: createError } = await supabase
        .from('dragon_arena_sessions')
        .insert({
          user_id: userId,
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
        user_id: userId,
        turn_number: item.turnNumber,
        player_action: item.playerAction,
        narrative: item.narrative,
        choices: item.choices,
        model: item.model,
      }))
      const { error: turnError } = await supabase.from('dragon_arena_turns').insert(rows)
      if (turnError) throw turnError
      return
    }

    const latest = nextTurns[nextTurns.length - 1]
    const { error: turnError } = await supabase.from('dragon_arena_turns').insert({
      session_id: activeSessionId,
      user_id: userId,
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
  }

  const play = async (selected?: string) => {
    const playerAction = (selected || action).trim()
    if (!playerAction || loading || dailyUsed) return
    setLoading(true)
    setError('')
    setAction('')
    const nextHistory: Turn[] = [...history, { role: 'player', text: playerAction }]
    setHistory(nextHistory)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Sign in again to use Dragon Arena.')

      const response = await fetch('/api/ai-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ turn, action: playerAction, history: nextHistory.slice(-10) }),
      })
      const payload = await response.json().catch(() => ({})) as Partial<GameReply> & { error?: string }
      if (!response.ok) {
        if (response.status === 429) setDailyUsed(true)
        throw new Error(payload.error || 'The AI game master is unavailable.')
      }

      const narrative = payload.narrative?.trim() || 'The vault shifts around you. Choose your next move.'
      const nextChoices = Array.isArray(payload.choices) && payload.choices.length ? payload.choices.slice(0, 3) : openingChoices
      setHistory((current) => [...current, { role: 'gm', text: narrative }])
      setChoices(nextChoices)
      setTurn((value) => value + 1)
      setDailyUsed(Boolean(payload.dailyRequestUsed))

      const nextCompleted = [...completedTurns, {
        turnNumber: turn,
        playerAction,
        narrative,
        choices: nextChoices,
        model: payload.model || MODEL,
      }]
      setCompletedTurns(nextCompleted)
      void persistMeaningfulSession(nextCompleted).catch((logError) => console.error('Dragon Arena session logging failed', logError))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not continue the game.')
      setHistory(history)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge color="green">AI game</Badge>
            <span className="text-xs text-muted-foreground">WildDragons.ai · OpenRouter free tier</span>
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground"><Swords className="h-6 w-6" /> Dragon Arena</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">A persistent rune-lit adventure tied to your signed-in AppForge account. During the public beta, each user receives one owner-funded AI turn per UTC day.</p>
        </div>
        <Button variant="secondary" onClick={reset}><RotateCcw className="h-4 w-4" /> New local run</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-border/70 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium"><Bot className="h-4 w-4" /> AI Game Master</div>
            <span className="text-xs text-muted-foreground">Turn {turn}</span>
          </div>
          <div className="max-h-[520px] min-h-[360px] space-y-3 overflow-y-auto p-4">
            {history.map((item, index) => (
              <div key={`${item.role}-${index}`} className={`flex ${item.role === 'player' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === 'player' ? 'bg-foreground text-background' : 'border border-border/70 bg-background/55 text-foreground'}`}>
                  {item.text}
                </div>
              </div>
            ))}
            {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> The Game Master is deciding what happens next…</div>}
          </div>
          <div className="border-t border-border/70 p-4 space-y-3">
            {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}
            {dailyUsed && <div className="rounded-lg border border-border/70 bg-background/45 px-3 py-2 text-sm text-muted-foreground">Today’s owner-funded AI turn has been used. Your local story remains visible; the next AI turn unlocks after 00:00 UTC.</div>}
            <div className="grid gap-2 sm:grid-cols-3">
              {choices.map((choice) => <Button key={choice} variant="secondary" disabled={loading || dailyUsed} onClick={() => void play(choice)} className="h-auto min-h-10 whitespace-normal text-left">{choice}</Button>)}
            </div>
            <div className="flex gap-2">
              <input value={action} disabled={loading || dailyUsed} onChange={(event) => setAction(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void play() }} placeholder={dailyUsed ? 'Next AI turn unlocks tomorrow…' : 'Or type your own action…'} className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
              <Button disabled={loading || dailyUsed || !action.trim()} onClick={() => void play()}><Send className="h-4 w-4" /> Act</Button>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="flex items-center gap-2 text-sm font-semibold"><ImagePlus className="h-4 w-4" /> Scene generator</h2><p className="mt-1 text-xs text-muted-foreground">One separate image-generation turn per UTC day. Images are saved to this run's asset ledger.</p></div>
            <Button variant="secondary" onClick={() => void generateScene()} disabled={!sessionId || sceneLoading || imageDailyUsed}><ImagePlus className="h-4 w-4" />{sceneLoading ? 'Generating…' : imageDailyUsed ? 'Used today' : 'Generate scene'}</Button>
          </div>
          {scene && <img src={scene} alt="Generated Dragon Arena scene" className="mt-4 max-h-[520px] w-full rounded-xl border border-border/70 object-cover" />}
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4" /> Daily AI allowance</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">One successful OpenRouter request per authenticated user per UTC day. Failed upstream requests are refunded automatically.</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold"><Shield className="h-4 w-4" /> Server-side key + session</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">OPENROUTER_API_KEY stays in Vercel. Every request also requires a valid Supabase access token; quota is enforced against the authenticated user ID.</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold"><Dices className="h-4 w-4" /> Smart story logs</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Every successful turn is saved immediately, restored after refresh, and included in the next live context. Generated files and images have a dedicated asset ledger so future generated assets can be attached to a run.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

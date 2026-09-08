import React from 'react'
import { Bot, Dices, Loader2, RotateCcw, Send, Shield, Sparkles, Swords } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'

type Turn = { role: 'player' | 'gm'; text: string }
type GameReply = { narrative: string; choices: string[]; model: string }

const MODEL = 'gpt-5.6-sol'
const opening = 'You enter the Ember Vault beneath WildDragons Keep. Three rune-lit passages split ahead while something enormous breathes in the dark.'
const openingChoices = ['Follow the blue runes', 'Call out to the creature', 'Search the vault entrance']

export function PF_AIDragonArena() {
  const [history, setHistory] = React.useState<Turn[]>([{ role: 'gm', text: opening }])
  const [choices, setChoices] = React.useState<string[]>(openingChoices)
  const [action, setAction] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [turn, setTurn] = React.useState(1)

  const reset = () => {
    setHistory([{ role: 'gm', text: opening }])
    setChoices(openingChoices)
    setAction('')
    setError('')
    setTurn(1)
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
      const response = await fetch('/api/ai-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, turn, action: playerAction, history: nextHistory.slice(-10) }),
      })
      const payload = await response.json().catch(() => ({})) as Partial<GameReply> & { error?: string }
      if (!response.ok) throw new Error(payload.error || 'The AI game master is unavailable.')
      const narrative = payload.narrative?.trim() || 'The vault shifts around you. Choose your next move.'
      setHistory((current) => [...current, { role: 'gm', text: narrative }])
      setChoices(Array.isArray(payload.choices) && payload.choices.length ? payload.choices.slice(0, 3) : openingChoices)
      setTurn((value) => value + 1)
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
            <span className="text-xs text-muted-foreground">WildDragons.ai · GPT-5.6 Sol</span>
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground"><Swords className="h-6 w-6" /> Dragon Arena</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">A turn-based adventure where an OpenAI game master reacts to your choices. The model is locked to the Plus-level GPT-5.6 Sol family; Pro-only models are intentionally excluded.</p>
        </div>
        <Button variant="secondary" onClick={reset}><RotateCcw className="h-4 w-4" /> New run</Button>
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
            <div className="grid gap-2 sm:grid-cols-3">
              {choices.map((choice) => <Button key={choice} variant="secondary" disabled={loading} onClick={() => void play(choice)} className="h-auto min-h-10 whitespace-normal text-left">{choice}</Button>)}
            </div>
            <div className="flex gap-2">
              <input value={action} disabled={loading} onChange={(event) => setAction(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void play() }} placeholder="Or type your own action…" className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
              <Button disabled={loading || !action.trim()} onClick={() => void play()}><Send className="h-4 w-4" /> Act</Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4" /> Model policy</div>
            <div className="mt-3 rounded-lg border border-border/70 bg-background/45 p-3">
              <div className="text-xs text-muted-foreground">Allowed model</div>
              <div className="mt-1 font-mono text-sm text-foreground">{MODEL}</div>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">The server validates the model allowlist. A modified browser request cannot switch this game to a Pro-only model.</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold"><Shield className="h-4 w-4" /> Server-side key</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">OPENAI_API_KEY stays in Vercel environment variables and is never shipped in the browser bundle.</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold"><Dices className="h-4 w-4" /> How to play</div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Pick one of three generated moves or write your own. The last turns are sent back to the Game Master to preserve short-term story continuity.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

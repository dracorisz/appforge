import React from 'react'
import { Link } from 'react-router-dom'
import { Loader2, LogIn, Send, Sparkles } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { DragonArenaIcon } from './DragonArenaIcon'
import { randomOpening } from '@/lib/dragonArena'

const GUEST_DAY_KEY = 'appforge-dragon-guest-day'
const utcDay = () => new Date().toISOString().slice(0, 10)

type Turn = { role: 'player' | 'gm'; text: string }
type GameReply = { narrative?: string; choices?: string[]; model?: string; error?: string }

export function PF_GuestDragonArena() {
  const [opening] = React.useState(() => randomOpening())
  const [history, setHistory] = React.useState<Turn[]>([{ role: 'gm', text: opening.narrative }])
  const [choices, setChoices] = React.useState<string[]>([...opening.choices])
  const [action, setAction] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [usedToday, setUsedToday] = React.useState(() => localStorage.getItem(GUEST_DAY_KEY) === utcDay())

  const play = async (selected?: string) => {
    const playerAction = (selected || action).trim()
    if (!playerAction || loading || usedToday) return
    setLoading(true)
    setError('')
    setAction('')
    const nextHistory: Turn[] = [...history, { role: 'player', text: playerAction }]
    setHistory(nextHistory)
    try {
      const response = await fetch('/api/ai-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-appforge-guest': 'dragon-arena' },
        body: JSON.stringify({ action: playerAction, history: nextHistory.slice(-8), turn: 1 }),
      })
      const payload = await response.json().catch(() => ({})) as GameReply
      if (!response.ok) throw new Error(payload.error || 'The guest game master is unavailable.')
      const narrative = payload.narrative?.trim() || 'The vault answers in silence.'
      const nextChoices = Array.isArray(payload.choices) && payload.choices.length ? payload.choices.slice(0, 3) : opening.choices
      setHistory((current) => [...current, { role: 'gm', text: narrative }])
      setChoices(nextChoices)
      localStorage.setItem(GUEST_DAY_KEY, utcDay())
      setUsedToday(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not continue the guest run.')
      setHistory(history)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-10">
      <div className="relative overflow-hidden rounded-2xl border border-border/70">
        <img src="/Dragon Arena.png" alt="Dragon Arena" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="relative p-5">
          <div className="flex flex-wrap items-center gap-2"><Badge color="green">Guest preview</Badge><Badge color="slate">1 AI turn / UTC day</Badge></div>
          <h1 className="mt-3 flex items-center gap-2 text-2xl font-semibold text-white"><DragonArenaIcon className="h-7 w-7" /> Dragon Arena</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-white/90">Play one local guest turn without an account. Sign in to save runs, earn points, switch sessions, generate scenes and use the asset gallery.</p>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border/70 px-4 py-3 text-sm font-medium">AI Game Master</div>
        <div className="min-h-[360px] space-y-3 p-4">
          {history.map((item, index) => <div key={`${item.role}-${index}`} className={`flex ${item.role === 'player' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === 'player' ? 'bg-foreground text-background' : 'border border-border/70 bg-background/55'}`}>{item.text}</div></div>)}
          {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> The Game Master is deciding…</div>}
        </div>
        <div className="space-y-3 border-t border-border/70 p-4">
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}
          {usedToday && <div className="rounded-lg border border-border/70 bg-background/45 px-3 py-2 text-sm text-muted-foreground">Your guest turn for today has been used. Sign in for the full Dragon Arena, or return after 00:00 UTC.</div>}
          <div className="grid gap-2 sm:grid-cols-3">{choices.map((choice) => <Button key={choice} variant="secondary" disabled={loading || usedToday} onClick={() => void play(choice)} className="h-auto min-h-10 whitespace-normal text-left"><Sparkles className="h-4 w-4" /> {choice}</Button>)}</div>
          <div className="flex gap-2"><input value={action} disabled={loading || usedToday} onChange={(event) => setAction(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void play() }} placeholder={usedToday ? 'Guest turn used today…' : 'Or type your own action…'} className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><Button disabled={loading || usedToday || !action.trim()} onClick={() => void play()}><Send className="h-4 w-4" /> Act</Button></div>
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-semibold">Continue the adventure</div><div className="mt-1 text-xs text-muted-foreground">Account mode adds persistent sessions, points, leaderboard, Hugging Face scenes and gallery assets.</div></div><Link to="/login?returnTo=%2Fapps%2Fai-dragon-arena" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium hover:bg-accent"><LogIn className="h-4 w-4" /> Sign in</Link></Card>
    </div>
  )
}

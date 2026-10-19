import React from 'react'
import { Bot, CheckCircle2, CircleAlert, Github, Send, Server, ShieldCheck, Sparkles, User } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { Button, Card, Input } from '@/components/ui'

type Message = { role: 'user' | 'assistant'; content: string }
const starterPrompts = [
  'Explain the current AppForge architecture.',
  'Help me plan the first safe coding-agent workflow.',
  'Review the risks of connecting GitHub, Vercel and Supabase.',
]

export function Companion() {
  const { session, user } = useAuth()
  const [messages, setMessages] = React.useState<Message[]>([])
  const [draft, setDraft] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState('')
  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  const sendMessage = async (value = draft) => {
    const content = value.trim()
    if (!content || sending || !session?.access_token) return
    const next = [...messages, { role: 'user' as const, content }]
    setMessages(next)
    setDraft('')
    setError('')
    setSending(true)
    try {
      const response = await fetch('/api/companion-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ messages: next }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof payload.message === 'string' ? payload.message : 'Companion could not complete this request.')
      setMessages([...next, { role: 'assistant', content: String(payload.text || '').trim() }])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Companion is temporarily unavailable.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <Card className="flex min-h-[65vh] min-w-0 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border/70 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background/60"><Bot className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Companion</h2>
            <p className="text-sm text-muted-foreground">Your AppForge development assistant</p>
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">Early access</span>
        </div>
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {!messages.length ? (
            <div className="mx-auto flex min-h-[42vh] max-w-xl flex-col justify-center">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background/60"><Sparkles className="h-6 w-6" /></span>
              <h3 className="text-xl font-semibold">Let's work on AppForge.</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Start with a question or a development task. The first slice establishes secure Google Cloud chat; repository and deployment actions will be added behind explicit approvals.</p>
              <div className="mt-6 grid gap-2">
                {starterPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => void sendMessage(prompt)} disabled={sending} className="rounded-xl border border-border/70 p-3 text-left text-sm transition-colors hover:bg-accent disabled:opacity-50">{prompt}</button>)}
              </div>
            </div>
          ) : messages.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70"><Bot className="h-4 w-4" /></span>}
              <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'border border-border/70 bg-background/60'}`}>{message.content}</div>
              {message.role === 'user' && <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70"><User className="h-4 w-4" /></span>}
            </div>
          ))}
          {sending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Sparkles className="h-4 w-4 animate-pulse" /> Companion is thinking…</div>}
          {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 p-3 text-sm"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
        </div>
        <form className="border-t border-border/70 p-3 sm:p-4" onSubmit={(event) => { event.preventDefault(); void sendMessage() }}>
          <div className="flex items-end gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Message Companion</span>
              <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about AppForge or describe a task…" maxLength={4000} disabled={sending} />
            </label>
            <Button type="submit" disabled={!draft.trim() || sending}><Send className="h-4 w-4" /> Send</Button>
          </div>
          <p className="mt-2 px-1 text-xs text-muted-foreground">Responses use Google Cloud Vertex AI. Do not include passwords, API keys or other secrets in messages.</p>
        </form>
      </Card>

      <aside className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /><h3 className="text-sm font-semibold">Workspace access</h3></div>
          <p className="mt-2 break-all text-sm text-muted-foreground">{user?.email || 'Signed-in account required'}</p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Companion is a private app. Server requests are authenticated against your AppForge account.</p>
        </Card>
        <Card className="space-y-4 p-4">
          <div><h3 className="text-sm font-semibold">Integrations</h3><p className="mt-1 text-xs text-muted-foreground">Connection setup is the next implementation stage.</p></div>
          {[
            { name: 'GitHub', description: 'Repository search, diffs and reviewed changes', icon: Github },
            { name: 'Vercel', description: 'Deployment status and project settings', icon: Server },
            { name: 'Supabase', description: 'Schema, migrations and security checks', icon: CheckCircle2 },
          ].map(({ name, description, icon: Icon }) => <div key={name} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70"><Icon className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><div className="text-sm font-medium">{name}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>
            <span className="mt-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">Not connected</span>
          </div>)}
        </Card>
      </aside>
    </div>
  )
}

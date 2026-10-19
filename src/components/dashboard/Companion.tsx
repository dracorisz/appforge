import React from 'react'
import { Bot, CheckCircle2, CircleAlert, Plus, Send, Sparkles, Trash2, User } from 'lucide-react'
import { SiGithub, SiSupabase, SiVercel } from 'react-icons/si'
import { useAuth } from '@/auth/AuthProvider'
import { Button, Card, Input } from '@/components/ui'

type Message = { role: 'user' | 'assistant'; content: string }
type ChatSession = { id: string; title: string; updatedAt: number; messages: Message[] }
type IntegrationStatus = 'checking' | 'verified' | 'needs_setup' | 'invalid_credentials' | 'insufficient_permissions' | 'unavailable'
type IntegrationKey = 'github' | 'vercel' | 'supabase'

const starterPrompts = ['Explain the current AppForge architecture.', 'Help me plan the first safe coding-agent workflow.', 'Review the risks of connecting GitHub, Vercel and Supabase.']
const statusLabel: Record<IntegrationStatus, string> = { checking: 'Checking…', verified: 'Connected', needs_setup: 'Not connected', invalid_credentials: 'Invalid credentials', insufficient_permissions: 'Permission issue', unavailable: 'Unavailable' }

export function Companion() {
  const { session, user } = useAuth()
  const storageKey = `appforge-companion-sessions:${user?.id || user?.email || 'local'}`
  const [sessions, setSessions] = React.useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = React.useState('')
  const [sessionsLoaded, setSessionsLoaded] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState('')
  const [integrationStatuses, setIntegrationStatuses] = React.useState<Record<IntegrationKey, IntegrationStatus>>({ github: 'checking', vercel: 'checking', supabase: 'checking' })
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const activeSession = sessions.find((item) => item.id === activeSessionId)
  const messages = activeSession?.messages || []

  React.useEffect(() => {
    let saved: ChatSession[] = []
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]')
      if (Array.isArray(parsed)) saved = parsed.filter((item) => item && typeof item.id === 'string' && Array.isArray(item.messages))
    } catch { /* Ignore malformed local session data. */ }
    if (!saved.length) saved = [{ id: crypto.randomUUID(), title: 'New chat', updatedAt: Date.now(), messages: [] }]
    setSessions(saved)
    setActiveSessionId(saved[0].id)
    setSessionsLoaded(true)
  }, [storageKey])

  React.useEffect(() => {
    if (!sessionsLoaded) return
    try { localStorage.setItem(storageKey, JSON.stringify(sessions.slice(0, 30))) } catch { /* Storage may be unavailable or full. */ }
  }, [sessions, sessionsLoaded, storageKey])

  React.useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, sending])

  React.useEffect(() => {
    if (!session?.access_token) { setIntegrationStatuses({ github: 'needs_setup', vercel: 'needs_setup', supabase: 'needs_setup' }); return }
    const controller = new AbortController()
    void fetch('/api/companion-integrations', { headers: { Authorization: `Bearer ${session.access_token}` }, signal: controller.signal }).then(async (response) => {
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error('Integration status could not be checked.')
      const integrations = payload.integrations || {}
      const normalize = (value: unknown): IntegrationStatus => ['verified', 'needs_setup', 'invalid_credentials', 'insufficient_permissions', 'unavailable'].includes(String(value)) ? value as IntegrationStatus : 'unavailable'
      setIntegrationStatuses({ github: normalize(integrations.github?.status), vercel: normalize(integrations.vercel?.status), supabase: normalize(integrations.supabase?.status) })
    }).catch(() => { if (!controller.signal.aborted) setIntegrationStatuses({ github: 'unavailable', vercel: 'unavailable', supabase: 'unavailable' }) })
    return () => controller.abort()
  }, [session?.access_token])

  const startNewSession = () => {
    const fresh = { id: crypto.randomUUID(), title: 'New chat', updatedAt: Date.now(), messages: [] }
    setSessions((current) => [fresh, ...current].slice(0, 30))
    setActiveSessionId(fresh.id)
    setDraft('')
    setError('')
  }
  const selectSession = (id: string) => { setActiveSessionId(id); setError('') }
  const deleteSession = (id: string) => {
    const remaining = sessions.filter((item) => item.id !== id)
    if (!remaining.length) { const fresh = { id: crypto.randomUUID(), title: 'New chat', updatedAt: Date.now(), messages: [] }; setSessions([fresh]); setActiveSessionId(fresh.id); return }
    setSessions(remaining)
    if (activeSessionId === id) setActiveSessionId(remaining[0].id)
  }

  const sendMessage = async (value = draft) => {
    const content = value.trim()
    if (!content || sending || !session?.access_token || !activeSessionId) return
    const next = [...messages, { role: 'user' as const, content }]
    const sessionId = activeSessionId
    setSessions((current) => current.map((item) => item.id === sessionId ? { ...item, title: item.messages.length === 0 ? content.slice(0, 42) : item.title, updatedAt: Date.now(), messages: next } : item))
    setDraft(''); setError(''); setSending(true)
    try {
      const response = await fetch('/api/companion-chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ messages: next }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof payload.message === 'string' ? payload.message : 'Companion could not complete this request.')
      setSessions((current) => current.map((item) => item.id === sessionId ? { ...item, updatedAt: Date.now(), messages: [...next, { role: 'assistant', content: String(payload.text || '').trim() }] } : item))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Companion is temporarily unavailable.') }
    finally { setSending(false) }
  }

  return (
    <div className="grid h-full min-h-0 min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_16rem]">
      <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-3 border-b border-border/70 px-3 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-background/60"><Bot className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1"><h2 className="font-semibold leading-tight">Companion</h2><p className="text-xs text-muted-foreground">AppForge development assistant</p></div>
          <Button type="button" variant="secondary" onClick={startNewSession} className="h-8 gap-1 px-2"><Plus className="h-4 w-4" /><span className="hidden sm:inline">New chat</span></Button>
        </div>
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-48 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border/70 p-2 md:flex" aria-label="Chat sessions">
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Recent sessions</div>
            {sessions.map((item) => <div key={item.id} className={`group flex items-center gap-1 rounded-lg ${item.id === activeSessionId ? 'bg-muted' : 'hover:bg-muted/60'}`}>
              <button type="button" onClick={() => selectSession(item.id)} className="min-w-0 flex-1 truncate px-2 py-2 text-left text-sm" aria-current={item.id === activeSessionId ? 'page' : undefined} title={item.title}>{item.title}</button>
              <button type="button" onClick={() => deleteSession(item.id)} className="mr-1 rounded p-1 text-muted-foreground opacity-0 hover:text-foreground focus:opacity-100 group-hover:opacity-100" aria-label={`Delete session ${item.title}`} title="Delete session"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>)}
          </aside>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-4" aria-live="polite">
              {!messages.length ? <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center py-4">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/60"><Sparkles className="h-5 w-5" /></span>
                <h3 className="text-lg font-semibold">Let's work on AppForge.</h3><p className="mt-1 text-sm text-muted-foreground">Ask a question or describe a development task.</p>
                <div className="mt-3 grid gap-2">{starterPrompts.map((prompt) => <Button key={prompt} variant="ghost" type="button" onClick={() => void sendMessage(prompt)} disabled={sending} className="h-auto w-full justify-start whitespace-normal border-border/70 p-3 text-left">{prompt}</Button>)}</div>
              </div> : messages.map((message, index) => <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/70"><Bot className="h-4 w-4" /></span>}
                <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-xl px-3 py-3 text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'border border-border/70 bg-background/60'}`}>{message.content}</div>
                {message.role === 'user' && <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/70"><User className="h-4 w-4" /></span>}
              </div>)}
              {sending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Sparkles className="h-4 w-4 animate-pulse" /> Companion is thinking…</div>}
              {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 p-3 text-sm"><CircleAlert className="mt-1 h-4 w-4 shrink-0" /><span>{error}</span></div>}
            </div>
            <form className="shrink-0 border-t border-border/70 p-3" onSubmit={(event) => { event.preventDefault(); void sendMessage() }}><div className="flex items-end gap-2"><label className="min-w-0 flex-1"><span className="sr-only">Message Companion</span><Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about AppForge or describe a task…" maxLength={4000} disabled={sending} /></label><Button type="submit" disabled={!draft.trim() || sending}><Send className="h-4 w-4" /> Send</Button></div></form>
          </div>
        </div>
      </Card>
      <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto">
        <Card className="shrink-0 p-3"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /><h3 className="text-sm font-semibold">Integrations</h3></div>
          {([{ name: 'GitHub', key: 'github' as const, icon: SiGithub }, { name: 'Vercel', key: 'vercel' as const, icon: SiVercel }, { name: 'Supabase', key: 'supabase' as const, icon: SiSupabase }]).map(({ name, key, icon: Icon }) => {
            const status = integrationStatuses[key]
            return <div key={name} className="mt-3 flex items-center gap-2"><Icon className="h-5 w-5 shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1 text-sm font-medium">{name}</span><span className={`text-xs ${status === 'verified' ? 'text-emerald-600 dark:text-emerald-400' : status === 'checking' ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400'}`}>{statusLabel[status]}</span></div>
          })}
        </Card>
        <Card className="shrink-0 p-3"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /><h3 className="text-sm font-semibold">Workspace access</h3></div><p className="mt-2 break-all text-sm text-muted-foreground">{user?.email || 'Signed-in account required'}</p></Card>
      </aside>
    </div>
  )
}

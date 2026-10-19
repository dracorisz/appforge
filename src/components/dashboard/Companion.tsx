import React from 'react'
import { Bot, Check, CheckCircle2, CircleAlert, Code2, Copy, Maximize2, MessageCircle, Plus, Send, Sparkles, Trash2, User, X } from 'lucide-react'
import { SiGithub, SiSupabase, SiVercel } from 'react-icons/si'
import { useAuth } from '@/auth/AuthProvider'
import { Button, Card } from '@/components/ui'

type Message = { role: 'user' | 'assistant'; content: string }
type ChatSession = { id: string; title: string; updatedAt: number; messages: Message[] }
type IntegrationStatus = 'checking' | 'verified' | 'needs_setup' | 'invalid_credentials' | 'insufficient_permissions' | 'unavailable'
type IntegrationKey = 'github' | 'vercel' | 'supabase'
type CompanionMode = 'chat' | 'code'

const starterPrompts: Record<CompanionMode, string[]> = { chat: ['Explain a technical concept in plain English.', 'Help me compare implementation approaches.', 'Think through a project plan with me.'], code: ['Help me debug an error.', 'Plan a safe, incremental feature.', 'Review code for correctness and security.'] }

function FormattedMessage({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let code: string[] | null = null
  const inline = (value: string) => value.split(/(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\x60[^\x60]+\x60)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
    if (part.startsWith('~~') && part.endsWith('~~')) return <del key={index}>{part.slice(2, -2)}</del>
    if (part.charCodeAt(0) === 96 && part.charCodeAt(part.length - 1) === 96) return <code key={index} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">{part.slice(1, -1)}</code>
    return part
  })
  const flushParagraph = () => {
    if (paragraph.length) { blocks.push(<p key={blocks.length} className="my-2 first:mt-0 last:mb-0">{inline(paragraph.join(' '))}</p>); paragraph = [] }
  }
  const flushList = () => {
    if (list) {
      const Tag = list.ordered ? 'ol' : 'ul'
      blocks.push(<Tag key={blocks.length} className={(list.ordered ? 'list-decimal' : 'list-disc') + ' my-2 space-y-1 pl-6'}>{list.items.map((item, index) => <li key={index}>{inline(item)}</li>)}</Tag>)
      list = null
    }
  }
  lines.forEach((line) => {
    if (/^\s*\x60\x60\x60/.test(line)) {
      flushParagraph(); flushList()
      if (code) { blocks.push(<pre key={blocks.length} className="my-3 max-w-full overflow-x-auto rounded-lg border border-border/70 bg-muted/60 p-3 text-xs leading-5"><code>{code.join('\n')}</code></pre>); code = null }
      else code = []
      return
    }
    if (code) { code.push(line); return }
    if (!line.trim()) { flushParagraph(); flushList(); return }
    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      flushParagraph(); flushList()
      blocks.push(<div key={blocks.length} className={heading[1].length <= 2 ? 'mt-3 font-semibold' : 'mt-2 font-medium'}>{inline(heading[2])}</div>)
      return
    }
    const bullet = line.match(/^\s*[-*+]\s+(.+)$/)
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/)
    if (bullet || numbered) {
      flushParagraph()
      const ordered = Boolean(numbered)
      if (list && list.ordered !== ordered) flushList()
      if (!list) list = { ordered, items: [] }
      list.items.push((bullet || numbered)![1])
      return
    }
    flushList()
    paragraph.push(line.trim())
  })
  flushParagraph(); flushList()
  if (code) blocks.push(<pre key={blocks.length} className="my-3 max-w-full overflow-x-auto rounded-lg border border-border/70 bg-muted/60 p-3 text-xs leading-5"><code>{code.join('\n')}</code></pre>)
  return <div className="break-words leading-6 [&_a]:break-all">{blocks}</div>
}
const statusLabel: Record<IntegrationStatus, string> = { checking: 'Checking…', verified: 'Connected', needs_setup: 'Not connected', invalid_credentials: 'Invalid credentials', insufficient_permissions: 'Permission issue', unavailable: 'Unavailable' }

export function Companion() {
  const { session, user } = useAuth()
  const storageKey = `appforge-companion-sessions:${user?.id || user?.email || 'local'}`
  const [sessions, setSessions] = React.useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = React.useState('')
  const [sessionsLoaded, setSessionsLoaded] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const [mode, setMode] = React.useState<CompanionMode>('chat')
  const [expanded, setExpanded] = React.useState(false)
  const [copiedMessage, setCopiedMessage] = React.useState<number | null>(null)
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
  React.useEffect(() => { if (!expanded) return; const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false) }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, [expanded])

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
      const response = await fetch('/api/companion-chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ messages: next, mode }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof payload.message === 'string' ? payload.message : 'Companion could not complete this request.')
      setSessions((current) => current.map((item) => item.id === sessionId ? { ...item, updatedAt: Date.now(), messages: [...next, { role: 'assistant', content: String(payload.text || '').trim() }] } : item))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Companion is temporarily unavailable.') }
    finally { setSending(false) }
  }

  const copyMessage = async (content: string, index: number) => { try { await navigator.clipboard.writeText(content); setCopiedMessage(index); window.setTimeout(() => setCopiedMessage((current) => current === index ? null : current), 1800) } catch { setError('Could not copy automatically. Select the response and copy it manually.') } }

  return (
    <div className={expanded ? 'fixed inset-2 z-50 flex min-h-0 min-w-0 flex-col rounded-xl border border-border bg-background p-2 shadow-2xl sm:inset-4 sm:p-3' : 'grid h-full min-h-0 min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_16rem]'}>
      {expanded && <div className="flex shrink-0 items-center justify-between px-2 pb-2"><span className="text-sm font-semibold">Companion workspace</span><Button type="button" variant="ghost" onClick={() => setExpanded(false)} aria-label="Close expanded chat"><X className="h-4 w-4" /></Button></div>}
      <Card className={expanded ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden' : 'flex h-full min-h-0 min-w-0 flex-col overflow-hidden'}>
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
                <h3 className="text-lg font-semibold">{mode === 'chat' ? 'What would you like to explore?' : 'What are we building or fixing?'}</h3><p className="mt-1 text-sm text-muted-foreground">{mode === 'chat' ? 'Discuss ideas, learn concepts, and plan next steps.' : 'Describe the goal, share code or errors, and work through a solution.'}</p>
                <div className="mt-3 grid gap-2">{starterPrompts[mode].map((prompt) => <Button key={prompt} variant="ghost" type="button" onClick={() => void sendMessage(prompt)} disabled={sending} className="h-auto w-full justify-start whitespace-normal border-border/70 p-3 text-left">{prompt}</Button>)}</div>
              </div> : messages.map((message, index) => <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/70"><Bot className="h-4 w-4" /></span>}
                <div className={`max-w-[92%] break-words rounded-xl px-3 py-3 text-sm ${message.role === 'user' ? 'whitespace-pre-wrap bg-primary text-primary-foreground' : 'border border-border/70 bg-background/60'}`}>{message.role === 'assistant' ? <FormattedMessage content={message.content} /> : message.content}</div>
                {message.role === 'assistant' && <button type="button" onClick={() => void copyMessage(message.content, index)} className="ml-1 inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Copy response" title="Copy response">{copiedMessage === index ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copiedMessage === index ? 'Copied' : 'Copy'}</button>}
                {message.role === 'user' && <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/70"><User className="h-4 w-4" /></span>}
              </div>)}
              {sending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Sparkles className="h-4 w-4 animate-pulse" /> Companion is thinking…</div>}
              {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 p-3 text-sm"><CircleAlert className="mt-1 h-4 w-4 shrink-0" /><span>{error}</span></div>}
            </div>
            <form className="shrink-0 border-t border-border/70 p-3" onSubmit={(event) => { event.preventDefault(); void sendMessage() }}><label className="mb-2 block"><span className="sr-only">Message Companion</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage() } }} placeholder={mode === 'chat' ? 'Ask anything… (Enter to send, Shift+Enter for a new line)' : 'Describe a coding task, paste code or an error… (Enter to send)'} maxLength={4000} disabled={sending} rows={2} className="!h-auto !max-h-36 !min-h-[3.5rem] w-full resize-y !px-3 !py-2" /></label><div className="flex flex-wrap items-center justify-between gap-2"><div className="inline-flex items-center rounded-lg border border-border/70 bg-muted/40 p-1" aria-label="Companion mode"><button type="button" onClick={() => setMode('chat')} aria-pressed={mode === 'chat'} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${mode === 'chat' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><MessageCircle className="h-3.5 w-3.5" />Chat</button><button type="button" onClick={() => setMode('code')} aria-pressed={mode === 'code'} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${mode === 'code' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Code2 className="h-3.5 w-3.5" />Code</button></div><Button type="submit" disabled={!draft.trim() || sending}><Send className="h-4 w-4" /> Send</Button></div></form>
          </div>
        </div>
      </Card>
      <aside className={expanded ? 'hidden' : 'flex h-full min-h-0 flex-col gap-3 overflow-y-auto'}>
        <Card className="shrink-0 p-3"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /><h3 className="text-sm font-semibold">Integrations</h3></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Connection status is checked securely by the server. Direct repository, deployment, and database actions are not yet exposed to chat.</p>
          {([{ name: 'GitHub', key: 'github' as const, icon: SiGithub }, { name: 'Vercel', key: 'vercel' as const, icon: SiVercel }, { name: 'Supabase', key: 'supabase' as const, icon: SiSupabase }]).map(({ name, key, icon: Icon }) => {
            const status = integrationStatuses[key]
            return <div key={name} className="mt-3 flex items-center gap-2"><Icon className="h-5 w-5 shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1 text-sm font-medium">{name}</span><span className={`text-xs ${status === 'verified' ? 'text-emerald-600 dark:text-emerald-400' : status === 'checking' ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400'}`}>{statusLabel[status]}</span></div>
          })}
        </Card>
        <Card className="shrink-0 p-3"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /><h3 className="text-sm font-semibold">Workspace access</h3></div><p className="mt-2 break-all text-sm text-muted-foreground">{user?.email || 'Signed-in account required'}</p><p className="mt-3 text-xs leading-5 text-muted-foreground">Use Chat for general discussion or Code for development tasks across projects. Connected services are currently status-checked only.</p></Card>
        <div className="mt-auto shrink-0 pt-1"><Button type="button" variant="secondary" onClick={startNewSession} className="w-full justify-center gap-2"><Plus className="h-4 w-4" />New chat</Button></div>
      </aside>
    </div>
  )
}

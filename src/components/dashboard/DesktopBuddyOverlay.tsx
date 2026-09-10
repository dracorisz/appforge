import React from 'react'
import { ChevronDown, ChevronUp, MessageCircle, Volume2, VolumeX, X } from 'lucide-react'

const STORAGE_KEY = 'appforge-desktop-buddy-v1'
const VISIBILITY_KEY = 'appforge-desktop-buddy-overlay'

type StoredBuddy = {
  name?: string
  imageDataUrl?: string
  voiceEnabled?: boolean
  voiceName?: string
}

const FALLBACK_IMAGE = 'https://community.kde.org/images.community/c/cb/Konqi.svg'

const readBuddy = (): StoredBuddy => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as StoredBuddy : {}
  } catch {
    return {}
  }
}

const initialOpen = () => {
  try { return localStorage.getItem(VISIBILITY_KEY) !== 'closed' } catch { return true }
}

export function DesktopBuddyOverlay() {
  const [buddy, setBuddy] = React.useState<StoredBuddy>(readBuddy)
  const [open, setOpen] = React.useState(initialOpen)
  const [expanded, setExpanded] = React.useState(false)
  const [message, setMessage] = React.useState('Ready when AppForge has something to say.')
  const [speaking, setSpeaking] = React.useState(false)

  const syncBuddy = React.useCallback(() => setBuddy(readBuddy()), [])

  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === STORAGE_KEY) syncBuddy()
    }
    const onUpdated = () => syncBuddy()
    window.addEventListener('storage', onStorage)
    window.addEventListener('appforge:desktop-buddy-updated', onUpdated)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('appforge:desktop-buddy-updated', onUpdated)
    }
  }, [syncBuddy])

  const speak = React.useCallback((text: string) => {
    if (!buddy.voiceEnabled || !('speechSynthesis' in window) || !text.trim()) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = window.speechSynthesis.getVoices().find((candidate) => candidate.name === buddy.voiceName)
    if (voice) utterance.voice = voice
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [buddy.voiceEnabled, buddy.voiceName])

  React.useEffect(() => {
    const onAgentResponse = (event: Event) => {
      const detail = (event as CustomEvent<{ text?: string }>).detail
      const text = typeof detail?.text === 'string' ? detail.text.trim() : ''
      if (!text) return
      setMessage(text.slice(0, 1000))
      setExpanded(true)
      speak(text)
    }
    window.addEventListener('appforge:agent-response', onAgentResponse)
    return () => window.removeEventListener('appforge:agent-response', onAgentResponse)
  }, [speak])

  const close = () => {
    setOpen(false)
    try { localStorage.setItem(VISIBILITY_KEY, 'closed') } catch { /* session-only */ }
    window.speechSynthesis?.cancel()
  }

  const reopen = () => {
    setOpen(true)
    try { localStorage.setItem(VISIBILITY_KEY, 'open') } catch { /* session-only */ }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={reopen}
        className="fixed bottom-4 right-4 z-50 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-border bg-card p-1 shadow-xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open Desktop Buddy"
        title="Open Desktop Buddy"
      >
        <img src={buddy.imageDataUrl || FALLBACK_IMAGE} alt="" className="h-full w-full object-contain" />
      </button>
    )
  }

  return (
    <aside className="fixed bottom-4 right-4 z-50 w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl" aria-label="Desktop Buddy companion">
      <div className="flex items-center gap-2 p-2.5">
        <div className={`grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted/60 p-1 transition-transform ${speaking ? 'scale-105' : ''}`}>
          <img src={buddy.imageDataUrl || FALLBACK_IMAGE} alt="" className="h-full w-full object-contain" />
        </div>
        <button type="button" onClick={() => setExpanded((value) => !value)} className="min-w-0 flex-1 rounded-xl px-2 py-1.5 text-left hover:bg-accent">
          <div className="flex items-center gap-1.5 text-sm font-semibold"><MessageCircle className="h-3.5 w-3.5" /> {buddy.name || 'Konqi Buddy'}</div>
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{speaking ? 'Speaking…' : message}</div>
        </button>
        <button type="button" onClick={() => setExpanded((value) => !value)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={expanded ? 'Collapse Desktop Buddy' : 'Expand Desktop Buddy'}>{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}</button>
        <button type="button" onClick={close} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Hide Desktop Buddy"><X className="h-4 w-4" /></button>
      </div>
      {expanded && (
        <div className="border-t border-border px-3 pb-3 pt-2.5">
          <p className="max-h-32 overflow-auto text-xs leading-5 text-muted-foreground">{message}</p>
          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <span>Persistent across AppForge routes</span>
            <span className="inline-flex items-center gap-1">{buddy.voiceEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}{buddy.voiceEnabled ? 'Voice on' : 'Voice off'}</span>
          </div>
        </div>
      )}
    </aside>
  )
}

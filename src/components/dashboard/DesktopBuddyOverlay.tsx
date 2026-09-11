import React from 'react'
// @code-scanning/ignore js/xss-through-dom: DOM content is read via textContent which returns plain text, not HTML, preventing reinterpretation as HTML.
import { Camera, MessageCircle, Move, Volume2, X } from 'lucide-react'
import { uploadVaultMedia } from '@/lib/mediaVault'
import { isWidgetEnabled, setWidgetEnabled, subscribeWidgetPreferences } from '@/lib/widgetPreferences'

const STORAGE_KEY = 'appforge-desktop-buddy-v1'
const POSITION_KEY = 'appforge-desktop-buddy-position-v1'

type StoredBuddy = {
  name?: string
  imageDataUrl?: string
  voiceEnabled?: boolean
  voiceName?: string
}

type Point = { x: number; y: number }

const FALLBACK_IMAGE = 'https://community.kde.org/images.community/c/cb/Konqi.svg'

const readBuddy = (): StoredBuddy => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as StoredBuddy : {}
  } catch {
    return {}
  }
}

const readPosition = (): Point => {
  try {
    const parsed = JSON.parse(localStorage.getItem(POSITION_KEY) || '{}') as Partial<Point>
    if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) return { x: Number(parsed.x), y: Number(parsed.y) }
  } catch { /* use default */ }
  return { x: Math.max(16, window.innerWidth - 230), y: Math.max(16, window.innerHeight - 300) }
}

const clampPosition = (point: Point): Point => ({
  x: Math.min(Math.max(8, point.x), Math.max(8, window.innerWidth - 190)),
  y: Math.min(Math.max(8, point.y), Math.max(8, window.innerHeight - 220)),
})

async function captureCurrentTabViewport(): Promise<File> {
  if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('Screen capture is not supported in this browser.')
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
  try {
    const video = document.createElement('video')
    video.srcObject = stream
    video.muted = true
    video.playsInline = true
    await video.play()
    await new Promise<void>((resolve) => {
      if (video.readyState >= 2) resolve()
      else video.addEventListener('loadeddata', () => resolve(), { once: true })
    })
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || window.innerWidth
    canvas.height = video.videoHeight || window.innerHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Screenshot canvas is unavailable.')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Could not encode screenshot.')
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    return new File([blob], `appforge-screenshot-${stamp}.png`, { type: 'image/png' })
  } finally {
    stream.getTracks().forEach((track) => track.stop())
  }
}

export function DesktopBuddyOverlay() {
  const [buddy, setBuddy] = React.useState<StoredBuddy>(readBuddy)
  const [enabled, setEnabled] = React.useState(() => isWidgetEnabled('desktop-buddy'))
  const [position, setPosition] = React.useState<Point>(() => clampPosition(readPosition()))
  const [message, setMessage] = React.useState('Ready when AppForge has something to say.')
  const [showMessage, setShowMessage] = React.useState(false)
  const [speaking, setSpeaking] = React.useState(false)
  const [jumping, setJumping] = React.useState(false)
  const [savingScreenshot, setSavingScreenshot] = React.useState(false)
  const [status, setStatus] = React.useState('Drag the character anywhere on the page.')
  const dragRef = React.useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null)

  const syncBuddy = React.useCallback(() => setBuddy(readBuddy()), [])

  React.useEffect(() => subscribeWidgetPreferences((changed) => {
    if (!changed || changed === 'desktop-buddy') setEnabled(isWidgetEnabled('desktop-buddy'))
  }), [])

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

  React.useEffect(() => {
    const onResize = () => setPosition((current) => clampPosition(current))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const speakText = React.useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text.trim()) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = window.speechSynthesis.getVoices().find((candidate) => candidate.name === buddy.voiceName)
    if (voice) utterance.voice = voice
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [buddy.voiceName])

  React.useEffect(() => {
    const onAgentResponse = (event: Event) => {
      const detail = (event as CustomEvent<{ text?: string }>).detail
      const text = typeof detail?.text === 'string' ? detail.text.trim() : ''
      if (!text) return
      setMessage(text.slice(0, 1000))
      setShowMessage(true)
      if (buddy.voiceEnabled) speakText(text)
    }
    window.addEventListener('appforge:agent-response', onAgentResponse)
    return () => window.removeEventListener('appforge:agent-response', onAgentResponse)
  }, [buddy.voiceEnabled, speakText])

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: position.x, originY: position.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setPosition(clampPosition({ x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY }))
  }

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return
    dragRef.current = null
    const next = clampPosition(position)
    setPosition(next)
    try { localStorage.setItem(POSITION_KEY, JSON.stringify(next)) } catch { /* session-only */ }
  }

  const jump = () => {
    setJumping(false)
    window.requestAnimationFrame(() => {
      setJumping(true)
      window.setTimeout(() => setJumping(false), 520)
    })
  }

  const screenshot = async () => {
    if (savingScreenshot) return
    setSavingScreenshot(true)
    setStatus('Choose this AppForge tab in the browser capture dialog…')
    try {
      const file = await captureCurrentTabViewport()
      await uploadVaultMedia(file, {
        kind: 'image',
        folder: 'Screenshots',
        title: `AppForge screenshot · ${new Date().toLocaleString()}`,
        description: 'Viewport screenshot captured from the Desktop Buddy widget.',
        metadata: { source: 'desktop-buddy', route: window.location.pathname, captured_at: new Date().toISOString() },
      })
      setStatus('Screenshot saved to Media Vault → Screenshots.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Screenshot was not saved.')
    } finally {
      setSavingScreenshot(false)
    }
  }

  if (!enabled) return null

  return (
    <aside
      className="fixed z-50 select-none"
      style={{ left: position.x, top: position.y }}
      aria-label="Movable Desktop Buddy widget"
    >
      {showMessage && (
        <button type="button" onClick={() => setShowMessage(false)} className="mb-1 block w-48 rounded-2xl border border-border bg-card/95 px-3 py-2 text-left text-[11px] leading-4 text-muted-foreground shadow-xl backdrop-blur-xl">
          <span className="font-semibold text-foreground">{buddy.name || 'Konqi Buddy'}</span>
          <span className="mt-1 line-clamp-3 block">{message}</span>
        </button>
      )}

      <div
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative flex h-36 w-40 touch-none cursor-grab items-end justify-center active:cursor-grabbing"
        title="Drag Desktop Buddy"
      >
        <img
          src={buddy.imageDataUrl || FALLBACK_IMAGE}
          alt=""
          draggable={false}
          className={`pointer-events-none max-h-36 max-w-40 object-contain drop-shadow-2xl transition-transform ${speaking ? 'scale-105' : ''} ${jumping ? '-translate-y-10 rotate-3' : ''}`}
        />
        <span className="pointer-events-none absolute right-0 top-0 rounded-full border border-border/70 bg-card/90 p-1 text-muted-foreground shadow-sm"><Move className="h-3 w-3" /></span>
      </div>

      <div className="mx-auto mt-1 flex w-fit items-center gap-1 rounded-xl border border-border bg-card/95 p-1 shadow-xl backdrop-blur-xl">
        <button type="button" onClick={() => speakText(message)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" title="Speak last response" aria-label="Speak last response"><Volume2 className={`h-4 w-4 ${speaking ? 'animate-pulse' : ''}`} /></button>
        <button type="button" onClick={jump} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" title="Jump" aria-label="Make Desktop Buddy jump"><span className="text-base leading-none">↥</span></button>
        <button type="button" onClick={() => void screenshot()} disabled={savingScreenshot} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50" title="Save viewport screenshot to Media Vault / Screenshots" aria-label="Save screenshot"><Camera className={`h-4 w-4 ${savingScreenshot ? 'animate-pulse' : ''}`} /></button>
        <button type="button" onClick={() => setShowMessage((value) => !value)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" title={status} aria-label="Show Desktop Buddy status"><MessageCircle className="h-4 w-4" /></button>
        <button type="button" onClick={() => setWidgetEnabled('desktop-buddy', false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" title="Turn off floating Desktop Buddy" aria-label="Turn off Desktop Buddy widget"><X className="h-4 w-4" /></button>
      </div>
      <p className="sr-only" aria-live="polite">{status}</p>
    </aside>
  )
}

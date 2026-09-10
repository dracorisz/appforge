import React from 'react'
import { Download, ImagePlus, MessageCircle, Mic2, PackageOpen, RotateCcw, Sparkles, Upload } from 'lucide-react'

type Provider = 'huggingface' | 'vertex' | 'browser'

type BuddyConfig = {
  name: string
  provider: Provider
  voiceEnabled: boolean
  voiceName: string
  imageDataUrl: string
  scale: number
  offsetX: number
  offsetY: number
}

const STORAGE_KEY = 'appforge-desktop-buddy-v1'

const defaultConfig: BuddyConfig = {
  name: 'Ember',
  provider: 'huggingface',
  voiceEnabled: false,
  voiceName: '',
  imageDataUrl: '',
  scale: 88,
  offsetX: 0,
  offsetY: 0,
}

const loadConfig = (): BuddyConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultConfig
    return { ...defaultConfig, ...(JSON.parse(raw) as Partial<BuddyConfig>) }
  } catch {
    return defaultConfig
  }
}

const dragonPlaceholder = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8b5cf6"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>
  <rect width="512" height="512" rx="96" fill="#0f172a"/>
  <path d="M155 342c-47-33-61-95-30-139 21-29 53-42 83-39 9-44 48-77 95-77 53 0 96 43 96 96 0 20-6 39-17 54 30 20 48 54 48 91 0 60-49 109-109 109H207c-19 0-37-5-52-14z" fill="url(#g)"/>
  <path d="M216 183l-46-67 78 30m78 22 62-44-31 78" fill="none" stroke="#e2e8f0" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="240" cy="247" r="14" fill="#020617"/><circle cx="327" cy="247" r="14" fill="#020617"/>
  <path d="M252 314c26 19 55 19 82 0" fill="none" stroke="#020617" stroke-width="14" stroke-linecap="round"/>
  <path d="M185 352c-35 8-58 32-72 72 35-3 64-17 86-44m151-26c30 9 52 31 67 66-34 0-63-11-86-35" fill="none" stroke="#e2e8f0" stroke-width="16" stroke-linecap="round"/>
</svg>`)} `

export function DesktopBuddy() {
  const [config, setConfig] = React.useState<BuddyConfig>(loadConfig)
  const [message, setMessage] = React.useState('Ready to help with your next AppForge task.')
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([])

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  React.useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis?.getVoices?.() || [])
    loadVoices()
    window.speechSynthesis?.addEventListener?.('voiceschanged', loadVoices)
    return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', loadVoices)
  }, [])

  const onUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage('Choose a PNG, WebP, JPEG, or SVG image.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setConfig((current) => ({ ...current, imageDataUrl: String(reader.result || '') }))
    reader.readAsDataURL(file)
  }

  const speak = () => {
    if (!('speechSynthesis' in window)) {
      setMessage('Browser speech synthesis is not available here.')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(message)
    const selected = voices.find((voice) => voice.name === config.voiceName)
    if (selected) utterance.voice = selected
    window.speechSynthesis.speak(utterance)
  }

  const exportPack = () => {
    const blob = new Blob([JSON.stringify({ version: 1, app: 'desktop-buddy', config }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${config.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'desktop-buddy'}.buddy.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importPack = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}')) as { config?: Partial<BuddyConfig> }
        if (!parsed.config) throw new Error('Missing config')
        setConfig({ ...defaultConfig, ...parsed.config })
        setMessage('Buddy pack imported.')
      } catch {
        setMessage('That file is not a valid Desktop Buddy pack.')
      }
    }
    reader.readAsText(file)
  }

  const image = config.imageDataUrl || dragonPlaceholder

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_.95fr]">
          <div className="space-y-5 p-6 md:p-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" /> Desktop Buddy
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Create a character that reacts with your agent.</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Upload a character asset, tune its presentation, choose an AI provider path, and optionally let browser voice read responses aloud. Character packs stay local unless you explicitly export them.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="rounded-2xl border p-4">
                <span className="text-xs font-medium text-muted-foreground">Name</span>
                <input className="mt-2 w-full bg-transparent text-sm outline-none" value={config.name} onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))} />
              </label>
              <label className="rounded-2xl border p-4">
                <span className="text-xs font-medium text-muted-foreground">Provider</span>
                <select className="mt-2 w-full bg-transparent text-sm outline-none" value={config.provider} onChange={(e) => setConfig((c) => ({ ...c, provider: e.target.value as Provider }))}>
                  <option value="huggingface">Hugging Face</option>
                  <option value="vertex">Vertex AI</option>
                  <option value="browser">Local/browser</option>
                </select>
              </label>
              <div className="rounded-2xl border p-4">
                <span className="text-xs font-medium text-muted-foreground">Storage</span>
                <p className="mt-2 text-sm">Local-first pack</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted">
                <Upload className="h-4 w-4" /> Upload character
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={onUpload} />
              </label>
              <button type="button" onClick={exportPack} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted"><Download className="h-4 w-4" /> Export pack</button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted">
                <PackageOpen className="h-4 w-4" /> Import pack
                <input type="file" accept="application/json,.json" className="hidden" onChange={importPack} />
              </label>
              <button type="button" onClick={() => setConfig(defaultConfig)} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted"><RotateCcw className="h-4 w-4" /> Reset</button>
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden border-t bg-muted/40 lg:border-l lg:border-t-0">
            <div className="absolute inset-0 flex items-end justify-center overflow-hidden p-5">
              <img
                src={image}
                alt={`${config.name || 'Desktop Buddy'} character`}
                className="max-h-[330px] max-w-[92%] select-none object-contain drop-shadow-2xl"
                style={{ transform: `translate(${config.offsetX}px, ${config.offsetY}px) scale(${config.scale / 100})` }}
              />
            </div>
            <div className="absolute left-4 top-4 rounded-2xl border bg-background/90 px-3 py-2 text-xs shadow-sm backdrop-blur">
              <span className="font-semibold">{config.name || 'Buddy'}</span> · {config.provider === 'huggingface' ? 'Hugging Face' : config.provider === 'vertex' ? 'Vertex AI' : 'Browser'}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-3xl border bg-card p-5 md:p-6">
          <div className="flex items-center gap-2"><ImagePlus className="h-5 w-5" /><h2 className="font-semibold">Character framing</h2></div>
          <label className="block space-y-2 text-sm"><span>Scale · {config.scale}%</span><input className="w-full" type="range" min="45" max="145" value={config.scale} onChange={(e) => setConfig((c) => ({ ...c, scale: Number(e.target.value) }))} /></label>
          <label className="block space-y-2 text-sm"><span>Horizontal · {config.offsetX}px</span><input className="w-full" type="range" min="-120" max="120" value={config.offsetX} onChange={(e) => setConfig((c) => ({ ...c, offsetX: Number(e.target.value) }))} /></label>
          <label className="block space-y-2 text-sm"><span>Vertical · {config.offsetY}px</span><input className="w-full" type="range" min="-120" max="120" value={config.offsetY} onChange={(e) => setConfig((c) => ({ ...c, offsetY: Number(e.target.value) }))} /></label>
          <p className="text-xs leading-5 text-muted-foreground">The uploaded asset remains browser-local. Server-side image generation/optimization can be added behind the selected Hugging Face or Vertex provider without changing the pack format.</p>
        </section>

        <section className="space-y-4 rounded-3xl border bg-card p-5 md:p-6">
          <div className="flex items-center gap-2"><MessageCircle className="h-5 w-5" /><h2 className="font-semibold">Response preview</h2></div>
          <textarea className="min-h-28 w-full rounded-2xl border bg-background p-3 text-sm outline-none" value={message} onChange={(e) => setMessage(e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="rounded-2xl border p-3 text-sm">
              <span className="text-xs text-muted-foreground">Voice</span>
              <select className="mt-1 w-full bg-transparent outline-none" value={config.voiceName} onChange={(e) => setConfig((c) => ({ ...c, voiceName: e.target.value }))}>
                <option value="">System default</option>
                {voices.map((voice) => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name} · {voice.lang}</option>)}
              </select>
            </label>
            <button type="button" onClick={speak} className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium hover:bg-muted"><Mic2 className="h-4 w-4" /> Speak</button>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border p-3 text-sm">
            <input type="checkbox" checked={config.voiceEnabled} onChange={(e) => setConfig((c) => ({ ...c, voiceEnabled: e.target.checked }))} />
            Auto-speak future agent responses when Desktop Buddy integration is enabled
          </label>
        </section>
      </div>
    </div>
  )
}

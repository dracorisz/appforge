import React from 'react'
import { Download, ExternalLink, ImagePlus, MessageCircle, Mic2, PackageOpen, Pause, Play, RotateCcw, Sparkles, Upload } from 'lucide-react'

type Provider = 'huggingface' | 'vertex' | 'browser'
type Activity = 'idle' | 'listening' | 'speaking'

type BuddyConfig = {
  name: string
  provider: Provider
  voiceEnabled: boolean
  voiceName: string
  imageDataUrl: string
  assetLabel: string
  assetSourceUrl: string
  assetLicense: string
  scale: number
  offsetX: number
  offsetY: number
}

type StarterAsset = {
  id: string
  name: string
  imageUrl: string
  sourceUrl: string
  license: string
  note: string
}

const STORAGE_KEY = 'appforge-desktop-buddy-v1'
const MAX_IMAGE_BYTES = 2_500_000
const MAX_PACK_IMAGE_CHARS = 4_000_000

const KDE_LICENSE = 'KDE mascot artwork: CC BY-SA / GFDL / LGPL'
const KDE_STARTERS: StarterAsset[] = [
  {
    id: 'konqi-default',
    name: 'Konqi',
    imageUrl: 'https://community.kde.org/images.community/c/cb/Konqi.svg',
    sourceUrl: 'https://community.kde.org/Promo/Material/Mascots#2014',
    license: KDE_LICENSE,
    note: 'Default KDE dragon mascot artwork.',
  },
  {
    id: 'konqi-utilities',
    name: 'Utilities Konqi',
    imageUrl: 'https://community.kde.org/Special:Redirect/file/Mascot_konqi-app-utilities.png',
    sourceUrl: 'https://community.kde.org/File:Mascot_konqi-app-utilities.png',
    license: 'Creative Commons Attribution-ShareAlike · Tyson Tan',
    note: 'KDE utilities mascot used on the Get Involved wiki.',
  },
  {
    id: 'konqi-katie-phone',
    name: 'Konqi + Katie',
    imageUrl: 'https://community.kde.org/images.community/2/26/Konqi_katie_phone.png',
    sourceUrl: 'https://community.kde.org/Promo/Material/Mascots#2018',
    license: KDE_LICENSE,
    note: 'KDE dragons with smartphones, useful for an assistant/mobile personality.',
  },
]

const defaultStarter = KDE_STARTERS[0]
const defaultConfig: BuddyConfig = {
  name: 'Konqi Buddy',
  provider: 'huggingface',
  voiceEnabled: false,
  voiceName: '',
  imageDataUrl: defaultStarter.imageUrl,
  assetLabel: defaultStarter.name,
  assetSourceUrl: defaultStarter.sourceUrl,
  assetLicense: defaultStarter.license,
  scale: 88,
  offsetX: 0,
  offsetY: 0,
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const isProvider = (value: unknown): value is Provider => value === 'huggingface' || value === 'vertex' || value === 'browser'

const sanitizeConfig = (value: Partial<BuddyConfig>): BuddyConfig => ({
  name: typeof value.name === 'string' ? value.name.slice(0, 64) : defaultConfig.name,
  provider: isProvider(value.provider) ? value.provider : defaultConfig.provider,
  voiceEnabled: typeof value.voiceEnabled === 'boolean' ? value.voiceEnabled : defaultConfig.voiceEnabled,
  voiceName: typeof value.voiceName === 'string' ? value.voiceName.slice(0, 160) : '',
  imageDataUrl: typeof value.imageDataUrl === 'string' && value.imageDataUrl.length <= MAX_PACK_IMAGE_CHARS ? value.imageDataUrl : defaultConfig.imageDataUrl,
  assetLabel: typeof value.assetLabel === 'string' ? value.assetLabel.slice(0, 120) : '',
  assetSourceUrl: typeof value.assetSourceUrl === 'string' ? value.assetSourceUrl.slice(0, 500) : '',
  assetLicense: typeof value.assetLicense === 'string' ? value.assetLicense.slice(0, 240) : '',
  scale: clamp(Number.isFinite(value.scale) ? Number(value.scale) : defaultConfig.scale, 45, 145),
  offsetX: clamp(Number.isFinite(value.offsetX) ? Number(value.offsetX) : defaultConfig.offsetX, -120, 120),
  offsetY: clamp(Number.isFinite(value.offsetY) ? Number(value.offsetY) : defaultConfig.offsetY, -120, 120),
})

const loadConfig = (): BuddyConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultConfig
    return sanitizeConfig(JSON.parse(raw) as Partial<BuddyConfig>)
  } catch {
    return defaultConfig
  }
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function DesktopBuddy() {
  const [config, setConfig] = React.useState<BuddyConfig>(loadConfig)
  const [message, setMessage] = React.useState('Ready to react to your next AppForge response.')
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([])
  const [activity, setActivity] = React.useState<Activity>('idle')

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    } catch {
      setMessage('This character is too large for browser storage. Export the pack or choose a smaller image.')
    }
  }, [config])

  React.useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis?.getVoices?.() || [])
    loadVoices()
    window.speechSynthesis?.addEventListener?.('voiceschanged', loadVoices)
    return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', loadVoices)
  }, [])

  const speakText = React.useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text.trim()) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const selected = voices.find((voice) => voice.name === config.voiceName)
    if (selected) utterance.voice = selected
    utterance.onstart = () => setActivity('speaking')
    utterance.onend = () => setActivity('idle')
    utterance.onerror = () => setActivity('idle')
    window.speechSynthesis.speak(utterance)
  }, [config.voiceName, voices])

  React.useEffect(() => {
    const onAgentResponse = (event: Event) => {
      const detail = (event as CustomEvent<{ text?: string }>).detail
      const text = typeof detail?.text === 'string' ? detail.text.trim() : ''
      if (!text) return
      setMessage(text)
      setActivity(config.voiceEnabled ? 'speaking' : 'listening')
      if (config.voiceEnabled) speakText(text)
      else window.setTimeout(() => setActivity('idle'), 700)
    }
    window.addEventListener('appforge:agent-response', onAgentResponse)
    return () => window.removeEventListener('appforge:agent-response', onAgentResponse)
  }, [config.voiceEnabled, speakText])

  const onUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage('Choose a PNG, WebP, JPEG, or SVG image.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMessage('Choose an image under 2.5 MB for browser-local storage.')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const imageDataUrl = String(reader.result || '')
      if (imageDataUrl.length > MAX_PACK_IMAGE_CHARS) {
        setMessage('That image expands too much for a portable local buddy pack. Choose a smaller asset.')
        return
      }
      setConfig((current) => ({ ...current, imageDataUrl, assetLabel: file.name, assetSourceUrl: '', assetLicense: 'User-supplied asset' }))
      setMessage('Character loaded locally.')
    }
    reader.readAsDataURL(file)
  }

  const chooseStarter = (starter: StarterAsset) => {
    setConfig((current) => ({
      ...current,
      imageDataUrl: starter.imageUrl,
      assetLabel: starter.name,
      assetSourceUrl: starter.sourceUrl,
      assetLicense: starter.license,
    }))
    setMessage(`${starter.name} selected from the KDE Community Wiki starter set.`)
  }

  const speak = () => {
    if (!('speechSynthesis' in window)) {
      setMessage('Browser speech synthesis is not available here.')
      return
    }
    speakText(message)
  }

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel()
    setActivity('idle')
  }

  const exportPack = () => {
    const blob = new Blob([JSON.stringify({ version: 2, app: 'desktop-buddy', exportedAt: new Date().toISOString(), config }, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `${config.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'desktop-buddy'}.buddy.json`)
  }

  const importPack = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5_000_000) {
      setMessage('That buddy pack is too large to import safely.')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}')) as { app?: unknown; version?: unknown; config?: Partial<BuddyConfig> }
        if (parsed.app !== 'desktop-buddy' || ![1, 2].includes(Number(parsed.version)) || !parsed.config) throw new Error('Invalid buddy pack')
        setConfig(sanitizeConfig(parsed.config))
        setMessage('Buddy pack imported.')
      } catch {
        setMessage('That file is not a valid Desktop Buddy pack.')
      }
    }
    reader.readAsText(file)
  }

  const exportPng = async () => {
    try {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.src = config.imageDataUrl
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas is unavailable')
      const fit = Math.min(470 / image.naturalWidth, 470 / image.naturalHeight)
      const width = image.naturalWidth * fit
      const height = image.naturalHeight * fit
      context.clearRect(0, 0, 512, 512)
      context.drawImage(image, (512 - width) / 2, (512 - height) / 2, width, height)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('PNG export failed')
      downloadBlob(blob, `${config.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'buddy'}-512.png`)
      setMessage('Optimized 512 × 512 transparent PNG exported.')
    } catch {
      setMessage('This remote asset blocks canvas export. Download it from its KDE source or upload a local copy first.')
    }
  }

  const testReaction = () => {
    const text = `${config.name || 'Desktop Buddy'} received an AppForge agent response and is ready.`
    window.dispatchEvent(new CustomEvent('appforge:agent-response', { detail: { text } }))
  }

  const providerNote = config.provider === 'huggingface'
    ? 'Hugging Face selected · server-side generation adapter is the next provider milestone.'
    : config.provider === 'vertex'
      ? 'Vertex AI selected · generation remains explicit/manual to stay inside the project cost controls.'
      : 'Browser mode selected · no provider credential is used.'

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_.95fr]">
          <div className="space-y-5 p-6 md:p-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" /> Desktop Buddy · beta
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Build a dragon companion for AppForge responses.</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Start from KDE Community dragon artwork or upload your own character, tune the framing, export portable assets, and optionally read agent responses with browser voice.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="rounded-2xl border p-4">
                <span className="text-xs font-medium text-muted-foreground">Name</span>
                <input className="mt-2 w-full bg-transparent text-sm outline-none" value={config.name} maxLength={64} onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))} />
              </label>
              <label className="rounded-2xl border p-4">
                <span className="text-xs font-medium text-muted-foreground">Provider path</span>
                <select className="mt-2 w-full bg-transparent text-sm outline-none" value={config.provider} onChange={(e) => setConfig((c) => ({ ...c, provider: e.target.value as Provider }))}>
                  <option value="huggingface">Hugging Face</option>
                  <option value="vertex">Vertex AI</option>
                  <option value="browser">Local/browser</option>
                </select>
              </label>
              <div className="rounded-2xl border p-4">
                <span className="text-xs font-medium text-muted-foreground">State</span>
                <p className="mt-2 text-sm capitalize">{activity}</p>
              </div>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">{providerNote}</p>

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
              <button type="button" onClick={() => void exportPng()} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted"><ImagePlus className="h-4 w-4" /> Export PNG</button>
              <button type="button" onClick={() => { setConfig(defaultConfig); setMessage('Desktop Buddy reset to KDE Konqi.') }} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted"><RotateCcw className="h-4 w-4" /> Reset</button>
            </div>
          </div>

          <div className="relative min-h-[390px] overflow-hidden border-t bg-muted/40 lg:border-l lg:border-t-0">
            <div className={`absolute inset-0 flex items-end justify-center overflow-hidden p-5 transition-transform ${activity === 'speaking' ? 'scale-[1.025]' : activity === 'listening' ? 'scale-[1.01]' : ''}`}>
              <img
                src={config.imageDataUrl}
                alt={`${config.name || 'Desktop Buddy'} character`}
                className="max-h-[350px] max-w-[92%] select-none object-contain drop-shadow-2xl"
                style={{ transform: `translate(${config.offsetX}px, ${config.offsetY}px) scale(${config.scale / 100})` }}
              />
            </div>
            <div className="absolute left-4 top-4 rounded-2xl border bg-background/90 px-3 py-2 text-xs shadow-sm backdrop-blur">
              <span className="font-semibold">{config.name || 'Buddy'}</span> · {activity}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-semibold">KDE dragon starters</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">These are linked from the KDE Community Wiki rather than copied without provenance. Each starter keeps its source and license metadata in the buddy pack.</p></div><a href="https://community.kde.org/Promo/Material/Mascots" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">KDE mascot wiki <ExternalLink className="h-3.5 w-3.5" /></a></div>
        <div className="grid gap-3 sm:grid-cols-3">{KDE_STARTERS.map((starter) => {
          const active = config.assetSourceUrl === starter.sourceUrl
          return <button key={starter.id} type="button" onClick={() => chooseStarter(starter)} className={`overflow-hidden rounded-2xl border text-left transition-colors hover:border-foreground/25 ${active ? 'ring-2 ring-primary/35' : ''}`}>
            <div className="grid aspect-[4/3] place-items-center bg-muted/35 p-3"><img src={starter.imageUrl} alt={starter.name} className="max-h-full max-w-full object-contain" loading="lazy" /></div>
            <div className="space-y-1 p-3"><div className="text-sm font-semibold">{starter.name}</div><p className="text-[11px] leading-4 text-muted-foreground">{starter.note}</p><p className="text-[10px] leading-4 text-muted-foreground">{starter.license}</p></div>
          </button>
        })}</div>
        <div className="rounded-2xl border bg-background/45 p-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Current asset:</strong> {config.assetLabel || 'Custom character'} · {config.assetLicense || 'No license metadata recorded'}{config.assetSourceUrl && <> · <a href={config.assetSourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">source</a></>}</div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-3xl border bg-card p-5 md:p-6">
          <div className="flex items-center gap-2"><ImagePlus className="h-5 w-5" /><h2 className="font-semibold">Character framing</h2></div>
          <label className="block space-y-2 text-sm"><span>Scale · {config.scale}%</span><input className="w-full" type="range" min="45" max="145" value={config.scale} onChange={(e) => setConfig((c) => ({ ...c, scale: Number(e.target.value) }))} /></label>
          <label className="block space-y-2 text-sm"><span>Horizontal · {config.offsetX}px</span><input className="w-full" type="range" min="-120" max="120" value={config.offsetX} onChange={(e) => setConfig((c) => ({ ...c, offsetX: Number(e.target.value) }))} /></label>
          <label className="block space-y-2 text-sm"><span>Vertical · {config.offsetY}px</span><input className="w-full" type="range" min="-120" max="120" value={config.offsetY} onChange={(e) => setConfig((c) => ({ ...c, offsetY: Number(e.target.value) }))} /></label>
          <p className="text-xs leading-5 text-muted-foreground">Uploads stay browser-local and are limited to 2.5 MB. Export PNG creates a transparent 512 × 512 character asset when the image source allows canvas access.</p>
        </section>

        <section className="space-y-4 rounded-3xl border bg-card p-5 md:p-6">
          <div className="flex items-center gap-2"><MessageCircle className="h-5 w-5" /><h2 className="font-semibold">Agent response + voice</h2></div>
          <textarea className="min-h-28 w-full rounded-2xl border bg-background p-3 text-sm outline-none" value={message} onChange={(e) => setMessage(e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <label className="rounded-2xl border p-3 text-sm">
              <span className="text-xs text-muted-foreground">Voice</span>
              <select className="mt-1 w-full bg-transparent outline-none" value={config.voiceName} onChange={(e) => setConfig((c) => ({ ...c, voiceName: e.target.value }))}>
                <option value="">System default</option>
                {voices.map((voice) => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name} · {voice.lang}</option>)}
              </select>
            </label>
            <button type="button" onClick={speak} className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium hover:bg-muted"><Mic2 className="h-4 w-4" /> Speak</button>
            <button type="button" onClick={stopSpeaking} className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium hover:bg-muted"><Pause className="h-4 w-4" /> Stop</button>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border p-3 text-sm">
            <input type="checkbox" checked={config.voiceEnabled} onChange={(e) => setConfig((c) => ({ ...c, voiceEnabled: e.target.checked }))} />
            Auto-speak AppForge <code className="rounded bg-muted px-1 text-[11px]">appforge:agent-response</code> events
          </label>
          <button type="button" onClick={testReaction} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted"><Play className="h-4 w-4" /> Test agent reaction</button>
        </section>
      </div>
    </div>
  )
}

import React from 'react'
import { Check, Download, ImagePlus, KeyRound, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const BUDDY_STORAGE_KEY = 'appforge-desktop-buddy-v1'
const HF_KEYS_STORAGE = 'dragon-arena-hf-keys'

type ProviderStatus = {
  ok?: boolean
  configured?: boolean
  personalTokenSupported?: boolean
  sharedQuota?: string
  error?: string
}

type GenerationReply = {
  ok?: boolean
  imageDataUrl?: string
  mimeType?: string
  sizeBytes?: number
  model?: string
  provider?: string
  providerModel?: string
  personalKeyUsed?: boolean
  requestId?: string
  error?: string
  provenance?: Record<string, unknown>
}

const loadPersonalHfTokens = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(HF_KEYS_STORAGE) || '[]')
    return Array.isArray(parsed) ? parsed.map(String).filter((token) => token.trim().startsWith('hf_')).slice(0, 3) : []
  } catch {
    return []
  }
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return ''
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const downloadDataUrl = (dataUrl: string, filename: string) => {
  const anchor = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export function DesktopBuddyProviderLab() {
  const [prompt, setPrompt] = React.useState('A friendly small dragon software assistant, expressive eyes, compact wings, cheerful and clever, clean full-body character design')
  const [status, setStatus] = React.useState<ProviderStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)
  const [result, setResult] = React.useState<GenerationReply | null>(null)
  const [message, setMessage] = React.useState('Generation is always explicit. No image requests run in the background.')

  const refreshStatus = React.useCallback(async () => {
    setLoadingStatus(true)
    try {
      const response = await fetch('/api/desktop-buddy-image', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({})) as ProviderStatus
      setStatus(payload)
    } catch {
      setStatus({ configured: false, error: 'Provider status is unavailable on this deployment.' })
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  React.useEffect(() => { void refreshStatus() }, [refreshStatus])

  const generate = async () => {
    const cleanPrompt = prompt.trim()
    if (cleanPrompt.length < 8 || generating) return
    setGenerating(true)
    setResult(null)
    setMessage('Contacting the server-side Hugging Face provider rotation…')
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Sign in again to generate a character.')

      const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      const personal = loadPersonalHfTokens()
      if (personal.length) headers['x-hf-tokens'] = personal.join(',')

      const response = await fetch('/api/desktop-buddy-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: cleanPrompt }),
      })
      const payload = await response.json().catch(() => ({})) as GenerationReply
      if (!response.ok || !payload.imageDataUrl) throw new Error(payload.error || 'Character generation failed.')
      setResult(payload)
      setMessage(`Generated with ${payload.provider || 'Hugging Face'} · ${payload.model || 'provider model'}${payload.sizeBytes ? ` · ${formatBytes(payload.sizeBytes)}` : ''}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Character generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  const useResult = () => {
    if (!result?.imageDataUrl) return
    try {
      const raw = localStorage.getItem(BUDDY_STORAGE_KEY)
      const current = raw ? JSON.parse(raw) : {}
      localStorage.setItem(BUDDY_STORAGE_KEY, JSON.stringify({
        ...current,
        imageDataUrl: result.imageDataUrl,
        assetLabel: `Generated Desktop Buddy · ${result.model || 'Hugging Face'}`,
        assetSourceUrl: '',
        assetLicense: 'AI-generated character · review applicable provider terms before redistribution',
        generatedProvenance: result.provenance || {},
      }))
      window.dispatchEvent(new Event('appforge:desktop-buddy-updated'))
      setMessage('Generated character is now the active floating Desktop Buddy.')
    } catch {
      setMessage('The generated image could not be stored in this browser. Download it instead.')
    }
  }

  const personalTokens = loadPersonalHfTokens().length

  return (
    <section className="mx-auto w-full max-w-6xl rounded-3xl border bg-card p-5 md:p-6" aria-label="Desktop Buddy AI provider lab">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2"><Sparkles className="h-5 w-5" /><h2 className="text-lg font-semibold">AI character generator</h2></div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Generate an original character through AppForge's server-side Hugging Face provider rotation. Shared generation uses the existing daily image-turn allowance; personal HF tokens configured in Story Studio are reused locally and sent only with this explicit request.</p>
        </div>
        <button type="button" onClick={() => void refreshStatus()} disabled={loadingStatus} className="inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold hover:bg-accent disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loadingStatus ? 'animate-spin' : ''}`} /> Provider status</button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border bg-background/45 p-3">
          <p className="text-xs font-semibold">Hugging Face</p>
          <p className="mt-1 text-xs text-muted-foreground">{status === null ? 'Checking deployment…' : status.configured ? 'Shared server token configured' : personalTokens ? 'Use your personal HF token' : 'Shared token not detected'}</p>
        </div>
        <div className="rounded-2xl border bg-background/45 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold"><KeyRound className="h-3.5 w-3.5" /> Personal HF</p>
          <p className="mt-1 text-xs text-muted-foreground">{personalTokens ? `${personalTokens} local token${personalTokens === 1 ? '' : 's'} available from Story Studio` : 'Optional; configure in Story Studio provider settings'}</p>
        </div>
        <div className="rounded-2xl border bg-background/45 p-3">
          <p className="text-xs font-semibold">Vertex AI</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Private Cloud Run worker is prepared, but browser generation stays disabled until Vercel → Google workload identity and per-user authorization are verified.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">Character prompt
            <textarea value={prompt} maxLength={900} onChange={(event) => setPrompt(event.target.value)} className="mt-1 min-h-28 w-full rounded-2xl border bg-background p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/25" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void generate()} disabled={generating || prompt.trim().length < 8 || (!status?.configured && !personalTokens)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} {generating ? 'Generating…' : 'Generate with Hugging Face'}</button>
            <span className="text-xs text-muted-foreground">{status?.sharedQuota || 'Explicit request only; no automatic retry.'}</span>
          </div>
          <p aria-live="polite" className="text-xs leading-5 text-muted-foreground">{message}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-muted/30">
          <div className="grid aspect-square place-items-center p-3">{result?.imageDataUrl ? <img src={result.imageDataUrl} alt="Generated Desktop Buddy character" className="max-h-full max-w-full object-contain" /> : <div className="px-6 text-center text-xs leading-5 text-muted-foreground">Generated character preview appears here. Nothing is generated until you press the button.</div>}</div>
          {result?.imageDataUrl && <div className="grid grid-cols-2 gap-2 border-t p-3"><button type="button" onClick={useResult} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold hover:bg-accent"><Check className="h-3.5 w-3.5" /> Use in Buddy</button><button type="button" onClick={() => downloadDataUrl(result.imageDataUrl!, 'desktop-buddy-generated.png')} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold hover:bg-accent"><Download className="h-3.5 w-3.5" /> Download</button></div>}
        </div>
      </div>
    </section>
  )
}

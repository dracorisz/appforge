import React from 'react'
import { Check, Cloud, Download, FolderOpen, ImagePlus, Images, KeyRound, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { listVaultMedia, uploadVaultMedia, vaultItemUrl, type VaultMedia } from '@/lib/mediaVault'

const BUDDY_STORAGE_KEY = 'appforge-desktop-buddy-v1'
const HF_KEYS_STORAGE = 'dragon-arena-hf-keys'
const VERTEX_RECOVERY_KEY = 'appforge-desktop-buddy-vertex-job'
const VERTEX_REQUEST_KEY = 'appforge-desktop-buddy-vertex-request'
const GENERATED_BUDDY_FOLDER = 'desktop-buddies'
const TRANSPARENT_PNG_REQUIREMENT = 'MUST BE PNG with a fully transparent alpha background. No white, colored, checkerboard, scene, floor, or other background.'

type ProviderName = 'huggingface' | 'vertex'
type ProviderStatus = {
  ok?: boolean
  configured?: boolean
  personalTokenSupported?: boolean
  sharedQuota?: string
  recoverableJobs?: boolean
  model?: string
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
  bridgeJobId?: string | null
  clientRequestId?: string | null
  workerJobId?: string | null
  status?: string
  error?: string
  provenance?: Record<string, unknown>
}

type GalleryBuddy = { item: VaultMedia; url: string | null }

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

const dataUrlToPng = async (dataUrl: string): Promise<{ dataUrl: string; blob: Blob }> => {
  const image = new Image()
  image.src = dataUrl
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, image.naturalWidth)
  canvas.height = Math.max(1, image.naturalHeight)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable for PNG normalization.')
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not normalize generated character to PNG.')
  const normalized = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('Could not read normalized PNG.'))
    reader.readAsDataURL(blob)
  })
  return { dataUrl: normalized, blob }
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
  const [provider, setProvider] = React.useState<ProviderName>('huggingface')
  const [prompt, setPrompt] = React.useState('A friendly small dragon software assistant, expressive eyes, compact wings, cheerful and clever, clean full-body character design')
  const [hfStatus, setHfStatus] = React.useState<ProviderStatus | null>(null)
  const [vertexStatus, setVertexStatus] = React.useState<ProviderStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)
  const [result, setResult] = React.useState<GenerationReply | null>(null)
  const [gallery, setGallery] = React.useState<GalleryBuddy[]>([])
  const [galleryLoading, setGalleryLoading] = React.useState(false)
  const [lastVertexJob, setLastVertexJob] = React.useState(() => localStorage.getItem(VERTEX_RECOVERY_KEY) || '')
  const [pendingVertexRequest, setPendingVertexRequest] = React.useState(() => localStorage.getItem(VERTEX_REQUEST_KEY) || '')
  const [message, setMessage] = React.useState('Generation is always explicit. No image requests run in the background.')

  const refreshStatus = React.useCallback(async () => {
    setLoadingStatus(true)
    try {
      const [hfResponse, vertexResponse] = await Promise.all([
        fetch('/api/desktop-buddy-image', { cache: 'no-store' }),
        fetch('/api/desktop-buddy-vertex', { cache: 'no-store' }),
      ])
      const [hfPayload, vertexPayload] = await Promise.all([
        hfResponse.json().catch(() => ({})) as Promise<ProviderStatus>,
        vertexResponse.json().catch(() => ({})) as Promise<ProviderStatus>,
      ])
      setHfStatus(hfPayload)
      setVertexStatus(vertexPayload)
    } catch {
      setHfStatus((current) => current || { configured: false, error: 'Provider status is unavailable.' })
      setVertexStatus((current) => current || { configured: false, error: 'Provider status is unavailable.' })
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  const refreshGallery = React.useCallback(async () => {
    setGalleryLoading(true)
    try {
      const items = await listVaultMedia('image', GENERATED_BUDDY_FOLDER)
      const resolved = await Promise.all(items.slice(0, 24).map(async (item) => ({
        item,
        url: await vaultItemUrl(item).catch(() => null),
      })))
      setGallery(resolved)
    } catch {
      setGallery([])
    } finally {
      setGalleryLoading(false)
    }
  }, [])

  React.useEffect(() => { void refreshStatus(); void refreshGallery() }, [refreshStatus, refreshGallery])

  const sessionToken = async () => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error('Sign in again to generate a character.')
    return token
  }

  const archiveResult = async (payload: GenerationReply, source: ProviderName, pngBlob: Blob) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const file = new File([pngBlob], `desktop-buddy-${source}-${timestamp}.png`, { type: 'image/png' })
    await uploadVaultMedia(file, {
      kind: 'image',
      title: `Desktop Buddy · ${payload.model || payload.provider || source}`,
      description: `AI-generated Desktop Buddy from ${source}. ${TRANSPARENT_PNG_REQUIREMENT}`,
      folder: GENERATED_BUDDY_FOLDER,
      metadata: {
        source: 'desktop-buddy-generator',
        generator_provider: payload.provider || source,
        model: payload.model || null,
        provider_model: payload.providerModel || null,
        request_id: payload.requestId || null,
        bridge_job_id: payload.bridgeJobId || null,
        prompt: prompt.trim(),
        transparent_png_required: true,
        provenance: payload.provenance || null,
      },
    })
    await refreshGallery()
  }

  const acceptResult = async (payload: GenerationReply, source: ProviderName) => {
    if (!payload.imageDataUrl) throw new Error(payload.error || 'Character generation did not return an image.')
    const provenance = payload.provenance || {
      source: 'desktop-buddy-generator',
      provider: payload.provider || source,
      model: payload.model || '',
      bridgeJobId: payload.bridgeJobId || undefined,
      generatedAt: new Date().toISOString(),
    }
    const normalized = await dataUrlToPng(payload.imageDataUrl)
    const normalizedPayload = { ...payload, imageDataUrl: normalized.dataUrl, mimeType: 'image/png', sizeBytes: normalized.blob.size, provenance }
    setResult(normalizedPayload)
    try {
      await archiveResult(normalizedPayload, source, normalized.blob)
      setMessage(`Generated with ${payload.provider || source} · ${payload.model || 'provider model'} · normalized to PNG · saved in Media Vault / Desktop Buddies.`)
    } catch (archiveError) {
      setMessage(`Generated with ${payload.provider || source}, but Media Vault archive failed: ${archiveError instanceof Error ? archiveError.message : 'unknown error'}`)
    }
  }

  const generateHuggingFace = async () => {
    const token = await sessionToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    const personal = loadPersonalHfTokens()
    if (personal.length) headers['x-hf-tokens'] = personal.join(',')
    const response = await fetch('/api/desktop-buddy-image', { method: 'POST', headers, body: JSON.stringify({ prompt: prompt.trim() }) })
    const payload = await response.json().catch(() => ({})) as GenerationReply
    if (!response.ok) throw new Error(payload.error || 'Hugging Face character generation failed.')
    await acceptResult(payload, 'huggingface')
  }

  const generateVertex = async () => {
    const token = await sessionToken()
    const clientRequestId = pendingVertexRequest || crypto.randomUUID()
    if (!pendingVertexRequest) {
      localStorage.setItem(VERTEX_REQUEST_KEY, clientRequestId)
      setPendingVertexRequest(clientRequestId)
    }
    const response = await fetch('/api/desktop-buddy-vertex', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ prompt: `${prompt.trim()}\n\n${TRANSPARENT_PNG_REQUIREMENT}`, clientRequestId }),
    })
    const payload = await response.json().catch(() => ({})) as GenerationReply
    if (payload.bridgeJobId) {
      localStorage.setItem(VERTEX_RECOVERY_KEY, payload.bridgeJobId)
      setLastVertexJob(payload.bridgeJobId)
    }
    if (!response.ok) throw new Error(payload.error || 'Vertex AI character generation failed.')
    if (payload.status === 'failed') {
      localStorage.removeItem(VERTEX_REQUEST_KEY)
      setPendingVertexRequest('')
      throw new Error('Vertex job failed. The next Generate action may safely start a new request.')
    }
    if (payload.status && payload.status !== 'complete') throw new Error(`Vertex job is ${payload.status}. Use Recover Vertex job instead of starting another paid request.`)
    localStorage.removeItem(VERTEX_REQUEST_KEY)
    setPendingVertexRequest('')
    await acceptResult(payload, 'vertex')
  }

  const generate = async () => {
    if (prompt.trim().length < 8 || generating) return
    setGenerating(true)
    setResult(null)
    setMessage(provider === 'vertex' ? 'Starting one idempotent private Vertex job…' : 'Contacting the server-side Hugging Face provider rotation…')
    try {
      if (provider === 'vertex') await generateVertex()
      else await generateHuggingFace()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Character generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  const recoverVertex = async () => {
    if (!lastVertexJob || generating) return
    setGenerating(true)
    setMessage('Recovering the existing private Vertex job. No new image request is being created…')
    try {
      const token = await sessionToken()
      const response = await fetch(`/api/desktop-buddy-vertex?id=${encodeURIComponent(lastVertexJob)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      const payload = await response.json().catch(() => ({})) as GenerationReply
      if (!response.ok) throw new Error(payload.error || 'Could not recover the Vertex job.')
      if (payload.status === 'failed') {
        localStorage.removeItem(VERTEX_REQUEST_KEY)
        setPendingVertexRequest('')
        throw new Error('The existing Vertex job failed. The next Generate action may safely start a new request.')
      }
      if (payload.status !== 'complete') throw new Error(`Vertex job is ${payload.status || 'still running'}. Try recovery again later; do not start a duplicate request.`)
      localStorage.removeItem(VERTEX_REQUEST_KEY)
      setPendingVertexRequest('')
      await acceptResult(payload, 'vertex')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not recover the Vertex job.')
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
        assetLabel: `Generated Desktop Buddy · ${result.model || result.provider || 'AI'}`,
        assetSourceUrl: '',
        assetLicense: 'AI-generated character · review applicable provider terms before redistribution',
        generatedProvenance: result.provenance || {},
      }))
      window.dispatchEvent(new Event('appforge:desktop-buddy-updated'))
      setMessage('Generated PNG is now the active floating Desktop Buddy and remains archived in Media Vault.')
    } catch {
      setMessage('The generated image could not be stored in this browser. It remains archived in Media Vault if the archive step succeeded.')
    }
  }

  const useGalleryBuddy = async (buddy: GalleryBuddy) => {
    if (!buddy.url) return
    try {
      const raw = localStorage.getItem(BUDDY_STORAGE_KEY)
      const current = raw ? JSON.parse(raw) : {}
      localStorage.setItem(BUDDY_STORAGE_KEY, JSON.stringify({
        ...current,
        imageDataUrl: buddy.url,
        assetLabel: buddy.item.title || buddy.item.file_name || 'Generated Desktop Buddy',
        assetSourceUrl: '',
        assetLicense: 'AI-generated character · stored in your Media Vault',
        generatedProvenance: buddy.item.metadata?.provenance || {},
      }))
      window.dispatchEvent(new Event('appforge:desktop-buddy-updated'))
      setMessage('Saved Desktop Buddy selected from your Media Vault gallery.')
    } catch {
      setMessage('Could not make that saved character active in this browser.')
    }
  }

  const personalTokens = loadPersonalHfTokens().length
  const selectedReady = provider === 'vertex' ? Boolean(vertexStatus?.configured) : Boolean(hfStatus?.configured || personalTokens)

  return (
    <section className="mx-auto w-full max-w-6xl space-y-5" aria-label="Desktop Buddy AI provider lab">
      <div className="rounded-3xl border bg-card p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2"><Sparkles className="h-5 w-5" /><h2 className="text-lg font-semibold">AI character generator</h2></div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Choose Hugging Face or the private Vertex AI bridge. Every generation is normalized to a PNG and archived to your private Desktop Buddies Media Vault folder.</p>
          </div>
          <button type="button" onClick={() => void refreshStatus()} disabled={loadingStatus} className="inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold hover:bg-accent disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loadingStatus ? 'animate-spin' : ''}`} /> Provider status</button>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Locked output rule:</strong> {TRANSPARENT_PNG_REQUIREMENT} This requirement is appended by the server for Hugging Face and by the client bridge for Vertex, so it does not depend on the editable prompt.</div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <button type="button" onClick={() => setProvider('huggingface')} className={`rounded-2xl border p-3 text-left ${provider === 'huggingface' ? 'ring-2 ring-primary/30' : 'bg-background/45'}`}>
            <p className="text-xs font-semibold">Hugging Face</p>
            <p className="mt-1 text-xs text-muted-foreground">{hfStatus === null ? 'Checking deployment…' : hfStatus.configured ? 'Shared server token configured' : personalTokens ? 'Use your personal HF token' : 'Shared token not detected'}</p>
          </button>
          <button type="button" onClick={() => setProvider('vertex')} className={`rounded-2xl border p-3 text-left ${provider === 'vertex' ? 'ring-2 ring-primary/30' : 'bg-background/45'}`}>
            <p className="flex items-center gap-1.5 text-xs font-semibold"><Cloud className="h-3.5 w-3.5" /> Vertex AI</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{vertexStatus === null ? 'Checking secure bridge…' : vertexStatus.configured ? `Secure bridge configured · ${vertexStatus.model || 'Gemini Image'}` : 'Bridge code ready; production WIF/IAM values still required'}</p>
          </button>
          <div className="rounded-2xl border bg-background/45 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold"><KeyRound className="h-3.5 w-3.5" /> Personal HF</p>
            <p className="mt-1 text-xs text-muted-foreground">{personalTokens ? `${personalTokens} local token${personalTokens === 1 ? '' : 's'} available from Story Studio` : 'Optional; configure in Story Studio provider settings'}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-muted-foreground">Character prompt
              <textarea value={prompt} maxLength={900} onChange={(event) => setPrompt(event.target.value)} className="mt-1 min-h-28 w-full rounded-2xl border bg-background p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/25" />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => void generate()} disabled={generating || prompt.trim().length < 8 || !selectedReady} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} {generating ? 'Working…' : provider === 'vertex' ? 'Generate with Vertex AI' : 'Generate with Hugging Face'}</button>
              {lastVertexJob && <button type="button" onClick={() => void recoverVertex()} disabled={generating} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold hover:bg-accent disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Recover Vertex job</button>}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">{provider === 'vertex' ? pendingVertexRequest ? 'A Vertex request key is pending. Generate will safely replay that same request until it resolves; recovery never starts a second paid image.' : 'Vertex jobs are owner-scoped and idempotent. Recovery checks the existing Cloud Run job instead of starting another paid image.' : hfStatus?.sharedQuota || 'Explicit request only; no automatic retry.'}</p>
            <p aria-live="polite" className="text-xs leading-5 text-muted-foreground">{message}</p>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-muted/30">
            <div className="grid aspect-square place-items-center p-3">{result?.imageDataUrl ? <img src={result.imageDataUrl} alt="Generated Desktop Buddy character" className="max-h-full max-w-full object-contain" /> : <div className="px-6 text-center text-xs leading-5 text-muted-foreground">Generated character preview appears here. Nothing is generated until you press a provider button.</div>}</div>
            {result?.imageDataUrl && <div className="grid grid-cols-2 gap-2 border-t p-3"><button type="button" onClick={useResult} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold hover:bg-accent"><Check className="h-3.5 w-3.5" /> Use in Buddy</button><button type="button" onClick={() => downloadDataUrl(result.imageDataUrl!, 'desktop-buddy-generated.png')} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold hover:bg-accent"><Download className="h-3.5 w-3.5" /> PNG</button></div>}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><div className="flex items-center gap-2"><Images className="h-5 w-5" /><h2 className="font-semibold">Your generated buddies</h2></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Private per-user gallery from Media Vault / Desktop Buddies. The newest 24 generations are shown here.</p></div>
          <div className="flex gap-2"><button type="button" onClick={() => void refreshGallery()} disabled={galleryLoading} className="inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold hover:bg-accent disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${galleryLoading ? 'animate-spin' : ''}`} /> Refresh</button><a href="/apps/media-vault" className="inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold hover:bg-accent"><FolderOpen className="h-3.5 w-3.5" /> Media Vault</a></div>
        </div>
        {galleryLoading && !gallery.length ? <div className="mt-4 rounded-2xl border bg-background/35 p-8 text-center text-xs text-muted-foreground">Loading your generated buddies…</div> : gallery.length ? <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">{gallery.map((buddy) => <button key={buddy.item.id} type="button" onClick={() => void useGalleryBuddy(buddy)} className="group overflow-hidden rounded-2xl border bg-background/35 text-left hover:border-foreground/25"><div className="grid aspect-square place-items-center overflow-hidden bg-muted/30">{buddy.url ? <img src={buddy.url} alt={buddy.item.title || 'Generated Desktop Buddy'} loading="lazy" className="h-full w-full object-contain p-2" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" />}</div><div className="p-2"><p className="truncate text-[11px] font-medium">{buddy.item.title || 'Generated Buddy'}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{new Date(buddy.item.created_at).toLocaleDateString()}</p></div></button>)}</div> : <div className="mt-4 rounded-2xl border bg-background/35 p-8 text-center text-xs text-muted-foreground">No archived generations yet. Your next successful generation will be saved here automatically.</div>}
      </div>
    </section>
  )
}

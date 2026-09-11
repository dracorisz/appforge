import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ExternalLink, Image as ImageIcon, Loader2, MessageSquareText, Sparkles } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { supabase, SUPABASE_PROJECT_URL } from '@/lib/supabase'
import { ManagedGalleryStrip } from './ManagedGalleryStrip'
import { PublicHeader } from './PublicHeader'

export type PublicDragonAsset = {
  id: string
  display_name: string | null
  avatar_url: string | null
  title: string | null
  storage_path: string | null
  external_url: string | null
  prompt: string | null
  model: string | null
  generated_at: string
  metadata: Record<string, unknown>
}

const GAME_MASTER_MODELS = [
  { id: 'openai/gpt-oss-20b:fastest', role: 'Primary narrative model', note: 'Fast Hugging Face Inference Providers route for normal story turns.' },
  { id: 'Qwen/Qwen2.5-7B-Instruct-1M:fastest', role: 'Long-context fallback', note: 'Instruction-following fallback for continuity-heavy story turns.' },
  { id: 'google/gemma-2-2b-it:fastest', role: 'Compact fallback', note: 'Small instruction-tuned fallback when larger providers are unavailable.' },
  { id: 'openai/gpt-oss-120b:cheapest', role: 'Capability fallback', note: 'Larger open-weight fallback after the faster options.' },
]

const IMAGE_MODELS = [
  { id: 'black-forest-labs/FLUX.1-schnell', role: 'Primary scene renderer', note: 'Fast renderer; AppForge resolves its live Hugging Face provider mappings before generation.' },
  { id: 'ByteDance/Hyper-SD', role: 'Fast diffusion fallback', note: 'Secondary image model used when FLUX providers are unavailable or exhausted.' },
  { id: 'stabilityai/stable-diffusion-xl-base-1.0', role: 'Compatibility fallback', note: 'Established SDXL fallback retained for broad provider compatibility.' },
]

const IMAGE_PROVIDERS = ['fal-ai', 'replicate', 'together', 'nscale', 'hf-inference']
const wrap = (value: number, length: number) => length ? (value + length) % length : 0

const publicAssetUrl = (asset: PublicDragonAsset) => {
  if (asset.storage_path) return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/dragon-arena-assets/${asset.storage_path}`
  return asset.external_url || ''
}

const formatBytes = (value: unknown) => {
  const bytes = Number(value || 0)
  if (!bytes) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const metaText = (asset: PublicDragonAsset) => {
  const provider = typeof asset.metadata?.provider === 'string' ? asset.metadata.provider : 'huggingface'
  const mime = typeof asset.metadata?.mime_type === 'string' ? asset.metadata.mime_type : null
  const size = formatBytes(asset.metadata?.size_bytes)
  const turn = Number(asset.metadata?.turn_number || 0)
  return [provider, mime, size, turn > 0 ? `turn ${turn}` : null].filter(Boolean).join(' · ')
}

function CarouselCard({ asset, active, onSelect }: { asset: PublicDragonAsset; active: boolean; onSelect: () => void }) {
  const src = publicAssetUrl(asset)
  const modelLabel = asset.model === 'unknown-legacy' ? 'Legacy model not recorded' : asset.model || 'Hugging Face image model'
  return (
    <button type="button" onClick={onSelect} className={`group relative shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#080d16] text-left shadow-[0_22px_80px_rgba(0,0,0,.38)] transition-all duration-500 ${active ? 'z-10 w-[78vw] max-w-3xl scale-100 opacity-100 md:w-[58vw]' : 'w-[52vw] max-w-xl scale-[.82] opacity-45 md:w-[34vw]'}`} aria-current={active ? 'true' : undefined}>
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        {src ? <img src={src} alt={asset.title || 'Story Studio generated scene'} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" loading="lazy" /> : <div className="flex h-full items-center justify-center text-white/35"><ImageIcon className="h-10 w-10" /></div>}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <div className="mb-2 flex flex-wrap gap-1.5"><Badge color="blue">Hugging Face</Badge><Badge color="slate">Story Studio</Badge></div>
          <h3 className={`${active ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'} line-clamp-2 font-semibold tracking-tight text-white`}>{asset.title || 'Story Studio scene'}</h3>
          {active && <p className="mt-1 text-[11px] text-white/55">{metaText(asset) || 'Generation metadata unavailable'}</p>}
        </div>
      </div>
      {active && <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-white/80">{asset.avatar_url ? <img src={asset.avatar_url} alt="" className="h-full w-full object-cover" /> : (asset.display_name || 'A').slice(0, 1).toUpperCase()}</div><div className="min-w-0"><div className="truncate text-xs font-medium text-white/85">{asset.display_name || 'AppForge creator'}</div><div className="truncate text-[10px] text-white/45">{modelLabel}</div></div></div>
        <span className="shrink-0 text-[10px] text-white/40">{new Date(asset.generated_at).toLocaleDateString()}</span>
      </div>}
    </button>
  )
}

function InfiniteShowcase({ assets }: { assets: PublicDragonAsset[] }) {
  const [index, setIndex] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  React.useEffect(() => {
    if (paused || assets.length < 2) return
    const timer = window.setInterval(() => setIndex((value) => wrap(value + 1, assets.length)), 5500)
    return () => window.clearInterval(timer)
  }, [assets.length, paused])
  React.useEffect(() => setIndex((value) => wrap(value, assets.length)), [assets.length])
  if (!assets.length) return <Card className="border-white/10 bg-white/[0.035] p-10 text-center text-sm text-white/45">No public creator-selected scenes yet.</Card>

  const positions = assets.length === 1 ? [0] : [-1, 0, 1]
  return (
    <div className="relative overflow-hidden py-7" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <div className="flex items-center justify-center gap-0 md:gap-2" aria-live="polite">
        {positions.map((offset) => {
          const assetIndex = wrap(index + offset, assets.length)
          const asset = assets[assetIndex]
          return <CarouselCard key={`${offset}-${asset.id}`} asset={asset} active={offset === 0} onSelect={() => setIndex(assetIndex)} />
        })}
      </div>
      {assets.length > 1 && <div className="mt-5 flex items-center justify-center gap-3"><button type="button" onClick={() => setIndex((value) => wrap(value - 1, assets.length))} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/75 hover:bg-white/10" aria-label="Previous scene"><ArrowLeft className="h-4 w-4" /></button><span className="min-w-16 text-center text-xs text-white/45">{index + 1} / {assets.length}</span><button type="button" onClick={() => setIndex((value) => wrap(value + 1, assets.length))} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/75 hover:bg-white/10" aria-label="Next scene"><ArrowRight className="h-4 w-4" /></button></div>}
    </div>
  )
}

export function HuggingFaceGalleryPage() {
  const [assets, setAssets] = React.useState<PublicDragonAsset[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true); setError('')
      const { data, error: rpcError } = await supabase.rpc('dragon_arena_public_gallery', { limit_count: 60 })
      if (!active) return
      if (rpcError) setError(rpcError.message); else setAssets((data || []) as PublicDragonAsset[])
      setLoading(false)
    }
    void load(); return () => { active = false }
  }, [])

  return (
    <div className="dark min-h-screen bg-black text-foreground" style={{ colorScheme: 'dark', '--background': '0 0% 0%' } as React.CSSProperties}>
      <PublicHeader />

      <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-border/70 bg-background/55 p-5"><div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground"><Sparkles className="h-4 w-4" /> Hugging Face powered generation</div><h1 className="mt-2 text-3xl font-semibold tracking-tight">Story Studio × Hugging Face</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Story Studio uses Hugging Face for narrative generation and scene artwork. Generated scenes stay private by default; creators explicitly choose what appears here.</p><div className="mt-4 flex flex-wrap gap-2"><Link to="/apps/ai-dragon-arena" className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/65 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/55">Open Story Studio <ArrowRight className="h-4 w-4" /></Link><a href="https://huggingface.co/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/65 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/55"><ExternalLink className="h-4 w-4" /> Hugging Face</a></div></section>

        <ManagedGalleryStrip />

        <section><div className="mb-2 flex items-end justify-between gap-3"><div><h2 className="text-xl font-semibold tracking-tight">Public generated assets</h2><p className="mt-1 text-sm text-muted-foreground">Creator-selected scenes from Story Studio.</p></div><span className="text-xs text-muted-foreground">{assets.length} scenes</span></div>{error && <Card className="mb-4 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Could not load the public gallery: {error}</Card>}{loading ? <Card className="flex items-center justify-center gap-2 border-border/70 bg-background/55 p-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading public Story Studio assets…</Card> : <InfiniteShowcase assets={assets} />}</section>

        <section className="grid gap-4 lg:grid-cols-2"><Card className="border-border/70 bg-background/55 p-4"><div className="flex items-center gap-2 text-sm font-semibold"><MessageSquareText className="h-4 w-4" /> Story-model rotation</div><p className="mt-1 text-xs leading-5 text-muted-foreground">Shared requests rotate through available Hugging Face credentials and these text models until one succeeds.</p><div className="mt-3 space-y-2">{GAME_MASTER_MODELS.map((model, i) => <div key={model.id} className="rounded-xl border border-border/70 bg-black/20 p-3"><div className="font-mono text-xs">{i + 1}. {model.id}</div><div className="mt-1 text-xs font-medium">{model.role}</div><div className="mt-0.5 text-xs leading-5 text-muted-foreground">{model.note}</div></div>)}</div></Card><Card className="border-border/70 bg-background/55 p-4"><div className="flex items-center gap-2 text-sm font-semibold"><ImageIcon className="h-4 w-4" /> Scene-model + provider rotation</div><p className="mt-1 text-xs leading-5 text-muted-foreground">AppForge resolves each model’s current provider mapping and tries compatible providers within a bounded request.</p><div className="mt-3 space-y-2">{IMAGE_MODELS.map((model, i) => <div key={model.id} className="rounded-xl border border-border/70 bg-black/20 p-3"><div className="font-mono text-xs">{i + 1}. {model.id}</div><div className="mt-1 text-xs font-medium">{model.role}</div><div className="mt-0.5 text-xs leading-5 text-muted-foreground">{model.note}</div></div>)}</div><div className="mt-3 flex flex-wrap gap-1.5">{IMAGE_PROVIDERS.map((provider) => <Badge key={provider} color="slate">{provider}</Badge>)}</div></Card></section>
      </main>
    </div>
  )
}

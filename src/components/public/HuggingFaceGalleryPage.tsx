import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Image as ImageIcon, Loader2, MessageSquareText, Sparkles } from 'lucide-react'
import { Badge, BuildBadge, Card } from '@/components/ui'
import { supabase, SUPABASE_PROJECT_URL } from '@/lib/supabase'
import { StoryStudioTeaserCard } from './StoryStudioTeaserCard'

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

const PublicAssetCard = ({ asset }: { asset: PublicDragonAsset }) => {
  const src = publicAssetUrl(asset)
  const modelLabel = asset.model === 'unknown-legacy' ? 'Legacy model not recorded' : asset.model || 'Hugging Face image model'

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#080d16] shadow-[0_18px_70px_rgba(0,0,0,.28)] transition-transform duration-200 hover:-translate-y-0.5">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        {src ? <img src={src} alt={asset.title || 'Story Studio generated scene'} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center text-white/35"><ImageIcon className="h-10 w-10" /></div>}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <div className="mb-2 flex flex-wrap gap-1.5"><Badge color="purple">Hugging Face</Badge><Badge color="slate">Story Studio</Badge></div>
          <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-white sm:text-lg">{asset.title || 'Story Studio scene'}</h3>
          <p className="mt-1 text-[11px] text-white/55">{metaText(asset) || 'Generation metadata unavailable'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-white/80">{asset.avatar_url ? <img src={asset.avatar_url} alt="" className="h-full w-full object-cover" /> : (asset.display_name || 'A').slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0">
            <div className="truncate text-xs font-medium text-white/85">{asset.display_name || 'AppForge creator'}</div>
            <div className="truncate text-[10px] text-white/45">{modelLabel}</div>
          </div>
        </div>
        <span className="shrink-0 text-[10px] text-white/40">{new Date(asset.generated_at).toLocaleDateString()}</span>
      </div>
      {asset.prompt && <div className="border-t border-white/10 px-4 py-3 text-[11px] leading-5 text-white/45"><p className="line-clamp-2">{asset.prompt}</p></div>}
    </article>
  )
}

export function HuggingFaceGalleryPage() {
  const [assets, setAssets] = React.useState<PublicDragonAsset[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      const { data, error: rpcError } = await supabase.rpc('dragon_arena_public_gallery', { limit_count: 60 })
      if (!active) return
      if (rpcError) setError(rpcError.message)
      else setAssets((data || []) as PublicDragonAsset[])
      setLoading(false)
    }
    void load()
    return () => { active = false }
  }, [])

  const firstFive = assets.slice(0, 5)
  const remaining = assets.slice(5)

  return (
    <div className="min-h-screen bg-[#060a11] text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060a11]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <img src="/favicon.svg" alt="AppForge" className="h-8 w-8 shrink-0" />
            <div className="min-w-0"><div className="truncate text-sm font-semibold text-white">AppForge × Hugging Face</div><div className="truncate text-[11px] text-white/45">Creator-selected Story Studio showcase</div></div>
          </Link>
          <div className="ml-auto flex items-center gap-2"><BuildBadge compact /><Link to="/apps/ai-dragon-arena" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white">Open Story Studio</Link></div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/50"><Sparkles className="h-4 w-4" /> Hugging Face powered generation</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Story Studio × Hugging Face</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">Story Studio uses Hugging Face for narrative generation and scene artwork. Image requests resolve each model’s current Hugging Face provider mapping and fail over across compatible providers rather than relying on one fixed image backend. Generated scenes stay private by default; creators explicitly choose which assets appear in this public showcase.</p>
          <div className="mt-4 flex flex-wrap gap-2"><Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10"><ArrowLeft className="h-4 w-4" /> Back to AppForge</Link><a href="https://huggingface.co/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10"><ExternalLink className="h-4 w-4" /> Hugging Face</a></div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="border-white/10 bg-white/[0.035] p-4 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold"><MessageSquareText className="h-4 w-4" /> Story-model rotation</div>
            <p className="mt-1 text-xs leading-5 text-white/50">Shared requests rotate through `HF_TOKEN_1/2/3`, then through these models until one succeeds. Story Studio can also rotate up to three personal HF tokens. `HF_TEXT_MODEL` can prepend an override.</p>
            <div className="mt-3 space-y-2">{GAME_MASTER_MODELS.map((model, index) => <div key={model.id} className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="flex items-start gap-2"><span className="rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/45">{index + 1}</span><div className="min-w-0"><div className="break-all font-mono text-xs font-medium text-white/85">{model.id}</div><div className="mt-1 text-xs font-medium text-white/70">{model.role}</div><div className="mt-0.5 text-xs leading-5 text-white/45">{model.note}</div></div></div></div>)}</div>
          </Card>

          <Card className="border-white/10 bg-white/[0.035] p-4 text-white">
            <div className="flex items-center gap-2 text-sm font-semibold"><ImageIcon className="h-4 w-4" /> Scene-model + provider rotation</div>
            <p className="mt-1 text-xs leading-5 text-white/50">`HF_IMAGE_MODEL` can prepend an override. For each model AppForge checks its live Hugging Face provider mapping and tries supported providers within one bounded generation request.</p>
            <div className="mt-3 space-y-2">{IMAGE_MODELS.map((model, index) => <div key={model.id} className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="flex items-start gap-2"><span className="rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/45">{index + 1}</span><div className="min-w-0"><div className="break-all font-mono text-xs font-medium text-white/85">{model.id}</div><div className="mt-1 text-xs font-medium text-white/70">{model.role}</div><div className="mt-0.5 text-xs leading-5 text-white/45">{model.note}</div></div></div></div>)}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">{IMAGE_PROVIDERS.map((provider) => <Badge key={provider} color="slate">{provider}</Badge>)}</div>
          </Card>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-xl font-semibold tracking-tight text-white">Public generated assets</h2><p className="mt-1 text-sm text-white/45">Creator-selected scenes plus one curated Story Studio generation teaser.</p></div><span className="text-xs text-white/40">{assets.length + 1} showcase items</span></div>
          {error && <Card className="mb-4 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Could not load the public gallery: {error}</Card>}
          {loading ? (
            <Card className="flex items-center justify-center gap-2 border-white/10 bg-white/[0.035] p-10 text-sm text-white/45"><Loader2 className="h-4 w-4 animate-spin" /> Loading public Story Studio assets…</Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {firstFive.map((asset) => <PublicAssetCard key={asset.id} asset={asset} />)}
              <StoryStudioTeaserCard />
              {remaining.map((asset) => <PublicAssetCard key={asset.id} asset={asset} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Image as ImageIcon, Loader2, MessageSquareText, Sparkles } from 'lucide-react'
import { BuildBadge, Card } from '@/components/ui'
import { supabase, SUPABASE_PROJECT_URL } from '@/lib/supabase'

export type PublicDragonAsset = {
  id: string
  display_name: string | null
  avatar_url: string | null
  title: string | null
  storage_path: string | null
  external_url: string | null
  prompt: string | null
  model: string | null
  created_at: string
}

const GAME_MASTER_MODELS = [
  { id: 'openai/gpt-oss-20b:fastest', role: 'Primary narrative model', note: 'Fast Hugging Face Inference Providers route for normal game turns.' },
  { id: 'Qwen/Qwen2.5-7B-Instruct-1M:fastest', role: 'Long-context fallback', note: 'Strong instruction-following model for continuity-heavy turns.' },
  { id: 'google/gemma-2-2b-it:fastest', role: 'Compact fallback', note: 'Small instruction-tuned fallback when larger providers are unavailable.' },
  { id: 'openai/gpt-oss-120b:cheapest', role: 'Capability fallback', note: 'Larger open-weight model tried after the faster options.' },
]

const IMAGE_MODELS = [
  { id: 'black-forest-labs/FLUX.1-schnell', role: 'Primary scene renderer', note: 'Fast text-to-image model used for Dragon Arena fantasy scenes.' },
  { id: 'stabilityai/stable-diffusion-xl-base-1.0', role: 'Compatibility fallback', note: 'Stable Diffusion XL fallback for the HF Inference image route.' },
]

const publicAssetUrl = (asset: PublicDragonAsset) => {
  if (asset.storage_path) return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/dragon-arena-assets/${asset.storage_path}`
  return asset.external_url || ''
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <img src="/favicon.svg" alt="AppForge" className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">AppForge × Hugging Face</div>
              <div className="truncate text-[11px] text-muted-foreground">Dragon Arena public showcase</div>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <BuildBadge compact />
            <Link to="/apps/ai-dragon-arena" className="rounded-lg border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium hover:bg-accent">Play Dragon Arena</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-border/70 bg-card/70 p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground"><Sparkles className="h-4 w-4" /> Hugging Face powered generation</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Dragon Arena × Hugging Face</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Dragon Arena uses Hugging Face for both the primary game-master rotation and cinematic scene generation. Requests rotate across configured server tokens and model/provider policies. If every remote GM route is unavailable, the game keeps continuity with a clearly identified local fallback instead of ending on a provider-limit error.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium hover:bg-accent"><ArrowLeft className="h-4 w-4" /> Back to AppForge</Link>
            <a href="https://huggingface.co/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium hover:bg-accent"><ExternalLink className="h-4 w-4" /> Hugging Face</a>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><MessageSquareText className="h-4 w-4" /> Game-master rotation</div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Requests rotate through `HF_TOKEN_1/2/3`, then through these models until one succeeds. Policy suffixes deliberately vary provider routing. `HF_TEXT_MODEL` can prepend an override.</p>
            <div className="mt-3 space-y-2">{GAME_MASTER_MODELS.map((model, index) => <div key={model.id} className="rounded-xl border border-border/70 bg-background/35 p-3"><div className="flex items-start gap-2"><span className="rounded-md border border-border/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{index + 1}</span><div className="min-w-0"><div className="break-all font-mono text-xs font-medium">{model.id}</div><div className="mt-1 text-xs font-medium text-foreground/80">{model.role}</div><div className="mt-0.5 text-xs leading-5 text-muted-foreground">{model.note}</div></div></div></div>)}</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><ImageIcon className="h-4 w-4" /> Scene-model rotation</div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Scene requests rotate through Hugging Face tokens and these HF Inference-compatible models. The deprecated SD3-medium default has been removed. `HF_IMAGE_MODEL` can prepend an override.</p>
            <div className="mt-3 space-y-2">{IMAGE_MODELS.map((model, index) => <div key={model.id} className="rounded-xl border border-border/70 bg-background/35 p-3"><div className="flex items-start gap-2"><span className="rounded-md border border-border/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{index + 1}</span><div className="min-w-0"><div className="break-all font-mono text-xs font-medium">{model.id}</div><div className="mt-1 text-xs font-medium text-foreground/80">{model.role}</div><div className="mt-0.5 text-xs leading-5 text-muted-foreground">{model.note}</div></div></div></div>)}</div>
          </Card>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-xl font-semibold tracking-tight">Public generated assets</h2><p className="mt-1 text-sm text-muted-foreground">Up to three showcased Dragon Arena scenes per user.</p></div><span className="text-xs text-muted-foreground">{assets.length} assets</span></div>
          {error && <Card className="mb-4 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Could not load the public gallery: {error}</Card>}
          {loading ? (
            <Card className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading public Dragon Arena assets…</Card>
          ) : assets.length === 0 ? (
            <Card className="p-10 text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-3 text-sm font-semibold">No public scenes yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Generate a scene in Dragon Arena to seed the showcase.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset) => {
                const src = publicAssetUrl(asset)
                return (
                  <Card key={asset.id} className="overflow-hidden p-0">
                    <div className="aspect-[4/3] bg-muted">
                      {src ? <img src={src} alt={asset.title || 'Dragon Arena generated scene'} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted text-[10px] font-semibold">{asset.avatar_url ? <img src={asset.avatar_url} alt="" className="h-full w-full object-cover" /> : (asset.display_name || 'A').slice(0, 1).toUpperCase()}</div>
                        <div className="min-w-0"><div className="truncate text-xs font-medium">{asset.display_name || 'AppForge adventurer'}</div><div className="truncate text-[10px] text-muted-foreground">{asset.model || 'Hugging Face image model'}</div></div>
                      </div>
                      <h3 className="mt-3 text-sm font-semibold">{asset.title || 'Dragon Arena scene'}</h3>
                      {asset.prompt && <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">{asset.prompt}</p>}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

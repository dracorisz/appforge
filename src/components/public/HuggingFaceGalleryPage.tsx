import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react'
import { BuildBadge, Card } from '@/components/ui'
import { supabase, SUPABASE_PROJECT_URL } from '@/lib/supabase'

export type PublicDragonAsset = {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  title: string | null
  storage_path: string | null
  external_url: string | null
  prompt: string | null
  model: string | null
  created_at: string
}

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
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Dragon Arena image gallery</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Generated scenes are created through the Hugging Face inference stack. Each adventurer can showcase up to their first three public Dragon Arena scenes here; the rest of their gallery remains visible only to that signed-in owner unless they explicitly publish more.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium hover:bg-accent"><ArrowLeft className="h-4 w-4" /> Back to AppForge</Link>
            <a href="https://huggingface.co/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium hover:bg-accent"><ExternalLink className="h-4 w-4" /> Hugging Face</a>
          </div>
        </section>

        {error && <Card className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Could not load the public gallery: {error}</Card>}
        {loading ? (
          <Card className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading public Dragon Arena assets…</Card>
        ) : assets.length === 0 ? (
          <Card className="p-10 text-center">
            <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-3 text-sm font-semibold">No public scenes yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Generate a scene in Dragon Arena to seed the showcase.</p>
          </Card>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium">{asset.display_name || 'AppForge adventurer'}</div>
                        <div className="truncate text-[10px] text-muted-foreground">{asset.model || 'Hugging Face image model'}</div>
                      </div>
                    </div>
                    <h2 className="mt-3 text-sm font-semibold">{asset.title || 'Dragon Arena scene'}</h2>
                    {asset.prompt && <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">{asset.prompt}</p>}
                  </div>
                </Card>
              )
            })}
          </section>
        )}
      </main>
    </div>
  )
}

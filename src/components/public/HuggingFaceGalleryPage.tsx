import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink, Image as ImageIcon, Loader2, MessageSquareText, Sparkles } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { supabase, SUPABASE_PROJECT_URL } from "@/lib/supabase";
import { FRONTEND_CONTENT_UPDATED_EVENT, loadPublishedFrontendContent } from "@/lib/frontendContent";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

export type PublicDragonAsset = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  title: string | null;
  storage_path: string | null;
  external_url: string | null;
  prompt: string | null;
  model: string | null;
  generated_at: string;
  metadata: Record<string, unknown>;
};

const GAME_MASTER_MODELS = [
  { id: "openai/gpt-oss-20b:fastest", role: "Primary narrative model", note: "Fast Hugging Face Inference Providers route for normal story turns." },
  { id: "Qwen/Qwen2.5-7B-Instruct-1M:fastest", role: "Long-context fallback", note: "Instruction-following fallback for continuity-heavy story turns." },
  { id: "google/gemma-2-2b-it:fastest", role: "Compact fallback", note: "Small instruction-tuned fallback when larger providers are unavailable." },
  { id: "openai/gpt-oss-120b:cheapest", role: "Capability fallback", note: "Larger open-weight fallback after the faster options." },
];

const IMAGE_MODELS = [
  { id: "black-forest-labs/FLUX.1-schnell", role: "Primary scene renderer", note: "Fast renderer; AppForge resolves its live Hugging Face provider mappings before generation." },
  { id: "ByteDance/Hyper-SD", role: "Fast diffusion fallback", note: "Secondary image model used when FLUX providers are unavailable or exhausted." },
  { id: "stabilityai/stable-diffusion-xl-base-1.0", role: "Compatibility fallback", note: "Established SDXL fallback retained for broad provider compatibility." },
];

const IMAGE_PROVIDERS = ["fal-ai", "replicate", "together", "nscale", "hf-inference"];
const wrap = (value: number, length: number) => (length ? (value + length) % length : 0);

const publicAssetUrl = (asset: PublicDragonAsset) => {
  if (asset.storage_path) return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/dragon-arena-assets/${asset.storage_path}`;
  return asset.external_url || "";
};

const formatBytes = (value: unknown) => {
  const bytes = Number(value || 0);
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const metaText = (asset: PublicDragonAsset) => {
  const provider = typeof asset.metadata?.provider === "string" ? asset.metadata.provider : "huggingface";
  const mime = typeof asset.metadata?.mime_type === "string" ? asset.metadata.mime_type : null;
  const size = formatBytes(asset.metadata?.size_bytes);
  const turn = Number(asset.metadata?.turn_number || 0);
  return [provider, mime, size, turn > 0 ? `turn ${turn}` : null].filter(Boolean).join(" · ");
};

function CarouselCard({ asset, active, onSelect }: { asset: PublicDragonAsset; active: boolean; onSelect: () => void }) {
  const src = publicAssetUrl(asset);
  const modelLabel = asset.model === "unknown-legacy" ? "Legacy model not recorded" : asset.model || "Hugging Face image model";
  return (
    <Button
      type="button"
      onClick={onSelect}
      className={`group relative shrink-0 cursor-pointer overflow-hidden rounded-xl border border-inverse/10 bg-[#080d16] text-left transition-all duration-500 ${active ? "z-10 w-[78vw] max-w-3xl scale-100 opacity-100 md:w-[58vw]" : "w-[52vw] max-w-xl scale-[.82] opacity-45 md:w-[34vw]"}`}
      aria-current={active ? "true" : undefined}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {src ? (
          <img src={src} alt={asset.title || "Story Studio generated scene"} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-inverse/35">
            <ImageIcon className="h-9 w-9" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-overlay/95 via-overlay/15 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge color="blue">Hugging Face</Badge>
            <Badge color="slate">Story Studio</Badge>
          </div>
          <h3 className={`${active ? "text-lg sm:text-lg" : "text-sm sm:text-sm"} line-clamp-2 font-semibold tracking-tight text-inverse`}>{asset.title || "Story Studio scene"}</h3>
          {active && <p className="mt-2 text-sm text-inverse/55">{metaText(asset) || "Generation metadata unavailable"}</p>}
        </div>
      </div>
      {active && (
        <div className="flex items-center justify-between gap-4 border-t border-inverse/10 px-4 py-2">
          <div className="min-w-0 truncate text-sm text-inverse/55">
            Model: <span className="text-inverse/80">{modelLabel}</span>
          </div>
          <span className="shrink-0 text-sm text-inverse/40">{new Date(asset.generated_at).toLocaleDateString()}</span>
        </div>
      )}
    </Button>
  );
}

function InfiniteShowcase({ assets }: { assets: PublicDragonAsset[] }) {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  React.useEffect(() => {
    if (paused || assets.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => wrap(value + 1, assets.length)), 5500);
    return () => window.clearInterval(timer);
  }, [assets.length, paused]);
  React.useEffect(() => setIndex((value) => wrap(value, assets.length)), [assets.length]);
  if (!assets.length) return <Card className="border-inverse/10 bg-inverse/[0.035] p-8 text-center text-sm text-inverse/45">No public creator-selected scenes yet.</Card>;

  const positions = assets.length === 1 ? [0] : [-1, 0, 1];
  return (
    <div className="relative overflow-hidden py-8" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <div className="flex items-center justify-center gap-2" aria-live="polite">
        {positions.map((offset) => {
          const assetIndex = wrap(index + offset, assets.length);
          const asset = assets[assetIndex];
          return <CarouselCard key={`${offset}-${asset.id}`} asset={asset} active={offset === 0} onSelect={() => setIndex(assetIndex)} />;
        })}
      </div>
      {assets.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <Button type="button" onClick={() => setIndex((value) => wrap(value - 1, assets.length))} className="cursor-pointer rounded-xl border border-inverse/10 bg-inverse/5 p-2 text-inverse/75 hover:bg-inverse/10" aria-label="Previous scene">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-16 text-center text-sm text-inverse/45">
            {index + 1} / {assets.length}
          </span>
          <Button type="button" onClick={() => setIndex((value) => wrap(value + 1, assets.length))} className="cursor-pointer rounded-xl border border-inverse/10 bg-inverse/5 p-2 text-inverse/75 hover:bg-inverse/10" aria-label="Next scene">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

const toManagedAsset = (item: Awaited<ReturnType<typeof loadPublishedFrontendContent>>[number]): PublicDragonAsset => ({
  id: `managed-${item.id}`,
  display_name: null,
  avatar_url: null,
  title: item.title,
  storage_path: null,
  external_url: item.image_url,
  prompt: item.summary,
  model: typeof item.metadata?.model === "string" ? item.metadata.model : "AppForge curated image",
  generated_at: item.updated_at,
  metadata: { ...item.metadata, provider: typeof item.metadata?.provider === "string" ? item.metadata.provider : "AppForge" },
});

export function HuggingFaceGalleryPage() {
  const [assets, setAssets] = React.useState<PublicDragonAsset[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [{ data, error: rpcError }, managed] = await Promise.all([supabase.rpc("dragon_arena_public_gallery", { limit_count: 60 }), loadPublishedFrontendContent("gallery_image")]);
      if (rpcError) throw rpcError;
      const gameAssets = (data || []) as PublicDragonAsset[];
      const managedAssets = managed.filter((item) => Boolean(item.image_url) && (!item.app_route || item.app_route === "/huggingface")).map(toManagedAsset);
      setAssets([...gameAssets, ...managedAssets]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the public gallery.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);
  React.useEffect(() => {
    const refresh = () => void load();
    window.addEventListener(FRONTEND_CONTENT_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(FRONTEND_CONTENT_UPDATED_EVENT, refresh);
  }, [load]);

  return (
    <div className="dark min-h-screen bg-overlay text-foreground" style={{ colorScheme: "dark", "--background": "0 0% 0%" } as React.CSSProperties}>
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8">
        <section className="rounded-xl border border-border bg-background/55 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4" /> Hugging Face powered generation
          </div>
          <h1 className="mt-2 text-lg font-semibold tracking-tight">Story Studio × Hugging Face</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Story Studio uses Hugging Face for narrative generation and scene artwork. Generated scenes stay private by default; creators explicitly choose what appears here.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/" className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background/65 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/55">
              Open Story Studio <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="https://huggingface.co/" target="_blank" rel="noreferrer" className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background/65 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/55">
              <ExternalLink className="h-4 w-4" /> Hugging Face
            </a>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Public generated assets</h2>
              <p className="mt-2 text-sm text-muted-foreground">One gallery for creator-selected Story Studio scenes and admin-managed images.</p>
            </div>
            <span className="text-sm text-muted-foreground">{assets.length} scenes</span>
          </div>
          {error && <Card className="mb-4 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Could not load the public gallery: {error}</Card>}
          {loading ? (
            <Card className="flex items-center justify-center gap-2 border-border bg-background/55 p-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading public Story Studio assets…
            </Card>
          ) : (
            <InfiniteShowcase assets={assets} />
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border bg-background/55 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquareText className="h-4 w-4" /> Story-model rotation
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Shared requests rotate through available Hugging Face credentials and these text models until one succeeds.</p>
            <div className="mt-4 space-y-2">
              {GAME_MASTER_MODELS.map((model, i) => (
                <div key={model.id} className="rounded-xl border border-border bg-overlay/20 p-4">
                  <div className="font-mono text-sm">
                    {i + 1}. {model.id}
                  </div>
                  <div className="mt-2 text-sm font-medium">{model.role}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{model.note}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="border-border bg-background/55 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ImageIcon className="h-4 w-4" /> Scene-model + provider rotation
            </div>
            <p className="mt-2 text-sm text-muted-foreground">AppForge resolves each model’s current provider mapping and tries compatible providers within a bounded request.</p>
            <div className="mt-4 space-y-2">
              {IMAGE_MODELS.map((model, i) => (
                <div key={model.id} className="rounded-xl border border-border bg-overlay/20 p-4">
                  <div className="font-mono text-sm">
                    {i + 1}. {model.id}
                  </div>
                  <div className="mt-2 text-sm font-medium">{model.role}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{model.note}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {IMAGE_PROVIDERS.map((provider) => (
                <Badge key={provider} color="slate">
                  {provider}
                </Badge>
              ))}
            </div>
          </Card>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

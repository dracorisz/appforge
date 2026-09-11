import React from 'react'
import { ArrowRight, Bot, BrainCircuit, Cloud, Code2, Cpu, KeyRound, Lock, Sparkles, WandSparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Card } from '@/components/ui'
import { DragonArenaIcon } from './DragonArenaIcon'

const integrations = [
  {
    name: 'Hugging Face',
    status: 'Active',
    icon: Cpu,
    description: 'Primary model-routing path for Story Studio text and scene generation, with provider-aware model resolution and optional personal tokens.',
  },
  {
    name: 'Gemini',
    status: 'Active fallback',
    icon: Sparkles,
    description: 'Gemini story generation and Google model experiments are supported through server-side and personal-key paths with bounded usage.',
  },
  {
    name: 'OpenRouter',
    status: 'Personal key',
    icon: BrainCircuit,
    description: 'Bring-your-own OpenRouter key support gives creators another model route without storing provider credentials in the public client bundle.',
  },
  {
    name: 'OpenAI / ChatGPT',
    status: 'Integration-ready',
    icon: Bot,
    description: 'AppForge keeps provider boundaries compatible with OpenAI-style text workflows while current Story Studio routing favors Hugging Face, Gemini and OpenRouter.',
  },
  {
    name: 'Google Cloud AI',
    status: 'Experiments',
    icon: Cloud,
    description: 'Private Cloud Run media-worker and Vertex AI experiments provide a path for image, story and agent workloads outside the browser.',
  },
  {
    name: 'Local continuity',
    status: 'Fallback',
    icon: Code2,
    description: 'A deterministic local continuity fallback keeps Story Studio responsive when external providers are unavailable or a shared quota is exhausted.',
  },
]

export function PF_GuestDragonArena() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-background">
        <img src="/Dragon Arena.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60" />
        <div className="relative max-w-3xl p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge color="slate">AI integrations</Badge>
            <Badge color="green">Story Studio private workspace</Badge>
          </div>
          <h1 className="mt-5 flex items-center gap-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            <DragonArenaIcon className="h-9 w-9" /> AppForge AI Studio
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            The public Dragon Arena guest game has been retired. This route now explains the AI provider layer behind AppForge: model routing, personal-key options, private server workers, graceful fallbacks and the integrations used by the signed-in Story Studio.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/login?returnTo=%2Fapps%2Fai-dragon-arena" className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:opacity-90">
              <Lock className="h-4 w-4" /> Open signed-in Story Studio
            </Link>
            <a href="https://dracorisz.github.io/appforge/AI-PROVIDERS" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-accent">
              AI provider docs <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Provider architecture</h2>
            <p className="mt-1 text-sm text-muted-foreground">Capabilities are explicit; provider secrets stay server-side or in user-controlled personal-key storage.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {integrations.map(({ name, status, icon: Icon, description }) => (
            <Card key={name} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background"><Icon className="h-5 w-5" /></span>
                <Badge color="slate">{status}</Badge>
              </div>
              <h3 className="mt-4 font-semibold">{name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <Card className="p-4"><KeyRound className="h-5 w-5" /><h3 className="mt-3 font-semibold">Bring your own provider</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Personal tokens can bypass shared quotas for supported providers without making those credentials part of AppForge's public configuration.</p></Card>
        <Card className="p-4"><WandSparkles className="h-5 w-5" /><h3 className="mt-3 font-semibold">Creator workflows</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Signed-in Story Studio combines narrative generation, scene creation, persistent sessions, asset continuity, Novel output and Comics output.</p></Card>
        <Card className="p-4"><Lock className="h-5 w-5" /><h3 className="mt-3 font-semibold">Private by default</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Public visitors see architecture and integration information only. Story generation, saved sessions, galleries and account data remain behind authentication.</p></Card>
      </section>
    </div>
  )
}

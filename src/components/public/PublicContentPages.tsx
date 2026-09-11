import React from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Clapperboard, FileText, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BUILD_INFO } from '@/lib/buildInfo'

const APPFORGE_MARK = '/favicon.svg?v=2'

type BlogArticle = {
  slug: string
  appName: string
  title: string
  description: string
  publishedAt: string
  readTime: string
  appRoute: string
  sections: Array<{ heading: string; body: string }>
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: 'desktop-buddy-your-ai-companion-on-the-desktop',
    appName: 'Desktop Buddy',
    title: 'Desktop Buddy: a small AI companion that lives with your workflow',
    description: 'How AppForge combines character assets, local optimization, voice-ready interactions and secure cloud image generation into a lightweight desktop companion.',
    publishedAt: 'September 2026',
    readTime: '4 min read',
    appRoute: '/apps/desktop-buddy',
    sections: [
      { heading: 'A character, not another dashboard', body: 'Desktop Buddy is designed around a persistent visual character that can react to agent responses without taking over the workspace. Character packs stay lightweight and are optimized into practical display sizes for fast PWA use.' },
      { heading: 'Local first where it matters', body: 'Asset resizing and format conversion can happen locally, while optional Hugging Face and Vertex AI providers are reserved for generation tasks that actually need cloud models. That keeps everyday interaction fast and avoids unnecessary inference cost.' },
      { heading: 'Built for safer cloud generation', body: 'The Vertex path is designed around short-lived identity rather than downloadable service-account keys. Requests use an idempotent job model so a browser timeout can be recovered without silently starting a second paid image generation.' },
    ],
  },
  {
    slug: 'getter-pro-capture-web-media-with-a-clear-storage-model',
    appName: 'Getter Pro',
    title: 'Getter Pro: capture web media without losing track of where it came from',
    description: 'A closer look at AppForge media discovery, the Media Vault handoff and the difference between storing a file and preserving a protected source URL.',
    publishedAt: 'September 2026',
    readTime: '4 min read',
    appRoute: '/apps/getter-pro',
    sections: [
      { heading: 'Discovery before download', body: 'Getter Pro focuses on identifying useful media and metadata first. That makes it possible to keep a useful record even when a source cannot or should not be downloaded directly.' },
      { heading: 'Media Vault as the durable handoff', body: 'Saved items belong in Media Vault with enough source information to understand what was captured later. For downloadable assets, the vault can point to persisted storage. For protected sources, the durable record should be the original URL and metadata rather than a misleading local-file claim.' },
      { heading: 'Clear feedback matters', body: 'A successful save needs to mean the item can actually be found again. AppForge is tightening that contract so the UI only reports success after the vault write is confirmed.' },
    ],
  },
  {
    slug: 'weather-now-fast-local-conditions-without-a-heavy-dashboard',
    appName: 'Weather Now',
    title: 'Weather Now: fast local conditions without a heavy dashboard',
    description: 'Why Weather Now keeps the primary forecast compact, supports quick city switching and brings the selected location into the AppForge sidebar.',
    publishedAt: 'September 2026',
    readTime: '3 min read',
    appRoute: '/apps/weather-now',
    sections: [
      { heading: 'Useful at a glance', body: 'Weather Now is built for the common case: open it, understand the current conditions, then get back to work. The interface prioritizes temperature, condition, location and near-term context rather than overwhelming the user with every possible chart.' },
      { heading: 'Cities as quick presets', body: 'City presets make regional checking faster, while the selected city can also drive the compact sidebar weather surface. The important detail is that the sidebar should follow the actual selected location rather than a stale label.' },
      { heading: 'Location is data, not a magic string', body: 'Location-aware requests should resolve coordinates or a real city before calling the weather provider. Treating a label such as “Your location” as an API location is brittle, so the app is moving toward explicit resolved-location state.' },
    ],
  },
  {
    slug: 'task-list-a-small-workspace-that-stays-out-of-the-way',
    appName: 'Task List',
    title: 'Task List: a small workspace that stays out of the way',
    description: 'The thinking behind a focused AppForge task surface: quick capture, clearer grouping and a layout that scales properly with the rest of the workspace.',
    publishedAt: 'September 2026',
    readTime: '3 min read',
    appRoute: '/apps/task-list',
    sections: [
      { heading: 'Fast capture wins', body: 'The core interaction should make adding and completing work nearly frictionless. Extra organization is useful only when it does not slow down that first capture step.' },
      { heading: 'Fit the workspace', body: 'A task app should not feel like a narrow widget dropped into a full-width product. AppForge is aligning Task List with the same content width, spacing and responsive behavior used by the rest of the workspace.' },
      { heading: 'Grow without becoming project-management software', body: 'The direction is richer filtering, grouping and useful task metadata while keeping the app lightweight. The goal is a dependable everyday list, not a second enterprise suite inside AppForge.' },
    ],
  },
  {
    slug: 'hugging-face-gallery-a-visible-home-for-generated-assets',
    appName: 'Hugging Face Gallery',
    title: 'Hugging Face Gallery: a visible home for generated AppForge assets',
    description: 'How the public gallery can turn generated images into reusable product content, with a curated slider managed separately from generation itself.',
    publishedAt: 'September 2026',
    readTime: '3 min read',
    appRoute: '/huggingface',
    sections: [
      { heading: 'Generation and presentation are different jobs', body: 'A model provider creates an image; the product still needs to decide which images deserve to be shown. The public gallery therefore benefits from a curated content layer instead of automatically exposing every generation.' },
      { heading: 'One reusable content source', body: 'The planned frontend content manager will let an admin choose gallery slider images, blog media and teaser content from one place. Public pages will consume only published entries, while editing remains behind authenticated admin controls.' },
      { heading: 'Ready for richer stories', body: 'Each blog article is structured to support an optional video walkthrough. That gives generated assets context and lets AppForge document an app with both written explanation and a practical demo.' },
    ],
  },
]

function PublicHeader({ section }: { section: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/landing" className="inline-flex items-center gap-3">
          <img src={APPFORGE_MARK} alt="AppForge" className="h-9 w-9 rounded-xl" />
          <div><div className="text-sm font-semibold">AppForge {section}</div><div className="text-xs text-muted-foreground">Build notes, app stories and product updates</div></div>
        </Link>
        <nav className="flex items-center gap-2 text-xs font-semibold">
          <Link to="/blog" className="rounded-lg border border-border/70 px-3 py-2 text-muted-foreground hover:text-foreground">Blog</Link>
          <Link to="/changelog" className="rounded-lg border border-border/70 px-3 py-2 text-muted-foreground hover:text-foreground">Changelog</Link>
          <Link to="/landing" className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Front</Link>
        </nav>
      </div>
    </header>
  )
}

export function PublicBlogPage() {
  React.useEffect(() => { document.title = 'AppForge Blog' }, [])
  return (
    <div className="dark min-h-dvh bg-black text-foreground" style={{ colorScheme: 'dark', '--background': '0 0% 0%' } as React.CSSProperties}>
      <PublicHeader section="Blog" />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="border-b border-border/60 pb-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"><Sparkles className="h-4 w-4" /> App stories</div>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Five practical looks inside AppForge.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">Short product articles covering how individual apps are designed, what they solve and where they are heading next. Each article is ready for an optional video walkthrough once the admin content manager is connected.</p>
        </section>
        <section className="grid gap-4 py-8 md:grid-cols-2">
          {BLOG_ARTICLES.map((article) => (
            <Link key={article.slug} to={`/blog/${article.slug}`} className="group flex min-h-64 flex-col rounded-2xl border border-border/70 bg-background/55 p-5 transition hover:-translate-y-0.5 hover:bg-accent/35">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{article.appName}</div>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">{article.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{article.description}</p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> {article.publishedAt} · {article.readTime}</span>
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">Read <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  )
}

export function PublicBlogArticlePage({ slug }: { slug: string }) {
  const article = BLOG_ARTICLES.find((item) => item.slug === slug)
  React.useEffect(() => { document.title = article ? `${article.title} · AppForge` : 'Article not found · AppForge' }, [article])
  if (!article) return <PublicBlogPage />
  return (
    <div className="dark min-h-dvh bg-black text-foreground" style={{ colorScheme: 'dark', '--background': '0 0% 0%' } as React.CSSProperties}>
      <PublicHeader section="Blog" />
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All articles</Link>
        <article className="mt-8">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{article.appName}</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{article.title}</h1>
          <p className="mt-5 text-base leading-8 text-muted-foreground">{article.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground"><span>{article.publishedAt}</span><span>{article.readTime}</span><Link to={article.appRoute} className="font-semibold text-foreground hover:underline">Open {article.appName}</Link></div>

          <div className="mt-8 rounded-2xl border border-dashed border-border/80 bg-background/45 p-6">
            <div className="flex items-center gap-2 font-semibold"><Clapperboard className="h-4 w-4" /> Video walkthrough</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">This slot is ready for the article video URL managed by the upcoming admin-only frontend content manager.</p>
          </div>

          <div className="mt-10 space-y-9">
            {article.sections.map((section) => <section key={section.heading}><h2 className="text-2xl font-semibold tracking-[-0.025em]">{section.heading}</h2><p className="mt-3 text-base leading-8 text-muted-foreground">{section.body}</p></section>)}
          </div>
        </article>
      </main>
    </div>
  )
}

const CHANGELOG_SECTIONS = [
  {
    version: '1.27.0',
    label: 'September 2026 release candidate',
    groups: [
      { title: 'Added', items: ['Public Apps directory at /explore with search, categories and access labels.', 'Desktop Buddy secure Vertex AI bridge with Vercel OIDC and Google Workload Identity Federation.', 'Owner-scoped idempotent Vertex bridge job ledger in Supabase.', 'Desktop Buddy Vertex provider controls, readiness state and recovery action.', 'Safe Vertex bridge status under Settings → Integrations.'] },
      { title: 'Improved', items: ['Story Studio and Desktop Buddy share the Hugging Face image-provider implementation.', 'Desktop Buddy keeps ambiguous worker timeouts recoverable without duplicate paid generation.', 'SEO and sitemap metadata now match current canonical public routes.', 'Supabase schema includes the owner-RLS Vertex bridge job table.'] },
      { title: 'Activation still required', items: ['Finish production Workload Identity review against real Vercel OIDC claims.', 'Apply least-privilege bridge IAM binding and production-only GCP bridge values.', 'Keep the private worker disabled until IAM and budget review, then perform one deliberate smoke test.', 'Deploy production only from a main commit that passes the complete release gate.'] },
    ],
  },
  {
    version: '1.18.x–1.26.x',
    label: 'September 2026',
    groups: [
      { title: 'Added', items: ['Desktop Buddy beta with starter artwork, local character packs, browser voice and persistent companion behavior.', 'Desktop Buddy local optimizer for 128, 256 and 512 px PNG/WebP variants.', 'GitHub sign-in alongside Google OAuth.', 'Project documentation and GitHub Pages status surfaces.', 'Weather sidebar gadget and richer Weather Now details.', 'Getter Pro media discovery improvements and per-result save/download actions.'] },
      { title: 'Changed and improved', items: ['Dashboard categories, search, recent apps and registry navigation.', 'Getter Pro provider diagnostics and partial-result behavior.', 'Landing-page branding, navigation and public-tool presentation.', 'Scrapper Pro naming replaced by Getter Pro on current user-facing surfaces.', 'Theme switching is no longer exposed in sidebar navigation.'] },
    ],
  },
]

export function PublicChangelogPage() {
  React.useEffect(() => { document.title = 'AppForge Changelog' }, [])
  return (
    <div className="dark min-h-dvh bg-black text-foreground" style={{ colorScheme: 'dark', '--background': '0 0% 0%' } as React.CSSProperties}>
      <PublicHeader section="Changelog" />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="border-b border-border/60 pb-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"><FileText className="h-4 w-4" /> Release history</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">What changed in AppForge.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">A public view of user-visible product changes. The root <code className="rounded bg-accent/50 px-1.5 py-0.5">CHANGELOG.md</code> on <code className="rounded bg-accent/50 px-1.5 py-0.5">main</code> remains the canonical release history.</p>
          <div className="mt-4 text-xs text-muted-foreground">Current app version: v{BUILD_INFO.version}</div>
        </section>
        <div className="space-y-10 py-8">
          {CHANGELOG_SECTIONS.map((release) => (
            <section key={release.version} className="rounded-2xl border border-border/70 bg-background/45 p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/60 pb-4"><div><div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Release</div><h2 className="mt-1 text-3xl font-semibold tracking-[-0.03em]">{release.version}</h2></div><div className="text-sm text-muted-foreground">{release.label}</div></div>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {release.groups.map((group) => <div key={group.title}><h3 className="text-sm font-semibold uppercase tracking-[0.12em]">{group.title}</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">{group.items.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">•</span><span>{item}</span></li>)}</ul></div>)}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}

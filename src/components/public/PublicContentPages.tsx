import React from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Clapperboard, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { loadPublishedFrontendContent, type FrontendContentRecord } from '@/lib/frontendContent'

const APPFORGE_MARK = '/favicon.svg?v=2'

type BlogSection = { heading: string; body: string }
type BlogArticle = {
  slug: string
  appName: string
  title: string
  description: string
  publishedAt: string
  readTime: string
  appRoute: string
  sections: BlogSection[]
  imageUrl?: string
  videoUrl?: string
}

const FALLBACK_ARTICLES: BlogArticle[] = [
  ['desktop-buddy-your-ai-companion-on-the-desktop','Desktop Buddy','Desktop Buddy: a small AI companion that lives with your workflow','How AppForge combines character assets, local optimization, voice-ready interactions and secure cloud image generation into a lightweight desktop companion.','/apps/desktop-buddy','4 min read'],
  ['getter-pro-capture-web-media-with-a-clear-storage-model','Getter Pro','Getter Pro: capture web media without losing track of where it came from','A closer look at AppForge media discovery, the Media Vault handoff and the difference between storing a file and preserving a protected source URL.','/apps/getter-pro','4 min read'],
  ['weather-now-fast-local-conditions-without-a-heavy-dashboard','Weather Now','Weather Now: fast local conditions without a heavy dashboard','Why Weather Now keeps the primary forecast compact, supports quick city switching and brings the selected location into the AppForge sidebar.','/apps/weather-now','3 min read'],
  ['task-list-a-small-workspace-that-stays-out-of-the-way','Task List','Task List: a small workspace that stays out of the way','The thinking behind a focused AppForge task surface: quick capture, clearer grouping and a layout that scales properly with the rest of the workspace.','/apps/task-list','3 min read'],
  ['hugging-face-gallery-a-visible-home-for-generated-assets','Hugging Face Gallery','Hugging Face Gallery: a visible home for generated AppForge assets','How the public gallery can turn generated images into reusable product content, with a curated slider managed separately from generation itself.','/huggingface','3 min read'],
].map(([slug, appName, title, description, appRoute, readTime]) => ({ slug, appName, title, description, appRoute, readTime, publishedAt: 'September 2026', sections: [] }))

const parseSections = (body: string | null): BlogSection[] => {
  if (!body?.trim()) return []
  const sections: BlogSection[] = []
  let heading = 'About this app'
  let lines: string[] = []
  const flush = () => {
    const text = lines.join('\n').trim()
    if (text) sections.push({ heading, body: text })
    lines = []
  }
  for (const raw of body.split('\n')) {
    if (raw.startsWith('## ')) {
      flush()
      heading = raw.slice(3).trim()
    } else {
      lines.push(raw)
    }
  }
  flush()
  return sections
}

const metadataText = (metadata: Record<string, unknown>, key: string, fallback: string) => typeof metadata[key] === 'string' && metadata[key] ? String(metadata[key]) : fallback

const recordToArticle = (record: FrontendContentRecord): BlogArticle => ({
  slug: record.slug,
  appName: metadataText(record.metadata, 'app_name', record.title.split(':')[0] || 'AppForge'),
  title: record.title,
  description: record.summary || 'A practical look inside this AppForge app.',
  publishedAt: metadataText(record.metadata, 'published_label', new Date(record.updated_at).toLocaleDateString()),
  readTime: metadataText(record.metadata, 'read_time', '3 min read'),
  appRoute: record.app_route || '/explore',
  sections: parseSections(record.body),
  imageUrl: record.image_url || undefined,
  videoUrl: record.video_url || undefined,
})

function useBlogArticles() {
  const [articles, setArticles] = React.useState<BlogArticle[]>(FALLBACK_ARTICLES)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    loadPublishedFrontendContent('blog_article')
      .then((records) => { if (active && records.length) setArticles(records.map(recordToArticle)) })
      .catch((error) => console.warn('AppForge blog CMS unavailable; using bundled articles.', error))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return { articles, loading }
}

function PublicHeader({ section }: { section: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/landing" className="inline-flex items-center gap-3"><img src={APPFORGE_MARK} alt="AppForge" className="h-9 w-9 rounded-xl" /><div><div className="text-sm font-semibold">AppForge {section}</div><div className="text-xs text-muted-foreground">Build notes, app stories and product updates</div></div></Link>
        <nav className="flex items-center gap-2 text-xs font-semibold"><Link to="/blog" className="rounded-lg border border-border/70 px-3 py-2 text-muted-foreground hover:text-foreground">Blog</Link><Link to="/changelog" className="rounded-lg border border-border/70 px-3 py-2 text-muted-foreground hover:text-foreground">Changelog</Link><Link to="/landing" className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Front</Link></nav>
      </div>
    </header>
  )
}

const youtubeEmbed = (url: string) => {
  try {
    const parsed = new URL(url)
    const id = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v') || (parsed.pathname.startsWith('/embed/') ? parsed.pathname.split('/')[2] : '')
    return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : ''
  } catch { return '' }
}

function VideoBlock({ url }: { url?: string }) {
  if (!url) return <div className="mt-8 rounded-2xl border border-dashed border-border/80 bg-background/45 p-6"><div className="flex items-center gap-2 font-semibold"><Clapperboard className="h-4 w-4" /> Video walkthrough</div><p className="mt-2 text-sm leading-6 text-muted-foreground">No walkthrough has been published yet. Admins can add one from the frontend content manager.</p></div>
  const embed = youtubeEmbed(url)
  return <div className="mt-8 overflow-hidden rounded-2xl border border-border/80 bg-background/45">{embed ? <iframe src={embed} title="Article video walkthrough" className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <div className="p-6"><div className="flex items-center gap-2 font-semibold"><Clapperboard className="h-4 w-4" /> Video walkthrough</div><a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">Open video <ArrowRight className="h-4 w-4" /></a></div>}</div>
}

export function PublicBlogPage() {
  const { articles, loading } = useBlogArticles()
  React.useEffect(() => { document.title = 'AppForge Blog' }, [])
  return (
    <div className="dark min-h-dvh bg-black text-foreground" style={{ colorScheme: 'dark', '--background': '0 0% 0%' } as React.CSSProperties}>
      <PublicHeader section="Blog" />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="border-b border-border/60 pb-8"><div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"><Sparkles className="h-4 w-4" /> App stories</div><h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Practical looks inside AppForge.</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">Product articles covering how individual apps are designed, what they solve and where they are heading next. Published content is managed through the TOTP-protected admin editor.</p>{loading && <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking latest published content…</div>}</section>
        <section className="grid gap-4 py-8 md:grid-cols-2">{articles.map((article) => <Link key={article.slug} to={`/blog/${article.slug}`} className="group flex min-h-64 flex-col overflow-hidden rounded-2xl border border-border/70 bg-background/55 transition hover:-translate-y-0.5 hover:bg-accent/35">{article.imageUrl ? <img src={article.imageUrl} alt="" className="h-40 w-full object-cover" loading="lazy" /> : null}<div className="flex flex-1 flex-col p-5"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{article.appName}</div><h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">{article.title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{article.description}</p><div className="mt-auto flex items-center justify-between gap-3 pt-6 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> {article.publishedAt} · {article.readTime}</span><span className="inline-flex items-center gap-1 font-semibold text-foreground">Read <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span></div></div></Link>)}</section>
      </main>
    </div>
  )
}

export function PublicBlogArticlePage({ slug }: { slug: string }) {
  const { articles, loading } = useBlogArticles()
  const article = articles.find((item) => item.slug === slug)
  React.useEffect(() => { document.title = article ? `${article.title} · AppForge` : 'AppForge Blog' }, [article])
  if (!article && loading) return <div className="dark flex min-h-dvh items-center justify-center bg-black text-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
  if (!article) return <PublicBlogPage />
  return (
    <div className="dark min-h-dvh bg-black text-foreground" style={{ colorScheme: 'dark', '--background': '0 0% 0%' } as React.CSSProperties}>
      <PublicHeader section="Blog" />
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8"><Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All articles</Link><article className="mt-8"><div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{article.appName}</div><h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{article.title}</h1><p className="mt-5 text-base leading-8 text-muted-foreground">{article.description}</p><div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground"><span>{article.publishedAt}</span><span>{article.readTime}</span><Link to={article.appRoute} className="font-semibold text-foreground hover:underline">Open {article.appName}</Link></div>{article.imageUrl ? <div className="mt-8 overflow-hidden rounded-2xl border border-border/70"><img src={article.imageUrl} alt={article.title} className="max-h-[34rem] w-full object-cover" /></div> : <div className="mt-8 flex aspect-[16/7] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/35 text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>}<VideoBlock url={article.videoUrl} /><div className="mt-10 space-y-9">{article.sections.map((section) => <section key={section.heading}><h2 className="text-2xl font-semibold tracking-[-0.025em]">{section.heading}</h2><p className="mt-3 whitespace-pre-line text-base leading-8 text-muted-foreground">{section.body}</p></section>)}</div></article></main>
    </div>
  )
}

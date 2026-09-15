import { PublicFooter } from "./PublicFooter";
import React from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { FRONTEND_CONTENT_UPDATED_EVENT, loadPublishedFrontendContent, type FrontendContentRecord } from "@/lib/frontendContent";
import { PublicHeader } from "./PublicHeader";
import { Switch } from "@/components/ui";

type BlogSection = { heading: string; body: string };
type BlogArticle = {
  slug: string;
  appName: string;
  title: string;
  description: string;
  publishedAt: string;
  readTime: string;
  appRoute: string;
  sections: BlogSection[];
  imageUrl?: string;
  videoUrl?: string;
  featured?: boolean;
};

const FALLBACK_ARTICLES: BlogArticle[] = [
  [
    "desktop-buddy-your-ai-companion-on-the-desktop",
    "Desktop Buddy",
    "Desktop Buddy: a small AI companion that lives with your workflow",
    "How AppForge combines character assets, local optimization, voice-ready interactions and secure cloud image generation into a lightweight desktop companion.",
    "/apps/desktop-buddy",
    "4 min read",
  ],
  [
    "getter-pro-capture-web-media-with-a-clear-storage-model",
    "Getter Pro",
    "Getter Pro: capture web media without losing track of where it came from",
    "A closer look at AppForge media discovery, the Media Vault handoff and the difference between storing a file and preserving a protected source URL.",
    "/apps/getter-pro",
    "4 min read",
  ],
  [
    "weather-now-fast-local-conditions-without-a-heavy-dashboard",
    "Weather Now",
    "Weather Now: fast local conditions without a heavy dashboard",
    "Why Weather Now keeps the primary forecast compact, supports quick city switching and brings the selected location into the AppForge sidebar.",
    "/apps/weather-now",
    "3 min read",
  ],
  [
    "task-list-a-small-workspace-that-stays-out-of-the-way",
    "Task List",
    "Task List: a small workspace that stays out of the way",
    "The thinking behind a focused AppForge task surface: quick capture, clearer grouping and a layout that scales properly with the rest of the workspace.",
    "/apps/task-list",
    "3 min read",
  ],
  [
    "hugging-face-gallery-a-visible-home-for-generated-assets",
    "Hugging Face Gallery",
    "Hugging Face Gallery: a visible home for generated AppForge assets",
    "How the public gallery can turn generated images into reusable product content, with a curated slider managed separately from generation itself.",
    "/huggingface",
    "3 min read",
  ],
].map(([slug, appName, title, description, appRoute, readTime], index) => ({ slug, appName, title, description, appRoute, readTime, publishedAt: "September 2026", sections: [], featured: index === 0 }));

const parseSections = (body: string | null): BlogSection[] => {
  if (!body?.trim()) return [];
  const sections: BlogSection[] = [];
  let heading = "About this app";
  let lines: string[] = [];
  const flush = () => {
    const text = lines.join("\n").trim();
    if (text) sections.push({ heading, body: text });
    lines = [];
  };
  for (const raw of body.split("\n")) {
    if (raw.startsWith("## ")) {
      flush();
      heading = raw.slice(3).trim();
    } else lines.push(raw);
  }
  flush();
  return sections;
};
const metadataText = (metadata: Record<string, unknown>, key: string, fallback: string) => (typeof metadata[key] === "string" && metadata[key] ? String(metadata[key]) : fallback);
const recordToArticle = (record: FrontendContentRecord): BlogArticle => ({
  slug: record.slug,
  appName: metadataText(record.metadata, "app_name", record.title.split(":")[0] || "AppForge"),
  title: record.title,
  description: record.summary || "A practical look inside this AppForge app.",
  publishedAt: metadataText(record.metadata, "published_label", new Date(record.updated_at).toLocaleDateString()),
  readTime: metadataText(record.metadata, "read_time", "3 min read"),
  appRoute: record.app_route || "/explore",
  sections: parseSections(record.body),
  imageUrl: record.image_url || undefined,
  videoUrl: record.video_url || undefined,
  featured: record.metadata?.featured === true,
});

function useBlogArticles() {
  const [articles, setArticles] = React.useState<BlogArticle[]>(FALLBACK_ARTICLES);
  const [loading, setLoading] = React.useState(true);
  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const records = await loadPublishedFrontendContent("blog_article");
      setArticles(records.length ? records.map(recordToArticle) : FALLBACK_ARTICLES);
    } catch (error) {
      console.warn("AppForge blog CMS unavailable; using bundled articles.", error);
      setArticles(FALLBACK_ARTICLES);
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "appforge-frontend-content-updated-at") void refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    void refresh();
    window.addEventListener(FRONTEND_CONTENT_UPDATED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener(FRONTEND_CONTENT_UPDATED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);
  return { articles, loading };
}

const youtubeEmbed = (url: string) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (!["youtu.be", "youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) return "";
    const id = host === "youtu.be" ? parsed.pathname.slice(1) : parsed.searchParams.get("v") || (parsed.pathname.startsWith("/embed/") ? parsed.pathname.split("/")[2] : "");
    return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : "";
  } catch {
    return "";
  }
};
function VideoBlock({ url }: { url?: string }) {
  if (!url) return null;
  const embed = youtubeEmbed(url);
  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
      {embed ? (
        <iframe src={embed} title="Article video walkthrough" className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      ) : (
        <video src={url} title="Article video walkthrough" className="aspect-video w-full object-contain" controls preload="metadata" playsInline />
      )}
    </div>
  );
}

function ArticleCard({ article, compact = false }: { article: BlogArticle; compact?: boolean }) {
  return (
    <Link to={`/blog/${article.slug}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-[border-color,background-color,box-shadow] hover:border-foreground/20 hover:bg-secondary hover:shadow-xl">
      {article.imageUrl && <img src={article.imageUrl} alt="" className={compact ? "h-28 w-full object-cover" : "h-36 w-full object-cover"} loading="lazy" />}
      <div className="flex flex-1 flex-col p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{article.appName}</div> {/* design-xs-ok: compact article metadata */}
        <h2 className={compact ? "mt-2 text-sm font-semibold tracking-[-0.02em]" : "mt-2 text-lg font-semibold tracking-[-0.025em]"}>{article.title}</h2>
        {!compact && <p className="mt-1 text-sm text-muted-foreground">{article.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-4 pt-4 text-sm text-muted-foreground">
          <span>
            {article.publishedAt} · {article.readTime}
          </span>
          <span className="inline-flex items-center gap-2 font-semibold text-foreground">
            Read <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function PublicBlogPage() {
  const { articles, loading } = useBlogArticles();
  const featured = articles.find((article) => article.featured) || articles[0];
  const remaining = articles.filter((article) => article.slug !== featured?.slug);
  React.useEffect(() => {
    document.title = "AppForge Blog";
  }, []);
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-4 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">AppForge Blog</div>
          <h1 className="mt-4 text-lg font-semibold tracking-[-0.04em] sm:text-5xl">Practical product stories.</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">How AppForge tools work, what they solve, and how they fit together.</p>
          {loading && (
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Updating…
            </div>
          )}
        </header>
        {featured && (
          <section className="mx-auto mt-8 max-w-3xl">
            <Link to={`/blog/${featured.slug}`} className="block rounded-xl border border-border bg-card p-4 text-center transition-[border-color,background-color,box-shadow] hover:border-foreground/20 hover:bg-secondary hover:shadow-xl">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Featured · {featured.appName}</div> {/* design-xs-ok: compact article metadata */}
              <h2 className="mx-auto mt-4 max-w-2xl text-lg font-semibold tracking-[-0.03em]">{featured.title}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">{featured.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                Read article <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </section>
        )}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-4">
            <h2 className="text-sm font-semibold">Latest</h2>
            <span className="text-sm text-muted-foreground">{articles.length} published</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {remaining.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

export function PublicBlogArticlePage({ slug }: { slug: string }) {
  const { articles, loading } = useBlogArticles();
  const [readingMode, setReadingMode] = React.useState(true);
  const article = articles.find((item) => item.slug === slug);
  const related = article
    ? articles
        .filter((item) => item.slug !== article.slug)
        .sort((a, b) => Number(b.appName === article.appName) - Number(a.appName === article.appName))
        .slice(0, 3)
    : [];
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [slug]);
  React.useEffect(() => {
    document.title = article ? `${article.title} · AppForge` : "AppForge Blog";
  }, [article]);
  if (!article && loading)
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (!article) return <PublicBlogPage />;
  const articleWidth = readingMode ? "max-w-4xl" : "max-w-7xl";
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-4 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>
        <article className={`mx-auto mt-8 w-full transition-[max-width] ${articleWidth}`}>
          <header className="text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{article.appName}</div> {/* design-xs-ok: compact article metadata */}
            <h1 className="mt-4 text-lg font-semibold tracking-[-0.04em] sm:text-5xl">{article.title}</h1>
            <p className="mx-auto mt-4 max-w-7xl text-sm text-muted-foreground">{article.description}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> {article.publishedAt}
              </span>
              <span>{article.readTime}</span>
              <Link to={article.appRoute} className="font-semibold text-foreground hover:underline">
                Open {article.appName}
              </Link>
            </div>
          </header>
          {article.imageUrl && (
            <div className="mt-8 overflow-hidden rounded-xl border border-border">
              <img src={article.imageUrl} alt={article.title} className="max-h-[36rem] w-full object-cover" />
            </div>
          )}
          <VideoBlock url={article.videoUrl} />
          <div className={`mx-auto mt-8 space-y-8 ${readingMode ? "max-w-4xl" : "max-w-7xl"}`}>
            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{section.heading}</h2>
                <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </div>
        </article>
        {related.length > 0 && (
          <section className="mt-8 border-t border-border/60 pt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Related articles</h2>
              <Link to="/blog" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
                View all
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <ArticleCard key={item.slug} article={item} compact />
              ))}
            </div>
          </section>
        )}
      </main>
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-xl border border-border bg-background/95 p-2 shadow-xl backdrop-blur-xl" role="group" aria-label="Article layout">
        <span className={`text-sm ${readingMode ? "text-muted-foreground" : "font-semibold text-foreground"}`}>Normal</span>
        <Switch checked={readingMode} onCheckedChange={setReadingMode} label="Toggle reading mode" />
        <span className={`text-sm ${readingMode ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Reading</span>
      </div>
      <PublicFooter />
    </div>
  );
}

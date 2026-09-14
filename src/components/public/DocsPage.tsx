import React from "react";
import { ChevronRight, FileText, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { FRONTEND_CONTENT_UPDATED_EVENT, loadPublishedFrontendContent, type FrontendContentRecord } from "@/lib/frontendContent";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";

type InlinePart = { type: "text" | "code" | "strong" | "link"; value: string; href?: string };

const inlineParts = (text: string): InlinePart[] => {
  const parts: InlinePart[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > cursor) parts.push({ type: "text", value: text.slice(cursor, match.index) });
    const token = match[0];
    if (token.startsWith("`")) parts.push({ type: "code", value: token.slice(1, -1) });
    else if (token.startsWith("**")) parts.push({ type: "strong", value: token.slice(2, -2) });
    else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) parts.push({ type: "link", value: link[1], href: link[2] });
    }
    cursor = (match.index || 0) + token.length;
  }
  if (cursor < text.length) parts.push({ type: "text", value: text.slice(cursor) });
  return parts;
};

const InlineMarkdown = ({ text }: { text: string }) => (
  <>
    {inlineParts(text).map((part, index) => {
      if (part.type === "code") return <code key={index} className="rounded-xl bg-muted px-2 py-2 font-mono text-sm">{part.value}</code>;
      if (part.type === "strong") return <strong key={index} className="font-semibold text-foreground">{part.value}</strong>;
      if (part.type === "link") {
        const external = /^https?:\/\//.test(part.href || "");
        return external ? <a key={index} href={part.href} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-4">{part.value}</a> : <Link key={index} to={part.href || "/docs"} className="font-medium text-foreground underline underline-offset-4">{part.value}</Link>;
      }
      return <React.Fragment key={index}>{part.value}</React.Fragment>;
    })}
  </>
);

function MarkdownDocument({ body }: { body: string }) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const nodes: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let code: string[] | null = null;
  let codeLanguage = "";

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ").trim();
    if (text) nodes.push(<p key={`p-${nodes.length}`} className="text-sm leading-7 text-muted-foreground"><InlineMarkdown text={text} /></p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    nodes.push(<Tag key={`l-${nodes.length}`} className={`${list.ordered ? "list-decimal" : "list-disc"} space-y-2 pl-8 text-sm leading-7 text-muted-foreground`}>{list.items.map((item, index) => <li key={index}><InlineMarkdown text={item} /></li>)}</Tag>);
    list = null;
  };
  const flushCode = () => {
    if (!code) return;
    nodes.push(<pre key={`c-${nodes.length}`} className="overflow-x-auto rounded-xl border border-border/70 bg-background/70 p-4 text-sm"><code className="font-mono" data-language={codeLanguage || undefined}>{code.join("\n")}</code></pre>);
    code = null;
    codeLanguage = "";
  };

  for (const line of lines) {
    if (code) {
      if (line.trim().startsWith("```")) flushCode();
      else code.push(line);
      continue;
    }
    if (line.trim().startsWith("```")) {
      flushParagraph();
      flushList();
      code = [];
      codeLanguage = line.trim().slice(3).trim();
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const text = heading[2].replace(/\s+#+$/, "").trim();
      if (level === 1) nodes.push(<h1 key={`h-${nodes.length}`} className="text-3xl font-semibold tracking-[-0.04em]"><InlineMarkdown text={text} /></h1>);
      else if (level === 2) nodes.push(<h2 key={`h-${nodes.length}`} className="pt-4 text-lg font-semibold tracking-[-0.02em]"><InlineMarkdown text={text} /></h2>);
      else nodes.push(<h3 key={`h-${nodes.length}`} className="pt-2 text-sm font-semibold"><InlineMarkdown text={text} /></h3>);
      continue;
    }
    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      const item = (ordered || unordered)?.[1] || "";
      if (!list || list.ordered !== isOrdered) flushList();
      if (!list) list = { ordered: isOrdered, items: [] };
      list.items.push(item);
      continue;
    }
    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      nodes.push(<blockquote key={`q-${nodes.length}`} className="rounded-xl border border-border/70 bg-muted/30 p-4 text-sm leading-7 text-muted-foreground"><InlineMarkdown text={line.slice(2)} /></blockquote>);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  flushCode();
  return <div className="space-y-4">{nodes}</div>;
}

const normalizeDocsSlug = (value: string) => value.replace(/^\/+|\/+$/g, "") || "index";
const docsHref = (slug: string) => slug === "index" ? "/docs" : `/docs/${slug}`;

export function DocsPage({ slug }: { slug?: string }) {
  const requestedSlug = normalizeDocsSlug(slug || "index");
  const [pages, setPages] = React.useState<FrontendContentRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      setPages(await loadPublishedFrontendContent("docs_page"));
      setError("");
    } catch (loadError) {
      console.warn("AppForge docs CMS unavailable.", loadError);
      setError("Documentation is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
    window.addEventListener(FRONTEND_CONTENT_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(FRONTEND_CONTENT_UPDATED_EVENT, refresh);
  }, [refresh]);

  const page = pages.find((item) => normalizeDocsSlug(item.slug) === requestedSlug);
  const navigation = React.useMemo(() => pages.slice().sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title)), [pages]);

  React.useEffect(() => {
    document.title = page ? `${page.title} · AppForge Docs` : "AppForge Docs";
  }, [page]);

  return (
    <div className="dark flex min-h-dvh flex-col bg-overlay text-foreground" style={{ colorScheme: "dark", "--background": "0 0% 0%" } as React.CSSProperties}>
      <PublicHeader />
      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Documentation navigation">
          <div className="rounded-xl border border-border/70 bg-background/40 p-4">
            <Link to="/docs" className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4" /> AppForge Docs</Link>
            <nav className="mt-4 space-y-2">
              {navigation.map((item) => {
                const active = normalizeDocsSlug(item.slug) === requestedSlug;
                return <Link key={item.id} to={docsHref(normalizeDocsSlug(item.slug))} className={`flex items-center justify-between gap-2 rounded-xl px-2 py-2 text-sm ${active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"}`}><span className="truncate">{item.title}</span>{active && <ChevronRight className="h-4 w-4 shrink-0" />}</Link>;
              })}
            </nav>
          </div>
        </aside>
        <section className="min-w-0">
          {loading && <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}
          {!loading && error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
          {!loading && !error && !page && <div className="rounded-xl border border-border/70 bg-background/40 p-8 text-center"><h1 className="text-lg font-semibold">Documentation page not found</h1><Link to="/docs" className="mt-4 inline-flex text-sm font-semibold underline">Back to docs</Link></div>}
          {!loading && page && <article className="rounded-xl border border-border/70 bg-background/35 p-4 sm:p-8"><MarkdownDocument body={page.body || page.summary || ""} /></article>}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

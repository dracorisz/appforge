import { AppHeading } from "@/components/layout/AppHeading";
import React from "react";
import { Archive, CheckSquare, Copy, Download, ExternalLink, FileText, FileVideo, Image as ImageIcon, Loader2, RefreshCw, Search, Square } from "lucide-react";
import { SiYoutube as Youtube } from "react-icons/si";
import { saveScrapperVaultResult } from "@/lib/mediaVault";
import { Button, Input, Tabs } from "@/components/ui";

export interface ScrapperProResult {
  id: string;
  source: string;
  type: "post" | "video" | "image" | "article";
  title: string;
  url: string;
  snippet: string;
  date?: string;
  thumbnail?: string;
  mediaUrl?: string;
  provenance?: Record<string, unknown>;
}

type SourceDefinition = { id: string; name: string; disabled?: boolean; status?: string };
type ScrapeResponse = { ok?: boolean; results?: ScrapperProResult[]; failures?: { sourceId: string; source: string; error: string }[]; error?: string };
type YouTubeResponse = { ok?: boolean; results?: ScrapperProResult[]; nextPageToken?: string | null; error?: string };

const SOURCES: SourceDefinition[] = [
  { id: "duckduckgo-images", name: "DuckDuckGo Images" },
  { id: "bing-images", name: "Bing Images" },
  { id: "wikimedia", name: "Wikimedia Commons" },
  { id: "reddit", name: "Reddit" },
  { id: "youtube", name: "YouTube Data API" },
  { id: "duckduckgo-general", name: "DuckDuckGo Web" },
  { id: "medium", name: "Medium" },
  { id: "tiktok", name: "TikTok", disabled: true, status: "API approval required" },
];

const DEFAULT_SOURCES = ["duckduckgo-images", "bing-images", "wikimedia", "reddit", "youtube"];
const VAULT_CHANGED_EVENT = "appforge:media-vault-changed";

const safeHttpUrl = (value?: string) => {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const normalizeResult = (item: ScrapperProResult): ScrapperProResult | null => {
  if (!item || typeof item !== "object") return null;
  const url = safeHttpUrl(item.url);
  if (!url || !item.id || !item.title) return null;
  return {
    ...item,
    id: String(item.id).slice(0, 500),
    source: String(item.source || "Unknown").slice(0, 120),
    title: String(item.title).slice(0, 1_000),
    snippet: String(item.snippet || "").slice(0, 10_000),
    url,
    thumbnail: safeHttpUrl(item.thumbnail),
    mediaUrl: safeHttpUrl(item.mediaUrl),
  };
};

const dedupe = (items: ScrapperProResult[]) =>
  Array.from(
    new Map(
      items
        .map(normalizeResult)
        .filter((item): item is ScrapperProResult => Boolean(item))
        .map((item) => [`${item.type}:${item.mediaUrl || item.url}`, item]),
    ).values(),
  );

const filenameFor = (result: ScrapperProResult, mime = "") => {
  const stem =
    result.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 72) || "getter-result";
  const sourceUrl = result.mediaUrl || result.thumbnail || "";
  const urlExt = sourceUrl.match(/\.([a-z0-9]{2,5})(?:[?#]|$)/i)?.[1]?.toLowerCase();
  const mimeExt = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : mime.includes("gif") ? "gif" : mime.includes("jpeg") ? "jpg" : undefined;
  return `${stem}.${mimeExt || urlExt || (result.type === "image" ? "jpg" : "bin")}`;
};

const TypeIcon = ({ type }: { type: ScrapperProResult["type"] }) => (type === "image" ? <ImageIcon className="h-4 w-4" /> : type === "video" ? <FileVideo className="h-4 w-4" /> : <FileText className="h-4 w-4" />);

const provenanceText = (result: ScrapperProResult) => {
  const p = result.provenance || {};
  const channel = typeof p.channelTitle === "string" ? p.channelTitle : "";
  const provider = typeof p.provider === "string" ? p.provider : result.source;
  const playlist = typeof p.uploadsPlaylistId === "string" ? p.uploadsPlaylistId : "";
  return [provider, channel, playlist ? `uploads ${playlist}` : ""].filter(Boolean).join(" · ");
};

const toVaultInput = (result: ScrapperProResult) => ({ source: result.source, type: result.type, title: result.title, originalUrl: result.url, thumbnail: result.thumbnail, mediaUrl: result.mediaUrl, snippet: result.snippet, date: result.date, provenance: result.provenance });

export function PF_ScrapperProNext() {
  const [query, setQuery] = React.useState("");
  const [selectedSources, setSelectedSources] = React.useState<Set<string>>(() => new Set(DEFAULT_SOURCES));
  const [results, setResults] = React.useState<ScrapperProResult[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());
  const [vaultSavedUrls, setVaultSavedUrls] = React.useState<Set<string>>(() => new Set());
  const [savingVault, setSavingVault] = React.useState<Set<string>>(() => new Set());
  const [nextPageToken, setNextPageToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [failures, setFailures] = React.useState<string[]>([]);
  const [message, setMessage] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | ScrapperProResult["type"]>("all");

  const fetchYouTube = async (cleanQuery: string, pageToken?: string) => {
    const response = await fetch("/api/youtube-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: cleanQuery, ...(pageToken ? { pageToken } : {}) }) });
    const data = (await response.json()) as YouTubeResponse;
    if (!response.ok || !data.ok) throw new Error(data.error || `YouTube failed with HTTP ${response.status}`);
    return data;
  };

  const fetchOtherSources = async (cleanQuery: string, sources: string[]) => {
    if (!sources.length) return { results: [] as ScrapperProResult[], failures: [] as string[] };
    const response = await fetch("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: cleanQuery, sources }) });
    const data = (await response.json()) as ScrapeResponse;
    if (!response.ok || !data.ok) throw new Error(data.error || `Search failed with HTTP ${response.status}`);
    return { results: data.results || [], failures: (data.failures || []).map((failure) => `${failure.source}: ${failure.error}`) };
  };

  const runSearch = async () => {
    const cleanQuery = query.trim();
    if (!cleanQuery || loading) return;
    const sourceIds = Array.from(selectedSources).filter((id) => id !== "tiktok");
    if (!sourceIds.length) {
      setMessage("Select at least one available source.");
      return;
    }
    setLoading(true);
    setFailures([]);
    setMessage("");
    setSelectedIds(new Set());
    setNextPageToken(null);
    try {
      const youtubeEnabled = sourceIds.includes("youtube");
      const others = sourceIds.filter((id) => id !== "youtube");
      const [otherData, youtubeData] = await Promise.all([
        fetchOtherSources(cleanQuery, others).catch((error) => ({ results: [] as ScrapperProResult[], failures: [error instanceof Error ? error.message : "Other sources failed"] })),
        youtubeEnabled
          ? fetchYouTube(cleanQuery).catch((error) => ({ ok: false, results: [] as ScrapperProResult[], nextPageToken: null, error: error instanceof Error ? error.message : "YouTube failed" }))
          : Promise.resolve({ ok: true, results: [] as ScrapperProResult[], nextPageToken: null } as YouTubeResponse),
      ]);
      const combined = dedupe([...(otherData.results || []), ...(youtubeData.results || [])]);
      setResults(combined);
      setNextPageToken(youtubeData.nextPageToken || null);
      setFailures([...otherData.failures, ...(!youtubeData.ok && youtubeData.error ? [`YouTube: ${youtubeData.error}`] : [])]);
      setMessage(`${combined.length} unique results loaded${youtubeData.nextPageToken ? " · more YouTube results available" : ""}.`);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreYouTube = async () => {
    const cleanQuery = query.trim();
    if (!cleanQuery || !nextPageToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchYouTube(cleanQuery, nextPageToken);
      setResults((current) => dedupe([...current, ...(data.results || [])]));
      setNextPageToken(data.nextPageToken || null);
      setMessage(`Loaded more ${filter === "all" ? "results" : `${filter} results`}${data.nextPageToken ? "." : " · end of results."}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Could not load more ${filter === "all" ? "results" : `${filter} results`}.`);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleSource = (source: SourceDefinition) => {
    if (source.disabled) return;
    setSelectedSources((current) => {
      const next = new Set(current);
      if (next.has(source.id)) next.delete(source.id);
      else next.add(source.id);
      return next;
    });
  };
  const toggleSelected = (id: string) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const visibleResults = filter === "all" ? results : results.filter((item) => item.type === filter);
  const selectedResults = results.filter((item) => selectedIds.has(item.id));
  const allVisibleSelected = visibleResults.length > 0 && visibleResults.every((item) => selectedIds.has(item.id));
  const toggleAllVisible = () =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleResults.forEach((item) => next.delete(item.id));
      else visibleResults.forEach((item) => next.add(item.id));
      return next;
    });

  const saveOneVault = async (result: ScrapperProResult, quiet = false) => {
    setSavingVault((current) => new Set(current).add(result.url));
    try {
      const row = await saveScrapperVaultResult(toVaultInput(result));
      if (!row?.id || row.source_app !== "getter-pro" || row.source_ref !== result.url.trim()) throw new Error("Media Vault did not confirm the saved reference.");
      setVaultSavedUrls((current) => new Set(current).add(result.url));
      window.dispatchEvent(new CustomEvent(VAULT_CHANGED_EVENT, { detail: { id: row.id, sourceRef: row.source_ref } }));
      if (!quiet) setMessage(`Saved “${result.title}” to Media Vault.`);
      return true;
    } catch (error) {
      if (!quiet) setMessage(error instanceof Error ? `Media Vault save failed: ${error.message}` : "Media Vault save failed.");
      return false;
    } finally {
      setSavingVault((current) => {
        const next = new Set(current);
        next.delete(result.url);
        return next;
      });
    }
  };

  const downloadResult = async (result: ScrapperProResult) => {
    const target = safeHttpUrl(result.mediaUrl || result.thumbnail);
    if (!target) {
      setMessage("This result does not expose a directly downloadable media URL.");
      return;
    }
    try {
      const response = await fetch(target);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (!blob.size) throw new Error("Empty media response");
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filenameFor(result, blob.type);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setMessage(`Downloaded “${result.title}”.`);
    } catch {
      const link = document.createElement("a");
      link.href = target;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = filenameFor(result);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage("The source blocks direct browser download, so the original media was opened for saving.");
    }
  };

  const saveSelectedVault = async () => {
    if (!selectedResults.length) return;
    let success = 0;
    for (const result of selectedResults) if (await saveOneVault(result, true)) success += 1;
    const failed = selectedResults.length - success;
    setMessage(`Media Vault confirmed ${success} save${success === 1 ? "" : "s"}${failed ? ` · ${failed} failed` : ""}.`);
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Source URL copied.");
    } catch {
      setMessage("Clipboard access was blocked by the browser. Open the source and copy the URL from the address bar.");
    }
  };
  const counts = React.useMemo(
    () => ({ image: results.filter((item) => item.type === "image").length, video: results.filter((item) => item.type === "video").length, article: results.filter((item) => item.type === "article").length, post: results.filter((item) => item.type === "post").length }),
    [results],
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4 sm:p-4">
      <section className="surface-card rounded-xl border p-4 sm:p-4">
        <AppHeading />
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void runSearch();
              }}
              placeholder="Search text, YouTube URL, channel ID, video ID, or @handle"
              className="h-11 w-full rounded-xl border bg-background pl-8 pr-4 text-sm"
            />
          </label>
          <Button type="button" onClick={() => void runSearch()} disabled={loading || !query.trim()} className="bg-primary px-4 font-semibold text-primary-foreground">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
          </Button>
          <Button type="button" onClick={() => void runSearch()} disabled={loading || !results.length} className="px-4 font-semibold">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {SOURCES.map((source) => {
            const active = selectedSources.has(source.id);
            return (
              <Button
                key={source.id}
                type="button"
                onClick={() => toggleSource(source)}
                disabled={source.disabled}
                title={source.status}
                className={`rounded-xl border px-4 py-2 text-sm font-medium ${source.disabled ? "cursor-not-allowed opacity-45" : active ? "bg-accent text-foreground cursor-pointer" : "text-muted-foreground hover:text-foreground"}`}
              >
                {source.name}
                {source.disabled ? ` · ${source.status}` : ""}
              </Button>
            );
          })}
        </div>
        {failures.length > 0 && <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning dark:text-warning">{failures.join(" · ")}</div>}
        <div aria-live="polite" className="mt-4 text-sm text-muted-foreground">
          {message}
        </div>
      </section>
      <section className="surface-card flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          className="min-w-0 flex-1"
          tabs={(["all", "image", "video", "post", "article"] as const).map((type) => ({ id: type, label: `${type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)} ${type === "all" ? results.length : counts[type]}` }))}
          active={filter}
          onChange={(id) => setFilter(id as typeof filter)}
          ariaLabel="Getter Pro result types"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={toggleAllVisible} disabled={!visibleResults.length} variant="ghost" size="sm" className="px-4" aria-pressed={allVisibleSelected}>
            {allVisibleSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />} {allVisibleSelected ? "Clear visible" : "Select visible"}
          </Button>
          <Button type="button" onClick={() => void saveSelectedVault()} disabled={!selectedResults.length} variant="ghost" size="sm" className="px-4">
            <Archive className="h-4 w-4" /> Media Vault
          </Button>
        </div>
      </section>
      {visibleResults.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleResults.map((result) => {
            const selected = selectedIds.has(result.id);
            const savedVault = vaultSavedUrls.has(result.url);
            const saving = savingVault.has(result.url);
            const downloadable = Boolean(result.mediaUrl || result.thumbnail);
            return (
              <article key={result.id} className={`surface-card flex h-full flex-col overflow-hidden rounded-xl border ${selected ? "ring-0 ring-primary/40" : ""}`}>
                <Button type="button" onClick={() => toggleSelected(result.id)} className="relative block aspect-video w-full overflow-hidden bg-muted/40 text-left" aria-pressed={selected}>
                  {result.thumbnail ? (
                    <img src={result.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-muted-foreground">
                      <TypeIcon type={result.type} />
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-xl bg-background/90 p-2">{selected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}</span>
                  {result.source === "YouTube" && (
                    <span className="absolute right-2 top-2 inline-flex items-center gap-2 rounded-xl bg-destructive px-2 py-2 text-sm font-semibold text-inverse">
                      <Youtube className="h-3 w-3" /> API
                    </span>
                  )}
                </Button>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <TypeIcon type={result.type} /> {result.source}
                    {savedVault ? " · vault" : ""}
                  </div>
                  <h2 className="mt-2 line-clamp-2 text-sm font-semibold">{result.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{result.snippet || "No description."}</p>
                  {result.provenance && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{provenanceText(result)}</p>}
                  <div className="mt-auto grid grid-cols-[1fr_auto_auto_auto] gap-2 pt-4">
                    <a href={result.url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-semibold hover:bg-accent">
                      Open <ExternalLink className="h-4 w-4" />
                    </a>
                    <Button type="button" onClick={() => void saveOneVault(result)} disabled={saving} className="grid w-9 place-items-center" aria-label="Save to Media Vault" title="Save to Media Vault">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className={`h-4 w-4 ${savedVault ? "text-primary" : ""}`} />}
                    </Button>
                    <Button type="button" onClick={() => void downloadResult(result)} disabled={!downloadable} className="grid w-9 place-items-center disabled:cursor-not-allowed disabled:opacity-35" aria-label="Download result media" title="Download media">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button type="button" onClick={() => void copyUrl(result.url)} className="grid w-9 place-items-center" aria-label="Copy source URL" title="Copy source URL">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
      {!loading && visibleResults.length === 0 && <div className="surface-card rounded-xl border p-4 text-center text-sm text-muted-foreground">Search to load public results, or change the active filter.</div>}
      {nextPageToken && selectedSources.has("youtube") && (
        <div className="flex justify-center">
          <Button type="button" onClick={() => void loadMoreYouTube()} disabled={loadingMore} className="bg-background px-4 font-semibold">
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />} Load more {filter === "all" ? "results" : `${filter} results`}
          </Button>
        </div>
      )}
    </div>
  );
}

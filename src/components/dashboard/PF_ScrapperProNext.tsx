import React from 'react'
import { Archive, CheckSquare, Copy, Download, ExternalLink, FileText, FileVideo, Image as ImageIcon, Loader2, RefreshCw, Search, Square, Youtube } from 'lucide-react'
import { saveScrapperVaultResult } from '@/lib/mediaVault'

export interface ScrapperProResult {
  id: string
  source: string
  type: 'post' | 'video' | 'image' | 'article'
  title: string
  url: string
  snippet: string
  date?: string
  thumbnail?: string
  mediaUrl?: string
  provenance?: Record<string, unknown>
}

type SourceDefinition = { id: string; name: string; disabled?: boolean; status?: string }
type ScrapeResponse = { ok?: boolean; results?: ScrapperProResult[]; failures?: { sourceId: string; source: string; error: string }[]; error?: string; durationMs?: number }
type YouTubeResponse = { ok?: boolean; results?: ScrapperProResult[]; nextPageToken?: string | null; error?: string; reason?: string }

const SOURCES: SourceDefinition[] = [
  { id: 'duckduckgo-images', name: 'DuckDuckGo Images' },
  { id: 'bing-images', name: 'Bing Images' },
  { id: 'wikimedia', name: 'Wikimedia Commons' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'youtube', name: 'YouTube Data API' },
  { id: 'duckduckgo-general', name: 'DuckDuckGo Web' },
  { id: 'medium', name: 'Medium' },
  { id: 'tiktok', name: 'TikTok', disabled: true, status: 'API approval required' },
]

const DEFAULT_SOURCES = ['duckduckgo-images', 'bing-images', 'wikimedia', 'reddit', 'youtube']
const SAVED_KEY = 'appforge-scrapper-saved'

const readSaved = (): ScrapperProResult[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

const dedupe = (items: ScrapperProResult[]) => Array.from(new Map(items.filter((item) => item?.url).map((item) => [`${item.type}:${item.mediaUrl || item.url}`, item])).values())

const downloadJson = (value: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const TypeIcon = ({ type }: { type: ScrapperProResult['type'] }) => {
  if (type === 'image') return <ImageIcon className="h-4 w-4" />
  if (type === 'video') return <FileVideo className="h-4 w-4" />
  return <FileText className="h-4 w-4" />
}

const provenanceText = (result: ScrapperProResult) => {
  const p = result.provenance || {}
  const channel = typeof p.channelTitle === 'string' ? p.channelTitle : ''
  const provider = typeof p.provider === 'string' ? p.provider : result.source
  const playlist = typeof p.uploadsPlaylistId === 'string' ? p.uploadsPlaylistId : ''
  return [provider, channel, playlist ? `uploads ${playlist}` : ''].filter(Boolean).join(' · ')
}

export function PF_ScrapperProNext() {
  const [query, setQuery] = React.useState('')
  const [selectedSources, setSelectedSources] = React.useState<Set<string>>(() => new Set(DEFAULT_SOURCES))
  const [results, setResults] = React.useState<ScrapperProResult[]>([])
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set())
  const [saved, setSaved] = React.useState<ScrapperProResult[]>(() => readSaved())
  const [nextPageToken, setNextPageToken] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [failures, setFailures] = React.useState<string[]>([])
  const [message, setMessage] = React.useState('')
  const [filter, setFilter] = React.useState<'all' | ScrapperProResult['type']>('all')

  React.useEffect(() => { localStorage.setItem(SAVED_KEY, JSON.stringify(saved.slice(0, 300))) }, [saved])

  const fetchYouTube = async (cleanQuery: string, pageToken?: string) => {
    const response = await fetch('/api/youtube-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: cleanQuery, ...(pageToken ? { pageToken } : {}) }),
    })
    const data = await response.json() as YouTubeResponse
    if (!response.ok || !data.ok) throw new Error(data.error || `YouTube failed with HTTP ${response.status}`)
    return data
  }

  const fetchOtherSources = async (cleanQuery: string, sources: string[]) => {
    if (!sources.length) return { results: [] as ScrapperProResult[], failures: [] as string[] }
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: cleanQuery, sources }),
    })
    const data = await response.json() as ScrapeResponse
    if (!response.ok || !data.ok) throw new Error(data.error || `Search failed with HTTP ${response.status}`)
    return { results: data.results || [], failures: (data.failures || []).map((failure) => `${failure.source}: ${failure.error}`) }
  }

  const runSearch = async () => {
    const cleanQuery = query.trim()
    if (!cleanQuery || loading) return
    const sourceIds = Array.from(selectedSources).filter((id) => id !== 'tiktok')
    if (!sourceIds.length) { setMessage('Select at least one available source.'); return }
    setLoading(true)
    setFailures([])
    setMessage('')
    setSelectedIds(new Set())
    setNextPageToken(null)
    try {
      const youtubeEnabled = sourceIds.includes('youtube')
      const others = sourceIds.filter((id) => id !== 'youtube')
      const [otherData, youtubeData] = await Promise.all([
        fetchOtherSources(cleanQuery, others).catch((error) => ({ results: [] as ScrapperProResult[], failures: [error instanceof Error ? error.message : 'Other sources failed'] })),
        youtubeEnabled ? fetchYouTube(cleanQuery).catch((error) => ({ ok: false, results: [] as ScrapperProResult[], nextPageToken: null, error: error instanceof Error ? error.message : 'YouTube failed' })) : Promise.resolve({ ok: true, results: [] as ScrapperProResult[], nextPageToken: null }),
      ])
      const combined = dedupe([...(otherData.results || []), ...(youtubeData.results || [])])
      setResults(combined)
      setNextPageToken(youtubeData.nextPageToken || null)
      setFailures([...otherData.failures, ...(!youtubeData.ok && youtubeData.error ? [`YouTube: ${youtubeData.error}`] : [])])
      setMessage(`${combined.length} unique results loaded${youtubeData.nextPageToken ? ' · more YouTube results available' : ''}.`)
    } finally { setLoading(false) }
  }

  const loadMoreYouTube = async () => {
    const cleanQuery = query.trim()
    if (!cleanQuery || !nextPageToken || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await fetchYouTube(cleanQuery, nextPageToken)
      setResults((current) => dedupe([...current, ...(data.results || [])]))
      setNextPageToken(data.nextPageToken || null)
      setMessage(`Loaded another YouTube page${data.nextPageToken ? '.' : ' · end of results.'}`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load the next YouTube page.') }
    finally { setLoadingMore(false) }
  }

  const toggleSource = (source: SourceDefinition) => {
    if (source.disabled) return
    setSelectedSources((current) => {
      const next = new Set(current)
      if (next.has(source.id)) next.delete(source.id)
      else next.add(source.id)
      return next
    })
  }

  const toggleSelected = (id: string) => setSelectedIds((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const visibleResults = filter === 'all' ? results : results.filter((item) => item.type === filter)
  const selectedResults = results.filter((item) => selectedIds.has(item.id))
  const allVisibleSelected = visibleResults.length > 0 && visibleResults.every((item) => selectedIds.has(item.id))

  const toggleAllVisible = () => setSelectedIds((current) => {
    const next = new Set(current)
    if (allVisibleSelected) visibleResults.forEach((item) => next.delete(item.id))
    else visibleResults.forEach((item) => next.add(item.id))
    return next
  })

  const saveSelectedLocal = () => {
    if (!selectedResults.length) return
    setSaved((current) => dedupe([...selectedResults, ...current]).slice(0, 300))
    setMessage(`Saved ${selectedResults.length} selected result${selectedResults.length === 1 ? '' : 's'} in this browser.`)
  }

  const saveSelectedVault = async () => {
    if (!selectedResults.length) return
    let success = 0
    let failed = 0
    for (const result of selectedResults) {
      try {
        await saveScrapperVaultResult({
          source: result.source,
          type: result.type,
          title: result.title,
          originalUrl: result.url,
          thumbnail: result.thumbnail,
          mediaUrl: result.mediaUrl,
          snippet: result.snippet,
          date: result.date,
          provenance: result.provenance,
        })
        success += 1
      } catch { failed += 1 }
    }
    setMessage(`Media Vault: ${success} saved${failed ? ` · ${failed} failed (sign-in/provider may be required)` : ''}.`)
  }

  const exportCollectibleCandidates = () => {
    if (!selectedResults.length) return
    const exportedAt = new Date().toISOString()
    downloadJson({
      schema: 'appforge.collectible-candidates.v1',
      exportedAt,
      rightsReminder: 'Public availability does not grant ownership, commercial rights, or minting permission. Verify creator/channel rights before any collectible or token-art use.',
      autoMint: false,
      candidates: selectedResults.map((result) => ({
        intent: 'collectible-candidate',
        title: result.title,
        source: result.source,
        originalUrl: result.url,
        creatorOrChannel: typeof result.provenance?.channelTitle === 'string' ? result.provenance.channelTitle : undefined,
        sourceId: result.provenance?.youtubeId,
        channelId: result.provenance?.channelId,
        thumbnail: result.thumbnail,
        mediaUrl: result.mediaUrl,
        provenance: result.provenance,
      })),
    }, `appforge-collectible-candidates-${exportedAt.slice(0, 10)}.json`)
    setMessage('Candidate metadata exported with creator/source attribution and an explicit rights reminder. Nothing was minted.')
  }

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setMessage('Source URL copied.')
  }

  const counts = React.useMemo(() => ({
    image: results.filter((item) => item.type === 'image').length,
    video: results.filter((item) => item.type === 'video').length,
    article: results.filter((item) => item.type === 'article').length,
    post: results.filter((item) => item.type === 'post').length,
  }), [results])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
      <section className="surface-card rounded-2xl border p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="flex items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight">Scrapper Pro</h1><span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">official YouTube pagination</span></div><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Search public sources, page through official YouTube Data API results, bulk-select references, refresh metadata, archive to Media Vault, and export optional collectible-candidate metadata without implying ownership rights.</p></div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{results.length} results</span><span>{selectedIds.size} selected</span><span>{saved.length} local saves</span></div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void runSearch() }} placeholder="Search text, YouTube URL, channel ID, video ID, or @handle" className="h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm" /></label>
          <button type="button" onClick={() => void runSearch()} disabled={loading || !query.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search</button>
          <button type="button" onClick={() => void runSearch()} disabled={loading || !results.length} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold hover:bg-accent disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">{SOURCES.map((source) => {
          const active = selectedSources.has(source.id)
          return <button key={source.id} type="button" onClick={() => toggleSource(source)} disabled={source.disabled} title={source.status} className={`rounded-lg border px-3 py-2 text-xs font-medium ${source.disabled ? 'cursor-not-allowed opacity-45' : active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{source.name}{source.disabled ? ` · ${source.status}` : ''}</button>
        })}</div>

        {failures.length > 0 && <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">{failures.join(' · ')}</div>}
        <div aria-live="polite" className="mt-3 min-h-5 text-xs text-muted-foreground">{message}</div>
      </section>

      <section className="surface-card flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">{(['all','image','video','post','article'] as const).map((type) => <button key={type} type="button" onClick={() => setFilter(type)} className={`rounded-lg px-3 py-2 text-xs font-medium capitalize ${filter === type ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{type}{type !== 'all' ? ` ${counts[type]}` : ` ${results.length}`}</button>)}</div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={toggleAllVisible} disabled={!visibleResults.length} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold disabled:opacity-40">{allVisibleSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />} {allVisibleSelected ? 'Clear visible' : 'Select visible'}</button><button type="button" onClick={saveSelectedLocal} disabled={!selectedResults.length} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold disabled:opacity-40"><Archive className="h-3.5 w-3.5" /> Save local</button><button type="button" onClick={() => void saveSelectedVault()} disabled={!selectedResults.length} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold disabled:opacity-40"><Archive className="h-3.5 w-3.5" /> Media Vault</button><button type="button" onClick={exportCollectibleCandidates} disabled={!selectedResults.length} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold disabled:opacity-40"><Download className="h-3.5 w-3.5" /> Candidate JSON</button></div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleResults.map((result) => {
          const selected = selectedIds.has(result.id)
          const savedLocal = saved.some((item) => item.id === result.id || item.url === result.url)
          return <article key={result.id} className={`surface-card overflow-hidden rounded-2xl border ${selected ? 'ring-2 ring-primary/40' : ''}`}>
            <button type="button" onClick={() => toggleSelected(result.id)} className="relative block aspect-video w-full overflow-hidden bg-muted/40 text-left" aria-pressed={selected}>{result.thumbnail ? <img src={result.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground"><TypeIcon type={result.type} /></div>}<span className="absolute left-2 top-2 rounded-lg bg-background/90 p-1.5 shadow">{selected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}</span>{result.source === 'YouTube' && <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-[10px] font-semibold text-white"><Youtube className="h-3 w-3" /> API</span>}</button>
            <div className="p-4"><div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><TypeIcon type={result.type} /> {result.source}{savedLocal ? ' · saved' : ''}</div><h2 className="mt-2 line-clamp-2 text-sm font-semibold leading-5">{result.title}</h2><p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{result.snippet || 'No description.'}</p>{result.provenance && <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-muted-foreground">{provenanceText(result)}</p>}<div className="mt-3 flex gap-2"><a href={result.url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold hover:bg-accent">Open <ExternalLink className="h-3.5 w-3.5" /></a><button type="button" onClick={() => void copyUrl(result.url)} className="grid min-h-9 w-9 place-items-center rounded-lg border hover:bg-accent" aria-label="Copy source URL"><Copy className="h-3.5 w-3.5" /></button></div></div>
          </article>
        })}
      </section>

      {!loading && visibleResults.length === 0 && <div className="surface-card rounded-2xl border p-10 text-center text-sm text-muted-foreground">Search to load public results, or change the active filter.</div>}
      {nextPageToken && selectedSources.has('youtube') && <div className="flex justify-center"><button type="button" onClick={() => void loadMoreYouTube()} disabled={loadingMore} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-background px-5 text-sm font-semibold hover:bg-accent disabled:opacity-50">{loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />} Load more YouTube results</button></div>}

      <section className="rounded-2xl border border-border/70 bg-background/60 p-4 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Collectible boundary:</strong> candidate export records intent and provenance only. AppForge never auto-mints fetched media, and public accessibility does not establish copyright ownership, commercial rights, or permission to tokenize an asset.</section>
    </div>
  )
}

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
type ScrapeResponse = { ok?: boolean; results?: ScrapperProResult[]; failures?: { sourceId: string; source: string; error: string }[]; error?: string }
type YouTubeResponse = { ok?: boolean; results?: ScrapperProResult[]; nextPageToken?: string | null; error?: string }

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
const VAULT_CHANGED_EVENT = 'appforge:media-vault-changed'

const readSaved = (): ScrapperProResult[] => {
  try { const parsed = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); return Array.isArray(parsed) ? parsed : [] }
  catch { return [] }
}

const dedupe = (items: ScrapperProResult[]) => Array.from(new Map(items.filter((item) => item?.url).map((item) => [`${item.type}:${item.mediaUrl || item.url}`, item])).values())

const downloadJson = (value: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url)
}

const filenameFor = (result: ScrapperProResult, mime = '') => {
  const stem = result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || 'getter-result'
  const sourceUrl = result.mediaUrl || result.thumbnail || ''
  const urlExt = sourceUrl.match(/\.([a-z0-9]{2,5})(?:[?#]|$)/i)?.[1]?.toLowerCase()
  const mimeExt = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : mime.includes('gif') ? 'gif' : mime.includes('jpeg') ? 'jpg' : undefined
  return `${stem}.${mimeExt || urlExt || (result.type === 'image' ? 'jpg' : 'bin')}`
}

const TypeIcon = ({ type }: { type: ScrapperProResult['type'] }) => type === 'image' ? <ImageIcon className="h-4 w-4" /> : type === 'video' ? <FileVideo className="h-4 w-4" /> : <FileText className="h-4 w-4" />

const provenanceText = (result: ScrapperProResult) => {
  const p = result.provenance || {}; const channel = typeof p.channelTitle === 'string' ? p.channelTitle : ''; const provider = typeof p.provider === 'string' ? p.provider : result.source; const playlist = typeof p.uploadsPlaylistId === 'string' ? p.uploadsPlaylistId : ''
  return [provider, channel, playlist ? `uploads ${playlist}` : ''].filter(Boolean).join(' · ')
}

const toVaultInput = (result: ScrapperProResult) => ({ source: result.source, type: result.type, title: result.title, originalUrl: result.url, thumbnail: result.thumbnail, mediaUrl: result.mediaUrl, snippet: result.snippet, date: result.date, provenance: result.provenance })

export function PF_ScrapperProNext() {
  const [query, setQuery] = React.useState('')
  const [selectedSources, setSelectedSources] = React.useState<Set<string>>(() => new Set(DEFAULT_SOURCES))
  const [results, setResults] = React.useState<ScrapperProResult[]>([])
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set())
  const [saved, setSaved] = React.useState<ScrapperProResult[]>(() => readSaved())
  const [vaultSavedUrls, setVaultSavedUrls] = React.useState<Set<string>>(() => new Set())
  const [savingVault, setSavingVault] = React.useState<Set<string>>(() => new Set())
  const [nextPageToken, setNextPageToken] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [failures, setFailures] = React.useState<string[]>([])
  const [message, setMessage] = React.useState('')
  const [filter, setFilter] = React.useState<'all' | ScrapperProResult['type']>('all')

  React.useEffect(() => { localStorage.setItem(SAVED_KEY, JSON.stringify(saved.slice(0, 300))) }, [saved])

  const fetchYouTube = async (cleanQuery: string, pageToken?: string) => {
    const response = await fetch('/api/youtube-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: cleanQuery, ...(pageToken ? { pageToken } : {}) }) })
    const data = await response.json() as YouTubeResponse
    if (!response.ok || !data.ok) throw new Error(data.error || `YouTube failed with HTTP ${response.status}`)
    return data
  }

  const fetchOtherSources = async (cleanQuery: string, sources: string[]) => {
    if (!sources.length) return { results: [] as ScrapperProResult[], failures: [] as string[] }
    const response = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: cleanQuery, sources }) })
    const data = await response.json() as ScrapeResponse
    if (!response.ok || !data.ok) throw new Error(data.error || `Search failed with HTTP ${response.status}`)
    return { results: data.results || [], failures: (data.failures || []).map((failure) => `${failure.source}: ${failure.error}`) }
  }

  const runSearch = async () => {
    const cleanQuery = query.trim(); if (!cleanQuery || loading) return
    const sourceIds = Array.from(selectedSources).filter((id) => id !== 'tiktok')
    if (!sourceIds.length) { setMessage('Select at least one available source.'); return }
    setLoading(true); setFailures([]); setMessage(''); setSelectedIds(new Set()); setNextPageToken(null)
    try {
      const youtubeEnabled = sourceIds.includes('youtube'); const others = sourceIds.filter((id) => id !== 'youtube')
      const [otherData, youtubeData] = await Promise.all([
        fetchOtherSources(cleanQuery, others).catch((error) => ({ results: [] as ScrapperProResult[], failures: [error instanceof Error ? error.message : 'Other sources failed'] })),
        youtubeEnabled ? fetchYouTube(cleanQuery).catch((error) => ({ ok: false, results: [] as ScrapperProResult[], nextPageToken: null, error: error instanceof Error ? error.message : 'YouTube failed' })) : Promise.resolve({ ok: true, results: [] as ScrapperProResult[], nextPageToken: null } as YouTubeResponse),
      ])
      const combined = dedupe([...(otherData.results || []), ...(youtubeData.results || [])]); setResults(combined); setNextPageToken(youtubeData.nextPageToken || null)
      setFailures([...otherData.failures, ...(!youtubeData.ok && youtubeData.error ? [`YouTube: ${youtubeData.error}`] : [])]); setMessage(`${combined.length} unique results loaded${youtubeData.nextPageToken ? ' · more YouTube results available' : ''}.`)
    } finally { setLoading(false) }
  }

  const loadMoreYouTube = async () => {
    const cleanQuery = query.trim(); if (!cleanQuery || !nextPageToken || loadingMore) return
    setLoadingMore(true)
    try { const data = await fetchYouTube(cleanQuery, nextPageToken); setResults((current) => dedupe([...current, ...(data.results || [])])); setNextPageToken(data.nextPageToken || null); setMessage(`Loaded another YouTube page${data.nextPageToken ? '.' : ' · end of results.'}`) }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load the next YouTube page.') }
    finally { setLoadingMore(false) }
  }

  const toggleSource = (source: SourceDefinition) => { if (source.disabled) return; setSelectedSources((current) => { const next = new Set(current); if (next.has(source.id)) next.delete(source.id); else next.add(source.id); return next }) }
  const toggleSelected = (id: string) => setSelectedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next })
  const visibleResults = filter === 'all' ? results : results.filter((item) => item.type === filter)
  const selectedResults = results.filter((item) => selectedIds.has(item.id))
  const allVisibleSelected = visibleResults.length > 0 && visibleResults.every((item) => selectedIds.has(item.id))
  const toggleAllVisible = () => setSelectedIds((current) => { const next = new Set(current); if (allVisibleSelected) visibleResults.forEach((item) => next.delete(item.id)); else visibleResults.forEach((item) => next.add(item.id)); return next })

  const saveOneLocal = (result: ScrapperProResult) => { setSaved((current) => dedupe([result, ...current]).slice(0, 300)); setMessage(`Saved “${result.title}” in this browser.`) }

  const saveOneVault = async (result: ScrapperProResult, quiet = false) => {
    setSavingVault((current) => new Set(current).add(result.url))
    try {
      const row = await saveScrapperVaultResult(toVaultInput(result))
      if (!row?.id || row.source_app !== 'scrapper-pro' || row.source_ref !== result.url.trim()) throw new Error('Media Vault did not confirm the saved reference.')
      setVaultSavedUrls((current) => new Set(current).add(result.url)); window.dispatchEvent(new CustomEvent(VAULT_CHANGED_EVENT, { detail: { id: row.id, sourceRef: row.source_ref } }))
      if (!quiet) setMessage(`Saved “${result.title}” to Media Vault.`)
      return true
    } catch (error) {
      if (!quiet) setMessage(error instanceof Error ? `Media Vault save failed: ${error.message}` : 'Media Vault save failed.')
      return false
    } finally { setSavingVault((current) => { const next = new Set(current); next.delete(result.url); return next }) }
  }

  const downloadResult = async (result: ScrapperProResult) => {
    const target = result.mediaUrl || result.thumbnail; if (!target) { setMessage('This result does not expose a directly downloadable media URL.'); return }
    try { const response = await fetch(target); if (!response.ok) throw new Error(`HTTP ${response.status}`); const blob = await response.blob(); if (!blob.size) throw new Error('Empty media response'); const objectUrl = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = objectUrl; link.download = filenameFor(result, blob.type); document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(objectUrl); setMessage(`Downloaded “${result.title}”.`) }
    catch { const link = document.createElement('a'); link.href = target; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.download = filenameFor(result); document.body.appendChild(link); link.click(); link.remove(); setMessage('The source blocks direct browser download, so the original media was opened for saving.') }
  }

  const saveSelectedLocal = () => { if (!selectedResults.length) return; setSaved((current) => dedupe([...selectedResults, ...current]).slice(0, 300)); setMessage(`Saved ${selectedResults.length} selected result${selectedResults.length === 1 ? '' : 's'} in this browser.`) }
  const saveSelectedVault = async () => { if (!selectedResults.length) return; let success = 0; for (const result of selectedResults) if (await saveOneVault(result, true)) success += 1; const failed = selectedResults.length - success; setMessage(`Media Vault confirmed ${success} save${success === 1 ? '' : 's'}${failed ? ` · ${failed} failed` : ''}.`) }

  const exportCollectibleCandidates = () => { if (!selectedResults.length) return; const exportedAt = new Date().toISOString(); downloadJson({ schema: 'appforge.collectible-candidates.v1', exportedAt, rightsReminder: 'Public availability does not grant ownership, commercial rights, or minting permission. Verify creator/channel rights before any collectible or token-art use.', autoMint: false, candidates: selectedResults.map((result) => ({ intent: 'collectible-candidate', title: result.title, source: result.source, originalUrl: result.url, creatorOrChannel: typeof result.provenance?.channelTitle === 'string' ? result.provenance.channelTitle : undefined, sourceId: result.provenance?.youtubeId, channelId: result.provenance?.channelId, thumbnail: result.thumbnail, mediaUrl: result.mediaUrl, provenance: result.provenance })) }, `appforge-collectible-candidates-${exportedAt.slice(0, 10)}.json`); setMessage('Candidate metadata exported with creator/source attribution. Nothing was minted.') }
  const copyUrl = async (url: string) => { await navigator.clipboard.writeText(url); setMessage('Source URL copied.') }
  const counts = React.useMemo(() => ({ image: results.filter((item) => item.type === 'image').length, video: results.filter((item) => item.type === 'video').length, article: results.filter((item) => item.type === 'article').length, post: results.filter((item) => item.type === 'post').length }), [results])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
      <section className="surface-card rounded-2xl border p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight">Getter Pro</h1><span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">verified Media Vault writes</span></div><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Search public sources, page through YouTube results, download media, save browser-local references, or archive durable references to Media Vault.</p></div><div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{results.length} results</span><span>{selectedIds.size} selected</span><span>{saved.length} local saves</span><span>{vaultSavedUrls.size} vault-confirmed</span></div></div>
        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]"><label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void runSearch() }} placeholder="Search text, YouTube URL, channel ID, video ID, or @handle" className="h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm" /></label><button type="button" onClick={() => void runSearch()} disabled={loading || !query.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search</button><button type="button" onClick={() => void runSearch()} disabled={loading || !results.length} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold hover:bg-accent disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Refresh</button></div>
        <div className="mt-4 flex flex-wrap gap-2">{SOURCES.map((source) => { const active = selectedSources.has(source.id); return <button key={source.id} type="button" onClick={() => toggleSource(source)} disabled={source.disabled} title={source.status} className={`rounded-lg border px-3 py-2 text-xs font-medium ${source.disabled ? 'cursor-not-allowed opacity-45' : active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{source.name}{source.disabled ? ` · ${source.status}` : ''}</button> })}</div>
        {failures.length > 0 && <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">{failures.join(' · ')}</div>}<div aria-live="polite" className="mt-3 min-h-5 text-xs text-muted-foreground">{message}</div>
      </section>
      <section className="surface-card flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-1.5">{(['all','image','video','post','article'] as const).map((type) => <button key={type} type="button" onClick={() => setFilter(type)} className={`rounded-lg px-3 py-2 text-xs font-medium capitalize ${filter === type ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{type}{type !== 'all' ? ` ${counts[type]}` : ` ${results.length}`}</button>)}</div><div className="flex flex-wrap gap-2"><button type="button" onClick={toggleAllVisible} disabled={!visibleResults.length} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold disabled:opacity-40">{allVisibleSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />} {allVisibleSelected ? 'Clear visible' : 'Select visible'}</button><button type="button" onClick={saveSelectedLocal} disabled={!selectedResults.length} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold disabled:opacity-40"><Archive className="h-3.5 w-3.5" /> Save local</button><button type="button" onClick={() => void saveSelectedVault()} disabled={!selectedResults.length} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold disabled:opacity-40"><Archive className="h-3.5 w-3.5" /> Media Vault</button><button type="button" onClick={exportCollectibleCandidates} disabled={!selectedResults.length} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold disabled:opacity-40"><Download className="h-3.5 w-3.5" /> Candidate JSON</button></div></section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleResults.map((result) => { const selected = selectedIds.has(result.id); const savedLocal = saved.some((item) => item.id === result.id || item.url === result.url); const savedVault = vaultSavedUrls.has(result.url); const saving = savingVault.has(result.url); const downloadable = Boolean(result.mediaUrl || result.thumbnail); return <article key={result.id} className={`surface-card overflow-hidden rounded-2xl border ${selected ? 'ring-2 ring-primary/40' : ''}`}><button type="button" onClick={() => toggleSelected(result.id)} className="relative block aspect-video w-full overflow-hidden bg-muted/40 text-left" aria-pressed={selected}>{result.thumbnail ? <img src={result.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground"><TypeIcon type={result.type} /></div>}<span className="absolute left-2 top-2 rounded-lg bg-background/90 p-1.5 shadow">{selected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}</span>{result.source === 'YouTube' && <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-[10px] font-semibold text-white"><Youtube className="h-3 w-3" /> API</span>}</button><div className="p-4"><div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><TypeIcon type={result.type} /> {result.source}{savedLocal ? ' · local' : ''}{savedVault ? ' · vault' : ''}</div><h2 className="mt-2 line-clamp-2 text-sm font-semibold leading-5">{result.title}</h2><p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{result.snippet || 'No description.'}</p>{result.provenance && <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-muted-foreground">{provenanceText(result)}</p>}<div className="mt-3 grid grid-cols-[1fr_auto_auto_auto_auto] gap-2"><a href={result.url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold hover:bg-accent">Open <ExternalLink className="h-3.5 w-3.5" /></a><button type="button" onClick={() => saveOneLocal(result)} className="grid min-h-9 w-9 place-items-center rounded-lg border hover:bg-accent" aria-label="Save locally" title="Save locally"><Archive className="h-3.5 w-3.5" /></button><button type="button" onClick={() => void saveOneVault(result)} disabled={saving} className="grid min-h-9 w-9 place-items-center rounded-lg border hover:bg-accent disabled:opacity-50" aria-label="Save to Media Vault" title="Save to Media Vault">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className={`h-3.5 w-3.5 ${savedVault ? 'text-primary' : ''}`} />}</button><button type="button" onClick={() => void downloadResult(result)} disabled={!downloadable} className="grid min-h-9 w-9 place-items-center rounded-lg border hover:bg-accent disabled:cursor-not-allowed disabled:opacity-35" aria-label="Download result media" title="Download media"><Download className="h-3.5 w-3.5" /></button><button type="button" onClick={() => void copyUrl(result.url)} className="grid min-h-9 w-9 place-items-center rounded-lg border hover:bg-accent" aria-label="Copy source URL" title="Copy source URL"><Copy className="h-3.5 w-3.5" /></button></div></div></article> })}</section>
      {!loading && visibleResults.length === 0 && <div className="surface-card rounded-2xl border p-10 text-center text-sm text-muted-foreground">Search to load public results, or change the active filter.</div>}
      {nextPageToken && selectedSources.has('youtube') && <div className="flex justify-center"><button type="button" onClick={() => void loadMoreYouTube()} disabled={loadingMore} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-background px-5 text-sm font-semibold hover:bg-accent disabled:opacity-50">{loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />} Load more YouTube results</button></div>}
      <section className="rounded-2xl border border-border/70 bg-background/60 p-4 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Save contract:</strong> “Saved to Media Vault” is only shown after Supabase returns and validates the persisted row. Browser-local saves are now labeled separately.</section>
    </div>
  )
}

import React from 'react'
import { Card, Button, Input, Badge, MediaShowbox } from '@/components/ui'
import { downloadTextPdf } from '@/lib/simplePdf'
import { saveScrapperVaultResult } from '@/lib/mediaVault'
import {
  AlertCircle,
  Archive,
  Check,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileText,
  FileVideo,
  Globe2,
  Grid3X3,
  Image as ImageIcon,
  List,
  Loader2,
  Maximize2,
  Play,
  Save,
  Search,
  Square,
  Trash2,
} from 'lucide-react'

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

type SourceType = ScrapperProResult['type']
type ViewMode = 'grid' | 'list'
type ResultFilter = 'media' | 'all' | SourceType | 'saved'

interface SourceDefinition {
  id: string
  name: string
  type: SourceType
}

interface ScrapeResponse {
  ok: boolean
  query: string
  count: number
  mediaCount?: number
  durationMs: number
  results: ScrapperProResult[]
  failures: { sourceId: string; source: string; error: string }[]
  error?: string
}

const SOURCES: SourceDefinition[] = [
  { id: 'duckduckgo-images', name: 'DuckDuckGo Images', type: 'image' },
  { id: 'bing-images', name: 'Bing Images', type: 'image' },
  { id: 'wikimedia', name: 'Wikimedia Commons', type: 'image' },
  { id: 'reddit', name: 'Reddit', type: 'post' },
  { id: 'youtube', name: 'YouTube', type: 'video' },
  { id: 'duckduckgo-general', name: 'DuckDuckGo Web', type: 'article' },
  { id: 'medium', name: 'Medium', type: 'article' },
]

const DEFAULT_SOURCES = new Set(['duckduckgo-images', 'bing-images', 'wikimedia', 'reddit', 'youtube'])
const STORAGE_KEY = 'appforge-scrapper-saved'
const LEGACY_STORAGE_KEY = 'projectforge-scrapper-saved'

const typeIcon = (type: SourceType) => {
  if (type === 'image') return ImageIcon
  if (type === 'video') return FileVideo
  if (type === 'article') return FileText
  return Globe2
}

const typeColor = (type: SourceType): 'blue' | 'red' | 'green' | 'slate' => {
  if (type === 'image') return 'blue'
  if (type === 'video') return 'red'
  if (type === 'article') return 'green'
  return 'slate'
}

const safeHost = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

const formatDuration = (ms: number) => ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`

const isYouTube = (result: ScrapperProResult) => {
  try {
    const host = new URL(result.url).hostname
    return host.includes('youtube.com') || host.includes('youtu.be')
  } catch { return false }
}

const slug = (value: string, fallback = 'scrapper-pro') => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 70) || fallback

const extensionFor = (contentType: string) => {
  const type = contentType.split(';')[0].toLowerCase()
  const map: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg',
    'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
  }
  return map[type] || 'bin'
}

export function PF_ScrapperPro() {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<ScrapperProResult[]>([])
  const [saved, setSaved] = React.useState<ScrapperProResult[]>([])
  const [selectedSources, setSelectedSources] = React.useState<Set<string>>(() => new Set(DEFAULT_SOURCES))
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid')
  const [filter, setFilter] = React.useState<ResultFilter>('media')
  const [running, setRunning] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const [durationMs, setDurationMs] = React.useState<number | null>(null)
  const [failures, setFailures] = React.useState<ScrapeResponse['failures']>([])
  const [error, setError] = React.useState('')
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null)
  const [savingVaultId, setSavingVaultId] = React.useState<string | null>(null)
  const [vaultSavedIds, setVaultSavedIds] = React.useState<Set<string>>(() => new Set())
  const [preview, setPreview] = React.useState<ScrapperProResult | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  React.useEffect(() => {
    try {
      const current = localStorage.getItem(STORAGE_KEY)
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
      const raw = current || legacy
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setSaved(parsed)
        if (!current && legacy) localStorage.setItem(STORAGE_KEY, legacy)
      }
    } catch { /* start clean */ }
    return () => {
      abortRef.current?.abort()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const persistSaved = (items: ScrapperProResult[]) => {
    setSaved(items)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed((value) => value + 1), 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  const stopSearch = () => {
    abortRef.current?.abort()
    abortRef.current = null
    stopTimer()
    setRunning(false)
    setError('Search stopped.')
  }

  const runSearch = async () => {
    const cleanQuery = query.trim()
    if (!cleanQuery || selectedSources.size === 0 || running) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setRunning(true)
    setError('')
    setFailures([])
    setDurationMs(null)
    startTimer()
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ query: cleanQuery, sources: Array.from(selectedSources) }),
      })
      const data = await response.json() as ScrapeResponse
      if (!response.ok || !data.ok) throw new Error(data.error || `Search failed with HTTP ${response.status}`)
      const nextResults = data.results || []
      setResults(nextResults)
      setFailures(data.failures || [])
      setDurationMs(data.durationMs ?? null)
      setFilter(nextResults.some((item) => item.type === 'image' || item.type === 'video') ? 'media' : 'all')
    } catch (searchError) {
      if (searchError instanceof DOMException && searchError.name === 'AbortError') return
      setError(searchError instanceof Error ? searchError.message : 'Search failed')
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      stopTimer()
      setRunning(false)
    }
  }

  const toggleSource = (sourceId: string) => {
    setSelectedSources((current) => {
      const next = new Set(current)
      if (next.has(sourceId)) next.delete(sourceId)
      else next.add(sourceId)
      return next
    })
  }

  const selectPreset = (preset: 'recommended' | 'media' | 'all') => {
    if (preset === 'all') return setSelectedSources(new Set(SOURCES.map((source) => source.id)))
    if (preset === 'media') return setSelectedSources(new Set(['duckduckgo-images', 'bing-images', 'wikimedia', 'reddit', 'youtube']))
    setSelectedSources(new Set(DEFAULT_SOURCES))
  }

  const toggleSaved = (result: ScrapperProResult) => {
    const exists = saved.some((item) => item.id === result.id || item.url === result.url)
    persistSaved(exists ? saved.filter((item) => item.id !== result.id && item.url !== result.url) : [result, ...saved].slice(0, 250))
  }

  const saveToMediaVault = async (result: ScrapperProResult) => {
    setSavingVaultId(result.id)
    setError('')
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
      setVaultSavedIds((current) => new Set(current).add(result.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save to Media Vault.')
    } finally { setSavingVaultId(null) }
  }

  const copyUrl = async (result: ScrapperProResult) => {
    try {
      await navigator.clipboard.writeText(result.url)
      setCopiedId(result.id)
      window.setTimeout(() => setCopiedId(null), 1600)
    } catch { setError('Clipboard access was blocked by the browser.') }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const downloadMedia = async (result: ScrapperProResult) => {
    const target = isYouTube(result) ? result.thumbnail : (result.mediaUrl || result.thumbnail)
    if (!target) throw new Error('This result does not expose downloadable media.')
    const response = await fetch(`/api/media?url=${encodeURIComponent(target)}&name=${encodeURIComponent(slug(result.title))}`)
    if (!response.ok) {
      const data = await response.json().catch(() => null) as { error?: string } | null
      throw new Error(data?.error || `Download failed with HTTP ${response.status}`)
    }
    const blob = await response.blob()
    downloadBlob(blob, `${slug(result.title)}.${extensionFor(blob.type)}`)
  }

  const downloadArticle = async (result: ScrapperProResult) => {
    const response = await fetch(`/api/article?url=${encodeURIComponent(result.url)}`)
    const data = await response.json() as { ok?: boolean; text?: string; error?: string }
    if (!response.ok || !data.ok || !data.text) throw new Error(data.error || 'Could not retrieve article text')
    downloadTextPdf({ title: result.title, sourceUrl: result.url, text: data.text, filename: `${slug(result.title)}.pdf` })
  }

  const downloadPost = (result: ScrapperProResult) => {
    downloadBlob(new Blob([`${result.title}\n\n${result.snippet || ''}\n\nSource: ${result.url}\n`], { type: 'text/plain;charset=utf-8' }), `${slug(result.title)}.txt`)
  }

  const downloadResult = async (result: ScrapperProResult) => {
    if (downloadingId) return
    setDownloadingId(result.id)
    setError('')
    try {
      if (result.type === 'article') await downloadArticle(result)
      else if (result.type === 'post') downloadPost(result)
      else await downloadMedia(result)
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Download failed')
    } finally { setDownloadingId(null) }
  }

  const exportResults = () => {
    const payload = filter === 'saved' ? saved : results
    if (!payload.length) return
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `scrapper-pro-${new Date().toISOString().slice(0, 10)}.json`)
  }

  const isSaved = (result: ScrapperProResult) => saved.some((item) => item.id === result.id || item.url === result.url)
  const mediaResults = results.filter((result) => result.type === 'image' || result.type === 'video')
  const activeResults = filter === 'saved' ? saved : filter === 'media' ? mediaResults : filter === 'all' ? results : results.filter((result) => result.type === filter)
  const previewableResults = activeResults.filter((result) => result.type === 'image' || result.type === 'video')
  const previewIndex = preview ? previewableResults.findIndex((result) => result.id === preview.id) : -1
  const navigatePreview = (direction: -1 | 1) => {
    if (!previewableResults.length || previewIndex < 0) return
    const nextIndex = (previewIndex + direction + previewableResults.length) % previewableResults.length
    setPreview(previewableResults[nextIndex])
  }

  const counts = React.useMemo(() => ({
    image: results.filter((result) => result.type === 'image').length,
    video: results.filter((result) => result.type === 'video').length,
    post: results.filter((result) => result.type === 'post').length,
    article: results.filter((result) => result.type === 'article').length,
  }), [results])

  const downloadLabel = (result: ScrapperProResult) => {
    if (result.type === 'article') return 'PDF'
    if (result.type === 'post') return 'TXT'
    if (result.type === 'video' && isYouTube(result)) return 'Thumbnail'
    return 'Download'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-foreground">Scrapper Pro</h1><Badge color="green">Server-backed</Badge></div><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Search public sources for real images, videos, posts, and articles. YouTube uses its official Data API and accepts text, video/channel URLs, IDs, and @handles. Signed-in users can archive provenance-rich references into Media Vault.</p></div>
        <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-background/45 p-1 backdrop-blur-md"><button type="button" onClick={() => setViewMode('grid')} aria-label="Grid view" className={`rounded-md p-1.5 ${viewMode === 'grid' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><Grid3X3 className="h-4 w-4" /></button><button type="button" onClick={() => setViewMode('list')} aria-label="List view" className={`rounded-md p-1.5 ${viewMode === 'list' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><List className="h-4 w-4" /></button></div>
      </div>

      <Card><div className="flex flex-col gap-3 lg:flex-row lg:items-end"><div className="flex-1"><label className="mb-1.5 block text-sm font-medium text-foreground">Search query</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && !running && runSearch()} placeholder="Name, handle, topic, product, event…" className="pl-9" /></div></div><div className="flex flex-wrap gap-2">{running ? <Button variant="secondary" onClick={stopSearch}><Square className="h-4 w-4" /> Stop</Button> : <Button onClick={runSearch} disabled={!query.trim() || selectedSources.size === 0}><Play className="h-4 w-4" /> Search {selectedSources.size} sources</Button>}<Button variant="secondary" onClick={exportResults} disabled={(filter === 'saved' ? saved : results).length === 0}><Download className="h-4 w-4" /> Export JSON</Button></div></div>
        <div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-xs font-medium text-muted-foreground">Presets:</span><button onClick={() => selectPreset('recommended')} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">Recommended</button><button onClick={() => selectPreset('media')} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">Media</button><button onClick={() => selectPreset('all')} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">All sources</button><button onClick={() => setSelectedSources(new Set())} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">Clear</button></div>
        <div className="mt-3 flex flex-wrap gap-1.5">{SOURCES.map((source) => { const Icon = typeIcon(source.type); const selected = selectedSources.has(source.id); return <button key={source.id} type="button" onClick={() => toggleSource(source.id)} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${selected ? 'border-foreground/25 bg-accent/80 text-foreground' : 'border-border/70 bg-background/40 text-muted-foreground hover:text-foreground'}`}><Icon className="h-3.5 w-3.5" /> {source.name}</button> })}</div>
        {running && <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching selected sources in parallel <span className="ml-auto inline-flex items-center gap-1 font-mono text-xs"><Clock3 className="h-3.5 w-3.5" /> {elapsed}s</span></div>}
        {error && <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
      </Card>

      {(results.length > 0 || saved.length > 0) && <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-1.5">{([['media', `Media ${mediaResults.length}`], ['image', `Images ${counts.image}`], ['video', `Videos ${counts.video}`], ['article', `Articles ${counts.article}`], ['post', `Posts ${counts.post}`], ['all', `All ${results.length}`], ['saved', `Saved ${saved.length}`]] as [ResultFilter, string][]).map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${filter === value ? 'border-foreground/25 bg-accent/85 text-foreground' : 'border-border/70 bg-background/35 text-muted-foreground hover:text-foreground'}`}>{label}</button>)}</div><div className="text-xs text-muted-foreground">{durationMs !== null && <span>{formatDuration(durationMs)} · </span>}{failures.length ? `${failures.length} source${failures.length === 1 ? '' : 's'} unavailable` : results.length ? 'All selected sources responded' : ''}</div></div>}

      {failures.length > 0 && <Card className="border-amber-500/30 bg-amber-500/5"><div className="flex items-start gap-2 p-4"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><div><h2 className="text-sm font-medium text-foreground">Some sources were unavailable</h2><p className="mt-1 text-xs text-muted-foreground">Public search pages can rate-limit or change markup. Successful results are still shown.</p><div className="mt-2 flex flex-wrap gap-1.5">{failures.map((failure) => <span key={failure.sourceId} title={failure.error} className="rounded-md border border-border bg-background/50 px-2 py-1 text-xs text-muted-foreground">{failure.source}</span>)}</div></div></div></Card>}

      {activeResults.length > 0 ? <div className={viewMode === 'grid' ? 'grid gap-3 sm:grid-cols-2' : 'space-y-2'}>{activeResults.map((result) => { const Icon = typeIcon(result.type); const savedResult = isSaved(result); const vaultSaved = vaultSavedIds.has(result.id); const previewable = result.type === 'image' || result.type === 'video'; const busy = downloadingId === result.id; return <Card key={`${filter}-${result.id}`} className={viewMode === 'list' ? 'p-3' : 'overflow-hidden p-0'}>{viewMode === 'grid' && result.thumbnail && <button type="button" onClick={() => previewable && setPreview(result)} className="group relative block h-72 w-full overflow-hidden bg-muted text-left" aria-label={previewable ? `Preview ${result.title}` : result.title}><img src={result.thumbnail} alt={result.title} loading="lazy" className="h-full w-full object-cover" onError={(event) => { (event.currentTarget as HTMLImageElement).style.opacity = '0' }} />{result.type === 'video' && <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-xl backdrop-blur-md transition-transform group-hover:scale-105"><Play className="ml-0.5 h-5 w-5 fill-current" /></span>}{previewable && <span className="absolute right-2 top-2 rounded-lg border border-white/15 bg-black/45 p-1.5 text-white/90 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"><Maximize2 className="h-3.5 w-3.5" /></span>}</button>}<div className={viewMode === 'grid' ? 'p-3' : 'flex items-center gap-3'}>{viewMode === 'list' && <button type="button" onClick={() => previewable && setPreview(result)} className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted text-muted-foreground ${previewable ? 'cursor-pointer' : 'cursor-default'}`}>{result.thumbnail ? <img src={result.thumbnail} alt="" className="h-full w-full object-cover" /> : <Icon className="h-4 w-4" />}</button>}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><Badge color={typeColor(result.type)}>{result.type}</Badge><span className="truncate text-[11px] text-muted-foreground">{result.source}</span></div><h3 className={`${previewable && viewMode === 'grid' ? 'mt-1 line-clamp-1 text-xs font-medium' : 'mt-2 line-clamp-2 text-sm font-semibold'} text-foreground`}>{result.title}</h3>{result.snippet && !(previewable && viewMode === 'grid') && <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{result.snippet}</p>}{!(previewable && viewMode === 'grid') && <p className="mt-2 truncate text-[11px] text-muted-foreground">{safeHost(result.url)}</p>}</div><div className={viewMode === 'grid' ? 'mt-2 flex items-center gap-1 border-t border-border/60 pt-2' : 'flex shrink-0 items-center gap-1'}>{previewable && <Button variant="secondary" size="sm" className={viewMode === 'grid' ? 'flex-1' : ''} onClick={() => setPreview(result)}><Maximize2 className="h-3.5 w-3.5" /> {viewMode === 'grid' ? 'View' : ''}</Button>}{!previewable && <a href={result.url} target="_blank" rel="noopener noreferrer" className={viewMode === 'grid' ? 'flex-1' : ''}><Button variant="secondary" size="sm" className={viewMode === 'grid' ? 'w-full' : ''}><ExternalLink className="h-3.5 w-3.5" /> {viewMode === 'grid' ? 'Open' : ''}</Button></a>}<Button variant="ghost" size="sm" onClick={() => downloadResult(result)} title={`Download ${downloadLabel(result)}`} disabled={busy}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}{viewMode === 'grid' && !previewable ? downloadLabel(result) : ''}</Button><Button variant="ghost" size="sm" onClick={() => copyUrl(result)} title="Copy URL">{copiedId === result.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</Button><Button variant="ghost" size="sm" onClick={() => toggleSaved(result)} title={savedResult ? 'Remove local save' : 'Save on this device'}>{savedResult ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Save className="h-3.5 w-3.5" />}</Button><Button variant="ghost" size="sm" onClick={() => void saveToMediaVault(result)} title={vaultSaved ? 'Saved to Media Vault' : 'Save to Media Vault'} disabled={savingVaultId === result.id || vaultSaved}>{savingVaultId === result.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : vaultSaved ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Archive className="h-3.5 w-3.5" />}</Button></div></div></Card> })}</div> : !running ? <Card><div className="py-10 text-center"><Search className="mx-auto h-5 w-5 text-muted-foreground" /><h2 className="mt-3 text-sm font-medium text-foreground">{filter === 'saved' ? 'No saved results yet' : filter === 'media' ? 'No media results yet' : 'Ready to search'}</h2><p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{filter === 'saved' ? 'Local saves stay on this device. Signed-in users can also archive a result to the Scrapper Pro folder in Media Vault.' : 'Enter a query, choose sources, and search. Media results open inside AppForge; article results can be exported as PDF.'}</p></div></Card> : null}

      {saved.length > 0 && <div className="flex justify-end"><Button variant="ghost" size="sm" onClick={() => persistSaved([])}><Trash2 className="h-3.5 w-3.5" /> Clear saved results</Button></div>}

      {preview && <MediaShowbox open onClose={() => setPreview(null)} type={preview.type as 'image' | 'video'} title={preview.title} source={preview.source} originalUrl={preview.url} mediaUrl={preview.mediaUrl} thumbnail={preview.thumbnail} downloading={downloadingId === preview.id} onDownload={() => downloadResult(preview)} downloadLabel={preview.type === 'video' && isYouTube(preview) ? 'Download thumbnail' : 'Download media'} note={preview.type === 'video' && isYouTube(preview) ? 'YouTube is playable in-page. The source does not expose a direct downloadable video file, so AppForge saves the result thumbnail instead.' : undefined} onPrevious={() => navigatePreview(-1)} onNext={() => navigatePreview(1)} hasPrevious={previewableResults.length > 1} hasNext={previewableResults.length > 1} positionLabel={previewIndex >= 0 ? `${previewIndex + 1} / ${previewableResults.length}` : undefined} />}
    </div>
  )
}

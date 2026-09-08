import React from 'react'
import { Card, Button, Input, Badge } from '@/components/ui'
import {
  AlertCircle,
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
}

type SourceType = ScrapperProResult['type']
type ViewMode = 'grid' | 'list'
type ResultFilter = 'all' | SourceType | 'saved'

interface SourceDefinition {
  id: string
  name: string
  type: SourceType
}

interface ScrapeResponse {
  ok: boolean
  query: string
  count: number
  durationMs: number
  results: ScrapperProResult[]
  failures: { sourceId: string; source: string; error: string }[]
  error?: string
}

const SOURCES: SourceDefinition[] = [
  { id: 'duckduckgo-images', name: 'DuckDuckGo Images', type: 'image' },
  { id: 'duckduckgo-general', name: 'DuckDuckGo', type: 'article' },
  { id: 'google-images', name: 'Google Images', type: 'image' },
  { id: 'bing-images', name: 'Bing Images', type: 'image' },
  { id: 'reddit', name: 'Reddit', type: 'post' },
  { id: 'youtube', name: 'YouTube', type: 'video' },
  { id: 'medium', name: 'Medium', type: 'article' },
  { id: 'flickr', name: 'Flickr', type: 'image' },
  { id: 'pixabay', name: 'Pixabay', type: 'image' },
  { id: 'pexels', name: 'Pexels', type: 'image' },
  { id: 'pinterest', name: 'Pinterest', type: 'image' },
  { id: 'deviantart', name: 'DeviantArt', type: 'image' },
]

const DEFAULT_SOURCES = new Set(['duckduckgo-images', 'duckduckgo-general', 'reddit', 'youtube', 'medium', 'pexels'])
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
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

export function PF_ScrapperPro() {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<ScrapperProResult[]>([])
  const [saved, setSaved] = React.useState<ScrapperProResult[]>([])
  const [selectedSources, setSelectedSources] = React.useState<Set<string>>(() => new Set(DEFAULT_SOURCES))
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid')
  const [filter, setFilter] = React.useState<ResultFilter>('all')
  const [running, setRunning] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const [durationMs, setDurationMs] = React.useState<number | null>(null)
  const [failures, setFailures] = React.useState<ScrapeResponse['failures']>([])
  const [error, setError] = React.useState('')
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
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
    } catch {
      // Ignore malformed local data and start clean.
    }

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          query: cleanQuery,
          sources: Array.from(selectedSources),
        }),
      })

      const data = await response.json() as ScrapeResponse
      if (!response.ok || !data.ok) {
        throw new Error(data.error || `Search failed with HTTP ${response.status}`)
      }

      setResults(data.results || [])
      setFailures(data.failures || [])
      setDurationMs(data.durationMs ?? null)
      setFilter('all')
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
    if (preset === 'all') {
      setSelectedSources(new Set(SOURCES.map((source) => source.id)))
      return
    }
    if (preset === 'media') {
      setSelectedSources(new Set(SOURCES.filter((source) => source.type === 'image' || source.type === 'video').map((source) => source.id)))
      return
    }
    setSelectedSources(new Set(DEFAULT_SOURCES))
  }

  const toggleSaved = (result: ScrapperProResult) => {
    const exists = saved.some((item) => item.id === result.id || item.url === result.url)
    if (exists) {
      persistSaved(saved.filter((item) => item.id !== result.id && item.url !== result.url))
    } else {
      persistSaved([result, ...saved].slice(0, 250))
    }
  }

  const copyUrl = async (result: ScrapperProResult) => {
    try {
      await navigator.clipboard.writeText(result.url)
      setCopiedId(result.id)
      window.setTimeout(() => setCopiedId(null), 1600)
    } catch {
      setError('Clipboard access was blocked by the browser.')
    }
  }

  const exportResults = () => {
    const payload = filter === 'saved' ? saved : results
    if (!payload.length) return
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `scrapper-pro-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const isSaved = (result: ScrapperProResult) => saved.some((item) => item.id === result.id || item.url === result.url)

  const activeResults = filter === 'saved'
    ? saved
    : filter === 'all'
      ? results
      : results.filter((result) => result.type === filter)

  const counts = React.useMemo(() => ({
    image: results.filter((result) => result.type === 'image').length,
    video: results.filter((result) => result.type === 'video').length,
    post: results.filter((result) => result.type === 'post').length,
    article: results.filter((result) => result.type === 'article').length,
  }), [results])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Scrapper Pro</h1>
            <Badge color="green">Server-backed</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Search public web sources for images, videos, posts, and articles. Requests run through SSToken's same-origin Vercel API so browser CORS restrictions do not break the workflow.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            className={`rounded-md p-1.5 ${viewMode === 'grid' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="List view"
            className={`rounded-md p-1.5 ${viewMode === 'list' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Search query</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !running) runSearch()
                }}
                placeholder="Name, handle, topic, product, event…"
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {running ? (
              <Button variant="secondary" onClick={stopSearch}>
                <Square className="h-4 w-4" /> Stop
              </Button>
            ) : (
              <Button onClick={runSearch} disabled={!query.trim() || selectedSources.size === 0}>
                <Play className="h-4 w-4" /> Search {selectedSources.size} sources
              </Button>
            )}
            <Button variant="secondary" onClick={exportResults} disabled={(filter === 'saved' ? saved : results).length === 0}>
              <Download className="h-4 w-4" /> Export JSON
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Presets:</span>
          <button onClick={() => selectPreset('recommended')} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">Recommended</button>
          <button onClick={() => selectPreset('media')} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">Media</button>
          <button onClick={() => selectPreset('all')} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">All sources</button>
          <button onClick={() => setSelectedSources(new Set())} className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">Clear</button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {SOURCES.map((source) => {
            const Icon = typeIcon(source.type)
            const selected = selectedSources.has(source.id)
            return (
              <button
                key={source.id}
                type="button"
                onClick={() => toggleSource(source.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                  selected
                    ? 'border-foreground/30 bg-accent text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {source.name}
              </button>
            )
          })}
        </div>

        {running && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching selected sources in parallel
            <span className="ml-auto inline-flex items-center gap-1 font-mono text-xs"><Clock3 className="h-3.5 w-3.5" /> {elapsed}s</span>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </Card>

      {(results.length > 0 || saved.length > 0) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {([
              ['all', `All ${results.length}`],
              ['image', `Images ${counts.image}`],
              ['video', `Videos ${counts.video}`],
              ['post', `Posts ${counts.post}`],
              ['article', `Articles ${counts.article}`],
              ['saved', `Saved ${saved.length}`],
            ] as [ResultFilter, string][]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  filter === value ? 'border-foreground/30 bg-accent text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            {durationMs !== null && <span>{formatDuration(durationMs)} · </span>}
            {failures.length ? `${failures.length} source${failures.length === 1 ? '' : 's'} unavailable` : results.length ? 'All selected sources responded' : ''}
          </div>
        </div>
      )}

      {failures.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <h2 className="text-sm font-medium text-foreground">Some sources were unavailable</h2>
              <p className="mt-1 text-xs text-muted-foreground">This is normal for public search pages that rate-limit or change markup. Successful sources are still shown.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {failures.map((failure) => (
                  <span key={failure.sourceId} title={failure.error} className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                    {failure.source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeResults.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-2'}>
          {activeResults.map((result) => {
            const Icon = typeIcon(result.type)
            const savedResult = isSaved(result)
            return (
              <Card key={`${filter}-${result.id}`} className={viewMode === 'list' ? 'p-3' : 'overflow-hidden p-0'}>
                {viewMode === 'grid' && result.thumbnail && (
                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="block h-44 overflow-hidden border-b border-border bg-muted">
                    <img
                      src={result.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                      onError={(event) => { (event.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  </a>
                )}

                <div className={viewMode === 'grid' ? 'p-4' : 'flex items-center gap-3'}>
                  {viewMode === 'list' && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge color={typeColor(result.type)}>{result.type}</Badge>
                      <span className="truncate text-xs text-muted-foreground">{result.source}</span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">{result.title}</h3>
                    {result.snippet && <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{result.snippet}</p>}
                    <p className="mt-2 truncate text-[11px] text-muted-foreground">{safeHost(result.url)}</p>
                  </div>

                  <div className={viewMode === 'grid' ? 'mt-3 flex items-center gap-1.5 border-t border-border pt-3' : 'flex shrink-0 items-center gap-1'}>
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className={viewMode === 'grid' ? 'flex-1' : ''}>
                      <Button variant="secondary" size="sm" className={viewMode === 'grid' ? 'w-full' : ''}>
                        <ExternalLink className="h-3.5 w-3.5" /> {viewMode === 'grid' ? 'Open' : ''}
                      </Button>
                    </a>
                    <Button variant="ghost" size="sm" onClick={() => copyUrl(result)} title="Copy URL">
                      {copiedId === result.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleSaved(result)} title={savedResult ? 'Remove from saved' : 'Save result'}>
                      {savedResult ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Save className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : !running ? (
        <Card>
          <div className="py-10 text-center">
            <Search className="mx-auto h-5 w-5 text-muted-foreground" />
            <h2 className="mt-3 text-sm font-medium text-foreground">{filter === 'saved' ? 'No saved results yet' : 'Ready to search'}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {filter === 'saved'
                ? 'Save useful results from a search and they will stay on this device.'
                : 'Enter a query, choose the sources you want, and run a search. Source availability can vary because these are public web endpoints.'}
            </p>
          </div>
        </Card>
      ) : null}

      {saved.length > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => persistSaved([])}>
            <Trash2 className="h-3.5 w-3.5" /> Clear saved results
          </Button>
        </div>
      )}
    </div>
  )
}

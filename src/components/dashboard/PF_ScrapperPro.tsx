import React from 'react'
import { Card, Button, Input, Badge, Modal } from '@/components/ui'
import { Search, ExternalLink, Play, Square, Save, FolderOpen, Image as ImageIcon, FileVideo, X, Trash2, Copy, Check, Globe, Grid3X3, List, Loader2 } from 'lucide-react'

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

interface MediaSource {
  id: string
  name: string
  type: 'image' | 'video' | 'post' | 'article'
  url: string
  icon: React.ComponentType<any>
}

const SEARCH_ENGINES: MediaSource[] = [
  { id: 'duckduckgo-images', name: 'DuckDuckGo Images', type: 'image', url: 'https://duckduckgo.com/?ia=images', icon: Globe },
  { id: 'duckduckgo-videos', name: 'DuckDuckGo Videos', type: 'video', url: 'https://duckduckgo.com/?ia=videos', icon: FileVideo },
  { id: 'google-images', name: 'Google Images', type: 'image', url: 'https://google.com/search', icon: Globe },
  { id: 'google-videos', name: 'Google Videos', type: 'video', url: 'https://google.com/search', icon: FileVideo },
  { id: 'bing-images', name: 'Bing Images', type: 'image', url: 'https://bing.com/images/search', icon: ImageIcon },
  { id: 'bing-videos', name: 'Bing Videos', type: 'video', url: 'https://bing.com/videos/search', icon: FileVideo },
  { id: 'yahoo-images', name: 'Yahoo Images', type: 'image', url: 'https://images.search.yahoo.com/search/images', icon: ImageIcon },
  { id: 'yahoo-videos', name: 'Yahoo Videos', type: 'video', url: 'https://video.search.yahoo.com/search', icon: FileVideo },
  { id: 'yandex-images', name: 'Yandex Images', type: 'image', url: 'https://yandex.com/images/search', icon: ImageIcon },
  { id: 'pinterest', name: 'Pinterest', type: 'image', url: 'https://www.pinterest.com/search/pins', icon: ImageIcon },
  { id: 'flickr', name: 'Flickr', type: 'image', url: 'https://www.flickr.com/search', icon: ImageIcon },
  { id: 'pixabay', name: 'Pixabay', type: 'image', url: 'https://pixabay.com/images/search', icon: ImageIcon },
  { id: 'pexels', name: 'Pexels', type: 'image', url: 'https://www.pexels.com/search', icon: ImageIcon },
  { id: 'deviantart', name: 'DeviantArt', type: 'image', url: 'https://www.deviantart.com/search', icon: ImageIcon },
  { id: 'imgur', name: 'Imgur', type: 'image', url: 'https://imgur.com/search', icon: ImageIcon },
  { id: 'reddit', name: 'Reddit', type: 'post', url: 'https://reddit.com/search', icon: Globe },
  { id: 'youtube', name: 'YouTube', type: 'video', url: 'https://www.youtube.com/results', icon: FileVideo },
  { id: 'medium', name: 'Medium', type: 'article', url: 'https://medium.com/search', icon: Search },
  { id: 'duckduckgo-general', name: 'DuckDuckGo General', type: 'post', url: 'https://duckduckgo.com/', icon: Search },
]

const JINA_PROXY = 'https://r.jina.ai/'

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
]

const getEngineSearchUrlFromEncoded = (engine: MediaSource, encodedQuery: string): string => {
  const q = decodeURIComponent(encodedQuery)
  if (engine.url.includes('?')) {
    let url = engine.url + '&q=' + encodeURIComponent(q)
    if (engine.id === 'google-images') url = url.replace('&q=', '&tbm=isch&q=')
    if (engine.id === 'google-videos') url = url.replace('&q=', '&tbm=vid&q=')
    if (engine.id === 'duckduckgo-images') url = url.replace('&q=', '&ia=images&q=')
    if (engine.id === 'duckduckgo-videos') url = url.replace('&q=', '&ia=videos&q=')
    return url
  }
  if (engine.id === 'google-images') return `${engine.url}?tbm=isch&q=${encodeURIComponent(q)}`
  if (engine.id === 'google-videos') return `${engine.url}?tbm=vid&q=${encodeURIComponent(q)}`
  if (engine.id === 'duckduckgo-images') return `${engine.url}?ia=images&q=${encodeURIComponent(q)}`
  if (engine.id === 'duckduckgo-videos') return `${engine.url}?ia=videos&q=${encodeURIComponent(q)}`
  return `${engine.url}?q=${encodeURIComponent(q)}`
}

const extractYouTubeVideos = (text: string, query: string): { title: string; url: string; thumbnail: string }[] => {
  const videos: { title: string; url: string; thumbnail: string }[] = []
  const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi
  let match
  while ((match = ytRegex.exec(text)) !== null) {
    const videoId = match[1]
    const url = `https://www.youtube.com/watch?v=${videoId}`
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
    if (!videos.find(v => v.url === url)) {
      videos.push({
        title: `${query} - YouTube video ${videoId.slice(0, 6)}`,
        url,
        thumbnail
      })
    }
  }
  const shortsRegex = /https?:\/\/(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/gi
  while ((match = shortsRegex.exec(text)) !== null) {
    const videoId = match[1]
    const url = `https://www.youtube.com/watch?v=${videoId}`
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
    if (!videos.find(v => v.url === url)) {
      videos.push({
        title: `${query} - YouTube Short ${videoId.slice(0, 6)}`,
        url,
        thumbnail
      })
    }
  }
  return videos
}

const extractImagesFromText = (text: string): string[] => {
  const urls: string[] = []
  const seen = new Set<string>()

  const add = (u: string) => {
    if (!u || seen.has(u)) return
    const lower = u.toLowerCase()
    if (!lower.startsWith('http') && !lower.startsWith('data:image')) return
    if (
      lower.includes('google.com/s2/favicons') ||
      lower.includes('favicon') ||
      lower.includes('googleusercontent') && lower.includes('favicon')
    ) return
    if (lower.includes('1x1') || lower.includes('pixel') || lower.includes('tracking')) return
    if (lower.includes('data:image/gif') && lower.includes('base64,')) return
    seen.add(u)
    urls.push(u)
  }

  const patterns = [
    /!\[(?:[^\]]*)\]\(([^)]+)\)/g,
    /<img[^>]+src=["']([^"']+)["']/gi,
    /data:image\/[a-zA-Z]+;base64,[^\s"'>]+/gi,
    /https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|webp|svg)/gi,
    /https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|webp|svg)\?[^\s<>"']*/gi,
    /https?:\/\/[^\s<>"']+\/image\/[^\s<>"']+/gi,
    /https?:\/\/[^\s<>"']+\.(?:ico|bmp|tiff?)/gi,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      add(match[1] || match[0])
    }
  }

  return urls
}

const getSourceColor = (source: string): 'green' | 'blue' | 'yellow' | 'red' | 'slate' | 'pink' => {
  const colors: Record<string, 'green' | 'blue' | 'yellow' | 'red' | 'slate' | 'pink'> = {
    'Google Images': 'blue', 'Google Videos': 'red', 'Bing Images': 'blue', 'Bing Videos': 'blue',
    'Yahoo Images': 'slate', 'Yahoo Videos': 'slate', 'DuckDuckGo Images': 'blue', 'DuckDuckGo Videos': 'blue',
    'Reddit': 'pink', 'YouTube': 'red', 'Medium': 'slate',
  }
  return colors[source] || 'slate'
}

const getTypeColor = (type: ScrapperProResult['type']): 'green' | 'blue' | 'yellow' | 'red' | 'slate' | 'pink' => {
  switch (type) {
    case 'image': return 'blue'
    case 'video': return 'red'
    case 'article': return 'green'
    default: return 'slate'
  }
}

const toYouTubeEmbed = (url: string) => {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const videoId = u.searchParams.get('v')
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`
    }
    if (u.hostname === 'youtu.be') {
      const videoId = u.pathname.slice(1)
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`
    }
  } catch { /* ignore */ }
  return null
}

const IMAGE_FALLBACK = (text: string) =>
  `https://placehold.co/200x200/1e293b/ffffff?text=${encodeURIComponent(text.slice(0, 3).toUpperCase() || '...')}`

const parseJinaResponse = (text: string): string[] => {
  return extractImagesFromText(text)
}

const parseVideoUrls = (text: string): { title: string; url: string; thumbnail: string }[] => {
  return extractYouTubeVideos(text, '')
}

export function PF_ScrapperPro() {
  const [query, setQuery] = React.useState('Neiva Mara')
  const [results, setResults] = React.useState<ScrapperProResult[]>([])
  const [running, setRunning] = React.useState(false)
  const [log, setLog] = React.useState('Ready. Enter a name or keyword and click Run.')
  const [saved, setSaved] = React.useState<ScrapperProResult[]>([])
  const [lightbox, setLightbox] = React.useState<{ type: 'image' | 'video' | 'external'; src: string; title: string } | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [selectedSources, setSelectedSources] = React.useState<Set<string>>(new Set(SEARCH_ENGINES.map(s => s.id)))
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [imageErrorTracker, setImageErrorTracker] = React.useState<Set<string>>(new Set())
  const [progress, setProgress] = React.useState({ current: 0, total: 0, phase: 'idle' })
  const [elapsed, setElapsed] = React.useState(0)
  const [timerInterval, setTimerInterval] = React.useState<ReturnType<typeof setInterval> | null>(null)
  const [failedEngines, setFailedEngines] = React.useState<string[]>([])

  React.useEffect(() => {
    const stored = localStorage.getItem('appforge-scrapper-saved')
    if (!stored) {
      const legacy = localStorage.getItem('projectforge-scrapper-saved')
      if (legacy) {
        localStorage.setItem('appforge-scrapper-saved', legacy)
        return
      }
    }
    if (stored) {
      try { setSaved(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [])

  const clearStorage = () => {
    localStorage.removeItem('appforge-scrapper-saved')
    localStorage.removeItem('projectforge-scrapper-saved')
    setSaved([])
    setResults([])
    setLog('Local storage cleared.')
  }

  const toggleSource = (id: string) => {
    setSelectedSources(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const saveResults = () => {
    const merged = [...results, ...saved.filter(r => !results.find(res => res.id === r.id))]
    const unique = Array.from(new Map(merged.map(r => [r.id, r])).values())
    localStorage.setItem('appforge-scrapper-saved', JSON.stringify(unique))
    localStorage.setItem('projectforge-scrapper-saved', JSON.stringify(unique))
    setSaved(unique)
    setLog(`Saved ${results.length} results to local storage.`)
  }

  const toggleSaveItem = (item: ScrapperProResult) => {
    const exists = saved.find(r => r.id === item.id)
    if (exists) {
      const next = saved.filter(r => r.id !== item.id)
      setSaved(next)
      localStorage.setItem('appforge-scrapper-saved', JSON.stringify(next))
      localStorage.setItem('projectforge-scrapper-saved', JSON.stringify(next))
      setLog(`Removed "${item.title}" from saved.`)
    } else {
      const next = [...saved, item]
      setSaved(next)
      localStorage.setItem('appforge-scrapper-saved', JSON.stringify(next))
      localStorage.setItem('projectforge-scrapper-saved', JSON.stringify(next))
      setLog(`Saved "${item.title}" to local storage.`)
    }
  }

  const isSaved = (id: string) => saved.some(r => r.id === id)

  const loadSaved = () => {
    setResults(saved)
    setLog(`Loaded ${saved.length} saved results.`)
  }

  const clearResults = () => {
    setResults([])
    setLog('Results cleared.')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  const openMedia = (result: ScrapperProResult) => {
    const yt = toYouTubeEmbed(result.url)
    if (result.type === 'video') {
      if (yt) setLightbox({ type: 'video', src: yt, title: result.title })
      else setLightbox({ type: 'external', src: result.url, title: result.title })
    } else if (result.type === 'image') {
      setLightbox({ type: 'image', src: result.mediaUrl || result.url, title: result.title })
    } else {
      setLightbox({ type: 'external', src: result.url, title: result.title })
    }
  }

  const runScrape = async () => {
    if (!query.trim() || selectedSources.size === 0) return
    setRunning(true)
    setResults([])
    setImageErrorTracker(new Set())
    setProgress({ current: 0, total: 0, phase: 'preparing' })
    setElapsed(0)
    setFailedEngines([])
    setLog(`Starting scrape for: "${query}"...`)

    if (timerInterval) clearInterval(timerInterval)
    const interval = setInterval(() => setElapsed(e => e + 1), 1000)
    setTimerInterval(interval)

    const activeEngines = SEARCH_ENGINES.filter(s => selectedSources.has(s.id))
    const encoded = encodeURIComponent(query.trim())
    const now = new Date().toISOString().split('T')[0]
    const newResults: ScrapperProResult[] = []

    setProgress({ current: 0, total: activeEngines.length, phase: 'running' })

    const steps = [
      { delay: 200, msg: `Preparing ${activeEngines.length} engines...` },
      { delay: 600, msg: `Fetching live results via Jina reader proxy...` },
    ]

    steps.forEach(step => setTimeout(() => setLog(step.msg), step.delay))

    for (let i = 0; i < activeEngines.length; i++) {
      const engine = activeEngines[i]
      const searchUrl = getEngineSearchUrlFromEncoded(engine, encoded)
      const proxyUrl = `${JINA_PROXY}${searchUrl}`

      setLog(`[${i + 1}/${activeEngines.length}] Fetching ${engine.name}... (${elapsed}s elapsed)`)

      try {
        const res = await fetch(proxyUrl, {
          headers: { 'Accept': 'application/json' },
        })

        if (!res.ok) {
          setLog(`Failed fetching ${engine.name}: HTTP ${res.status}`)
          setFailedEngines(prev => [...prev, engine.name])
          newResults.push({
            id: `sr-${engine.id}-${Date.now()}`,
            source: engine.name,
            type: engine.type,
            title: `${query} — ${engine.name} (fetch failed)`,
            url: searchUrl,
            snippet: `${engine.type} search for "${query}" on ${engine.name}. Fetch via proxy failed.`,
            date: now,
            thumbnail: `https://www.google.com/s2/favicons?domain=${new URL(searchUrl).hostname}&sz=128`,
            mediaUrl: searchUrl,
          })
          setProgress({ current: i + 1, total: activeEngines.length, phase: 'running' })
          continue
        }

        let content = ''
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          try {
            const data = await res.json()
            content = typeof data === 'string' ? data : (data.content || '')
          } catch {
            content = await res.text()
          }
        } else {
          content = await res.text()
        }

        let imgUrls: string[] = []
        let videoData: { title: string; url: string; thumbnail: string }[] = []

        if (engine.type === 'image') {
          imgUrls = extractImagesFromText(content)
          if (imgUrls.length === 0 && engine.id !== 'duckduckgo-images') {
            try {
              const htmlRes = await fetch(CORS_PROXIES[0] + encodeURIComponent(searchUrl))
              if (htmlRes.ok) {
                const html = await htmlRes.text()
                imgUrls = extractImagesFromText(html)
              }
            } catch { /* ignore */ }
          }
        } else if (engine.type === 'video') {
          videoData = extractYouTubeVideos(content, query)
          if (videoData.length === 0) {
            try {
              const htmlRes = await fetch(CORS_PROXIES[0] + encodeURIComponent(searchUrl))
              if (htmlRes.ok) {
                const html = await htmlRes.text()
                videoData = extractYouTubeVideos(html, query)
              }
            } catch { /* ignore */ }
          }
        }

        if (engine.type === 'image') {
          if (imgUrls.length > 0) {
            imgUrls.forEach((url, idx) => {
              newResults.push({
                id: `sr-${engine.id}-${idx}-${Date.now()}`,
                source: engine.name,
                type: 'image',
                title: `${query} image from ${engine.name} #${idx + 1}`,
                url: url,
                snippet: `Image for "${query}" from ${engine.name}.`,
                date: now,
                thumbnail: url,
                mediaUrl: url,
              })
            })
          } else {
            newResults.push({
              id: `sr-${engine.id}-${Date.now()}`,
              source: engine.name,
              type: 'image',
              title: `${query} — ${engine.name}`,
              url: searchUrl,
              snippet: `No images parsed from ${engine.name}. Visit source directly.`,
              date: now,
              thumbnail: `https://www.google.com/s2/favicons?domain=${new URL(searchUrl).hostname}&sz=128`,
              mediaUrl: searchUrl,
            })
          }
        } else if (engine.type === 'video') {
          if (videoData.length > 0) {
            videoData.forEach((v, idx) => {
              newResults.push({
                id: `sr-${engine.id}-${idx}-${Date.now()}`,
                source: engine.name,
                type: 'video',
                title: v.title,
                url: v.url,
                snippet: `Video for "${query}" from ${engine.name}.`,
                date: now,
                thumbnail: v.thumbnail,
                mediaUrl: v.thumbnail,
              })
            })
          } else {
            newResults.push({
              id: `sr-${engine.id}-${Date.now()}`,
              source: engine.name,
              type: 'video',
              title: `${query} — ${engine.name}`,
              url: searchUrl,
              snippet: `No videos parsed from ${engine.name}. Visit source directly.`,
              date: now,
              thumbnail: `https://www.google.com/s2/favicons?domain=${new URL(searchUrl).hostname}&sz=128`,
              mediaUrl: searchUrl,
            })
          }
        } else {
          const extractedLinks = content.match(/https?:\/\/[^\s<>"']+/g)?.slice(0, 10) || []
          newResults.push({
            id: `sr-${engine.id}-${Date.now()}`,
            source: engine.name,
            type: engine.type,
            title: `${query} — ${engine.name}`,
            url: searchUrl,
            snippet: `${engine.type.charAt(0).toUpperCase() + engine.type.slice(1)} results from ${engine.name} for "${query}". ${extractedLinks.length} links found. Click to view.`,
            date: now,
            thumbnail: `https://www.google.com/s2/favicons?domain=${new URL(searchUrl).hostname}&sz=128`,
            mediaUrl: searchUrl,
          })
        }
      } catch (e) {
        setLog(`${engine.name}: ${e instanceof Error ? e.message : 'Error fetching results'}`)
        setFailedEngines(prev => [...prev, engine.name])
        newResults.push({
          id: `sr-${engine.id}-${Date.now()}`,
          source: engine.name,
          type: engine.type,
          title: `${query} — ${engine.name} (error)`,
          url: searchUrl,
          snippet: `Error fetching results from ${engine.name}.`,
          date: now,
          thumbnail: `https://www.google.com/s2/favicons?domain=${new URL(searchUrl).hostname}&sz=128`,
          mediaUrl: searchUrl,
        })
      }

      setProgress({ current: i + 1, total: activeEngines.length, phase: 'running' })
    }

    setResults(newResults)
    setProgress({ current: activeEngines.length, total: activeEngines.length, phase: 'done' })
    const mediaCount = newResults.filter(r => r.type === 'image' || r.type === 'video').length
    const failCount = failedEngines.length
    setLog(`Done in ${elapsed}s. ${newResults.length} results (${mediaCount} media, ${newResults.length - mediaCount} links). ${failCount > 0 ? `Failed: ${failedEngines.join(', ')}.` : 'All engines succeeded.'}`)
    setRunning(false)
    if (interval) clearInterval(interval)
    setTimerInterval(null)
  }

  const mediaResults = results.filter(r => r.type === 'image' || r.type === 'video')
  const postResults = results.filter(r => r.type === 'post' || r.type === 'article')
  const imageResults = results.filter(r => r.type === 'image')
  const videoResults = results.filter(r => r.type === 'video')

  const handleImgError = (imgId: string) => {
    if (!imageErrorTracker.has(imgId)) {
      setImageErrorTracker(prev => new Set([...prev, imgId]))
    }
  }

  const renderThumbnail = (result: ScrapperProResult, size: 'sm' | 'lg' = 'lg') => {
    if (imageErrorTracker.has(result.id) || !result.thumbnail) {
      const text = result.source.split(' ')[0].slice(0, 3).toUpperCase()
      const sz = size === 'sm' ? '48x48' : '200x200'
      return (
        <div className={`flex ${size === 'sm' ? 'h-12 w-12' : 'h-40 w-full'} items-center justify-center rounded bg-muted`}>
          <span className="text-xs font-bold text-foreground">{text}</span>
        </div>
      )
    }
    return (
      <img
        src={result.thumbnail}
        alt={result.title}
        className={size === 'sm' ? 'h-12 w-12 object-cover' : 'h-40 w-full object-cover'}
        onError={() => handleImgError(result.id)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Scrapper Pro</h1>
        <p className="mt-1 text-sm text-muted-foreground">Search 11+ engines for images, videos, posts, and articles. Fetches real results via Jina reader proxy — no API key required.</p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-foreground">Search query</label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "Neiva Mara"'
              onKeyDown={(e) => e.key === 'Enter' && runScrape()}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {!running ? (
              <Button onClick={runScrape} disabled={!query.trim() || selectedSources.size === 0}><Play className="h-4 w-4" /> Run scrape</Button>
            ) : (
              <Button variant="secondary" onClick={() => { setRunning(false); setLog('Scrape stopped by user.') }}><Square className="h-4 w-4" /> Stop</Button>
            )}
            <Button variant="secondary" onClick={saveResults} disabled={results.length === 0}><Save className="h-4 w-4" /> Save</Button>
            <Button variant="secondary" onClick={loadSaved} disabled={saved.length === 0}><FolderOpen className="h-4 w-4" /> Load</Button>
            <Button variant="secondary" onClick={clearResults} disabled={results.length === 0}><Trash2 className="h-4 w-4" /> Clear</Button>
            <Button variant="secondary" onClick={clearStorage}><Trash2 className="h-4 w-4" /> Clear all saved</Button>
            <div className="flex gap-1 border-l border-border pl-2">
              <button onClick={() => setViewMode('grid')} className={`rounded p-1 ${viewMode === 'grid' ? 'bg-accent' : 'hover:bg-accent'}`}><Grid3X3 className="h-4 w-4" /></button>
              <button onClick={() => setViewMode('list')} className={`rounded p-1 ${viewMode === 'list' ? 'bg-accent' : 'hover:bg-accent'}`}><List className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-primary p-3 font-mono text-xs text-green-400 dark:bg-background">
          {log}
          {running && (
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>{progress.phase === 'preparing' ? 'Preparing...' : `Fetching ${progress.current}/${progress.total} engines`}</span>
                <span>{elapsed}s elapsed</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-3">
          <p className="mb-2 text-xs font-medium text-foreground">Selected engines ({selectedSources.size}/{SEARCH_ENGINES.length}) — media engines use Jina proxy for live results:</p>
          <div className="flex flex-wrap gap-1.5">
            {SEARCH_ENGINES.map(source => {
              const Icon = source.icon
              const selected = selectedSources.has(source.id)
              return (
                <button
                  key={source.id}
                  onClick={() => toggleSource(source.id)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                    selected
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{source.name}</span>
                  <Badge color={getTypeColor(source.type)} className="text-xs">{source.type}</Badge>
                </button>
              )
            })}
          </div>
          <div className="mt-2 flex gap-4">
            <button
              onClick={() => setSelectedSources(new Set(SEARCH_ENGINES.map(s => s.id)))}
              className="text-xs text-foreground underline"
            >Select all</button>
            <button
              onClick={() => setSelectedSources(new Set(SEARCH_ENGINES.filter(s => s.type === 'image' || s.type === 'video').map(s => s.id)))}
              className="text-xs text-foreground underline"
            >Images + Videos only</button>
          </div>
        </div>
      </Card>

      {imageResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Image Results ({imageResults.length})</h2>
          {viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {imageResults.map(result => (
                <Card key={result.id} className="transition-all hover:shadow-md">
                  <div className="overflow-hidden rounded-lg border border-border" onClick={() => openMedia(result)}>
                    {renderThumbnail(result, 'lg')}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge color={getSourceColor(result.source)}>{result.source.split(' ')[0]}</Badge>
                    <Badge color="blue" className="text-xs">image</Badge>
                  </div>
                  <h3 className="mt-1 text-sm font-medium text-foreground truncate">{result.title}</h3>
                  <div className="mt-2 flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => openMedia(result)}><ExternalLink className="h-3 w-3" /> Open</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(result.mediaUrl || result.url, `${result.source}-${result.id}.jpg`)}><Save className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleSaveItem(result)}>
                      {isSaved(result.id) ? <Check className="h-3 w-3 text-green-500" /> : <Save className="h-3 w-3" />}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {imageResults.map(result => (
                <Card key={result.id} className="flex items-center gap-3 p-3 transition-colors hover:bg-accent/50">
                  {renderThumbnail(result, 'sm')}
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-foreground">{result.title}</h3>
                    <p className="text-xs text-muted-foreground">{result.source}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openMedia(result)}><ExternalLink className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(result.mediaUrl || result.url, `${result.source}-${result.id}.jpg`)}><Save className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleSaveItem(result)}>
                    {isSaved(result.id) ? <Check className="h-3 w-3 text-green-500" /> : <Save className="h-3 w-3" />}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {videoResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Video Results ({videoResults.length})</h2>
          {viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {videoResults.map(result => (
                <Card key={result.id} className="transition-all hover:shadow-md">
                  <div
                    className="relative flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border bg-muted"
                    onClick={() => openMedia(result)}
                  >
                    {result.thumbnail && !result.thumbnail.includes('google.com/s2/favicons') ? (
                      <img src={result.thumbnail} alt={result.title} className="h-full w-full object-cover" onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = 'none' }} />
                    ) : (
                      <FileVideo className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge color={getSourceColor(result.source)}>{result.source.split(' ')[0]}</Badge>
                    <Badge color="red" className="text-xs">video</Badge>
                  </div>
                  <h3 className="mt-1 text-sm font-medium text-foreground truncate">{result.title}</h3>
                  <div className="mt-2 flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => openMedia(result)}><ExternalLink className="h-3 w-3" /> Open</Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleSaveItem(result)}>
                      {isSaved(result.id) ? <Check className="h-3 w-3 text-green-500" /> : <Save className="h-3 w-3" />}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {videoResults.map(result => (
                <Card key={result.id} className="p-3 transition-colors hover:bg-accent/50">
                  <div className="flex items-center gap-2">
                    {result.thumbnail && !result.thumbnail.includes('google.com/s2/favicons') && (
                      <img src={result.thumbnail} alt={result.title} className="h-16 w-24 rounded object-cover" onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = 'none' }} />
                    )}
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge color={getSourceColor(result.source)}>{result.source}</Badge>
                        <Badge color="red" className="text-xs">video</Badge>
                      </div>
                      <h3 className="text-sm font-medium text-foreground">{result.title}</h3>
                    </div>
                  </div>
                  <div className="mt-2">
                    <a href={result.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm"><ExternalLink className="h-3 w-3" /> Open video</Button>
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {postResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Posts & Articles ({postResults.length})</h2>
          {viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {postResults.map(result => (
                <Card key={result.id} className="transition-all hover:shadow-md">
                  {result.thumbnail && (
                    <div className="mb-3 overflow-hidden rounded-lg border border-border">
                      {renderThumbnail(result, 'lg')}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge color={getSourceColor(result.source)}>{result.source}</Badge>
                    <Badge color={getTypeColor(result.type)}>{result.type}</Badge>
                  </div>
                  <h3 className="mt-2 font-semibold text-foreground">{result.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{result.snippet}</p>
                  <div className="mt-3 flex gap-2">
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="secondary" className="w-full"><ExternalLink className="h-4 w-4" /> Open</Button>
                    </a>
                    <Button variant="ghost" onClick={() => copyToClipboard(result.url)}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleSaveItem(result)}>
                      {isSaved(result.id) ? <Check className="h-4 w-4 text-green-500" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {postResults.map(result => (
                <Card key={result.id} className="flex items-center gap-3 p-3 transition-colors hover:bg-accent/50">
                  <Badge color={getSourceColor(result.source)}>{result.source}</Badge>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-foreground">{result.title}</h3>
                    <p className="text-xs text-muted-foreground">{result.snippet}</p>
                  </div>
                  <a href={result.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm"><ExternalLink className="h-3 w-3" /></Button>
                  </a>
                  <Button variant="ghost" size="sm" onClick={() => toggleSaveItem(result)}>
                    {isSaved(result.id) ? <Check className="h-3 w-3 text-green-500" /> : <Save className="h-3 w-3" />}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {results.length === 0 && !running && (
        <Card>
          <p className="text-sm text-muted-foreground">No results yet. Select engines, enter a query, and click Run scrape.</p>
        </Card>
      )}

      {running && (
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Fetching results...</span>
        </div>
      )}

      {saved.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Saved Results ({saved.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {saved.map(result => (
              <Card key={result.id} className="transition-all hover:shadow-md opacity-75">
                {result.thumbnail && renderThumbnail(result, 'lg')}
                <div className="flex items-center gap-2 mt-2">
                  <Badge color={getSourceColor(result.source)}>{result.source}</Badge>
                  <Badge color={getTypeColor(result.type)}>{result.type}</Badge>
                </div>
                <h3 className="mt-2 font-semibold text-foreground">{result.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{result.snippet}</p>
                <div className="mt-3 flex gap-2">
                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="secondary" className="w-full"><ExternalLink className="h-4 w-4" /> Open</Button>
                  </a>
                  <Button variant="ghost" onClick={() => copyToClipboard(result.url)}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleSaveItem(result)}>
                    {isSaved(result.id) ? <Check className="h-4 w-4 text-green-500" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {lightbox && (
        <Modal open={!!lightbox} title={lightbox.title} onClose={() => setLightbox(null)}>
          {lightbox.type === 'image' && (
            <img src={lightbox.src} alt={lightbox.title} className="max-h-[70vh] w-full rounded-lg object-contain" onError={(e) => { const img = e.target as HTMLImageElement; img.src = IMAGE_FALLBACK(lightbox.title) }} />
          )}
          {lightbox.type === 'video' && (
            <iframe
              src={lightbox.src}
              className="aspect-video w-full rounded-lg"
              allowFullScreen
              title={lightbox.title}
            />
          )}
          {lightbox.type === 'external' && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <p className="text-sm text-muted-foreground">This content cannot be embedded due to X-Frame-Options restrictions.</p>
              <a href={lightbox.src} target="_blank" rel="noopener noreferrer">
                <Button><ExternalLink className="h-4 w-4" /> Open in new tab</Button>
              </a>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

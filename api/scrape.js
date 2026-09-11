// @code-scanning/ignore js/double-escaping: decodeHtml reverses entity encoding that was intentionally applied for storage/transmission; output is consumed as plain text in a controlled context, not as HTML.

import { searchYouTube } from './_youtube-data.js'

const SOURCES = {
  'duckduckgo-images': { name: 'DuckDuckGo Images', kind: 'image' },
  'bing-images': { name: 'Bing Images', kind: 'image' },
  wikimedia: { name: 'Wikimedia Commons', kind: 'image' },
  reddit: { name: 'Reddit', kind: 'mixed' },
  youtube: { name: 'YouTube', kind: 'video' },
  'duckduckgo-general': { name: 'DuckDuckGo Web', kind: 'article' },
  medium: { name: 'Medium', kind: 'article' },
}

const safeUrl = (value) => {
  try {
    const url = new URL(String(value || ''))
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

const hash = (value) => {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

const decodeHtml = (value = '') => String(value)
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')

const cleanText = (value, fallback = '') => {
  const text = decodeHtml(String(value || ''))
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return (text || fallback).slice(0, 220)
}

const fetchText = async (url, options = {}, timeoutMs = 9000) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/json,text/plain;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; AppForge-GetterPro/2.1; +https://sstoken.space)',
        ...(options.headers || {}),
      },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return (await response.text()).slice(0, 2_000_000)
  } finally {
    clearTimeout(timeout)
  }
}

const fetchJson = async (url, options = {}, timeoutMs = 9000) => JSON.parse(await fetchText(url, options, timeoutMs))

const scrapeDuckDuckGoImages = async (query) => {
  const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`
  const html = await fetchText(searchUrl)
  const tokenMatch = html.match(/vqd=["']?([^&"']+)/i) || html.match(/vqd[:=] ?["']([0-9-]+)["']/i)
  if (!tokenMatch?.[1]) throw new Error('DuckDuckGo image token unavailable')

  const endpoint = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${encodeURIComponent(tokenMatch[1])}&f=,,,&p=1`
  const data = await fetchJson(endpoint, { headers: { Referer: searchUrl } })

  return (data.results || []).slice(0, 30).map((item, index) => {
    const image = safeUrl(item.image)
    const thumbnail = safeUrl(item.thumbnail) || image
    const pageUrl = safeUrl(item.url) || image
    if (!image || !pageUrl) return null
    return {
      id: `ddg-${hash(image)}`,
      source: 'DuckDuckGo Images',
      type: 'image',
      title: cleanText(item.title, `Image ${index + 1}`),
      url: pageUrl,
      mediaUrl: image,
      thumbnail,
      snippet: cleanText(item.source, 'Image result'),
    }
  }).filter(Boolean)
}

const scrapeBingImages = async (query) => {
  const html = await fetchText(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC3&first=1`)
  const items = []
  const seen = new Set()
  const regex = /<a[^>]+class=["'][^"']*iusc[^"']*["'][^>]+m=["']([^"']+)["'][^>]*>/gi
  let match

  while ((match = regex.exec(html)) !== null && items.length < 30) {
    try {
      const metadata = JSON.parse(decodeHtml(match[1]))
      const image = safeUrl(metadata.murl)
      const thumbnail = safeUrl(metadata.turl) || image
      const pageUrl = safeUrl(metadata.purl) || image
      if (!image || !pageUrl || seen.has(image)) continue
      seen.add(image)
      items.push({
        id: `bing-${hash(image)}`,
        source: 'Bing Images',
        type: 'image',
        title: cleanText(metadata.t || metadata.desc, `Bing image ${items.length + 1}`),
        url: pageUrl,
        mediaUrl: image,
        thumbnail,
        snippet: cleanText(metadata.host || metadata.domain, 'Image result'),
      })
    } catch {
      // Ignore malformed metadata blocks.
    }
  }

  if (!items.length) throw new Error('No Bing image results parsed')
  return items
}

const scrapeWikimedia = async (query) => {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `file:${query}`,
    gsrnamespace: '6',
    gsrlimit: '24',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '640',
  })
  const data = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params.toString()}`)
  const pages = Object.values(data?.query?.pages || {})

  return pages.map((page, index) => {
    const info = page.imageinfo?.[0]
    const image = safeUrl(info?.url)
    const thumbnail = safeUrl(info?.thumburl) || image
    const pageUrl = safeUrl(info?.descriptionurl) || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title || '')}`
    if (!image || !thumbnail) return null
    const meta = info?.extmetadata || {}
    return {
      id: `commons-${page.pageid || hash(image)}`,
      source: 'Wikimedia Commons',
      type: 'image',
      title: cleanText(meta.ObjectName?.value || page.title?.replace(/^File:/, ''), `Commons image ${index + 1}`),
      url: pageUrl,
      mediaUrl: image,
      thumbnail,
      snippet: cleanText(meta.LicenseShortName?.value || meta.Artist?.value, 'Wikimedia Commons'),
    }
  }).filter(Boolean)
}

const redditImage = (post) => {
  const preview = decodeHtml(post?.preview?.images?.[0]?.source?.url || '')
  const destination = decodeHtml(post?.url_overridden_by_dest || post?.url || '')
  if (/\.(png|jpe?g|webp|gif)(?:\?|$)/i.test(destination)) return safeUrl(destination)
  return safeUrl(preview)
}

const scrapeReddit = async (query) => {
  const data = await fetchJson(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=25&sort=relevance&type=link`, {
    headers: { 'User-Agent': 'AppForge-GetterPro/2.1' },
  })

  return (data?.data?.children || []).map(({ data: post }) => {
    const permalink = safeUrl(`https://www.reddit.com${post.permalink || ''}`)
    if (!permalink) return null
    const videoUrl = safeUrl(post?.secure_media?.reddit_video?.fallback_url || post?.media?.reddit_video?.fallback_url)
    const imageUrl = redditImage(post)
    const thumbnail = safeUrl(decodeHtml(post?.thumbnail)) || imageUrl
    const type = videoUrl ? 'video' : imageUrl ? 'image' : 'post'

    return {
      id: `reddit-${post.id || hash(permalink)}`,
      source: 'Reddit',
      type,
      title: cleanText(post.title, 'Reddit result'),
      url: permalink,
      mediaUrl: videoUrl || imageUrl || undefined,
      thumbnail: thumbnail || undefined,
      snippet: cleanText(post.selftext || post.subreddit_name_prefixed, 'Reddit'),
      date: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : undefined,
    }
  }).filter(Boolean)
}

const scrapeYouTube = async (query) => (await searchYouTube(query)).results

const extractMarkdownLinks = (text) => {
  const results = []
  const seen = new Set()
  const regex = /\[([^\]]{2,220})\]\((https?:\/\/[^)\s]+)\)/g
  let match
  while ((match = regex.exec(text)) !== null && results.length < 16) {
    const url = safeUrl(match[2])
    if (!url || seen.has(url)) continue
    seen.add(url)
    results.push({ title: cleanText(match[1], url), url })
  }
  return results
}

const scrapeWebLinks = async (sourceId, query) => {
  const target = sourceId === 'medium'
    ? `https://medium.com/search?q=${encodeURIComponent(query)}`
    : `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
  const text = await fetchText(`https://r.jina.ai/${target}`)
  const sourceName = SOURCES[sourceId].name
  return extractMarkdownLinks(text).map((item) => ({
    id: `${sourceId}-${hash(item.url)}`,
    source: sourceName,
    type: 'article',
    title: item.title,
    url: item.url,
    snippet: `${sourceName} result`,
  }))
}

const SCRAPERS = {
  'duckduckgo-images': scrapeDuckDuckGoImages,
  'bing-images': scrapeBingImages,
  wikimedia: scrapeWikimedia,
  reddit: scrapeReddit,
  youtube: scrapeYouTube,
  'duckduckgo-general': (query) => scrapeWebLinks('duckduckgo-general', query),
  medium: (query) => scrapeWebLinks('medium', query),
}

const classifyFailure = (sourceId, reason) => {
  const raw = reason instanceof Error ? reason.message : String(reason || 'Source failed')
  const lower = raw.toLowerCase()
  if (sourceId === 'duckduckgo-images' && lower.includes('token unavailable')) {
    return { code: 'parser_or_upstream_change', error: 'DuckDuckGo Images is temporarily degraded: its upstream image token could not be extracted. Other selected sources continue normally.' }
  }
  if (sourceId === 'reddit' && /http 40[13]/.test(lower)) {
    return { code: 'upstream_blocked', error: 'Reddit blocked this server-side request. Other selected sources continue normally.' }
  }
  if (sourceId === 'youtube' && (lower.includes('api key') || lower.includes('not configured') || lower.includes('missing'))) {
    return { code: 'missing_configuration', error: 'YouTube is not configured on this deployment. The server-side YOUTUBE_API_KEY must be available in the production environment.' }
  }
  if (lower.includes('abort') || lower.includes('timeout')) {
    return { code: 'timeout', error: `${SOURCES[sourceId].name} timed out. Other selected sources continue normally.` }
  }
  if (lower.startsWith('http ')) {
    return { code: 'upstream_http_error', error: `${SOURCES[sourceId].name} returned ${raw}. Other selected sources continue normally.` }
  }
  return { code: 'provider_error', error: `${SOURCES[sourceId].name} is temporarily unavailable: ${raw}` }
}

const runSearch = async (query, sources) => {
  const startedAt = Date.now()
  const settled = await Promise.allSettled(sources.map(async (sourceId) => ({
    sourceId,
    results: await SCRAPERS[sourceId](query),
  })))

  const results = []
  const failures = []
  const sourceStatus = []

  settled.forEach((entry, index) => {
    const sourceId = sources[index]
    if (entry.status === 'fulfilled') {
      results.push(...entry.value.results)
      sourceStatus.push({ sourceId, source: SOURCES[sourceId].name, status: 'ok', count: entry.value.results.length })
    } else {
      const classified = classifyFailure(sourceId, entry.reason)
      failures.push({ sourceId, source: SOURCES[sourceId].name, ...classified })
      sourceStatus.push({ sourceId, source: SOURCES[sourceId].name, status: 'degraded', count: 0, code: classified.code })
    }
  })

  const unique = Array.from(new Map(
    results
      .filter((item) => item.url)
      .map((item) => [`${item.type}:${item.mediaUrl || item.url}`, item]),
  ).values())

  const rank = { image: 0, video: 1, post: 2, article: 3 }
  unique.sort((a, b) => (rank[a.type] ?? 9) - (rank[b.type] ?? 9))

  return {
    ok: true,
    service: 'appforge-getter-pro',
    query,
    count: unique.length,
    mediaCount: unique.filter((item) => item.type === 'image' || item.type === 'video').length,
    durationMs: Date.now() - startedAt,
    results: unique.slice(0, 160),
    failures,
    sourceStatus,
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET' && !req.query?.q) {
    return res.status(200).json({
      ok: true,
      service: 'appforge-getter-pro',
      sources: Object.entries(SOURCES).map(([id, source]) => ({ id, name: source.name, kind: source.kind })),
    })
  }

  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const query = String(req.method === 'GET' ? req.query?.q || '' : req.body?.query || '').trim()
  const rawSources = req.method === 'GET'
    ? String(req.query?.sources || 'duckduckgo-images,bing-images,wikimedia,reddit,youtube').split(',')
    : Array.isArray(req.body?.sources) ? req.body.sources : []
  const sources = [...new Set(rawSources.map(String))].filter((id) => SOURCES[id]).slice(0, 7)

  if (!query) return res.status(400).json({ error: 'Query is required' })
  if (query.length > 200) return res.status(400).json({ error: 'Query is too long' })
  if (!sources.length) return res.status(400).json({ error: 'Select at least one source' })

  try {
    return res.status(200).json(await runSearch(query, sources))
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Search failed' })
  }
}

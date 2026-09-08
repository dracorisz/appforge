const SOURCES = {
  'duckduckgo-images': {
    name: 'DuckDuckGo Images',
    type: 'image',
    search: (q) => `https://duckduckgo.com/?ia=images&q=${encodeURIComponent(q)}`,
  },
  'duckduckgo-general': {
    name: 'DuckDuckGo',
    type: 'article',
    search: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  },
  'google-images': {
    name: 'Google Images',
    type: 'image',
    search: (q) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`,
  },
  'bing-images': {
    name: 'Bing Images',
    type: 'image',
    search: (q) => `https://www.bing.com/images/search?q=${encodeURIComponent(q)}`,
  },
  reddit: {
    name: 'Reddit',
    type: 'post',
    search: (q) => `https://www.reddit.com/search/?q=${encodeURIComponent(q)}`,
  },
  youtube: {
    name: 'YouTube',
    type: 'video',
    search: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
  },
  medium: {
    name: 'Medium',
    type: 'article',
    search: (q) => `https://medium.com/search?q=${encodeURIComponent(q)}`,
  },
  flickr: {
    name: 'Flickr',
    type: 'image',
    search: (q) => `https://www.flickr.com/search/?text=${encodeURIComponent(q)}`,
  },
  pixabay: {
    name: 'Pixabay',
    type: 'image',
    search: (q) => `https://pixabay.com/images/search/${encodeURIComponent(q)}/`,
  },
  pexels: {
    name: 'Pexels',
    type: 'image',
    search: (q) => `https://www.pexels.com/search/${encodeURIComponent(q)}/`,
  },
  pinterest: {
    name: 'Pinterest',
    type: 'image',
    search: (q) => `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}`,
  },
  deviantart: {
    name: 'DeviantArt',
    type: 'image',
    search: (q) => `https://www.deviantart.com/search?q=${encodeURIComponent(q)}`,
  },
}

const SEARCH_HOSTS = new Set([
  'duckduckgo.com', 'www.google.com', 'google.com', 'www.bing.com', 'bing.com',
  'www.reddit.com', 'reddit.com', 'www.youtube.com', 'youtube.com', 'youtu.be',
  'medium.com', 'www.flickr.com', 'flickr.com', 'pixabay.com', 'www.pexels.com',
  'pexels.com', 'www.pinterest.com', 'pinterest.com', 'www.deviantart.com', 'deviantart.com',
])

const safeUrl = (value) => {
  try {
    const url = new URL(value)
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

const cleanLabel = (value, fallback) => {
  const text = String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, 180) || fallback
}

const extractMarkdownLinks = (text) => {
  const links = []
  const seen = new Set()
  const regex = /\[([^\]]{1,220})\]\((https?:\/\/[^)\s]+)\)/g
  let match
  while ((match = regex.exec(text)) !== null) {
    const url = safeUrl(match[2])
    if (!url || seen.has(url)) continue
    seen.add(url)
    links.push({ title: cleanLabel(match[1], url), url })
  }
  return links
}

const extractImages = (text) => {
  const images = []
  const seen = new Set()
  const patterns = [
    /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,
    /<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi,
    /https?:\/\/[^\s<>"')]+\.(?:png|jpe?g|webp|gif)(?:\?[^\s<>"')]+)?/gi,
  ]

  for (const regex of patterns) {
    let match
    while ((match = regex.exec(text)) !== null) {
      const raw = match[2] || match[1] || match[0]
      const url = safeUrl(raw)
      if (!url || seen.has(url)) continue
      const lower = url.toLowerCase()
      if (lower.includes('favicon') || lower.includes('1x1') || lower.includes('pixel') || lower.includes('tracking')) continue
      seen.add(url)
      images.push({ title: cleanLabel(match[1], 'Image result'), url })
      if (images.length >= 24) return images
    }
  }
  return images
}

const extractYouTube = (text) => {
  const items = []
  const seen = new Set()
  const regex = /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/g
  let match
  while ((match = regex.exec(text)) !== null) {
    const id = match[1]
    if (seen.has(id)) continue
    seen.add(id)
    items.push({
      title: `YouTube video ${id.slice(0, 6)}`,
      url: `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    })
    if (items.length >= 12) break
  }
  return items
}

const fetchText = async (url, timeoutMs = 8000) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/plain, text/markdown, application/json;q=0.9, */*;q=0.8',
        'User-Agent': 'SSToken-ScrapperPro/1.0',
      },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return (await response.text()).slice(0, 500000)
  } finally {
    clearTimeout(timeout)
  }
}

const scrapeReddit = async (query) => {
  const response = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=10&sort=relevance`, {
    headers: { 'User-Agent': 'SSToken-ScrapperPro/1.0' },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = await response.json()
  return (data?.data?.children || []).map(({ data: post }) => ({
    id: `reddit-${post.id || hash(post.permalink || post.title || '')}`,
    source: 'Reddit',
    type: 'post',
    title: cleanLabel(post.title, 'Reddit result'),
    url: `https://www.reddit.com${post.permalink || ''}`,
    snippet: cleanLabel(post.selftext, post.subreddit_name_prefixed || 'Reddit post').slice(0, 260),
    date: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : undefined,
    thumbnail: typeof post.thumbnail === 'string' && post.thumbnail.startsWith('http') ? post.thumbnail : undefined,
  }))
}

const scrapeSource = async (sourceId, query) => {
  const source = SOURCES[sourceId]
  if (!source) throw new Error('Unsupported source')
  if (sourceId === 'reddit') return scrapeReddit(query)

  const searchUrl = source.search(query)
  const readerUrl = `https://r.jina.ai/${searchUrl}`
  const text = await fetchText(readerUrl)

  if (source.type === 'video') {
    return extractYouTube(text).map((item) => ({
      id: `${sourceId}-${hash(item.url)}`,
      source: source.name,
      type: 'video',
      title: item.title,
      url: item.url,
      snippet: `Video result for “${query}”.`,
      thumbnail: item.thumbnail,
      mediaUrl: item.thumbnail,
    }))
  }

  if (source.type === 'image') {
    return extractImages(text).slice(0, 16).map((item, index) => ({
      id: `${sourceId}-${hash(item.url)}`,
      source: source.name,
      type: 'image',
      title: item.title === 'Image result' ? `${source.name} image ${index + 1}` : item.title,
      url: item.url,
      snippet: `Image result for “${query}”.`,
      thumbnail: item.url,
      mediaUrl: item.url,
    }))
  }

  const links = extractMarkdownLinks(text)
    .filter((item) => {
      try {
        const host = new URL(item.url).hostname.toLowerCase()
        return !SEARCH_HOSTS.has(host) || item.url.includes('/comments/') || item.url.includes('/@')
      } catch {
        return false
      }
    })
    .slice(0, 10)

  return links.map((item) => ({
    id: `${sourceId}-${hash(item.url)}`,
    source: source.name,
    type: source.type,
    title: item.title,
    url: item.url,
    snippet: `Result for “${query}” from ${source.name}.`,
  }))
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      service: 'sstoken-scrapper-pro',
      sources: Object.entries(SOURCES).map(([id, source]) => ({ id, name: source.name, type: source.type })),
    })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const query = String(req.body?.query || '').trim()
  const requested = Array.isArray(req.body?.sources) ? req.body.sources : []
  const sources = [...new Set(requested)].filter((id) => SOURCES[id]).slice(0, 10)

  if (!query) return res.status(400).json({ error: 'Query is required' })
  if (query.length > 200) return res.status(400).json({ error: 'Query is too long' })
  if (!sources.length) return res.status(400).json({ error: 'Select at least one source' })

  const startedAt = Date.now()
  const settled = await Promise.allSettled(sources.map(async (sourceId) => ({
    sourceId,
    results: await scrapeSource(sourceId, query),
  })))

  const results = []
  const failures = []

  settled.forEach((entry, index) => {
    const sourceId = sources[index]
    if (entry.status === 'fulfilled') {
      results.push(...entry.value.results)
    } else {
      failures.push({
        sourceId,
        source: SOURCES[sourceId].name,
        error: entry.reason instanceof Error ? entry.reason.message : 'Source failed',
      })
    }
  })

  const unique = Array.from(new Map(results.filter((item) => item.url).map((item) => [item.url, item])).values())

  return res.status(200).json({
    ok: true,
    query,
    count: unique.length,
    durationMs: Date.now() - startedAt,
    results: unique.slice(0, 120),
    failures,
  })
}

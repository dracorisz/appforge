const API_ROOT = 'https://www.googleapis.com/youtube/v3'

export class YouTubeApiError extends Error {
  constructor(message, status = 500, reason = 'youtube_api_error') {
    super(message)
    this.name = 'YouTubeApiError'
    this.status = status
    this.reason = reason
  }
}

export const parseYouTubeInput = (value = '') => {
  const input = String(value).trim()
  if (/^UC[\w-]{22}$/.test(input)) return { kind: 'channel', value: input }
  if (/^[\w-]{11}$/.test(input)) return { kind: 'video', value: input }
  if (/^@[\w.-]+$/.test(input)) return { kind: 'handle', value: input }
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`)
    const host = url.hostname.replace(/^www\./, '')
    if (!['youtube.com', 'm.youtube.com', 'youtu.be'].includes(host)) return { kind: 'search', value: input }
    const videoId = host === 'youtu.be' ? url.pathname.split('/')[1] : url.searchParams.get('v') || (/^\/shorts\//.test(url.pathname) ? url.pathname.split('/')[2] : '')
    if (/^[\w-]{11}$/.test(videoId || '')) return { kind: 'video', value: videoId }
    const channelId = url.pathname.match(/^\/channel\/(UC[\w-]{22})/)?.[1]
    if (channelId) return { kind: 'channel', value: channelId }
    const handle = url.pathname.match(/^\/@([^/?]+)/)?.[1]
    if (handle) return { kind: 'handle', value: `@${handle}` }
  } catch { /* Treat non-URLs as search text. */ }
  return { kind: 'search', value: input }
}

const bestThumbnail = (thumbnails = {}) => {
  const order = ['maxres', 'standard', 'high', 'medium', 'default']
  for (const resolution of order) {
    if (thumbnails[resolution]?.url) return { ...thumbnails[resolution], resolution }
  }
  return null
}

const durationSeconds = (duration = '') => {
  const match = String(duration).match(/^P(?:([\d.]+)D)?T?(?:([\d.]+)H)?(?:([\d.]+)M)?(?:([\d.]+)S)?$/)
  if (!match) return undefined
  return Number(match[1] || 0) * 86400 + Number(match[2] || 0) * 3600 + Number(match[3] || 0) * 60 + Number(match[4] || 0)
}

export function createYouTubeClient({ apiKey = process.env.YOUTUBE_API_KEY, fetchImpl = fetch } = {}) {
  if (!apiKey) throw new YouTubeApiError('YouTube search is not configured. Add YOUTUBE_API_KEY to the server environment.', 503, 'not_configured')

  const cache = new Map()
  const request = async (resource, params) => {
    const query = new URLSearchParams({ ...params, key: apiKey })
    const url = `${API_ROOT}/${resource}?${query}`
    const cached = cache.get(url)
    if (cached && cached.expiresAt > Date.now()) return cached.data
    const response = await fetchImpl(url)
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const reason = data?.error?.errors?.[0]?.reason || 'youtube_api_error'
      const friendly = ['quotaExceeded', 'dailyLimitExceeded'].includes(reason)
        ? 'YouTube API quota is exhausted. Try again after the quota resets.'
        : data?.error?.message || `YouTube API request failed (${response.status}).`
      throw new YouTubeApiError(friendly, response.status, reason)
    }
    cache.set(url, { data, expiresAt: Date.now() + 5 * 60_000 })
    return data
  }

  const channels = async (params) => request('channels', { part: 'snippet,statistics,contentDetails,brandingSettings', ...params })
  const videos = async (ids) => ids.length ? request('videos', { part: 'snippet,contentDetails,statistics', id: ids.join(',') }) : { items: [] }

  const resolveChannel = async (input) => {
    if (input.kind === 'channel') return input.value
    if (input.kind === 'handle') {
      const data = await channels({ forHandle: input.value.replace(/^@/, '') })
      return data.items?.[0]?.id || null
    }
    return null
  }

  const videoResults = (items = []) => items.map((item) => {
    const thumb = bestThumbnail(item.snippet?.thumbnails)
    return {
      id: `youtube-video-${item.id}`,
      source: 'YouTube', type: 'video', title: item.snippet?.title || 'YouTube video',
      url: `https://www.youtube.com/watch?v=${item.id}`, mediaUrl: `https://www.youtube.com/watch?v=${item.id}`,
      thumbnail: thumb?.url, snippet: item.snippet?.description || item.snippet?.channelTitle || 'YouTube video',
      date: item.snippet?.publishedAt,
      provenance: { provider: 'youtube-data-api-v3', youtubeId: item.id, channelId: item.snippet?.channelId, channelTitle: item.snippet?.channelTitle, thumbnailResolution: thumb?.resolution, thumbnails: item.snippet?.thumbnails, duration: item.contentDetails?.duration, durationSeconds: durationSeconds(item.contentDetails?.duration), statistics: item.statistics, fetchedAt: new Date().toISOString() },
    }
  })

  const channelResults = (items = []) => items.flatMap((item) => {
    const avatar = bestThumbnail(item.snippet?.thumbnails)
    const banner = item.brandingSettings?.image?.bannerExternalUrl
    const common = { provider: 'youtube-data-api-v3', youtubeId: item.id, channelId: item.id, channelTitle: item.snippet?.title, uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads, statistics: item.statistics, fetchedAt: new Date().toISOString() }
    const results = avatar?.url ? [{ id: `youtube-channel-${item.id}-avatar`, source: 'YouTube', type: 'image', title: `${item.snippet?.title || 'YouTube channel'} profile image`, url: `https://www.youtube.com/channel/${item.id}`, mediaUrl: avatar.url, thumbnail: avatar.url, snippet: item.snippet?.description || 'YouTube channel profile image', provenance: { ...common, assetRole: 'channel-profile', thumbnailResolution: avatar.resolution, thumbnails: item.snippet?.thumbnails } }] : []
    if (banner) results.push({ id: `youtube-channel-${item.id}-banner`, source: 'YouTube', type: 'image', title: `${item.snippet?.title || 'YouTube channel'} banner`, url: `https://www.youtube.com/channel/${item.id}`, mediaUrl: banner, thumbnail: banner, snippet: 'YouTube channel banner', provenance: { ...common, assetRole: 'channel-banner' } })
    return results
  })

  const fetchChannel = async (channelId, pageToken) => {
    const channelData = await channels({ id: channelId })
    const channel = channelData.items?.[0]
    if (!channel) throw new YouTubeApiError('YouTube channel was not found.', 404, 'not_found')
    const uploads = channel.contentDetails?.relatedPlaylists?.uploads
    let uploadData = { items: [] }
    if (uploads) uploadData = await request('playlistItems', { part: 'snippet,contentDetails', playlistId: uploads, maxResults: '24', ...(pageToken ? { pageToken } : {}) })
    const ids = uploadData.items?.map((item) => item.contentDetails?.videoId).filter(Boolean) || []
    const videoData = await videos(ids)
    return { results: [...channelResults([channel]), ...videoResults(videoData.items)], nextPageToken: uploadData.nextPageToken || null }
  }

  const search = async (query, pageToken) => {
    const parsed = parseYouTubeInput(query)
    if (parsed.kind === 'video') return { results: videoResults((await videos([parsed.value])).items), nextPageToken: null }
    const channelId = await resolveChannel(parsed)
    if (channelId) return fetchChannel(channelId, pageToken)
    const data = await request('search', { part: 'snippet', q: parsed.value, type: 'video,channel,playlist', maxResults: '24', ...(pageToken ? { pageToken } : {}) })
    const videoIds = data.items?.map((item) => item.id?.videoId).filter(Boolean) || []
    const channelIds = data.items?.map((item) => item.id?.channelId).filter(Boolean) || []
    const [videoData, channelData] = await Promise.all([videos(videoIds), channelIds.length ? channels({ id: channelIds.join(',') }) : { items: [] }])
    return { results: [...channelResults(channelData.items), ...videoResults(videoData.items)], nextPageToken: data.nextPageToken || null }
  }

  return { search }
}

export const searchYouTube = async (query, options = {}) => createYouTubeClient(options).search(query, options.pageToken)

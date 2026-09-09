import assert from 'node:assert/strict'
import test from 'node:test'
import { createYouTubeClient, parseYouTubeInput, YouTubeApiError } from '../api/_youtube-data.js'

test('parses search text and common YouTube URLs', () => {
  assert.deepEqual(parseYouTubeInput('ambient coding'), { kind: 'search', value: 'ambient coding' })
  assert.deepEqual(parseYouTubeInput('https://youtu.be/dQw4w9WgXcQ'), { kind: 'video', value: 'dQw4w9WgXcQ' })
  assert.deepEqual(parseYouTubeInput('https://youtube.com/@OpenAI'), { kind: 'handle', value: '@OpenAI' })
  assert.deepEqual(parseYouTubeInput('https://youtube.com/channel/UCXZCJLdBC09xxGZ6gcdrc6A'), { kind: 'channel', value: 'UCXZCJLdBC09xxGZ6gcdrc6A' })
})

test('keeps the API key server-side and enriches searched videos', async () => {
  const urls = []
  const fetchImpl = async (url) => {
    urls.push(url)
    const path = new URL(url).pathname
    if (path.endsWith('/search')) return Response.json({ items: [{ id: { videoId: 'dQw4w9WgXcQ' } }], nextPageToken: 'next' })
    if (path.endsWith('/videos')) return Response.json({ items: [{ id: 'dQw4w9WgXcQ', snippet: { title: 'Demo', channelId: 'channel', channelTitle: 'Creator', thumbnails: { high: { url: 'https://img.example/high.jpg', width: 480, height: 360 } } }, contentDetails: { duration: 'PT1M2S' }, statistics: { viewCount: '42' } }] })
    return Response.json({ items: [] })
  }
  const result = await createYouTubeClient({ apiKey: 'server-secret', fetchImpl }).search('demo')
  assert.equal(result.nextPageToken, 'next')
  assert.equal(result.results[0].provenance.durationSeconds, 62)
  assert.equal(result.results[0].provenance.thumbnailResolution, 'high')
  assert.ok(urls.every((url) => url.includes('key=server-secret')))
  assert.ok(!JSON.stringify(result).includes('server-secret'))
})

test('resolves a handle and traverses its uploads playlist', async () => {
  const fetchImpl = async (url) => {
    const parsed = new URL(url)
    const path = parsed.pathname
    if (path.endsWith('/channels') && parsed.searchParams.has('forHandle')) return Response.json({ items: [{ id: 'UCXZCJLdBC09xxGZ6gcdrc6A' }] })
    if (path.endsWith('/channels')) return Response.json({ items: [{ id: 'UCXZCJLdBC09xxGZ6gcdrc6A', snippet: { title: 'OpenAI', thumbnails: { default: { url: 'https://img.example/avatar.jpg' } } }, contentDetails: { relatedPlaylists: { uploads: 'uploads-id' } }, statistics: { subscriberCount: '1' }, brandingSettings: { image: { bannerExternalUrl: 'https://img.example/banner.jpg' } } }] })
    if (path.endsWith('/playlistItems')) return Response.json({ items: [{ contentDetails: { videoId: 'dQw4w9WgXcQ' } }] })
    if (path.endsWith('/videos')) return Response.json({ items: [{ id: 'dQw4w9WgXcQ', snippet: { title: 'Video', thumbnails: {} }, contentDetails: {}, statistics: {} }] })
    throw new Error(`Unexpected URL ${url}`)
  }
  const result = await createYouTubeClient({ apiKey: 'key', fetchImpl }).search('@OpenAI')
  assert.deepEqual(result.results.map((item) => item.provenance?.assetRole || item.type), ['channel-profile', 'channel-banner', 'video'])
})

test('returns a clear configuration error without an API key', () => {
  assert.throws(() => createYouTubeClient({ apiKey: '' }), (error) => error instanceof YouTubeApiError && error.status === 503)
})

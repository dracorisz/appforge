import { searchYouTube, YouTubeApiError } from './_youtube-data.js'

const cleanToken = (value) => {
  const token = String(value || '').trim()
  return token && token.length <= 512 ? token : undefined
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const query = String(req.method === 'GET' ? req.query?.q || '' : req.body?.query || '').trim()
  const pageToken = cleanToken(req.method === 'GET' ? req.query?.pageToken : req.body?.pageToken)

  if (!query) return res.status(400).json({ error: 'Query is required' })
  if (query.length > 300) return res.status(400).json({ error: 'Query is too long' })

  try {
    const data = await searchYouTube(query, { pageToken })
    return res.status(200).json({
      ok: true,
      query,
      results: data.results || [],
      nextPageToken: data.nextPageToken || null,
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof YouTubeApiError) {
      return res.status(error.status || 500).json({ error: error.message, reason: error.reason })
    }
    return res.status(500).json({ error: error instanceof Error ? error.message : 'YouTube search failed' })
  }
}

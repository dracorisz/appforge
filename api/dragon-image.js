const DEFAULT_IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || 'openrouter/free'
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_b56EltHyMfwOQjVQcQFHwA_VUiSn9zN'

const supabaseRequest = (path, token, init = {}) => fetch(`${SUPABASE_URL}${path}`, {
  ...init,
  headers: {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  },
})

const getBearer = (req) => {
  const value = req.headers?.authorization || ''
  return value.startsWith('Bearer ') ? value.slice(7).trim() : ''
}

const authenticate = async (token) => {
  if (!token) return null
  const response = await supabaseRequest('/auth/v1/user', token)
  return response.ok ? response.json().catch(() => null) : null
}

const consumeImageRequest = async (token) => {
  const response = await supabaseRequest('/rest/v1/rpc/consume_dragon_arena_image_request', token, { method: 'POST', body: '{}' })
  if (!response.ok) throw new Error('image_quota_check_failed')
  return response.json().catch(() => false)
}

const refundImageRequest = async (token) => {
  await supabaseRequest('/rest/v1/rpc/refund_dragon_arena_image_request', token, { method: 'POST', body: '{}' }).catch(() => undefined)
}

const extractImageUrl = (data) => {
  const content = data?.choices?.[0]?.message?.content
  if (Array.isArray(content)) {
    const imagePart = content.find((part) => part?.type === 'image_url' || part?.type === 'output_image')
    return imagePart?.image_url?.url || imagePart?.url || null
  }
  return data?.choices?.[0]?.message?.images?.[0]?.image_url?.url || null
}

const saveImage = async (token, userId, imageUrl) => {
  const imageResponse = imageUrl.startsWith('data:')
    ? null
    : await fetch(imageUrl)
  const mimeType = imageUrl.match(/^data:([^;]+);base64,/)?.[1] || imageResponse?.headers.get('content-type') || 'image/png'
  const bytes = imageUrl.startsWith('data:')
    ? Buffer.from(imageUrl.split(',')[1], 'base64')
    : Buffer.from(await imageResponse.arrayBuffer())
  const storagePath = `${userId}/${crypto.randomUUID()}.png`
  const upload = await supabaseRequest(`/storage/v1/object/dragon-arena-assets/${storagePath}`, token, {
    method: 'POST',
    headers: { 'Content-Type': mimeType, 'x-upsert': 'false' },
    body: bytes,
  })
  if (!upload.ok) throw new Error('image_storage_upload_failed')
  return { storagePath, publicUrl: `${SUPABASE_URL}/storage/v1/object/public/dragon-arena-assets/${storagePath}` }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const token = getBearer(req)
  const user = await authenticate(token)
  if (!user?.id) return res.status(401).json({ error: 'Sign in to generate Dragon Arena scenes.' })
  const personalKey = String(req.headers?.['x-openrouter-key'] || '').trim()
  const apiKey = personalKey.startsWith('sk-or-') ? personalKey : process.env.OPENROUTER_API_KEY
  const usingPersonalKey = Boolean(personalKey.startsWith('sk-or-'))
  if (!apiKey) return res.status(503).json({ error: 'Scene generation is offline until an OpenRouter key is configured.' })

  const { prompt, sessionId } = req.body || {}
  if (typeof prompt !== 'string' || prompt.trim().length < 8) return res.status(400).json({ error: 'Describe the scene to generate.' })
  if (typeof sessionId !== 'string') return res.status(400).json({ error: 'A Dragon Arena session is required.' })

  let reserved = false
  try {
    reserved = usingPersonalKey || await consumeImageRequest(token)
    if (!reserved) return res.status(429).json({ error: 'Your Dragon Arena image turn for today has already been used. Come back after 00:00 UTC.' })

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.VITE_APP_URL || 'https://www.sstoken.space',
        'X-OpenRouter-Title': process.env.VITE_APP_NAME || 'AppForge Dragon Arena',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_IMAGE_MODEL,
        modalities: ['text', 'image'],
        messages: [{ role: 'user', content: `Create a cinematic fantasy game scene for Dragon Arena. No words, logos, UI, or watermark. ${prompt.trim().slice(0, 1200)}` }],
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      await refundImageRequest(token)
      return res.status(response.status === 429 ? 429 : 502).json({ error: 'The scene generator could not answer. Your image turn was not consumed.' })
    }

    const imageUrl = extractImageUrl(data)
    if (!imageUrl) {
      await refundImageRequest(token)
      return res.status(502).json({ error: 'The image model returned no image. Your image turn was not consumed.' })
    }
    const saved = await saveImage(token, user.id, imageUrl)
    return res.status(200).json({ imageUrl: saved.publicUrl, storagePath: saved.storagePath, model: data.model || DEFAULT_IMAGE_MODEL, sessionId, personalKeyUsed: usingPersonalKey })
  } catch (error) {
    if (reserved) await refundImageRequest(token)
    console.error('Dragon Arena image request failed', error)
    return res.status(502).json({ error: 'Could not reach the Dragon Arena scene generator.' })
  }
}
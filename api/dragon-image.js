const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_b56EltHyMfwOQjVQcQFHwA_VUiSn9zN'
const HF_IMAGE_MODEL = process.env.HF_IMAGE_MODEL || 'stabilityai/stable-diffusion-3-medium-diffusers'
const MAX_IMAGE_BYTES = 15 * 1024 * 1024

const HF_TOKENS = [
  process.env.HF_TOKEN_1,
  process.env.HF_TOKEN_2,
  process.env.HF_TOKEN_3,
].filter(Boolean)
let hfTokenIndex = 0

const orderedHfTokens = (personalToken = '') => {
  if (personalToken) return [personalToken]
  if (!HF_TOKENS.length) return []
  const start = hfTokenIndex % HF_TOKENS.length
  hfTokenIndex += 1
  return HF_TOKENS.map((_, offset) => HF_TOKENS[(start + offset) % HF_TOKENS.length])
}

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

const generateImageFromHf = async (prompt, hfToken) => {
  const response = await fetch(`https://router.huggingface.co/hf-inference/models/${encodeURIComponent(HF_IMAGE_MODEL)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${hfToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: `${prompt.trim().slice(0, 900)} Cinematic fantasy game scene, dramatic lighting, detailed environment. No words, logos, UI, or watermark.`,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`HF_${response.status}: ${text.slice(0, 200)}`)
  }

  const mimeType = response.headers.get('content-type') || 'image/png'
  if (!mimeType.startsWith('image/') && mimeType !== 'application/octet-stream') {
    const text = await response.text().catch(() => '')
    throw new Error(`HF_INVALID_RESPONSE: ${text.slice(0, 200)}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (!buffer.length) throw new Error('HF_EMPTY_IMAGE')
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error('HF_IMAGE_TOO_LARGE')

  return { buffer, mimeType: mimeType.startsWith('image/') ? mimeType : 'image/png' }
}

const saveImage = async (token, userId, bytes, mimeType) => {
  const storagePath = `${userId}/${crypto.randomUUID()}.png`
  const upload = await supabaseRequest(`/storage/v1/object/dragon-arena-assets/${storagePath}`, token, {
    method: 'POST',
    headers: { 'Content-Type': mimeType || 'image/png', 'x-upsert': 'false' },
    body: bytes,
  })
  if (!upload.ok) {
    const detail = await upload.text().catch(() => '')
    throw new Error(`image_storage_upload_failed: ${detail.slice(0, 160)}`)
  }
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

  const userHfToken = String(req.headers?.['x-hf-token'] || '').trim()
  const personalHfToken = userHfToken.startsWith('hf_') ? userHfToken : ''
  const hfTokens = orderedHfTokens(personalHfToken)
  const usingPersonalKey = Boolean(personalHfToken)

  if (!hfTokens.length) {
    return res.status(503).json({ error: 'Scene generation is offline until a Hugging Face token is configured.' })
  }

  const { prompt, sessionId } = req.body || {}
  if (typeof prompt !== 'string' || prompt.trim().length < 8) return res.status(400).json({ error: 'Describe the scene to generate.' })
  if (typeof sessionId !== 'string' || !sessionId.trim()) return res.status(400).json({ error: 'A Dragon Arena session is required.' })

  let reserved = false
  try {
    reserved = usingPersonalKey || await consumeImageRequest(token)
    if (!reserved) return res.status(429).json({ error: 'Your Dragon Arena image turn for today has already been used. Come back after 00:00 UTC or add a personal Hugging Face token.' })

    let lastError = null
    for (const hfToken of hfTokens) {
      try {
        const generated = await generateImageFromHf(prompt, hfToken)
        const saved = await saveImage(token, user.id, generated.buffer, generated.mimeType)
        return res.status(200).json({
          imageUrl: saved.publicUrl,
          storagePath: saved.storagePath,
          model: HF_IMAGE_MODEL,
          sessionId,
          personalKeyUsed: usingPersonalKey,
          provider: 'huggingface',
        })
      } catch (hfError) {
        lastError = hfError
      }
    }

    await refundImageRequest(token)
    const reason = lastError instanceof Error ? lastError.message : 'The Hugging Face scene generator could not answer. Your image turn was not consumed.'
    return res.status(502).json({ error: reason })
  } catch (error) {
    if (reserved && !usingPersonalKey) await refundImageRequest(token)
    console.error('Dragon Arena image request failed', error)
    return res.status(502).json({ error: 'Could not reach the Dragon Arena Hugging Face scene generator.' })
  }
}

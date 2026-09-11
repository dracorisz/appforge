import { generateHfImage, orderedHfTokens, parsePersonalHfTokens, publicHfAttempts } from './_hf-image-provider.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
// A base64 data URL expands binary data by roughly one third. Keep the raw image
// small enough to remain comfortably inside browser/server JSON and localStorage limits.
const MAX_RESPONSE_BYTES = 2_400_000
const hasSharedHfToken = () => Boolean(process.env.HF_TOKEN_1 || process.env.HF_TOKEN_2 || process.env.HF_TOKEN_3)

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

const BUDDY_SUFFIX = 'MANDATORY OUTPUT REQUIREMENT: generate exactly one original cute desktop assistant character as a PNG image with a fully transparent alpha background. The background MUST be transparent, not white, not colored, not a checkerboard, and not a scene. Full body, centered, clean silhouette, generous transparent padding around the character, no words, captions, logos, UI, watermark, border, shadow box, floor, scenery, or text. Output MUST be suitable for direct use as a transparent PNG sprite without background-removal cleanup.'

export default async function handler(req, res) {
  const startedAt = Date.now()
  const requestId = crypto.randomUUID()
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('x-appforge-request-id', requestId)

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      provider: 'huggingface-inference-providers',
      configured: hasSharedHfToken(),
      personalTokenSupported: true,
      sharedQuota: 'Uses the existing AppForge daily image-turn allowance.',
      requestId,
    })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed.', requestId })
  }

  const token = getBearer(req)
  const user = await authenticate(token)
  if (!user?.id) return res.status(401).json({ error: 'Sign in to generate a Desktop Buddy character.', requestId })

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : ''
  if (prompt.length < 8) return res.status(400).json({ error: 'Describe the character you want to generate.', requestId })
  if (prompt.length > 900) return res.status(400).json({ error: 'Keep the character prompt under 900 characters.', requestId })

  const personalTokens = parsePersonalHfTokens(req.headers)
  const tokens = orderedHfTokens(personalTokens)
  const usingPersonalKey = personalTokens.length > 0
  if (!tokens.length) return res.status(503).json({ error: 'Hugging Face generation is offline until a server-side or personal HF token is configured.', requestId })

  let reserved = false
  try {
    reserved = usingPersonalKey || await consumeImageRequest(token)
    if (!reserved) {
      return res.status(429).json({
        error: 'Your shared AppForge image turn for today has already been used. Try again after 00:00 UTC or use a personal Hugging Face token.',
        requestId,
      })
    }

    const generated = await generateHfImage({ prompt, tokens, promptSuffix: BUDDY_SUFFIX, budgetMs: 50_000 })
    if (generated.buffer.length > MAX_RESPONSE_BYTES) {
      if (!usingPersonalKey) await refundImageRequest(token)
      return res.status(502).json({
        error: 'The generated character was too large for the safe browser response limit. Your shared image turn was refunded.',
        requestId,
      })
    }

    return res.status(200).json({
      ok: true,
      imageDataUrl: `data:${generated.mimeType};base64,${generated.buffer.toString('base64')}`,
      mimeType: generated.mimeType,
      sizeBytes: generated.buffer.length,
      model: generated.model,
      provider: `huggingface:${generated.provider}`,
      providerModel: generated.providerModel,
      personalKeyUsed: usingPersonalKey,
      requestId,
      durationMs: Date.now() - startedAt,
      provenance: {
        source: 'desktop-buddy-generator',
        provider: `huggingface:${generated.provider}`,
        model: generated.model,
        providerModel: generated.providerModel,
        prompt: prompt.slice(0, 900),
        outputRequirement: 'PNG with fully transparent alpha background',
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    if (reserved && !usingPersonalKey) await refundImageRequest(token)
    const attempts = publicHfAttempts(error?.attempts || [])
    console.error('Desktop Buddy Hugging Face generation failed', { requestId, code: error?.message, attempts })
    return res.status(502).json({
      error: 'Hugging Face image providers could not generate this character right now. A shared image turn was not consumed.',
      provider: 'huggingface-inference-providers',
      requestId,
      durationMs: Date.now() - startedAt,
      attempts,
    })
  }
}

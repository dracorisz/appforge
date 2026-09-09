const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_b56EltHyMfwOQjVQcQFHwA_VUiSn9zN'

const DEFAULT_HF_IMAGE_MODELS = [
  'black-forest-labs/FLUX.1-schnell',
  'stabilityai/stable-diffusion-xl-base-1.0',
]
const HF_IMAGE_MODELS = [process.env.HF_IMAGE_MODEL, ...DEFAULT_HF_IMAGE_MODELS]
  .filter((value, index, list) => Boolean(value) && list.indexOf(value) === index)
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

const verifySession = async (token, userId, sessionId) => {
  const response = await supabaseRequest(`/rest/v1/dragon_arena_sessions?id=eq.${encodeURIComponent(sessionId)}&user_id=eq.${encodeURIComponent(userId)}&select=id`, token)
  if (!response.ok) return false
  const rows = await response.json().catch(() => [])
  return Array.isArray(rows) && rows.length === 1
}

const consumeImageRequest = async (token) => {
  const response = await supabaseRequest('/rest/v1/rpc/consume_dragon_arena_image_request', token, { method: 'POST', body: '{}' })
  if (!response.ok) throw new Error('image_quota_check_failed')
  return response.json().catch(() => false)
}

const refundImageRequest = async (token) => {
  await supabaseRequest('/rest/v1/rpc/refund_dragon_arena_image_request', token, { method: 'POST', body: '{}' }).catch(() => undefined)
}

const generateImageFromHf = async (prompt, hfToken, model) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45000)
  try {
    const response = await fetch(`https://router.huggingface.co/hf-inference/models/${encodeURIComponent(model)}`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `${prompt.trim().slice(0, 900)} Cinematic dark-fantasy game scene set in WildDragons Keep, atmospheric depth, dramatic volumetric lighting, detailed environment, coherent medieval-fantasy architecture, no words, logos, UI, watermark, captions, or text.`,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      const error = new Error(`HF_${response.status} ${model}: ${text.slice(0, 180)}`)
      error.status = response.status
      throw error
    }

    const mimeType = response.headers.get('content-type') || 'image/png'
    if (!mimeType.startsWith('image/') && mimeType !== 'application/octet-stream') {
      const text = await response.text().catch(() => '')
      throw new Error(`HF_INVALID_RESPONSE ${model}: ${text.slice(0, 180)}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    if (!buffer.length) throw new Error(`HF_EMPTY_IMAGE ${model}`)
    if (buffer.length > MAX_IMAGE_BYTES) throw new Error(`HF_IMAGE_TOO_LARGE ${model}`)

    return { buffer, mimeType: mimeType.startsWith('image/') ? mimeType : 'image/png', model }
  } finally {
    clearTimeout(timeout)
  }
}

const saveImage = async (token, userId, bytes, mimeType) => {
  const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png'
  const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`
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

const removeStoredImage = async (token, storagePath) => {
  if (!storagePath) return
  await supabaseRequest(`/storage/v1/object/dragon-arena-assets/${storagePath}`, token, { method: 'DELETE' }).catch(() => undefined)
}

const persistAsset = async ({ token, userId, sessionId, prompt, generated, saved, generatedAt, turnNumber, usingPersonalKey }) => {
  const response = await supabaseRequest('/rest/v1/dragon_arena_assets?select=id,title,storage_path,is_public,metadata,created_at', token, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      session_id: sessionId,
      user_id: userId,
      asset_type: 'scene',
      storage_path: saved.storagePath,
      external_url: saved.publicUrl,
      mime_type: generated.mimeType,
      prompt: prompt.trim().slice(0, 4000),
      title: `Scene turn ${Math.max(1, Number(turnNumber) || 1)}`,
      is_public: false,
      mint_status: 'not_requested',
      metadata: {
        model: generated.model,
        provider: 'huggingface-hf-inference',
        generated_at: generatedAt,
        size_bytes: generated.buffer.length,
        mime_type: generated.mimeType,
        personal_hf_token: usingPersonalKey,
        turn_number: Math.max(1, Number(turnNumber) || 1),
      },
    }),
  })
  const rows = await response.json().catch(() => [])
  if (!response.ok || !Array.isArray(rows) || !rows[0]?.id) {
    const detail = Array.isArray(rows) ? '' : String(rows?.message || rows?.error || '')
    throw new Error(`asset_ledger_failed${detail ? `: ${detail.slice(0, 160)}` : ''}`)
  }
  return rows[0]
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

  const { prompt, sessionId, turnNumber } = req.body || {}
  if (typeof prompt !== 'string' || prompt.trim().length < 8) return res.status(400).json({ error: 'Describe the scene to generate.' })
  if (typeof sessionId !== 'string' || !sessionId.trim()) return res.status(400).json({ error: 'A Dragon Arena session is required.' })
  if (!await verifySession(token, user.id, sessionId.trim())) return res.status(403).json({ error: 'This Dragon Arena session is not available to the signed-in user.' })

  let reserved = false
  let saved = null
  try {
    reserved = usingPersonalKey || await consumeImageRequest(token)
    if (!reserved) return res.status(429).json({ error: 'Your Dragon Arena image turn for today has already been used. Come back after 00:00 UTC or add a personal Hugging Face token.' })

    let lastError = null
    let generated = null
    const attempts = []
    for (let tokenIndex = 0; tokenIndex < hfTokens.length && !generated; tokenIndex += 1) {
      const hfToken = hfTokens[tokenIndex]
      for (const model of HF_IMAGE_MODELS) {
        try {
          generated = await generateImageFromHf(prompt, hfToken, model)
          break
        } catch (hfError) {
          lastError = hfError
          attempts.push({ model, code: Number(hfError?.status) || undefined })
        }
      }
    }

    if (!generated) {
      if (!usingPersonalKey) await refundImageRequest(token)
      console.error('Dragon Arena HF image rotation exhausted', lastError, attempts)
      return res.status(502).json({
        error: 'Hugging Face could not generate a scene right now. Your image turn was not consumed. Try again shortly or use a personal HF token.',
        provider: 'huggingface',
      })
    }

    const generatedAt = new Date().toISOString()
    saved = await saveImage(token, user.id, generated.buffer, generated.mimeType)

    let asset
    try {
      asset = await persistAsset({
        token,
        userId: user.id,
        sessionId: sessionId.trim(),
        prompt,
        generated,
        saved,
        generatedAt,
        turnNumber,
        usingPersonalKey,
      })
    } catch (ledgerError) {
      await removeStoredImage(token, saved.storagePath)
      if (!usingPersonalKey) await refundImageRequest(token)
      console.error('Dragon Arena scene asset ledger failed', ledgerError)
      return res.status(502).json({ error: 'The scene was generated but could not be saved safely. Your image turn was not consumed.' })
    }

    return res.status(200).json({
      imageUrl: saved.publicUrl,
      storagePath: saved.storagePath,
      model: generated.model,
      sessionId,
      assetId: asset.id,
      isPublic: Boolean(asset.is_public),
      generatedAt: asset.created_at || generatedAt,
      metadata: asset.metadata || {},
      personalKeyUsed: usingPersonalKey,
      provider: 'huggingface-hf-inference',
    })
  } catch (error) {
    if (saved?.storagePath) await removeStoredImage(token, saved.storagePath)
    if (reserved && !usingPersonalKey) await refundImageRequest(token)
    console.error('Dragon Arena image request failed', error)
    return res.status(502).json({ error: 'Could not reach the Dragon Arena Hugging Face scene generator. Your image turn was not consumed.' })
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_b56EltHyMfwOQjVQcQFHwA_VUiSn9zN'

// Hugging Face Inference Providers can move models between backends over time.
// Keep model preference here, but resolve the live provider mapping at request time.
const DEFAULT_HF_IMAGE_MODELS = [
  'black-forest-labs/FLUX.1-schnell',
  'ByteDance/Hyper-SD',
  'stabilityai/stable-diffusion-xl-base-1.0',
]
const HF_IMAGE_MODELS = [process.env.HF_IMAGE_MODEL, ...DEFAULT_HF_IMAGE_MODELS]
  .filter((value, index, list) => Boolean(value) && list.indexOf(value) === index)
const SUPPORTED_IMAGE_PROVIDERS = new Set(['fal-ai', 'replicate', 'together', 'nscale', 'hf-inference'])
const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const GENERATION_BUDGET_MS = 52_000

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

const buildPrompt = (prompt) => `${prompt.trim().slice(0, 900)} Cinematic dark-fantasy game scene set in WildDragons Keep, atmospheric depth, dramatic volumetric lighting, detailed environment, coherent medieval-fantasy architecture, dynamic story composition, no words, logos, UI, watermark, captions, or text.`

const timeoutSignal = (deadline, maxMs = 18_000) => {
  const remaining = Math.max(1, deadline - Date.now())
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Math.min(maxMs, remaining))
  return { signal: controller.signal, clear: () => clearTimeout(timeout) }
}

const fetchProviderMappings = async (model, hfToken, deadline) => {
  const timer = timeoutSignal(deadline, 7_000)
  try {
    const response = await fetch(`https://huggingface.co/api/models/${model}?expand[]=inferenceProviderMapping`, {
      signal: timer.signal,
      headers: { Authorization: `Bearer ${hfToken}` },
    })
    if (!response.ok) throw Object.assign(new Error(`HF_MAPPING_${response.status}`), { status: response.status })
    const payload = await response.json().catch(() => ({}))
    const raw = payload?.inferenceProviderMapping
    const mappings = Array.isArray(raw)
      ? raw
      : raw && typeof raw === 'object'
        ? Object.entries(raw).map(([provider, value]) => ({ provider, hfModelId: model, ...(value || {}) }))
        : []
    return mappings.filter((mapping) =>
      mapping &&
      mapping.status !== 'staging' &&
      mapping.task === 'text-to-image' &&
      SUPPORTED_IMAGE_PROVIDERS.has(mapping.provider) &&
      typeof mapping.providerId === 'string' &&
      mapping.providerId,
    )
  } finally {
    timer.clear()
  }
}

const downloadImage = async (url, deadline) => {
  const timer = timeoutSignal(deadline, 12_000)
  try {
    const response = await fetch(url, { signal: timer.signal })
    if (!response.ok) throw Object.assign(new Error(`HF_IMAGE_DOWNLOAD_${response.status}`), { status: response.status })
    const mimeType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = Buffer.from(await response.arrayBuffer())
    return validateImage(buffer, mimeType)
  } finally {
    timer.clear()
  }
}

const validateImage = (buffer, mimeType = 'image/png') => {
  if (!buffer?.length) throw new Error('HF_EMPTY_IMAGE')
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error('HF_IMAGE_TOO_LARGE')
  const normalizedMime = String(mimeType).split(';')[0].trim().toLowerCase()
  if (normalizedMime.startsWith('image/')) return { buffer, mimeType: normalizedMime }
  if (normalizedMime === 'application/octet-stream') return { buffer, mimeType: 'image/png' }
  throw new Error(`HF_INVALID_IMAGE_TYPE_${normalizedMime || 'unknown'}`)
}

const generateWithHfInference = async ({ prompt, token, providerModel, deadline }) => {
  const timer = timeoutSignal(deadline, 20_000)
  try {
    const response = await fetch(`https://router.huggingface.co/hf-inference/models/${encodeURIComponent(providerModel)}`, {
      method: 'POST',
      signal: timer.signal,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt }),
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw Object.assign(new Error(`HF_${response.status}: ${detail.slice(0, 140)}`), { status: response.status })
    }
    return validateImage(Buffer.from(await response.arrayBuffer()), response.headers.get('content-type') || 'image/png')
  } finally {
    timer.clear()
  }
}

const generateWithTogetherLike = async ({ prompt, token, provider, providerModel, deadline }) => {
  const timer = timeoutSignal(deadline, 22_000)
  try {
    const response = await fetch(`https://router.huggingface.co/${provider}/v1/images/generations`, {
      method: 'POST',
      signal: timer.signal,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: providerModel, prompt, response_format: 'b64_json' }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const detail = payload?.error?.message || payload?.error || payload?.message || `HTTP ${response.status}`
      throw Object.assign(new Error(`${provider}_${response.status}: ${String(detail).slice(0, 140)}`), { status: response.status })
    }
    const base64 = payload?.data?.[0]?.b64_json
    const url = payload?.data?.[0]?.url
    if (typeof base64 === 'string' && base64) return validateImage(Buffer.from(base64, 'base64'), 'image/jpeg')
    if (typeof url === 'string' && /^https?:\/\//.test(url)) return downloadImage(url, deadline)
    throw new Error(`${provider}_INVALID_RESPONSE`)
  } finally {
    timer.clear()
  }
}

const generateWithReplicate = async ({ prompt, token, providerModel, deadline }) => {
  const timer = timeoutSignal(deadline, 28_000)
  try {
    const encodedModel = providerModel.split('/').map(encodeURIComponent).join('/')
    const response = await fetch(`https://router.huggingface.co/replicate/v1/models/${encodedModel}/predictions`, {
      method: 'POST',
      signal: timer.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({ input: { prompt } }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const detail = payload?.detail || payload?.error || `HTTP ${response.status}`
      throw Object.assign(new Error(`replicate_${response.status}: ${String(detail).slice(0, 140)}`), { status: response.status })
    }
    const output = Array.isArray(payload?.output) ? payload.output[0] : payload?.output
    if (typeof output === 'string' && /^https?:\/\//.test(output)) return downloadImage(output, deadline)
    throw new Error('replicate_INVALID_RESPONSE')
  } finally {
    timer.clear()
  }
}

const generateWithFal = async ({ prompt, token, providerModel, deadline }) => {
  const initialTimer = timeoutSignal(deadline, 10_000)
  let initialUrl
  let headers
  try {
    initialUrl = `https://router.huggingface.co/fal-ai/${providerModel}?_subdomain=queue`
    headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    const response = await fetch(initialUrl, {
      method: 'POST',
      signal: initialTimer.signal,
      headers,
      body: JSON.stringify({ prompt }),
    })
    const queued = await response.json().catch(() => ({}))
    if (!response.ok) {
      const detail = queued?.detail || queued?.error || `HTTP ${response.status}`
      throw Object.assign(new Error(`fal-ai_${response.status}: ${String(detail).slice(0, 140)}`), { status: response.status })
    }
    if (!queued?.request_id || !queued?.response_url) throw new Error('fal-ai_INVALID_QUEUE_RESPONSE')

    const responsePath = new URL(queued.response_url).pathname
    const baseUrl = 'https://router.huggingface.co/fal-ai'
    const query = '?_subdomain=queue'
    let status = queued.status
    while (status !== 'COMPLETED') {
      if (Date.now() >= deadline - 2_000) throw new Error('fal-ai_TIMEOUT')
      await new Promise((resolve) => setTimeout(resolve, 650))
      const pollTimer = timeoutSignal(deadline, 5_000)
      try {
        const poll = await fetch(`${baseUrl}${responsePath}/status${query}`, { signal: pollTimer.signal, headers })
        const pollData = await poll.json().catch(() => ({}))
        if (!poll.ok) throw Object.assign(new Error(`fal-ai_STATUS_${poll.status}`), { status: poll.status })
        status = pollData?.status
      } finally {
        pollTimer.clear()
      }
    }

    const resultTimer = timeoutSignal(deadline, 7_000)
    try {
      const resultResponse = await fetch(`${baseUrl}${responsePath}${query}`, { signal: resultTimer.signal, headers })
      const result = await resultResponse.json().catch(() => ({}))
      if (!resultResponse.ok) throw Object.assign(new Error(`fal-ai_RESULT_${resultResponse.status}`), { status: resultResponse.status })
      const url = result?.images?.[0]?.url
      if (typeof url === 'string' && /^https?:\/\//.test(url)) return downloadImage(url, deadline)
      throw new Error('fal-ai_INVALID_RESULT')
    } finally {
      resultTimer.clear()
    }
  } finally {
    initialTimer.clear()
  }
}

const generateFromProvider = async ({ prompt, token, mapping, deadline }) => {
  if (mapping.provider === 'fal-ai') return generateWithFal({ prompt, token, providerModel: mapping.providerId, deadline })
  if (mapping.provider === 'replicate') return generateWithReplicate({ prompt, token, providerModel: mapping.providerId, deadline })
  if (mapping.provider === 'together' || mapping.provider === 'nscale') return generateWithTogetherLike({ prompt, token, provider: mapping.provider, providerModel: mapping.providerId, deadline })
  if (mapping.provider === 'hf-inference') return generateWithHfInference({ prompt, token, providerModel: mapping.providerId, deadline })
  throw new Error(`unsupported_image_provider_${mapping.provider}`)
}

const generateImageFromHf = async (prompt, hfToken, model, deadline) => {
  const scenePrompt = buildPrompt(prompt)
  const mappings = await fetchProviderMappings(model, hfToken, deadline)
  if (!mappings.length) throw new Error(`HF_NO_LIVE_IMAGE_PROVIDER_${model}`)

  let lastError = null
  const providerAttempts = []
  for (const mapping of mappings) {
    if (Date.now() >= deadline - 2_000) break
    try {
      const image = await generateFromProvider({ prompt: scenePrompt, token: hfToken, mapping, deadline })
      return { ...image, model, provider: mapping.provider, providerModel: mapping.providerId }
    } catch (error) {
      lastError = error
      providerAttempts.push({ provider: mapping.provider, code: Number(error?.status) || undefined })
    }
  }
  const exhausted = new Error(`HF_PROVIDER_ROTATION_EXHAUSTED_${model}`)
  exhausted.cause = lastError
  exhausted.providerAttempts = providerAttempts
  throw exhausted
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
        provider: `huggingface:${generated.provider}`,
        provider_model: generated.providerModel,
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

const publicAttempts = (attempts) => attempts.slice(0, 12).map((attempt) => ({
  model: attempt.model,
  code: attempt.code || null,
  providers: Array.isArray(attempt.providers)
    ? attempt.providers.slice(0, 8).map((provider) => ({ provider: provider.provider, code: provider.code || null }))
    : [],
}))

export default async function handler(req, res) {
  const startedAt = Date.now()
  const requestId = crypto.randomUUID()
  res.setHeader('x-appforge-request-id', requestId)

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.', requestId })
  }

  const token = getBearer(req)
  const user = await authenticate(token)
  if (!user?.id) return res.status(401).json({ error: 'Sign in to generate Dragon Arena scenes.', requestId })

  const userHfToken = String(req.headers?.['x-hf-token'] || '').trim()
  const personalHfToken = userHfToken.startsWith('hf_') ? userHfToken : ''
  const hfTokens = orderedHfTokens(personalHfToken)
  const usingPersonalKey = Boolean(personalHfToken)

  if (!hfTokens.length) {
    return res.status(503).json({ error: 'Scene generation is offline until a Hugging Face token is configured.', requestId })
  }

  const { prompt, sessionId, turnNumber } = req.body || {}
  if (typeof prompt !== 'string' || prompt.trim().length < 8) return res.status(400).json({ error: 'Describe the scene to generate.', requestId })
  if (typeof sessionId !== 'string' || !sessionId.trim()) return res.status(400).json({ error: 'A Dragon Arena session is required.', requestId })
  if (!await verifySession(token, user.id, sessionId.trim())) return res.status(403).json({ error: 'This Dragon Arena session is not available to the signed-in user.', requestId })

  let reserved = false
  let saved = null
  const deadline = Date.now() + GENERATION_BUDGET_MS
  try {
    reserved = usingPersonalKey || await consumeImageRequest(token)
    if (!reserved) return res.status(429).json({ error: 'Your Dragon Arena image turn for today has already been used. Come back after 00:00 UTC or add a personal Hugging Face token.', requestId })

    let lastError = null
    let generated = null
    const attempts = []
    for (let tokenIndex = 0; tokenIndex < hfTokens.length && !generated; tokenIndex += 1) {
      const hfToken = hfTokens[tokenIndex]
      for (const model of HF_IMAGE_MODELS) {
        if (Date.now() >= deadline - 2_000) break
        try {
          generated = await generateImageFromHf(prompt, hfToken, model, deadline)
          break
        } catch (hfError) {
          lastError = hfError
          attempts.push({ model, code: Number(hfError?.status) || undefined, providers: hfError?.providerAttempts || [] })
        }
      }
    }

    if (!generated) {
      if (!usingPersonalKey) await refundImageRequest(token)
      console.error('Dragon Arena Hugging Face provider rotation exhausted', { requestId, lastError, attempts })
      return res.status(502).json({
        error: 'Hugging Face image providers could not render this scene right now. Your image turn was not consumed. Try again shortly or use a personal HF token with Inference Providers access.',
        provider: 'huggingface-inference-providers',
        requestId,
        durationMs: Date.now() - startedAt,
        attempts: publicAttempts(attempts),
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
      console.error('Dragon Arena scene asset ledger failed', { requestId, ledgerError })
      return res.status(502).json({ error: 'The scene was generated but could not be saved safely. Your image turn was not consumed.', requestId, durationMs: Date.now() - startedAt })
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
      provider: `huggingface:${generated.provider}`,
      requestId,
      durationMs: Date.now() - startedAt,
    })
  } catch (error) {
    if (saved?.storagePath) await removeStoredImage(token, saved.storagePath)
    if (reserved && !usingPersonalKey) await refundImageRequest(token)
    console.error('Dragon Arena image request failed', { requestId, error })
    return res.status(502).json({ error: 'Could not reach the Dragon Arena Hugging Face scene generator. Your image turn was not consumed.', requestId, durationMs: Date.now() - startedAt })
  }
}

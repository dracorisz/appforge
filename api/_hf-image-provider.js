const DEFAULT_HF_IMAGE_MODELS = [
  'black-forest-labs/FLUX.1-schnell',
  'ByteDance/Hyper-SD',
  'stabilityai/stable-diffusion-xl-base-1.0',
]

const SUPPORTED_IMAGE_PROVIDERS = new Set(['fal-ai', 'replicate', 'together', 'nscale', 'hf-inference'])
const MAX_IMAGE_BYTES = 15 * 1024 * 1024

let hfTokenIndex = 0

export const getHfImageModels = () => [process.env.HF_IMAGE_MODEL, ...DEFAULT_HF_IMAGE_MODELS]
  .filter((value, index, list) => Boolean(value) && list.indexOf(value) === index)

export const parsePersonalHfTokens = (headers = {}) => {
  const value = String(headers['x-hf-tokens'] || headers['x-hf-token'] || '')
  return [...new Set(value.split(',').map((token) => token.trim()).filter((token) => token.startsWith('hf_')))].slice(0, 3)
}

export const orderedHfTokens = (personalTokens = []) => {
  const validPersonal = Array.isArray(personalTokens)
    ? [...new Set(personalTokens.filter((token) => typeof token === 'string' && token.startsWith('hf_')))].slice(0, 3)
    : []
  if (validPersonal.length) return validPersonal

  const configured = [process.env.HF_TOKEN_1, process.env.HF_TOKEN_2, process.env.HF_TOKEN_3].filter(Boolean)
  if (!configured.length) return []
  const start = hfTokenIndex % configured.length
  hfTokenIndex += 1
  return configured.map((_, offset) => configured[(start + offset) % configured.length])
}

const timeoutSignal = (deadline, maxMs = 18_000) => {
  const remaining = Math.max(1, deadline - Date.now())
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Math.min(maxMs, remaining))
  return { signal: controller.signal, clear: () => clearTimeout(timeout) }
}

const validateImage = (buffer, mimeType = 'image/png') => {
  if (!buffer?.length) throw new Error('HF_EMPTY_IMAGE')
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error('HF_IMAGE_TOO_LARGE')
  const normalizedMime = String(mimeType).split(';')[0].trim().toLowerCase()
  if (normalizedMime.startsWith('image/')) return { buffer, mimeType: normalizedMime }
  if (normalizedMime === 'application/octet-stream') return { buffer, mimeType: 'image/png' }
  throw new Error(`HF_INVALID_IMAGE_TYPE_${normalizedMime || 'unknown'}`)
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
    return validateImage(Buffer.from(await response.arrayBuffer()), response.headers.get('content-type') || 'image/jpeg')
  } finally {
    timer.clear()
  }
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
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'wait' },
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
  try {
    const initialUrl = `https://router.huggingface.co/fal-ai/${providerModel}?_subdomain=queue`
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
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

export const publicHfAttempts = (attempts = []) => attempts.slice(0, 12).map((attempt) => ({
  model: attempt.model,
  code: attempt.code || null,
  providers: Array.isArray(attempt.providers)
    ? attempt.providers.slice(0, 8).map((provider) => ({ provider: provider.provider, code: provider.code || null }))
    : [],
}))

export async function generateHfImage({ prompt, tokens, promptSuffix = '', budgetMs = 52_000 }) {
  const cleanPrompt = String(prompt || '').trim().slice(0, 900)
  if (cleanPrompt.length < 8) throw new Error('HF_PROMPT_TOO_SHORT')
  if (!Array.isArray(tokens) || !tokens.length) throw new Error('HF_TOKEN_UNAVAILABLE')

  const fullPrompt = `${cleanPrompt}${promptSuffix ? ` ${String(promptSuffix).trim()}` : ''}`.trim()
  const deadline = Date.now() + Math.max(5_000, Math.min(55_000, Number(budgetMs) || 52_000))
  const attempts = []
  let lastError = null

  for (const token of tokens) {
    for (const model of getHfImageModels()) {
      if (Date.now() >= deadline - 2_000) break
      try {
        const mappings = await fetchProviderMappings(model, token, deadline)
        if (!mappings.length) throw new Error(`HF_NO_LIVE_IMAGE_PROVIDER_${model}`)
        const providerAttempts = []
        for (const mapping of mappings) {
          if (Date.now() >= deadline - 2_000) break
          try {
            const image = await generateFromProvider({ prompt: fullPrompt, token, mapping, deadline })
            return { ...image, model, provider: mapping.provider, providerModel: mapping.providerId, attempts }
          } catch (error) {
            lastError = error
            providerAttempts.push({ provider: mapping.provider, code: Number(error?.status) || undefined })
          }
        }
        attempts.push({ model, providers: providerAttempts })
      } catch (error) {
        lastError = error
        attempts.push({ model, code: Number(error?.status) || undefined, providers: error?.providerAttempts || [] })
      }
    }
  }

  const exhausted = new Error('HF_PROVIDER_ROTATION_EXHAUSTED')
  exhausted.cause = lastError
  exhausted.attempts = attempts
  throw exhausted
}

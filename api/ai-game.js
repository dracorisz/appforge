import { generateGeminiText } from './_gemini.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_b56EltHyMfwOQjVQcQFHwA_VUiSn9zN'

const DEFAULT_HF_TEXT_MODELS = [
  'openai/gpt-oss-20b:fastest',
  'Qwen/Qwen2.5-7B-Instruct-1M:fastest',
  'google/gemma-2-2b-it:fastest',
  'openai/gpt-oss-120b:cheapest',
]
const HF_TEXT_MODELS = [process.env.HF_TEXT_MODEL, ...DEFAULT_HF_TEXT_MODELS]
  .filter((value, index, list) => Boolean(value) && list.indexOf(value) === index)

const SERVER_HF_TOKENS = [process.env.HF_TOKEN_1, process.env.HF_TOKEN_2, process.env.HF_TOKEN_3].filter(Boolean)
let hfTokenIndex = 0

const orderedHfTokens = (personalTokens = []) => {
  const validPersonal = Array.isArray(personalTokens) ? personalTokens.filter((token) => typeof token === 'string' && token.startsWith('hf_')).slice(0, 3) : []
  if (validPersonal.length) return [...new Set(validPersonal)]
  if (!SERVER_HF_TOKENS.length) return []
  const start = hfTokenIndex % SERVER_HF_TOKENS.length
  hfTokenIndex += 1
  return SERVER_HF_TOKENS.map((_, offset) => SERVER_HF_TOKENS[(start + offset) % SERVER_HF_TOKENS.length])
}

const parseReply = (text) => {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    const value = JSON.parse(cleaned)
    return {
      narrative: String(value?.narrative || '').trim(),
      choices: Array.isArray(value?.choices) ? value.choices.map((choice) => String(choice).trim()).filter(Boolean).slice(0, 3) : [],
    }
  } catch {
    return { narrative: cleaned, choices: [] }
  }
}

const getBearer = (req) => {
  const value = req.headers?.authorization || ''
  return value.startsWith('Bearer ') ? value.slice(7).trim() : ''
}

const supabaseRequest = async (path, token, init = {}) => fetch(`${SUPABASE_URL}${path}`, {
  ...init,
  headers: {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  },
})

const authenticate = async (token) => {
  if (!token) return null
  const response = await supabaseRequest('/auth/v1/user', token)
  if (!response.ok) return null
  return response.json().catch(() => null)
}

const consumeDailyRequest = async (token) => {
  const response = await supabaseRequest('/rest/v1/rpc/consume_dragon_arena_daily_request', token, { method: 'POST', body: '{}' })
  if (!response.ok) throw new Error('quota_check_failed')
  return response.json().catch(() => false)
}

const callHfGameMaster = async ({ hfToken, model, instructions, input, timeoutMs = 18000 }) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: instructions }, { role: 'user', content: input }],
        temperature: 0.88,
        max_tokens: 300,
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const detail = data?.error?.message || data?.error || `HTTP ${response.status}`
      const error = new Error(`HF_${response.status} ${model}: ${String(detail).slice(0, 180)}`)
      error.status = response.status
      throw error
    }
    const parsed = parseReply(data?.choices?.[0]?.message?.content)
    if (!parsed.narrative) throw new Error(`HF_EMPTY_REPLY ${model}`)
    return { parsed, model: data?.model || model }
  } finally {
    clearTimeout(timeout)
  }
}

const callPersonalOpenRouter = async ({ apiKey, instructions, input, timeoutMs = 18000 }) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.VITE_APP_URL || 'https://www.sstoken.space',
        'X-OpenRouter-Title': process.env.VITE_APP_NAME || 'AppForge Story Studio',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openrouter/free',
        messages: [{ role: 'system', content: instructions }, { role: 'user', content: input }],
        temperature: 0.88,
        max_tokens: 300,
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data?.error?.message || `OpenRouter HTTP ${response.status}`)
    const parsed = parseReply(data?.choices?.[0]?.message?.content)
    if (!parsed.narrative) throw new Error('OpenRouter returned an empty turn.')
    return { parsed, model: data?.model || 'openrouter/free' }
  } finally {
    clearTimeout(timeout)
  }
}

const localFallback = ({ action, turn, builderMode }) => {
  const clean = action.trim().replace(/\s+/g, ' ').slice(0, 140)
  const turnNo = Math.max(1, Number(turn) || 1)
  const motifs = [
    'Blue fire crawls across a broken-crown rune.',
    'A dragon-carved arch groans and sheds dust.',
    'Warm ash-laced wind carries the sound of chains.',
    'Three old sigils flare in a warning sequence.',
  ]
  const consequences = [
    'Something in the next chamber notices you.',
    'One rune brightens while another dies in payment.',
    'A hidden mechanism unlocks beneath your feet.',
    'The Keep falls silent, waiting for your move.',
  ]
  const motif = motifs[(turnNo + clean.length) % motifs.length]
  const consequence = consequences[(turnNo * 3 + clean.length) % consequences.length]
  const narrative = builderMode === 'comics'
    ? `${motif} You ${clean.charAt(0).toLowerCase()}${clean.slice(1)}. ${consequence}`
    : `You ${clean.charAt(0).toLowerCase()}${clean.slice(1)}. ${motif}\n\n${consequence}`
  return { parsed: { narrative, choices: ['Inspect rune', 'Push forward', 'Hold and listen'] }, model: 'appforge/local-continuity-fallback' }
}

const promptForMode = (builderMode) => {
  const common = `Preserve continuity. React directly to the latest player/director action. Each turn must create one concrete consequence, discovery, danger, reward, relationship shift, clue, or twist. Never decide the user's next action. Keep recurring characters, places, objects, costs, clues, injuries, promises, and visual motifs consistent. Give exactly three distinct action choices, each 2-6 words, starting with a strong verb. Return ONLY valid JSON: {"narrative":"...","choices":["...","...","..."]}. No markdown.`
  if (builderMode === 'comics') {
    return `You are the story director for AppForge Comics Builder, an interactive graphic-novel game. ${common} Write 30-60 words total in 1-2 short paragraphs. Favor visible action, expressions, poses, staging, lighting, camera-readable moments, and concise dialogue over exposition. The narrative must describe one panel-worthy beat that can be illustrated immediately.`
  }
  return `You are the story director for AppForge Novel Builder, an interactive choice-driven fiction game. ${common} Write 45-85 words total in 2-3 short paragraphs. Favor character intention, sensory detail, tension, readable dialogue, and forward motion over lore dumps. Keep sentences compact and make every turn feel like a scene beat rather than a summary.`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const token = getBearer(req)
  const user = await authenticate(token)
  const guestMode = !user?.id && String(req.headers?.['x-appforge-guest'] || '') === 'dragon-arena'
  if (!user?.id && !guestMode) return res.status(401).json({ error: 'Sign in to use Story Studio.' })

  const personalGeminiKey = !guestMode ? String(req.headers?.['x-gemini-key'] || '').trim() : ''
  const usingPersonalGemini = Boolean(personalGeminiKey)

  const personalOpenRouterKey = String(req.headers?.['x-openrouter-key'] || '').trim()
  const usingPersonalOpenRouter = Boolean(personalOpenRouterKey.startsWith('sk-or-')) && !guestMode
  const personalHfHeader = String(req.headers?.['x-hf-tokens'] || req.headers?.['x-hf-token'] || '')
  const personalHfTokens = personalHfHeader.split(',').map((value) => value.trim()).filter((value) => value.startsWith('hf_')).slice(0, 3)
  const usingPersonalHf = personalHfTokens.length > 0
  const hfTokens = orderedHfTokens(personalHfTokens)

  const { action, history = [], turn = 1, builderMode = 'novel' } = req.body || {}
  const normalizedMode = builderMode === 'comics' ? 'comics' : 'novel'
  if (typeof action !== 'string' || action.trim().length < 2) return res.status(400).json({ error: 'Choose or enter a meaningful action first.' })

  let sharedQuotaAvailable = guestMode || usingPersonalOpenRouter || usingPersonalHf
  if (!guestMode && !sharedQuotaAvailable) {
    try {
      sharedQuotaAvailable = await consumeDailyRequest(token)
    } catch (error) {
      console.error('Story Studio quota check failed; continuing locally', error)
      sharedQuotaAvailable = false
    }
  }

  const recent = Array.isArray(history)
    ? history.slice(-6).map((entry) => `${entry?.role === 'player' ? 'USER' : 'STORY DIRECTOR'}: ${String(entry?.text || '').slice(0, 700)}`).join('\n')
    : ''

  const instructions = promptForMode(normalizedMode)
  const input = `MODE: ${normalizedMode.toUpperCase()}\nTURN: ${Number(turn) || 1}\nRECENT STORY:\n${recent}\n\nLATEST USER ACTION/DIRECTION: ${action.trim().slice(0, 700)}`

  let result = null
  let provider = 'huggingface'
  let lastError = null
  const attempts = []
  // Reserve time for Gemini and serialization inside the 30-second function limit.
  const providerDeadline = Date.now() + 10000

  if (usingPersonalOpenRouter) {
    try {
      result = await callPersonalOpenRouter({ apiKey: personalOpenRouterKey, instructions, input, timeoutMs: 5000 })
      provider = 'openrouter-personal'
    } catch (error) {
      lastError = error
      attempts.push({ provider: 'openrouter-personal', status: 'failed' })
    }
  }

  if (!result && sharedQuotaAvailable && hfTokens.length) {
    for (let tokenIndex = 0; tokenIndex < hfTokens.length && !result && Date.now() < providerDeadline; tokenIndex += 1) {
      const hfToken = hfTokens[tokenIndex]
      for (const model of HF_TEXT_MODELS) {
        if (Date.now() >= providerDeadline) break
        try {
          result = await callHfGameMaster({ hfToken, model, instructions, input, timeoutMs: Math.max(1, Math.min(5000, providerDeadline - Date.now())) })
          provider = usingPersonalHf ? 'huggingface-personal' : 'huggingface'
          attempts.push({ model, status: 'ok' })
          break
        } catch (error) {
          lastError = error
          attempts.push({ model, status: 'failed', code: Number(error?.status) || undefined })
        }
      }
    }
  }

  if (!result && !guestMode && (usingPersonalGemini || process.env.GEMINI_API_KEY)) {
    let geminiAllowed = usingPersonalGemini
    if (!geminiAllowed) {
      try {
        geminiAllowed = usingPersonalOpenRouter || usingPersonalHf
          ? Boolean(await consumeDailyRequest(token))
          : Boolean(sharedQuotaAvailable)
      } catch { geminiAllowed = false }
    }
    if (geminiAllowed) {
      try {
        const reply = await generateGeminiText({ apiKey: personalGeminiKey || process.env.GEMINI_API_KEY, instructions, input, json: true })
        const parsed = parseReply(reply.text)
        if (!parsed.narrative) throw new Error('Gemini empty narrative')
        result = { parsed, model: reply.model }
        provider = usingPersonalGemini ? 'gemini-personal' : 'gemini'
        attempts.push({ provider, status: 'ok' })
      } catch {
        attempts.push({ provider: 'gemini', status: 'failed' })
      }
    }
  }

  if (!result) {
    if (sharedQuotaAvailable) console.error('Story Studio provider rotation exhausted; using local fallback', lastError, attempts)
    result = localFallback({ action, turn, builderMode: normalizedMode })
    provider = 'local-fallback'
  }

  return res.status(200).json({
    narrative: result.parsed.narrative,
    choices: result.parsed.choices.length === 3 ? result.parsed.choices : ['Trace the clue', 'Advance carefully', 'Hold and listen'],
    model: result.model,
    provider,
    degraded: provider === 'local-fallback',
    dailyRequestUsed: false,
    sharedAiQuotaAvailable: Boolean(sharedQuotaAvailable),
    personalKeyUsed: provider.endsWith('-personal'),
    guestMode,
    builderMode: normalizedMode,
    resetAt: '00:00 UTC',
  })
}
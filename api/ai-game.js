const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_b56EltHyMfwOQjVQcQFHwA_VUiSn9zN'

// Keep the first models fast/cheap for normal play, then fall back to a larger model.
// Hugging Face router policy suffixes are intentional: :fastest and :cheapest may
// resolve to different providers, giving the rotation more resilience than changing
// tokens alone (multiple tokens can still share the same account-level provider quota).
const DEFAULT_HF_TEXT_MODELS = [
  'openai/gpt-oss-20b:fastest',
  'Qwen/Qwen2.5-7B-Instruct-1M:fastest',
  'google/gemma-2-2b-it:fastest',
  'openai/gpt-oss-120b:cheapest',
]
const HF_TEXT_MODELS = [process.env.HF_TEXT_MODEL, ...DEFAULT_HF_TEXT_MODELS]
  .filter((value, index, list) => Boolean(value) && list.indexOf(value) === index)

const SERVER_HF_TOKENS = [
  process.env.HF_TOKEN_1,
  process.env.HF_TOKEN_2,
  process.env.HF_TOKEN_3,
].filter(Boolean)
let hfTokenIndex = 0

const orderedHfTokens = (personalToken = '') => {
  if (personalToken) return [personalToken]
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

const refundDailyRequest = async (token) => {
  if (!token) return
  try {
    await supabaseRequest('/rest/v1/rpc/refund_dragon_arena_daily_request', token, { method: 'POST', body: '{}' })
  } catch (error) {
    console.error('Dragon Arena quota refund failed', error)
  }
}

const callHfGameMaster = async ({ hfToken, model, instructions, input }) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 18000)
  try {
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: instructions },
          { role: 'user', content: input },
        ],
        temperature: 0.9,
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
    const content = data?.choices?.[0]?.message?.content
    const parsed = parseReply(content)
    if (!parsed.narrative) throw new Error(`HF_EMPTY_REPLY ${model}`)
    return { parsed, model: data?.model || model }
  } finally {
    clearTimeout(timeout)
  }
}

const callPersonalOpenRouter = async ({ apiKey, instructions, input }) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 18000)
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.VITE_APP_URL || 'https://www.sstoken.space',
        'X-OpenRouter-Title': process.env.VITE_APP_NAME || 'AppForge Dragon Arena',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openrouter/free',
        messages: [
          { role: 'system', content: instructions },
          { role: 'user', content: input },
        ],
        temperature: 0.9,
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

const localFallback = ({ action, turn }) => {
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
  return {
    parsed: {
      narrative: `You ${clean.charAt(0).toLowerCase()}${clean.slice(1)}. ${motif}\n\n${consequence}`,
      choices: ['Inspect rune', 'Push forward', 'Hold and listen'],
    },
    model: 'appforge/local-continuity-fallback',
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const token = getBearer(req)
  const user = await authenticate(token)
  const guestMode = !user?.id && String(req.headers?.['x-appforge-guest'] || '') === 'dragon-arena'
  if (!user?.id && !guestMode) return res.status(401).json({ error: 'Sign in to use Dragon Arena.' })

  const personalOpenRouterKey = String(req.headers?.['x-openrouter-key'] || '').trim()
  const usingPersonalOpenRouter = Boolean(personalOpenRouterKey.startsWith('sk-or-')) && !guestMode
  const personalHfHeader = String(req.headers?.['x-hf-token'] || '').trim()
  const personalHfToken = personalHfHeader.startsWith('hf_') ? personalHfHeader : ''
  const hfTokens = orderedHfTokens(personalHfToken)

  const { action, history = [], turn = 1 } = req.body || {}
  if (typeof action !== 'string' || action.trim().length < 2) return res.status(400).json({ error: 'Choose or enter a meaningful action first.' })

  let reserved = guestMode
  if (!guestMode) {
    try {
      reserved = usingPersonalOpenRouter || Boolean(personalHfToken) || await consumeDailyRequest(token)
      if (!reserved) return res.status(429).json({ error: 'Your Dragon Arena AI turn for today has already been used. Come back after 00:00 UTC or use a personal provider key.' })
    } catch (error) {
      console.error('Dragon Arena quota check failed', error)
      return res.status(503).json({ error: 'Could not verify today’s Dragon Arena allowance.' })
    }
  }

  const recent = Array.isArray(history)
    ? history.slice(-6).map((entry) => `${entry?.role === 'player' ? 'PLAYER' : 'GAME MASTER'}: ${String(entry?.text || '').slice(0, 700)}`).join('\n')
    : ''

  const instructions = `You are the Game Master for WildDragons.ai Dragon Arena, a fast, choice-driven fantasy adventure. React directly to the player's latest action and preserve continuity. Each turn must create one clear consequence, discovery, danger, reward, or twist. Never decide the player's next action. Keep recurring runes, creatures, locations, costs, and clues consistent. Write 45-85 words total, split into 2 or 3 short paragraphs. Prefer vivid concrete sentences over lore exposition. Make something change every turn. Then give exactly three distinct action choices, each 2-6 words, starting with a strong verb. Return ONLY valid JSON: {"narrative":"...","choices":["...","...","..."]}. No markdown.`
  const input = `TURN: ${Number(turn) || 1}\nRECENT HISTORY:\n${recent}\n\nLATEST PLAYER ACTION: ${action.trim().slice(0, 700)}`

  let result = null
  let provider = 'huggingface'
  let lastError = null
  const attempts = []

  if (usingPersonalOpenRouter) {
    try {
      result = await callPersonalOpenRouter({ apiKey: personalOpenRouterKey, instructions, input })
      provider = 'openrouter-personal'
    } catch (error) {
      lastError = error
      attempts.push({ provider: 'openrouter-personal', status: 'failed' })
    }
  }

  if (!result && hfTokens.length) {
    for (let tokenIndex = 0; tokenIndex < hfTokens.length && !result; tokenIndex += 1) {
      const hfToken = hfTokens[tokenIndex]
      for (const model of HF_TEXT_MODELS) {
        try {
          result = await callHfGameMaster({ hfToken, model, instructions, input })
          provider = personalHfToken ? 'huggingface-personal' : 'huggingface'
          attempts.push({ model, status: 'ok' })
          break
        } catch (error) {
          lastError = error
          attempts.push({ model, status: 'failed', code: Number(error?.status) || undefined })
        }
      }
    }
  }

  if (!result) {
    console.error('Dragon Arena provider rotation exhausted; using local fallback', lastError, attempts)
    result = localFallback({ action, turn })
    provider = 'local-fallback'
  }

  return res.status(200).json({
    narrative: result.parsed.narrative,
    choices: result.parsed.choices.length === 3 ? result.parsed.choices : ['Trace the rune', 'Advance carefully', 'Hold and listen'],
    model: result.model,
    provider,
    degraded: provider === 'local-fallback',
    dailyRequestUsed: true,
    personalKeyUsed: usingPersonalOpenRouter || Boolean(personalHfToken),
    guestMode,
    resetAt: '00:00 UTC',
  })
}
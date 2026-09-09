const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_b56EltHyMfwOQjVQcQFHwA_VUiSn9zN'

const DEFAULT_HF_TEXT_MODELS = [
  'Qwen/Qwen2.5-7B-Instruct-1M:cheapest',
  'google/gemma-2-2b-it:cheapest',
  'openai/gpt-oss-120b:cheapest',
]
const HF_TEXT_MODELS = [process.env.HF_TEXT_MODEL, ...DEFAULT_HF_TEXT_MODELS]
  .filter((value, index, list) => Boolean(value) && list.indexOf(value) === index)

const HF_TOKENS = [
  process.env.HF_TOKEN_1,
  process.env.HF_TOKEN_2,
  process.env.HF_TOKEN_3,
].filter(Boolean)
let hfTokenIndex = 0

const orderedHfTokens = () => {
  if (!HF_TOKENS.length) return []
  const start = hfTokenIndex % HF_TOKENS.length
  hfTokenIndex += 1
  return HF_TOKENS.map((_, offset) => HF_TOKENS[(start + offset) % HF_TOKENS.length])
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
  const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
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
      temperature: 0.8,
      max_tokens: 650,
    }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = data?.error?.message || data?.error || `HTTP ${response.status}`
    throw new Error(`HF_${response.status} ${model}: ${String(detail).slice(0, 180)}`)
  }
  const content = data?.choices?.[0]?.message?.content
  const parsed = parseReply(content)
  if (!parsed.narrative) throw new Error(`HF_EMPTY_REPLY ${model}`)
  return { parsed, model: data?.model || model }
}

const callPersonalOpenRouter = async ({ apiKey, instructions, input }) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
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
      temperature: 0.8,
      max_tokens: 650,
    }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error?.message || `OpenRouter HTTP ${response.status}`)
  const parsed = parseReply(data?.choices?.[0]?.message?.content)
  if (!parsed.narrative) throw new Error('OpenRouter returned an empty turn.')
  return { parsed, model: data?.model || 'openrouter/free' }
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

  const personalKey = String(req.headers?.['x-openrouter-key'] || '').trim()
  const usingPersonalKey = Boolean(personalKey.startsWith('sk-or-')) && !guestMode
  const hfTokens = orderedHfTokens()
  if (!usingPersonalKey && !hfTokens.length) {
    return res.status(503).json({ error: 'Dragon Arena is offline until a Hugging Face token is configured.' })
  }

  const { action, history = [], turn = 1 } = req.body || {}
  if (typeof action !== 'string' || action.trim().length < 2) return res.status(400).json({ error: 'Choose or enter a meaningful action first.' })

  let reserved = guestMode
  if (!guestMode) {
    try {
      reserved = usingPersonalKey || await consumeDailyRequest(token)
      if (!reserved) return res.status(429).json({ error: 'Your Dragon Arena AI turn for today has already been used. Come back after 00:00 UTC.' })
    } catch (error) {
      console.error('Dragon Arena quota check failed', error)
      return res.status(503).json({ error: 'Could not verify today’s Dragon Arena allowance.' })
    }
  }

  const recent = Array.isArray(history)
    ? history.slice(-10).map((entry) => `${entry?.role === 'player' ? 'PLAYER' : 'GAME MASTER'}: ${String(entry?.text || '').slice(0, 1200)}`).join('\n')
    : ''

  const instructions = `You are the Game Master for WildDragons.ai Dragon Arena, a concise turn-based fantasy adventure. Continue from the supplied recent history and react specifically to the player's latest action. Keep continuity, introduce meaningful consequences, and never decide the player's next action for them. The setting is WildDragons Keep and its rune-lit vaults. Treat runes as persistent world objects with names, visual motifs, powers, costs, and consequences that can recur across sessions. Keep the narrative between 70 and 150 words. End with exactly three short, distinct choices. Return ONLY valid JSON with this shape: {"narrative":"...","choices":["...","...","..."]}. Do not use markdown.`
  const input = `TURN: ${Number(turn) || 1}\nRECENT HISTORY:\n${recent}\n\nLATEST PLAYER ACTION: ${action.trim().slice(0, 1200)}`

  try {
    let result = null
    let lastError = null

    if (usingPersonalKey) {
      try {
        result = await callPersonalOpenRouter({ apiKey: personalKey, instructions, input })
      } catch (error) {
        lastError = error
      }
    } else {
      for (const hfToken of hfTokens) {
        for (const model of HF_TEXT_MODELS) {
          try {
            result = await callHfGameMaster({ hfToken, model, instructions, input })
            break
          } catch (error) {
            lastError = error
          }
        }
        if (result) break
      }
    }

    if (!result) {
      if (!guestMode && reserved && !usingPersonalKey) await refundDailyRequest(token)
      console.error('Dragon Arena provider rotation exhausted', lastError)
      return res.status(502).json({ error: 'The AI game master is temporarily unavailable. Your turn was not consumed.' })
    }

    return res.status(200).json({
      narrative: result.parsed.narrative,
      choices: result.parsed.choices.length === 3 ? result.parsed.choices : ['Trace the nearest rune', 'Listen for movement beyond the vault', 'Retreat and study the markings'],
      model: result.model,
      provider: usingPersonalKey ? 'openrouter-personal' : 'huggingface',
      dailyRequestUsed: true,
      personalKeyUsed: usingPersonalKey,
      guestMode,
      resetAt: '00:00 UTC',
    })
  } catch (error) {
    if (reserved && !guestMode && !usingPersonalKey) await refundDailyRequest(token)
    console.error('Dragon Arena request failed', error)
    return res.status(502).json({ error: 'Could not reach the AI game master. Your turn was not consumed.' })
  }
}

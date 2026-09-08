const ALLOWED_MODELS = new Set(['gpt-5.6-sol'])
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_b56EltHyMfwOQjVQcQFHwA_VUiSn9zN'

const extractText = (response) => {
  if (typeof response?.output_text === 'string' && response.output_text.trim()) return response.output_text.trim()
  for (const item of response?.output || []) {
    for (const part of item?.content || []) {
      if (part?.type === 'output_text' && typeof part.text === 'string') return part.text.trim()
    }
  }
  return ''
}

const parseReply = (text) => {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
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
  const response = await supabaseRequest('/rest/v1/rpc/consume_dragon_arena_daily_request', token, {
    method: 'POST',
    body: '{}',
  })
  if (!response.ok) throw new Error('quota_check_failed')
  return response.json().catch(() => false)
}

const refundDailyRequest = async (token) => {
  try {
    await supabaseRequest('/rest/v1/rpc/refund_dragon_arena_daily_request', token, {
      method: 'POST',
      body: '{}',
    })
  } catch (error) {
    console.error('Dragon Arena quota refund failed', error)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Dragon Arena is offline until OPENAI_API_KEY is configured securely on the server.' })

  const token = getBearer(req)
  const user = await authenticate(token)
  if (!user?.id) return res.status(401).json({ error: 'Sign in to use Dragon Arena.' })

  const { model = 'gpt-5.6-sol', action, history = [], turn = 1 } = req.body || {}
  if (!ALLOWED_MODELS.has(model)) return res.status(400).json({ error: 'This model is not enabled for Dragon Arena.' })
  if (typeof action !== 'string' || action.trim().length < 2) return res.status(400).json({ error: 'Choose or enter a meaningful action first.' })

  let reserved = false
  try {
    reserved = await consumeDailyRequest(token)
    if (!reserved) return res.status(429).json({ error: 'Your Dragon Arena AI turn for today has already been used. Come back after 00:00 UTC.' })
  } catch (error) {
    console.error('Dragon Arena quota check failed', error)
    return res.status(503).json({ error: 'Could not verify today’s Dragon Arena allowance.' })
  }

  const recent = Array.isArray(history)
    ? history.slice(-10).map((entry) => `${entry?.role === 'player' ? 'PLAYER' : 'GAME MASTER'}: ${String(entry?.text || '').slice(0, 1200)}`).join('\n')
    : ''

  const instructions = `You are the Game Master for WildDragons.ai Dragon Arena, a concise turn-based fantasy adventure. Continue from the supplied recent history and react specifically to the player's latest action. Keep continuity, introduce meaningful consequences, and never decide the player's next action for them. The setting is WildDragons Keep and its rune-lit vaults. Treat runes as persistent world objects with names, visual motifs, powers, costs, and consequences that can recur across sessions. Keep the narrative between 70 and 150 words. End with exactly three short, distinct choices. Return ONLY valid JSON with this shape: {"narrative":"...","choices":["...","...","..."]}. Do not use markdown.`
  const input = `TURN: ${Number(turn) || 1}\nRECENT HISTORY:\n${recent}\n\nLATEST PLAYER ACTION: ${action.trim().slice(0, 1200)}`

  try {
    const openai = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions,
        input,
        reasoning: { effort: 'medium' },
        max_output_tokens: 650,
        safety_identifier: `dragon-arena-${user.id}`,
      }),
    })

    const data = await openai.json().catch(() => ({}))
    if (!openai.ok) {
      await refundDailyRequest(token)
      console.error('OpenAI Dragon Arena error', openai.status, data?.error?.type || data?.error?.code || 'unknown')
      return res.status(openai.status === 429 ? 429 : 502).json({ error: openai.status === 429 ? 'The AI game master is at its API limit. Your daily turn was not consumed.' : 'The AI game master could not answer. Your daily turn was not consumed.' })
    }

    const parsed = parseReply(extractText(data))
    if (!parsed.narrative) {
      await refundDailyRequest(token)
      return res.status(502).json({ error: 'The AI game master returned an empty turn. Your daily turn was not consumed.' })
    }

    return res.status(200).json({
      narrative: parsed.narrative,
      choices: parsed.choices.length === 3 ? parsed.choices : ['Trace the nearest rune', 'Listen for movement beyond the vault', 'Retreat and study the markings'],
      model,
      dailyRequestUsed: true,
      resetAt: '00:00 UTC',
    })
  } catch (error) {
    if (reserved) await refundDailyRequest(token)
    console.error('Dragon Arena request failed', error)
    return res.status(502).json({ error: 'Could not reach the AI game master. Your daily turn was not consumed.' })
  }
}

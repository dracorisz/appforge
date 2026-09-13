const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

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

const firstJsonObject = (value) => {
  const text = String(value || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try { return JSON.parse(text) } catch { /* continue */ }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch { /* continue */ }
  }
  return null
}

const normalizeChoices = (value) => Array.isArray(value)
  ? value.map((choice) => typeof choice === 'string' ? choice : choice?.label || choice?.action || '').map((choice) => String(choice).trim()).filter(Boolean).slice(0, 3)
  : []

const parseReply = (text) => {
  const raw = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const value = firstJsonObject(raw)
  if (!value || typeof value !== 'object') return { narrative: raw, choices: [], scenePrompt: '' }
  const narrativeValue = value.narrative ?? value.story ?? value.text ?? value.content ?? ''
  const nestedNarrative = narrativeValue && typeof narrativeValue === 'object' ? narrativeValue.text ?? narrativeValue.content ?? '' : narrativeValue
  return {
    narrative: String(nestedNarrative || '').trim(),
    choices: normalizeChoices(value.choices ?? value.actions ?? value.options ?? value.suggested_actions),
    scenePrompt: String(value.scenePrompt ?? value.scene_prompt ?? value.imagePrompt ?? value.image_prompt ?? '').trim(),
  }
}

const getBearer = (req) => {
  const value = req.headers?.authorization || ''
  return value.startsWith('Bearer ') ? value.slice(7).trim() : ''
}
const supabaseRequest = async (path, token, init = {}) => fetch(`${SUPABASE_URL}${path}`, {
  ...init,
  headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
})
const authenticate = async (token) => {
  if (!token) return null
  const response = await supabaseRequest('/auth/v1/user', token)
  return response.ok ? response.json().catch(() => null) : null
}

const callHfGameMaster = async ({ hfToken, model, instructions, input, timeoutMs = 15000 }) => {
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
        temperature: 0.78,
        max_tokens: 520,
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
    if (!parsed.narrative || parsed.narrative.startsWith('{"narrative"')) throw new Error(`HF_INVALID_REPLY ${model}`)
    return { parsed, model: data?.model || model }
  } finally { clearTimeout(timeout) }
}

const localFallback = ({ action, turn, builderMode }) => {
  const clean = action.trim().replace(/\s+/g, ' ').slice(0, 180)
  const turnNo = Math.max(1, Number(turn) || 1)
  const motifs = ['Blue fire crawls across a broken-crown rune.', 'A dragon-carved arch groans and sheds dust.', 'Warm ash-laced wind carries the sound of chains.', 'Three old sigils flare in a warning sequence.']
  const consequences = ['Something in the next chamber notices you.', 'One rune brightens while another dies in payment.', 'A hidden mechanism unlocks beneath your feet.', 'The Keep falls silent, waiting for your move.']
  const motif = motifs[(turnNo + clean.length) % motifs.length]
  const consequence = consequences[(turnNo * 3 + clean.length) % consequences.length]
  const narrative = builderMode === 'comics'
    ? `${motif} You ${clean.charAt(0).toLowerCase()}${clean.slice(1)}. ${consequence}`
    : `You ${clean.charAt(0).toLowerCase()}${clean.slice(1)}. ${motif}\n\n${consequence}`
  return {
    parsed: {
      narrative,
      choices: ['Inspect the rune', 'Advance carefully', 'Hold and listen'],
      scenePrompt: `${motif} A lone adventurer reacts after ${clean.toLowerCase()}, ${consequence.toLowerCase()} cinematic dark fantasy, no text`,
    },
    model: 'appforge/local-continuity-fallback',
  }
}

const promptForMode = (builderMode) => {
  const contract = `You are the Game Master. Maintain causal continuity across the entire session. React to the player's latest action rather than summarizing it. Preserve named characters, relationships, locations, injuries, inventory, promises, clues, threats, costs and unresolved goals from recent context. Every turn must materially change the situation through a consequence, discovery, danger, reward, relationship shift, clue or hard choice. Do not choose for the player. Give exactly three distinct, plausible next actions; none may be synonyms and at least one should be cautious, one proactive and one socially/creatively different when the scene allows it. Also create one concise visual scenePrompt describing the exact resulting moment for image generation: subjects, action, location, mood, composition and important continuity details; never include UI/text/logos. Return ONLY JSON with exactly these keys: {"narrative":"...","choices":["...","...","..."],"scenePrompt":"..."}.`
  if (builderMode === 'comics') return `${contract} This is Comics mode. Narrative: 45-90 words, one visually decisive panel beat, concise dialogue, readable pose/expression/staging/camera. Choices: 2-7 words each. scenePrompt: 35-80 words and panel-ready.`
  return `${contract} This is Novel mode. Narrative: 100-180 words in 2-4 compact paragraphs with character intention, sensory detail, dialogue where useful, tension and forward motion. Avoid lore dumps and generic fantasy filler. Choices: 2-8 words each. scenePrompt: 35-80 words, concrete and visually specific.`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed.' }) }
  const token = getBearer(req)
  const user = await authenticate(token)
  const guestMode = !user?.id && String(req.headers?.['x-appforge-guest'] || '') === 'dragon-arena'
  if (!user?.id && !guestMode) return res.status(401).json({ error: 'Sign in to use Story Studio.' })

  const personalHfHeader = String(req.headers?.['x-hf-tokens'] || req.headers?.['x-hf-token'] || '')
  const personalHfTokens = personalHfHeader.split(',').map((value) => value.trim()).filter((value) => value.startsWith('hf_')).slice(0, 3)
  const hfTokens = orderedHfTokens(personalHfTokens)
  const { action, history = [], turn = 1, builderMode = 'novel', opening = null } = req.body || {}
  const normalizedMode = builderMode === 'comics' ? 'comics' : 'novel'
  if (typeof action !== 'string' || action.trim().length < 2) return res.status(400).json({ error: 'Choose or enter a meaningful action first.' })

  const recent = Array.isArray(history)
    ? history.slice(-12).map((entry) => `${entry?.role === 'player' ? 'PLAYER' : 'GM'}: ${String(entry?.text || '').slice(0, 1100)}`).join('\n')
    : ''
  const openingContext = opening && typeof opening === 'object'
    ? `OPENING / WORLD SEED: ${String(opening.label || '')}\n${String(opening.narrative || '').slice(0, 1400)}`
    : ''
  const instructions = promptForMode(normalizedMode)
  const input = `MODE: ${normalizedMode.toUpperCase()}\nTURN: ${Number(turn) || 1}\n${openingContext}\nRECENT STORY:\n${recent}\n\nLATEST PLAYER ACTION: ${action.trim().slice(0, 900)}`

  let result = null
  let provider = 'huggingface'
  let lastError = null
  const attempts = []
  const deadline = Date.now() + 17_000
  if (hfTokens.length) {
    for (let tokenIndex = 0; tokenIndex < hfTokens.length && !result && Date.now() < deadline; tokenIndex += 1) {
      for (const model of HF_TEXT_MODELS) {
        if (Date.now() >= deadline) break
        try {
          result = await callHfGameMaster({ hfToken: hfTokens[tokenIndex], model, instructions, input, timeoutMs: Math.max(1000, Math.min(7000, deadline - Date.now())) })
          provider = personalHfTokens.length ? 'huggingface-personal' : 'huggingface'
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
    console.warn('Story Studio HF rotation unavailable; using continuity fallback', { reason: lastError?.message, attempts })
    result = localFallback({ action, turn, builderMode: normalizedMode })
    provider = 'local-fallback'
  }

  const choices = result.parsed.choices.length >= 3 ? result.parsed.choices.slice(0, 3) : ['Trace the clue', 'Advance carefully', 'Hold and listen']
  const scenePrompt = result.parsed.scenePrompt || `${result.parsed.narrative.slice(0, 500)} Cinematic dark fantasy scene, coherent characters and location, no text or UI.`
  return res.status(200).json({
    narrative: result.parsed.narrative,
    choices,
    actions: choices,
    scenePrompt,
    imagePrompt: scenePrompt,
    model: result.model,
    provider,
    degraded: provider === 'local-fallback',
    personalKeyUsed: provider === 'huggingface-personal',
    guestMode,
    builderMode: normalizedMode,
  })
}

import { createGcpBridgeCredentials, getGcpBridgeConfig } from './_gcp-cloud-run.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || ''
const MODEL = process.env.COMPANION_VERTEX_MODEL || 'gemini-2.5-flash'
const LOCATION = process.env.COMPANION_VERTEX_LOCATION || 'us-central1'
const OWNER_EMAIL = (process.env.COMPANION_OWNER_EMAIL || 'dracorisz@gmail.com').trim().toLowerCase()
const MAX_MESSAGES = 24
const MAX_MESSAGE_CHARS = 4000
const MAX_TOTAL_CHARS = 18000

const getBearer = (req) => {
  const value = req.headers?.authorization || ''
  return value.startsWith('Bearer ') ? value.slice(7).trim() : ''
}

const authenticate = async (token) => {
  if (!token || !SUPABASE_KEY) return null
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  })
  return response.ok ? response.json().catch(() => null) : null
}

const normalizeMessages = (value) => {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_MESSAGES) return null
  let total = 0
  const messages = []
  for (const item of value) {
    if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') return null
    const content = item.content.trim()
    if (!content || content.length > MAX_MESSAGE_CHARS) return null
    total += content.length
    if (total > MAX_TOTAL_CHARS) return null
    messages.push({ role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: content }] })
  }
  if (messages[messages.length - 1]?.role !== 'user') return null
  return messages
}

export default async function handler(req, res) {
  const requestId = crypto.randomUUID()
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('x-appforge-request-id', requestId)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.', requestId })
  }

  const token = getBearer(req)
  const user = await authenticate(token).catch(() => null)
  if (!user?.id) return res.status(401).json({ message: 'Sign in to use Companion.', requestId })
  if (String(user.email || '').trim().toLowerCase() !== OWNER_EMAIL) return res.status(403).json({ message: 'Companion is currently restricted to its owner.', requestId })

  const messages = normalizeMessages(req.body?.messages)
  if (!messages) return res.status(400).json({ message: 'Messages are invalid or exceed Companion limits.', requestId })

  const config = getGcpBridgeConfig()
  if (!config.configured) return res.status(503).json({ message: 'Google Cloud identity is not configured for Companion.', requestId })

  try {
    const { accessToken } = await createGcpBridgeCredentials()
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${encodeURIComponent(config.projectNumber)}/locations/${encodeURIComponent(LOCATION)}/publishers/google/models/${encodeURIComponent(MODEL)}:generateContent`
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'You are Companion, a careful AI development assistant working inside AppForge. Help the signed-in developer understand, plan, and implement software changes. Be honest about which tools and repositories you can access. Do not claim to have inspected files or executed actions unless tool results prove it. Prefer small, testable steps. Never ask for secrets or expose credentials. At this stage you have chat only; GitHub, Vercel and Supabase actions are not connected yet. Do not pretend otherwise.' }] },
        contents: messages,
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
      }),
      signal: AbortSignal.timeout(22000),
    })
    if (!response.ok) {
      console.warn('Companion Vertex request failed', { requestId, status: response.status, model: MODEL })
      return res.status(response.status === 429 ? 429 : 502).json({ message: response.status === 429 ? 'Companion has reached the current model quota. Try again shortly.' : 'Google Cloud could not complete the request. Check Vertex AI access and model availability.', requestId })
    }
    const payload = await response.json()
    const candidate = payload?.candidates?.[0]
    const text = (candidate?.content?.parts || []).filter((part) => !part.thought).map((part) => part.text || '').join('').trim()
    if (!text) return res.status(502).json({ message: 'Google Cloud returned no usable text. Try a shorter request.', requestId })
    return res.status(200).json({ text, model: MODEL, provider: 'vertex-ai', requestId })
  } catch (error) {
    const code = String(error?.message || '')
    console.warn('Companion request unavailable', { requestId, reason: code.slice(0, 100) })
    return res.status(503).json({ message: 'Companion is temporarily unavailable. Check Google Cloud identity, Vertex AI API enablement and quota.', requestId })
  }
}

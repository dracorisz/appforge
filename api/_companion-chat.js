import { createGcpBridgeCredentials, getGcpBridgeConfig } from './_gcp-cloud-run.js'
import { authenticateCompanionRequest } from './_companion-auth.js'

const MODEL = process.env.COMPANION_VERTEX_MODEL || 'gemini-2.5-flash'
const LOCATION = process.env.COMPANION_VERTEX_LOCATION || 'us-central1'
const MAX_MESSAGES = 24
const MAX_MESSAGE_CHARS = 4000
const MAX_TOTAL_CHARS = 18000

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

  const auth = await authenticateCompanionRequest(req)
  if (!auth.ok) return res.status(auth.status).json({ message: auth.message, requestId })

  const messages = normalizeMessages(req.body?.messages)
  if (!messages) return res.status(400).json({ message: 'Messages are invalid or exceed Companion limits.', requestId })
  const mode = req.body?.mode === 'code' ? 'code' : 'chat'

  const config = getGcpBridgeConfig()
  if (!config.configured) return res.status(503).json({ message: 'Google Cloud identity is not configured for Companion.', requestId })

  try {
    const { accessToken } = await createGcpBridgeCredentials()
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${encodeURIComponent(config.projectNumber)}/locations/${encodeURIComponent(LOCATION)}/publishers/google/models/${encodeURIComponent(MODEL)}:generateContent`
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: mode === 'code' ? 'You are Companion in Code mode, a general-purpose coding and software engineering assistant. Help with coding tasks across the user’s projects, not only AppForge: architecture, debugging, implementation plans, code generation, tests, reviews, security, and deployment reasoning. Prefer concrete, incremental, testable solutions. Format responses with clear Markdown headings, lists, and fenced code blocks when useful. Be honest about capabilities: you have no repository or runtime tools in this chat endpoint, and GitHub, Vercel, and Supabase are currently connection-status checks only. Never claim to have inspected files, run tests, changed a repository, queried a database, or deployed anything unless actual tool results prove it. Never request or expose secrets. Ask a focused question only when an essential detail is missing; otherwise state assumptions and proceed.' : 'You are Companion in Chat mode, a helpful general-purpose assistant for technical and everyday discussion, learning, brainstorming, and planning. Keep the tone clear and natural, and use Markdown formatting when it improves readability. You may discuss software and projects, but do not automatically turn every question into a coding task. Be honest about capabilities: you have no repository or runtime tools in this chat endpoint, and GitHub, Vercel, and Supabase are currently connection-status checks only. Never claim to have inspected files, run code, changed a repository, queried a database, or deployed anything unless actual tool results prove it. Never request or expose secrets.' }] },
        contents: messages,
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
      }),
      signal: AbortSignal.timeout(22000),
    })
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}))
      const providerError = errorPayload?.error || {}
      const providerMessage = String(providerError.message || '').replace(/[\r\n\t]+/g, ' ').slice(0, 240)
      console.warn('Companion Vertex request failed', {
        requestId,
        status: response.status,
        providerStatus: String(providerError.status || '').slice(0, 80),
        providerMessage,
        model: MODEL,
        location: LOCATION,
      })
      const message = response.status === 429
        ? 'Companion has reached the current model quota. Try again shortly.'
        : response.status === 403
          ? 'Vertex AI denied access for the configured Google Cloud identity. Check Vertex AI API enablement and the service account permissions.'
          : 'Google Cloud could not complete the request. Check Vertex AI access and model availability.'
      return res.status(response.status === 429 ? 429 : 502).json({ message, requestId })
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

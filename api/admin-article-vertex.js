import { callCloudWorker, createGcpBridgeCredentials } from './_gcp-cloud-run.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

const getBearer = (req) => {
  const value = String(req.headers?.authorization || '')
  return value.startsWith('Bearer ') ? value.slice(7).trim() : ''
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

const decodePayload = (token) => {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
  } catch { return {} }
}

const verifyAdminAal2 = async (token) => {
  if (!token || decodePayload(token).aal !== 'aal2') return false
  const user = await supabaseRequest('/auth/v1/user', token)
  if (!user.ok) return false
  const admin = await supabaseRequest('/rest/v1/rpc/is_admin', token, { method: 'POST', body: '{}' })
  if (!admin.ok) return false
  return (await admin.json().catch(() => false)) === true
}

const readWorkerText = async ({ config, accessToken, uri }) => {
  const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(String(uri || ''))
  if (!match || match[1] !== config.workerBucket || !match[2].startsWith('outputs/')) throw new Error('unexpected_worker_output')
  const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(match[1])}/o/${encodeURIComponent(match[2])}?alt=media`
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(20_000) })
  if (!response.ok) throw new Error(`worker_output_download_failed_${response.status}`)
  const text = (await response.text()).trim()
  if (!text || text.length > 30000) throw new Error('worker_output_size_invalid')
  return text
}

const extractJson = (text) => {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('vertex_article_invalid_json')
  return JSON.parse(cleaned.slice(start, end + 1))
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const token = getBearer(req)
  if (!(await verifyAdminAal2(token))) return res.status(403).json({ error: 'Admin + TOTP verification required.' })

  const topic = String(req.body?.topic || '').trim()
  const context = String(req.body?.context || '').trim()
  if (topic.length < 4 || topic.length > 600) return res.status(400).json({ error: 'Provide an article topic between 4 and 600 characters.' })
  if (context.length > 2500) return res.status(400).json({ error: 'Article context is limited to 2500 characters.' })

  try {
    const credentials = await createGcpBridgeCredentials()
    const id = `article-${crypto.randomUUID().replace(/-/g, '').slice(0, 28)}`
    const prompt = `You are the editorial assistant for AppForge, an integrated web-tool platform. Draft a concise, factual product article for a broad technical audience. Avoid hype, invented metrics, unsupported claims, and marketing filler. Return JSON only with keys: title, summary, body, app_route, metadata. The body must use Markdown with useful ## section headings. metadata must be an object with app_name, read_time, and published_label.\n\nTopic: ${topic}\n${context ? `Context:\n${context}` : ''}`
    const worker = await callCloudWorker({ config: credentials.config, idToken: credentials.idToken, path: '/v1/jobs', method: 'POST', body: { id, kind: 'story', prompt } })
    const text = await readWorkerText({ config: credentials.config, accessToken: credentials.accessToken, uri: worker.output })
    const article = extractJson(text)
    return res.status(200).json({ ok: true, provider: 'vertex-ai', model: worker.model || 'gemini-2.5-flash-lite', article })
  } catch (error) {
    console.error('admin article Vertex generation failed', error)
    return res.status(502).json({ error: 'Vertex could not draft the article right now.' })
  }
}

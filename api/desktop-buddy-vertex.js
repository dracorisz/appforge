import { callCloudWorker, createGcpBridgeCredentials, downloadPrivateWorkerObject, getGcpBridgeConfig } from './_gcp-cloud-run.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ixqoosixhahrsgwoxyme.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_b56EltHyMfwOQjVQcQFHwA_VUiSn9zN'
const MODEL = 'gemini-3.1-flash-image'
const PROMPT_SUFFIX = 'MANDATORY OUTPUT REQUIREMENT: generate exactly one original cute desktop assistant character as a PNG image with a fully transparent alpha background. The background MUST be transparent, not white, not colored, not a checkerboard, and not a scene. Full body, centered, expressive and readable at small size, clean silhouette, generous transparent padding around the character, no words, logos, captions, UI, watermark, border, floor, scenery, or text. Output MUST be suitable for direct use as a transparent PNG sprite without background-removal cleanup.'

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

const jobPath = (query = '') => `/rest/v1/vertex_bridge_jobs${query}`

const insertJob = async (token, row) => {
  const response = await supabaseRequest(jobPath('?select=*'), token, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row),
  })
  const payload = await response.json().catch(() => [])
  if (!response.ok || !Array.isArray(payload) || !payload[0]) throw new Error('vertex_job_ledger_unavailable')
  return payload[0]
}

const getJob = async (token, id, userId) => {
  const query = `?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`
  const response = await supabaseRequest(jobPath(query), token)
  const payload = await response.json().catch(() => [])
  if (!response.ok) throw new Error('vertex_job_ledger_unavailable')
  return Array.isArray(payload) ? payload[0] || null : null
}

const getJobByClientRequest = async (token, clientRequestId, userId) => {
  const query = `?client_request_id=eq.${encodeURIComponent(clientRequestId)}&user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`
  const response = await supabaseRequest(jobPath(query), token)
  const payload = await response.json().catch(() => [])
  if (!response.ok) throw new Error('vertex_job_ledger_unavailable')
  return Array.isArray(payload) ? payload[0] || null : null
}

const patchJob = async (token, id, userId, patch) => {
  const query = `?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`
  const response = await supabaseRequest(jobPath(query), token, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  })
  if (!response.ok) throw new Error('vertex_job_ledger_unavailable')
}

const toDataUrl = ({ buffer, contentType }) => `data:${contentType};base64,${buffer.toString('base64')}`
const makeWorkerJobId = () => `buddy-${crypto.randomUUID().replace(/-/g, '').slice(0, 28)}`
const validUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))

const publicError = (error) => {
  const code = String(error?.message || 'vertex_bridge_failed')
  if (code === 'gcp_bridge_not_configured') return { status: 503, code, message: 'Vertex AI bridge is not configured on this deployment.' }
  if (code.startsWith('gcp_sts_exchange_failed_') || code.startsWith('gcp_service_account_')) return { status: 503, code: 'gcp_identity_unavailable', message: 'Google workload identity could not be established. Check the production WIF/IAM configuration.' }
  if (code.startsWith('cloud_worker_')) return { status: Number(error?.status) || 502, code, message: error?.publicMessage || 'The private Vertex worker rejected the request.' }
  if (code.startsWith('worker_output_') || code === 'unexpected_worker_output' || code === 'unexpected_worker_output_type') return { status: 502, code: 'vertex_output_unavailable', message: 'Vertex completed but its private output could not be retrieved safely.' }
  if (code === 'vertex_job_ledger_unavailable') return { status: 503, code, message: 'Vertex bridge job storage is unavailable. Apply the latest Supabase migration before enabling Vertex.' }
  return { status: 502, code: 'vertex_bridge_failed', message: 'Vertex AI is temporarily unavailable. No automatic retry was started.' }
}

const recoverOrDownload = async ({ token, user, job, credentials }) => {
  let current = job
  if (current.status !== 'complete' && current.status !== 'failed') {
    const worker = await callCloudWorker({ config: credentials.config, idToken: credentials.idToken, path: `/v1/jobs/${encodeURIComponent(current.worker_job_id)}` })
    const nextStatus = worker.status === 'complete' ? 'complete' : worker.status === 'failed' ? 'failed' : 'running'
    await patchJob(token, current.id, user.id, {
      status: nextStatus,
      output_uri: worker.output || current.output_uri || null,
      model: worker.model || current.model || MODEL,
      error_code: nextStatus === 'failed' ? 'worker_failed' : null,
    })
    current = { ...current, status: nextStatus, output_uri: worker.output || current.output_uri || null, model: worker.model || current.model || MODEL }
  }

  if (current.status === 'failed') return { status: 'failed', model: current.model || MODEL }
  if (current.status !== 'complete' || !current.output_uri) return { status: current.status || 'running', model: current.model || MODEL }

  const image = await downloadPrivateWorkerObject({ config: credentials.config, accessToken: credentials.accessToken, uri: current.output_uri })
  return {
    status: 'complete',
    model: current.model || MODEL,
    mimeType: image.contentType,
    sizeBytes: image.buffer.length,
    imageDataUrl: toDataUrl(image),
  }
}

export default async function handler(req, res) {
  const requestId = crypto.randomUUID()
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('x-appforge-request-id', requestId)

  if (req.method === 'GET' && !req.query?.id) {
    const config = getGcpBridgeConfig()
    return res.status(200).json({ ok: true, provider: 'vertex-ai-private-cloud-run', configured: config.configured, requiresSignIn: true, recoverableJobs: true, model: MODEL, requestId })
  }

  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed.', requestId })
  }

  const token = getBearer(req)
  const user = await authenticate(token)
  if (!user?.id) return res.status(401).json({ error: 'Sign in to use Vertex AI.', requestId })

  let bridgeJobId = null
  let workerJobId = null
  let clientRequestId = null
  try {
    const credentials = await createGcpBridgeCredentials()

    if (req.method === 'GET') {
      const id = String(req.query?.id || '').trim()
      if (!validUuid(id)) return res.status(400).json({ error: 'A valid bridge job ID is required.', requestId })
      const job = await getJob(token, id, user.id)
      if (!job) return res.status(404).json({ error: 'Vertex job not found.', requestId })
      const recovered = await recoverOrDownload({ token, user, job, credentials })
      return res.status(200).json({ ok: true, bridgeJobId: job.id, clientRequestId: job.client_request_id, workerJobId: job.worker_job_id, provider: 'vertex-ai', requestId, ...recovered })
    }

    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : ''
    clientRequestId = String(req.body?.clientRequestId || '').trim()
    if (prompt.length < 8) return res.status(400).json({ error: 'Describe the character you want Vertex AI to create.', requestId })
    if (prompt.length > 900) return res.status(400).json({ error: 'Keep the Vertex character prompt under 900 characters.', requestId })
    if (!validUuid(clientRequestId)) return res.status(400).json({ error: 'A valid client request ID is required for safe Vertex retries.', requestId })

    const existing = await getJobByClientRequest(token, clientRequestId, user.id)
    if (existing) {
      bridgeJobId = existing.id
      workerJobId = existing.worker_job_id
      const recovered = await recoverOrDownload({ token, user, job: existing, credentials })
      return res.status(200).json({ ok: true, idempotentReplay: true, bridgeJobId, clientRequestId, workerJobId, provider: 'vertex-ai', requestId, ...recovered })
    }

    bridgeJobId = crypto.randomUUID()
    workerJobId = makeWorkerJobId()
    await insertJob(token, { id: bridgeJobId, user_id: user.id, client_request_id: clientRequestId, worker_job_id: workerJobId, kind: 'image', status: 'running', model: MODEL })

    let workerCompleted = false
    try {
      const worker = await callCloudWorker({ config: credentials.config, idToken: credentials.idToken, path: '/v1/jobs', method: 'POST', body: { id: workerJobId, kind: 'image', prompt: `${prompt}\n\n${PROMPT_SUFFIX}` } })
      workerCompleted = true
      await patchJob(token, bridgeJobId, user.id, { status: 'complete', output_uri: worker.output, model: worker.model || MODEL, error_code: null })
      const recovered = await recoverOrDownload({ token, user, job: { id: bridgeJobId, user_id: user.id, client_request_id: clientRequestId, worker_job_id: workerJobId, status: 'complete', output_uri: worker.output, model: worker.model || MODEL }, credentials })
      return res.status(200).json({ ok: true, bridgeJobId, clientRequestId, workerJobId, provider: 'vertex-ai', requestId, ...recovered })
    } catch (workerError) {
      const mapped = publicError(workerError)
      const errorName = String(workerError?.name || '').toLowerCase()
      const errorMessage = String(workerError?.message || '').toLowerCase()
      const ambiguousTimeout = errorName.includes('abort') || errorName.includes('timeout') || errorMessage.includes('abort') || errorMessage.includes('timeout')
      // A completed generation remains recoverable even if ledger persistence or
      // downloading its output fails. Transport/5xx failures may also hide success.
      const uncertain = ambiguousTimeout || workerError instanceof TypeError || Number(workerError?.status) >= 500
      await patchJob(token, bridgeJobId, user.id, { status: workerCompleted || uncertain ? 'running' : 'failed', error_code: mapped.code }).catch(() => undefined)
      throw workerError
    }
  } catch (error) {
    const mapped = publicError(error)
    console.error('Desktop Buddy Vertex bridge request failed', { requestId, code: mapped.code, bridgeJobId, clientRequestId })
    return res.status(mapped.status).json({ error: mapped.message, code: mapped.code, requestId, bridgeJobId, clientRequestId, workerJobId })
  }
}

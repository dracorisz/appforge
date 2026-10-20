import { getVercelOidcToken } from '@vercel/oidc'

const CLOUD_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'
const WORKSPACE_AND_CLOUD_SCOPES = [
  CLOUD_SCOPE,
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
]
const STS_URL = 'https://sts.googleapis.com/v1/token'
const IAM_CREDENTIALS_BASE = 'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts'
const MAX_OBJECT_BYTES = 2_500_000

let cachedBridgeAuth = null
let cachedBridgeExpiresAt = 0

let cachedGcpStatus = null
let cachedGcpStatusExpiresAt = 0
const GCP_STATUS_CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes to prevent excessive API calls

const requiredEnv = (name) => String(process.env[name] || '').trim()

export const getGcpBridgeConfig = () => {
  const projectNumber = requiredEnv('GCP_PROJECT_NUMBER')
  const serviceAccountEmail = requiredEnv('GCP_SERVICE_ACCOUNT_EMAIL')
  const poolId = requiredEnv('GCP_WORKLOAD_IDENTITY_POOL_ID')
  const providerId = requiredEnv('GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID')
  const workerUrl = requiredEnv('GCP_CLOUD_WORKER_URL').replace(/\/$/, '')
  const workerBucket = requiredEnv('GCP_WORKER_BUCKET')
  const configured = Boolean(projectNumber && serviceAccountEmail && poolId && providerId && workerUrl && workerBucket)
  const audience = configured
    ? `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`
    : ''
  return { configured, projectNumber, serviceAccountEmail, poolId, providerId, workerUrl, workerBucket, audience }
}

const parseJson = async (response) => response.json().catch(() => ({}))

const exchangeVercelOidc = async (config) => {
  const subjectToken = await getVercelOidcToken()
  if (!subjectToken) throw new Error('vercel_oidc_unavailable')

  const body = new URLSearchParams({
    audience: config.audience,
    grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
    requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    scope: CLOUD_SCOPE,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    subject_token: subjectToken,
  })
  const response = await fetch(STS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(10_000),
  })
  const payload = await parseJson(response)
  if (!response.ok || !payload.access_token) throw new Error(`gcp_sts_exchange_failed_${response.status}`)
  return payload.access_token
}

const generateServiceAccountAccessToken = async (config, federatedToken) => {
  const url = `${IAM_CREDENTIALS_BASE}/${encodeURIComponent(config.serviceAccountEmail)}:generateAccessToken`
  // Request both cloud-platform and Google Workspace readonly scopes (Drive, Docs, Sheets)
  let response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${federatedToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope: WORKSPACE_AND_CLOUD_SCOPES, lifetime: '900s' }),
    signal: AbortSignal.timeout(10_000),
  })
  let payload = await parseJson(response)
  if (!response.ok || !payload.accessToken) {
    // Fallback to cloud-platform scope if extended scopes are rejected
    response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${federatedToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: [CLOUD_SCOPE], lifetime: '900s' }),
      signal: AbortSignal.timeout(10_000),
    })
    payload = await parseJson(response)
    if (!response.ok || !payload.accessToken) {
      throw new Error(`gcp_service_account_access_token_failed_${response.status}`)
    }
  }
  return payload.accessToken
}

const generateServiceAccountIdToken = async (config, federatedToken) => {
  const url = `${IAM_CREDENTIALS_BASE}/${encodeURIComponent(config.serviceAccountEmail)}:generateIdToken`
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${federatedToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ audience: config.workerUrl, includeEmail: true }),
    signal: AbortSignal.timeout(10_000),
  })
  const payload = await parseJson(response)
  if (!response.ok || !payload.token) throw new Error(`gcp_service_account_id_token_failed_${response.status}`)
  return payload.token
}

export const createGcpBridgeCredentials = async () => {
  const config = getGcpBridgeConfig()
  if (!config.configured) throw new Error('gcp_bridge_not_configured')
  if (cachedBridgeAuth && Date.now() < cachedBridgeExpiresAt) {
    return { config, ...cachedBridgeAuth }
  }
  const federatedToken = await exchangeVercelOidc(config)
  const [accessToken, idToken] = await Promise.all([
    generateServiceAccountAccessToken(config, federatedToken),
    generateServiceAccountIdToken(config, federatedToken),
  ])
  cachedBridgeAuth = { accessToken, idToken }
  cachedBridgeExpiresAt = Date.now() + 10 * 60 * 1000 // Cache for 10 minutes (lifetime is 15m)
  return { config, accessToken, idToken }
}

/**
 * Cached Google Cloud & Vertex AI status check (15-minute TTL) so budget/quota telemetry
 * reflects live Google Cloud state without making excessive API calls.
 */
export async function getCachedGcpQuotaAndBillingStatus({ forceRefresh = false, fetchImpl = fetch } = {}) {
  const config = getGcpBridgeConfig()
  if (!config.configured) {
    return {
      configured: false,
      vertexApiState: 'unconfigured',
      serviceAccountEmail: null,
      projectNumber: null,
      checkedAt: new Date().toISOString(),
      cacheTtlMinutes: 15,
    }
  }

  if (!forceRefresh && cachedGcpStatus && Date.now() < cachedGcpStatusExpiresAt) {
    return { ...cachedGcpStatus, fromCache: true }
  }

  try {
    const { accessToken } = await createGcpBridgeCredentials()
    const svcUrl = `https://serviceusage.googleapis.com/v1/projects/${encodeURIComponent(config.projectNumber)}/services/aiplatform.googleapis.com`
    const svcRes = await fetchImpl(svcUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(6000),
    }).catch(() => null)
    const svcData = svcRes && svcRes.ok ? await svcRes.json().catch(() => ({})) : {}

    const statusObj = {
      configured: true,
      projectNumber: config.projectNumber,
      serviceAccountEmail: config.serviceAccountEmail,
      vertexApiState: svcData.state || 'ENABLED',
      workspaceScopesIncluded: true,
      checkedAt: new Date().toISOString(),
      cacheTtlMinutes: 15,
      fromCache: false,
    }
    cachedGcpStatus = statusObj
    cachedGcpStatusExpiresAt = Date.now() + GCP_STATUS_CACHE_TTL_MS
    return statusObj
  } catch {
    const fallbackObj = {
      configured: true,
      projectNumber: config.projectNumber,
      serviceAccountEmail: config.serviceAccountEmail,
      vertexApiState: 'CONFIGURED',
      workspaceScopesIncluded: true,
      checkedAt: new Date().toISOString(),
      cacheTtlMinutes: 15,
      fromCache: false,
    }
    cachedGcpStatus = fallbackObj
    cachedGcpStatusExpiresAt = Date.now() + 5 * 60 * 1000
    return fallbackObj
  }
}

export const callCloudWorker = async ({ config, idToken, path, method = 'GET', body }) => {
  const response = await fetch(`${config.workerUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${idToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(75_000),
  })
  const payload = await parseJson(response)
  if (!response.ok) {
    const error = new Error(`cloud_worker_${response.status}`)
    error.status = response.status
    error.publicMessage = String(payload.error || 'Vertex worker request failed.')
    throw error
  }
  return payload
}

export const downloadPrivateWorkerObject = async ({ config, accessToken, uri }) => {
  const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(String(uri || ''))
  if (!match || match[1] !== config.workerBucket || !match[2].startsWith('outputs/')) throw new Error('unexpected_worker_output')
  const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(match[1])}/o/${encodeURIComponent(match[2])}?alt=media`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`worker_output_download_failed_${response.status}`)
  const contentType = String(response.headers.get('content-type') || '').split(';')[0]
  if (!['image/webp', 'image/png', 'image/jpeg'].includes(contentType)) throw new Error('unexpected_worker_output_type')
  const buffer = Buffer.from(await response.arrayBuffer())
  if (!buffer.length || buffer.length > MAX_OBJECT_BYTES) throw new Error('worker_output_size_invalid')
  return { buffer, contentType }
}

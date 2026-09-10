import { getVercelOidcToken } from '@vercel/oidc'

const CLOUD_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'
const STS_URL = 'https://sts.googleapis.com/v1/token'
const IAM_CREDENTIALS_BASE = 'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts'
const MAX_OBJECT_BYTES = 2_500_000

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
    ? `https://iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`
    : ''
  return { configured, projectNumber, serviceAccountEmail, poolId, providerId, workerUrl, workerBucket, audience }
}

const parseJson = async (response) => response.json().catch(() => ({}))

const exchangeVercelOidc = async (config) => {
  const subjectToken = await getVercelOidcToken({ audience: config.audience })
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
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${federatedToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope: [CLOUD_SCOPE], lifetime: '900s' }),
    signal: AbortSignal.timeout(10_000),
  })
  const payload = await parseJson(response)
  if (!response.ok || !payload.accessToken) throw new Error(`gcp_service_account_access_token_failed_${response.status}`)
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
  const federatedToken = await exchangeVercelOidc(config)
  const [accessToken, idToken] = await Promise.all([
    generateServiceAccountAccessToken(config, federatedToken),
    generateServiceAccountIdToken(config, federatedToken),
  ])
  return { config, accessToken, idToken }
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

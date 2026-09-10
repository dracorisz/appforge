import assert from 'node:assert/strict'
import test from 'node:test'
import handler from '../api/desktop-buddy-vertex.js'
import { getGcpBridgeConfig } from '../api/_gcp-cloud-run.js'

const makeRes = () => {
  const headers = new Map()
  return {
    statusCode: 200,
    body: null,
    setHeader(name, value) { headers.set(String(name).toLowerCase(), value) },
    status(code) { this.statusCode = code; return this },
    json(value) { this.body = value; return this },
    getHeader(name) { return headers.get(String(name).toLowerCase()) },
  }
}

const bridgeEnvNames = [
  'GCP_PROJECT_NUMBER',
  'GCP_SERVICE_ACCOUNT_EMAIL',
  'GCP_WORKLOAD_IDENTITY_POOL_ID',
  'GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID',
  'GCP_CLOUD_WORKER_URL',
  'GCP_WORKER_BUCKET',
]

const withBridgeEnv = async (values, fn) => {
  const previous = Object.fromEntries(bridgeEnvNames.map((name) => [name, process.env[name]]))
  try {
    for (const name of bridgeEnvNames) {
      if (values[name] === undefined) delete process.env[name]
      else process.env[name] = values[name]
    }
    await fn()
  } finally {
    for (const name of bridgeEnvNames) {
      if (previous[name] === undefined) delete process.env[name]
      else process.env[name] = previous[name]
    }
  }
}

test('Vertex bridge status is safely disabled when server WIF configuration is absent', async () => {
  await withBridgeEnv({}, async () => {
    const res = makeRes()
    await handler({ method: 'GET', query: {}, headers: {} }, res)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.configured, false)
    assert.equal(res.body.requiresSignIn, true)
    assert.equal(res.body.recoverableJobs, true)
    assert.equal(res.getHeader('cache-control'), 'no-store')
  })
})

test('bridge configuration exposes only readiness while composing the expected Google audience internally', async () => {
  await withBridgeEnv({
    GCP_PROJECT_NUMBER: '123456789',
    GCP_SERVICE_ACCOUNT_EMAIL: 'appforge-vercel-bridge@example.iam.gserviceaccount.com',
    GCP_WORKLOAD_IDENTITY_POOL_ID: 'vercel-prod',
    GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID: 'vercel',
    GCP_CLOUD_WORKER_URL: 'https://worker.example.run.app/',
    GCP_WORKER_BUCKET: 'example-bucket',
  }, async () => {
    const config = getGcpBridgeConfig()
    assert.equal(config.configured, true)
    assert.equal(config.workerUrl, 'https://worker.example.run.app')
    assert.equal(config.audience, 'https://iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/vercel-prod/providers/vercel')
  })
})

test('Vertex POST rejects unauthenticated callers before attempting Google identity exchange', async () => {
  const res = makeRes()
  await handler({ method: 'POST', query: {}, headers: {}, body: { prompt: 'friendly dragon', clientRequestId: crypto.randomUUID() } }, res)
  assert.equal(res.statusCode, 401)
  assert.match(res.body.error, /sign in/i)
})

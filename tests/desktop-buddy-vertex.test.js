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
    assert.equal(config.audience, '//iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/vercel-prod/providers/vercel')
  })
})

test('Vertex POST rejects unauthenticated callers before attempting Google identity exchange', async () => {
  const res = makeRes()
  await handler({ method: 'POST', query: {}, headers: {}, body: { prompt: 'friendly dragon', clientRequestId: crypto.randomUUID() } }, res)
  assert.equal(res.statusCode, 401)
  assert.match(res.body.error, /sign in/i)
})

for (const failure of ['download', 'transport', 'upstream']) {
  test(`Vertex recovers the original paid job after ${failure} failure`, async () => {
    const originalFetch = globalThis.fetch
    const originalOidc = process.env.VERCEL_OIDC_TOKEN
    const jwtPart = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
    process.env.VERCEL_OIDC_TOKEN = `${jwtPart({ alg: 'RS256' })}.${jwtPart({ exp: Math.floor(Date.now() / 1000) + 3600, aud: 'https://vercel.com/dracorisz-projects' })}.test`
    const clientRequestId = crypto.randomUUID()
    const userId = crypto.randomUUID()
    let row
    let generations = 0
    let downloads = 0
    const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })
    globalThis.fetch = async (url, init = {}) => {
      url = String(url)
      if (url.endsWith('/auth/v1/user')) return json({ id: userId })
      if (url === 'https://sts.googleapis.com/v1/token') {
        assert.equal(init.body.get('subject_token'), process.env.VERCEL_OIDC_TOKEN)
        assert.match(init.body.get('audience'), /workloadIdentityPools\/vercel-production\/providers\/vercel$/)
        return json({ access_token: 'federated' })
      }
      if (url.endsWith(':generateAccessToken')) return json({ accessToken: 'access' })
      if (url.endsWith(':generateIdToken')) return json({ token: 'id' })
      if (url.includes('/rest/v1/vertex_bridge_jobs')) {
        if (init.method === 'POST') { row = JSON.parse(init.body); return json([row]) }
        if (init.method === 'PATCH') { Object.assign(row, JSON.parse(init.body)); return new Response(null, { status: 204 }) }
        return json(row ? [row] : [])
      }
      if (url === 'https://worker.example.run.app/v1/jobs') {
        generations++
        if (failure === 'transport') throw new TypeError('fetch failed')
        if (failure === 'upstream') return json({ error: 'Temporarily unavailable' }, 503)
        return json({ status: 'complete', output: 'gs://example-bucket/outputs/buddy.webp' })
      }
      if (url.startsWith('https://worker.example.run.app/v1/jobs/')) return json({ status: 'complete', output: 'gs://example-bucket/outputs/buddy.webp' })
      if (url.startsWith('https://storage.googleapis.com/')) {
        downloads++
        if (failure === 'download' && downloads === 1) return json({}, 503)
        return new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/webp' } })
      }
      throw new Error(`Unexpected request: ${url}`)
    }
    try {
      await withBridgeEnv({
        GCP_PROJECT_NUMBER: '136413445697',
        GCP_SERVICE_ACCOUNT_EMAIL: 'vercel-worker-invoker@wild-dragons.iam.gserviceaccount.com',
        GCP_WORKLOAD_IDENTITY_POOL_ID: 'vercel-production',
        GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID: 'vercel',
        GCP_CLOUD_WORKER_URL: 'https://worker.example.run.app',
        GCP_WORKER_BUCKET: 'example-bucket',
      }, async () => {
        const req = { method: 'POST', query: {}, headers: { authorization: 'Bearer user-token' }, body: { prompt: 'friendly dragon character', clientRequestId } }
        const first = makeRes()
        await handler(req, first)
        assert.ok(first.statusCode >= 500)
        assert.equal(row.status, 'running')
        const recovered = makeRes()
        await handler(req, recovered)
        assert.equal(recovered.statusCode, 200)
        assert.equal(recovered.body.status, 'complete')
        assert.equal(recovered.body.idempotentReplay, true)
        assert.equal(generations, 1, 'Recovery must never generate or charge again')
      })
    } finally {
      globalThis.fetch = originalFetch
      if (originalOidc === undefined) delete process.env.VERCEL_OIDC_TOKEN
      else process.env.VERCEL_OIDC_TOKEN = originalOidc
    }
  })
}

import test from 'node:test'
import assert from 'node:assert/strict'

process.env.SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key'
process.env.COMPANION_OWNER_EMAIL = 'owner@example.com'
delete process.env.GITHUB_TOKEN
delete process.env.VERCEL_API_TOKEN
delete process.env.SUPABASE_ACCESS_TOKEN

const { default: handler } = await import('../api/_companion-integrations.js')

const makeResponse = () => ({
  statusCode: 200,
  headers: {},
  body: null,
  setHeader(name, value) { this.headers[name] = value },
  status(code) { this.statusCode = code; return this },
  json(value) { this.body = value; return this },
})

test('integration status rejects methods other than GET', async () => {
  const res = makeResponse()
  await handler({ method: 'POST', headers: {} }, res)
  assert.equal(res.statusCode, 405)
  assert.equal(res.headers.Allow, 'GET')
})

test('integration status requires an authenticated owner', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ id: 'other-user', email: 'other@example.com' }), { status: 200 })
  try {
    const res = makeResponse()
    await handler({ method: 'GET', headers: { authorization: 'Bearer test-session' } }, res)
    assert.equal(res.statusCode, 403)
    assert.match(res.body.message, /restricted to its owner/i)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('integration status reports missing provider credentials without exposing secrets', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(JSON.stringify({ id: 'owner-user', email: 'owner@example.com' }), { status: 200 })
  try {
    const res = makeResponse()
    await handler({ method: 'GET', headers: { authorization: 'Bearer test-session' } }, res)
    assert.equal(res.statusCode, 200)
    assert.deepEqual(
      Object.fromEntries(Object.entries(res.body.integrations).map(([name, item]) => [name, item.status])),
      { github: 'needs_setup', vercel: 'needs_setup', supabase: 'needs_setup' },
    )
    assert.equal(JSON.stringify(res.body).includes('test-publishable-key'), false)
  } finally {
    globalThis.fetch = originalFetch
  }
})

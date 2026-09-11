import assert from 'node:assert/strict'
import test from 'node:test'
import handler from '../api/desktop-buddy-image.js'

const responseStub = () => ({
  headers: {}, statusCode: 200, body: null,
  setHeader(name, value) { this.headers[name] = value },
  status(code) { this.statusCode = code; return this },
  json(value) { this.body = value; return this },
})

test('Desktop Buddy provider status is read-only and reports shared HF configuration', async (t) => {
  const previous = [process.env.HF_TOKEN_1, process.env.HF_TOKEN_2, process.env.HF_TOKEN_3]
  process.env.HF_TOKEN_1 = 'hf_status_test'
  delete process.env.HF_TOKEN_2
  delete process.env.HF_TOKEN_3
  t.after(() => {
    const keys = ['HF_TOKEN_1', 'HF_TOKEN_2', 'HF_TOKEN_3']
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key]
      else process.env[key] = previous[index]
    })
  })

  const res = responseStub()
  await handler({ method: 'GET', headers: {} }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.ok, true)
  assert.equal(res.body.configured, true)
  assert.equal(res.body.provider, 'huggingface-inference-providers')
  assert.equal(res.body.personalTokenSupported, true)
})

test('Desktop Buddy provider status does not require authentication', async () => {
  const res = responseStub()
  await handler({ method: 'GET', headers: {} }, res)
  assert.equal(res.statusCode, 200)
  assert.equal(typeof res.body.configured, 'boolean')
  assert.ok(res.body.requestId)
})

test('Desktop Buddy generation POST rejects missing bearer auth before provider work', async (t) => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  globalThis.fetch = async () => { throw new Error('network should not be reached without auth') }

  const res = responseStub()
  await handler({ method: 'POST', headers: {}, body: { prompt: 'A friendly dragon assistant' } }, res)
  assert.equal(res.statusCode, 401)
  assert.match(res.body.error, /sign in/i)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { generateGeminiText } from '../api/_gemini.js'
import handler from '../api/ai-game.js'

const reply = { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ narrative: 'The rune opens a hidden door.', choices: ['Enter the doorway', 'Inspect the rune', 'Call for help'] }) }] } }] }

test('Gemini sends key in header, bounds output, and requests JSON', async () => {
  const result = await generateGeminiText({ apiKey: 'test-secret', instructions: 'director', input: 'open door', json: true,
    fetchImpl: async (url, init) => {
      assert.ok(!url.includes('test-secret'))
      assert.equal(init.headers['x-goog-api-key'], 'test-secret')
      const body = JSON.parse(init.body)
      assert.equal(body.generationConfig.responseMimeType, 'application/json')
      assert.equal(body.generationConfig.maxOutputTokens, 768)
      return Response.json(reply)
    } })
  assert.match(result.text, /hidden door/)
})

test('Gemini rejects rate limits without leaking upstream errors or keys', async () => {
  await assert.rejects(generateGeminiText({ apiKey: 'secret', instructions: '', input: '', fetchImpl: async () => Response.json({ error: 'secret' }, { status: 429 }) }), { message: 'Gemini HTTP 429' })
})

test('Gemini rejects empty, blocked and truncated output', async () => {
  for (const data of [{}, { candidates: [{ finishReason: 'SAFETY' }] }, { candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'partial' }] } }] }]) {
    await assert.rejects(generateGeminiText({ apiKey: 'secret', instructions: '', input: '', fetchImpl: async () => Response.json(data) }))
  }
})

test('Story Studio Gemini respects personal keys, shared quota and guests', async (t) => {
  const oldFetch = globalThis.fetch
  const oldKey = process.env.GEMINI_API_KEY
  const oldError = console.error
  console.error = () => {}
  process.env.GEMINI_API_KEY = 'server-secret'
  t.after(() => { globalThis.fetch = oldFetch; console.error = oldError; if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey })
  for (const scenario of [
    { personal: true, quota: false, provider: 'gemini-personal' },
    { personal: false, quota: true, provider: 'gemini' },
    { personal: false, quota: false, provider: 'local-fallback' },
    { guest: true, quota: true, provider: 'local-fallback' },
    { personal: true, quota: false, failed: true, provider: 'local-fallback' },
  ]) {
    let googleCalls = 0
    globalThis.fetch = async (url, init) => {
      if (url.includes('/auth/v1/user')) return Response.json({ id: 'user-1' })
      if (url.includes('consume_dragon_arena_daily_request')) return Response.json(scenario.quota)
      if (url.includes('generativelanguage.googleapis.com')) {
        googleCalls++
        assert.equal(init.headers['x-goog-api-key'], scenario.personal ? 'personal-secret' : 'server-secret')
        return scenario.failed ? Response.json({}, { status: 429 }) : Response.json(reply)
      }
      return Response.json({}, { status: 503 })
    }
    let output
    await handler({ method: 'POST', headers: scenario.guest ? { 'x-appforge-guest': 'dragon-arena' } : { authorization: 'Bearer session', ...(scenario.personal ? { 'x-gemini-key': 'personal-secret' } : {}) }, body: { action: 'Open the door' } }, {
      status() { return this }, json(value) { output = value }, setHeader() {},
    })
    assert.equal(output.provider, scenario.provider)
    assert.equal(googleCalls, scenario.guest || (!scenario.personal && !scenario.quota) ? 0 : 1)
    assert.equal(output.personalKeyUsed, scenario.provider === 'gemini-personal')
  }
})

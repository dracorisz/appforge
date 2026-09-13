import test from 'node:test'
import assert from 'node:assert/strict'
import { generateGeminiText } from '../api/_gemini.js'

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

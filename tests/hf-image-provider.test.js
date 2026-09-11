import assert from 'node:assert/strict'
import test from 'node:test'
import { generateHfImage, orderedHfTokens, parsePersonalHfTokens } from '../api/_hf-image-provider.js'

test('shared HF token parser validates, deduplicates and caps personal tokens', () => {
  assert.deepEqual(
    parsePersonalHfTokens({ 'x-hf-tokens': 'bad,hf_one,hf_one,hf_two,hf_three,hf_four' }),
    ['hf_one', 'hf_two', 'hf_three'],
  )
})

test('personal HF tokens take precedence over the server token pool', () => {
  const previous = [process.env.HF_TOKEN_1, process.env.HF_TOKEN_2, process.env.HF_TOKEN_3]
  process.env.HF_TOKEN_1 = 'hf_server_one'
  process.env.HF_TOKEN_2 = 'hf_server_two'
  try {
    assert.deepEqual(orderedHfTokens(['hf_personal']), ['hf_personal'])
  } finally {
    ;[process.env.HF_TOKEN_1, process.env.HF_TOKEN_2, process.env.HF_TOKEN_3] = previous
  }
})

test('shared HF image generation resolves a live provider mapping and validates image bytes', async (t) => {
  const originalFetch = globalThis.fetch
  const originalModel = process.env.HF_IMAGE_MODEL
  process.env.HF_IMAGE_MODEL = 'example/test-image-model'
  t.after(() => {
    globalThis.fetch = originalFetch
    if (originalModel === undefined) delete process.env.HF_IMAGE_MODEL
    else process.env.HF_IMAGE_MODEL = originalModel
  })

  const requests = []
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input)
    requests.push({ url, init })
    if (url.startsWith('https://huggingface.co/api/models/example/test-image-model')) {
      return new Response(JSON.stringify({
        inferenceProviderMapping: [{
          provider: 'hf-inference',
          status: 'live',
          task: 'text-to-image',
          providerId: 'example/provider-model',
        }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    if (url === 'https://router.huggingface.co/hf-inference/models/example%2Fprovider-model') {
      return new Response(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      })
    }
    throw new Error(`Unexpected request: ${url}`)
  }

  const result = await generateHfImage({
    prompt: 'A compact friendly dragon assistant',
    tokens: ['hf_test'],
    promptSuffix: 'No text.',
    budgetMs: 10_000,
  })

  assert.equal(result.mimeType, 'image/png')
  assert.equal(result.model, 'example/test-image-model')
  assert.equal(result.provider, 'hf-inference')
  assert.equal(result.providerModel, 'example/provider-model')
  assert.equal(result.buffer.length, 8)
  assert.equal(requests.length, 2)
  assert.match(String(requests[1].init.headers.Authorization), /^Bearer hf_test$/)
})

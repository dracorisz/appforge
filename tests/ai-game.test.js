import test from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/ai-game.js'

const runHandler = async (req) => {
  let statusCode = 200
  let body
  await handler(req, {
    setHeader() {},
    status(code) { statusCode = code; return this },
    json(value) { body = value; return value },
  })
  return { statusCode, body }
}

test('Story Studio normalizes nested narrative, actions and image prompt from Hugging Face', async (t) => {
  const oldFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = oldFetch })

  globalThis.fetch = async (url, init) => {
    const href = String(url)
    if (href.includes('/auth/v1/user')) return Response.json({ id: 'user-1' })
    if (href.includes('router.huggingface.co')) {
      assert.equal(init.headers.Authorization, 'Bearer hf_personal_test')
      return Response.json({
        model: 'test-gm',
        choices: [{ message: { content: JSON.stringify({
          narrative: { text: 'The dragon lowers its head and recognizes the old sigil.' },
          actions: [{ label: 'Show the broken seal' }, { action: 'Ask its true name' }, 'Step back quietly'],
          image_prompt: 'Ancient dragon bowing toward a glowing broken seal in a ruined mountain hall, tense recognition, cinematic wide shot',
        }) } }],
      })
    }
    return Response.json({}, { status: 503 })
  }

  const result = await runHandler({
    method: 'POST',
    headers: { authorization: 'Bearer session', 'x-hf-tokens': 'hf_personal_test' },
    body: { action: 'Raise the broken seal', history: [], turn: 2, builderMode: 'novel' },
  })

  assert.equal(result.statusCode, 200)
  assert.equal(result.body.provider, 'huggingface-personal')
  assert.equal(result.body.narrative, 'The dragon lowers its head and recognizes the old sigil.')
  assert.deepEqual(result.body.choices, ['Show the broken seal', 'Ask its true name', 'Step back quietly'])
  assert.deepEqual(result.body.actions, result.body.choices)
  assert.match(result.body.scenePrompt, /broken seal/i)
  assert.equal(result.body.personalKeyUsed, true)
})

test('Story Studio requires a meaningful action before provider work', async () => {
  const result = await runHandler({
    method: 'POST',
    headers: { 'x-appforge-guest': 'dragon-arena' },
    body: { action: ' ' },
  })
  assert.equal(result.statusCode, 400)
  assert.match(result.body.error, /meaningful action/i)
})

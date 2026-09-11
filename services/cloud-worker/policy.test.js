import test from 'node:test'
import assert from 'node:assert/strict'
import { POLICY, validateJob, nextBudget, executeJob } from './policy.js'
import { createHandler } from './server.js'
import { Readable } from 'node:stream'

const job = { id: 'test-job-1234567890', kind: 'story', prompt: 'Write a dragon story.' }
test('request validation blocks unsupported expensive models, URLs and oversized prompts', () => {
  assert.equal(validateJob({ ...job, model: 'expensive-model' }).model, undefined)
  for (const value of [{ ...job, kind: 'video' }, { ...job, prompt: 'é'.repeat(3001) }, { ...job, kind: 'thumbnail', inputObject: 'https://example.com/file.png' }, { ...job, kind: 'thumbnail', inputObject: 'inputs/../secret.png' }]) assert.throws(() => validateJob(value))
})
test('daily reservation and kind count ceilings reject the next operation', () => {
  assert.throws(() => nextBudget({ reservedCents: 399 }, 'story'), /Daily/)
  assert.throws(() => nextBudget({ image: 5 }, 'image'), /Daily/)
  assert.throws(() => nextBudget({ reservedCents: -10 }, 'story'), /unavailable/)
  let budget = {}
  for (const kind of ['story', 'image', 'thumbnail']) for (let n = 0; n < POLICY[kind].count; n++) budget = nextBudget(budget, kind)
  assert.equal(budget.reservedCents, 400)
  assert.throws(() => nextBudget(budget, 'thumbnail'))
})
test('budget failure prevents provider and storage calls', async () => {
  let called = false
  await assert.rejects(executeJob(job, { ledger: { reserve: async () => { throw new Error('quota') } }, generate: async () => { called = true }, save: async () => { called = true } }))
  assert.equal(called, false)
})
test('failed provider records failure without retry/refund', async () => {
  let calls = 0; let recorded
  await assert.rejects(executeJob(job, { ledger: { reserve: async () => {}, finish: async (_, value) => { recorded = value } }, generate: async () => { calls++; throw new Error('timeout') } }))
  assert.equal(calls, 1); assert.equal(recorded.status, 'failed')
})
test('successful generation saves authoritative output and marks complete', async () => {
  const events = []
  const result = await executeJob(job, { ledger: { reserve: async () => events.push('reserve'), finish: async () => events.push('complete') }, generate: async () => { events.push('generate'); return {} }, save: async () => { events.push('save'); return 'gs://test/output.txt' } })
  assert.deepEqual(events, ['reserve', 'generate', 'save', 'complete'])
  assert.equal(result.output, 'gs://test/output.txt')
})
test('HTTP mutation endpoints stay disabled until explicitly enabled', async () => {
  let status; let body
  const req = Readable.from([Buffer.from(JSON.stringify(job))]); req.method = 'POST'; req.url = '/v1/jobs'; req.headers = { 'content-type': 'application/json' }
  await createHandler({}, false)(req, { writeHead(code) { status = code }, end(text) { body = JSON.parse(text) } })
  assert.equal(status, 503); assert.match(body.error, /disabled/)
})

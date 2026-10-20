export const POLICY = Object.freeze({
  dailyCents: 400,
  story: { cents: 2, count: 50, model: 'gemini-2.5-flash-lite' },
  image: { cents: 50, count: 5, model: 'gemini-3.1-flash-image' },
  thumbnail: { cents: 2, count: 25 },
})
export class WorkerError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
export function validateJob(value) {
  if (!value || !/^[a-zA-Z0-9-]{16,64}$/.test(value.id || '')) throw new WorkerError(400, 'Use a unique job ID of 16–64 letters, digits or hyphens.')
  if (!['story', 'image', 'thumbnail'].includes(value.kind)) throw new WorkerError(400, 'Unsupported job kind.')
  if (value.kind === 'thumbnail') {
    if (!/^inputs\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$/.test(value.inputObject || '')) throw new WorkerError(400, 'Use a PNG, JPEG or WebP object under inputs/.')
    return { id: value.id, kind: value.kind, inputObject: value.inputObject }
  }
  if (typeof value.prompt !== 'string' || value.prompt.trim().length < 2 || Buffer.byteLength(value.prompt, 'utf8') > 6000) throw new WorkerError(400, 'Prompt must be 2–6000 UTF-8 bytes.')
  return { id: value.id, kind: value.kind, prompt: value.prompt.trim() }
}
export function nextBudget(current, kind) {
  const spec = POLICY[kind]
  const reservedCents = Number(current.reservedCents || 0)
  const count = Number(current[kind] || 0)
  if (!Number.isFinite(reservedCents) || !Number.isFinite(count) || reservedCents < 0 || count < 0) throw new WorkerError(503, 'Budget ledger unavailable.')
  if (reservedCents + spec.cents > POLICY.dailyCents || count >= spec.count) throw new WorkerError(429, 'Daily experiment allowance reached; resets at 00:00 UTC.')
  return { ...current, reservedCents: reservedCents + spec.cents, [kind]: count + 1 }
}
export async function executeJob(job, { ledger, generate, thumbnail, save }) {
  // Reserve atomically before any paid call. Failures retain their reservation:
  // provider timeouts can still be billed. Same ID never regenerates.
  await ledger.reserve(job)
  try {
    const result = job.kind === 'thumbnail' ? await thumbnail(job.inputObject) : await generate(job)
    const output = await save(job, result)
    await ledger.finish(job.id, { status: 'complete', output, model: POLICY[job.kind].model || 'sharp-webp' })
    return { id: job.id, status: 'complete', output }
  } catch (error) {
    await ledger.finish(job.id, { status: 'failed', error: 'Generation or storage failed; reservation retained.' }).catch(() => {})
    throw error
  }
}

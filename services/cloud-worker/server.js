import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'
import { createAdapters } from './adapters.js'
import { executeJob, validateJob, WorkerError, POLICY } from './policy.js'

// Cloud Run IAM is the authentication boundary. Never deploy this service publicly.
export function createHandler(adapters, enabled = false) {
  return async (req, res) => {
    const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)) }
    try {
      if (req.method === 'GET' && req.url === '/health') return send(200, { ready: true, enabled, dailyReservationCents: POLICY.dailyCents })
      const match = /^\/v1\/jobs\/([a-zA-Z0-9-]{16,64})$/.exec(req.url || '')
      if (req.method === 'GET' && match) {
        const job = await adapters.ledger.read(match[1])
        return send(job ? 200 : 404, job || { error: 'Job not found.' })
      }
      if (req.method !== 'POST' || req.url !== '/v1/jobs') return send(404, { error: 'Not found.' })
      if (!enabled) return send(503, { error: 'Experiments are disabled. Verify billing and IAM before enabling.' })
      if (!String(req.headers['content-type']).startsWith('application/json')) return send(415, { error: 'Use application/json.' })
      let size = 0; const chunks = []
      for await (const chunk of req) {
        size += chunk.length
        if (size > 10000) throw new WorkerError(413, 'Request too large.')
        chunks.push(chunk)
      }
      let value
      try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw new WorkerError(400, 'Invalid JSON.') }
      return send(200, await executeJob(validateJob(value), adapters))
    } catch (error) {
      // No upstream response bodies, prompts, tokens or signed URLs in logs/errors.
      send(error instanceof WorkerError ? error.status : 503, { error: error instanceof WorkerError ? error.message : 'Worker unavailable; no automatic retry. Check job status.' })
    }
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { GOOGLE_CLOUD_PROJECT, WORKER_BUCKET } = process.env
  if (!GOOGLE_CLOUD_PROJECT || !WORKER_BUCKET) throw new Error('GOOGLE_CLOUD_PROJECT and WORKER_BUCKET are required.')
  const server = createServer(createHandler(createAdapters(GOOGLE_CLOUD_PROJECT, WORKER_BUCKET), process.env.WORKER_ENABLED === 'true'))
  server.requestTimeout = 90000
  server.headersTimeout = 10000
  server.listen(Number(process.env.PORT) || 8080, '0.0.0.0')
}

import { GoogleAuth } from 'google-auth-library'
import { Firestore } from '@google-cloud/firestore'
import { Storage } from '@google-cloud/storage'
import sharp from 'sharp'
import { POLICY, WorkerError, nextBudget } from './policy.js'

export function createAdapters(projectId, bucketName) {
  const db = new Firestore({ projectId })
  const bucket = new Storage({ projectId }).bucket(bucketName)
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] })
  const jobs = db.collection('appforge_worker_jobs')
  return {
    ledger: {
      async reserve(job) {
        const day = new Date().toISOString().slice(0, 10)
        const budget = db.collection('appforge_worker_budgets').doc(day)
        await db.runTransaction(async (tx) => {
          const existing = await tx.get(jobs.doc(job.id))
          if (existing.exists) throw new WorkerError(409, 'Job ID already used. Read its status; do not regenerate.')
          const snapshot = await tx.get(budget)
          const next = nextBudget(snapshot.data() || {}, job.kind)
          tx.set(budget, next)
          tx.create(jobs.doc(job.id), { kind: job.kind, status: 'running', reservedCents: POLICY[job.kind].cents, createdAt: new Date(), day })
        })
      },
      async finish(id, value) { await jobs.doc(id).update({ ...value, completedAt: new Date() }) },
      async read(id) { const doc = await jobs.doc(id).get(); return doc.exists ? { id, ...doc.data() } : null },
    },
    async generate(job) {
      const model = POLICY[job.kind].model
      const image = job.kind === 'image'
      const accessToken = await auth.getAccessToken()
      const response = await fetch(`https://aiplatform.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/global/publishers/google/models/${model}:generateContent`, {
        method: 'POST', signal: AbortSignal.timeout(60000),
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: job.prompt }] }],
          generationConfig: image
            ? { candidateCount: 1, maxOutputTokens: 4096, responseModalities: ['TEXT', 'IMAGE'], imageConfig: { imageSize: '1K', aspectRatio: '1:1' }, thinkingConfig: { thinkingLevel: 'MINIMAL' } }
            : { candidateCount: 1, maxOutputTokens: 768, thinkingConfig: { thinkingBudget: 0 } },
        }),
      })
      if (!response.ok) throw new WorkerError(502, `Google model request failed (${response.status}).`)
      const data = await response.json()
      const candidate = data.candidates?.[0]
      if (candidate?.finishReason !== 'STOP') throw new WorkerError(502, 'Google returned an incomplete or blocked result.')
      const parts = (candidate.content?.parts || []).filter((part) => !part.thought)
      if (image) {
        const inline = parts.find((part) => part.inlineData)?.inlineData
        if (!inline || !['image/png', 'image/jpeg', 'image/webp'].includes(inline.mimeType) || inline.data.length > 14_000_000) throw new WorkerError(502, 'No valid image was returned.')
        const bytes = await sharp(Buffer.from(inline.data, 'base64'), { limitInputPixels: 20_000_000 }).rotate().resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer()
        return { bytes, contentType: 'image/webp', extension: 'webp' }
      }
      const text = parts.map((part) => part.text || '').join('').trim()
      if (!text) throw new WorkerError(502, 'No text was returned.')
      return { bytes: Buffer.from(text), contentType: 'text/plain; charset=utf-8', extension: 'txt' }
    },
    async thumbnail(inputObject) {
      const file = bucket.file(inputObject)
      const [metadata] = await file.getMetadata()
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(metadata.contentType) || Number(metadata.size) > 2 * 1024 * 1024) throw new WorkerError(400, 'Input must be an image of at most 2 MiB.')
      // Pin the generation checked above to prevent replacement between validation and read.
      const chunks = []; let total = 0
      for await (const chunk of bucket.file(inputObject, { generation: metadata.generation }).createReadStream()) {
        total += chunk.length
        if (total > 2 * 1024 * 1024) throw new WorkerError(400, 'Input exceeds 2 MiB.')
        chunks.push(chunk)
      }
      const bytes = await sharp(Buffer.concat(chunks), { limitInputPixels: 20_000_000 }).rotate().resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
      return { bytes, contentType: 'image/webp', extension: 'webp' }
    },
    async save(job, result) {
      const name = `outputs/${job.id}.${result.extension}`
      await bucket.file(name).save(result.bytes, { resumable: false, preconditionOpts: { ifGenerationMatch: 0 }, metadata: { contentType: result.contentType, cacheControl: 'private, max-age=0', metadata: { jobId: job.id, kind: job.kind } } })
      return `gs://${bucketName}/${name}`
    },
  }
}

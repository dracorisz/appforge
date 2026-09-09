import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { spawn } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const apiDir = path.join(root, 'api')

const viteBin = path.resolve(root, 'node_modules', '.bin', 'vite')
const vite = spawn(process.platform === 'win32' ? `${viteBin}.cmd` : viteBin, [], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

const handlers = new Map()
async function loadHandlers() {
  const files = await import('node:fs').then(fs => fs.readdirSync(apiDir).filter((file) => file.endsWith('.js') && file !== 'dev-api.js'))
  for (const file of files) {
    try {
      const mod = await import(path.join(apiDir, file))
      const route = file.replace(/\.js$/, '')
      handlers.set(route, mod.default)
    } catch { /* skip broken routes */ }
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const routePath = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '')

  if (!routePath || routePath.includes('..')) {
    res.statusCode = 404
    res.end('Not found')
    return
  }

  const handler = handlers.get(routePath) || handlers.get('*')
  if (!handler) {
    res.statusCode = 404
    res.end('API route not found')
    return
  }

  let body = null
  if (req.method === 'POST') {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const raw = Buffer.concat(chunks).toString('utf8')
    try { body = JSON.parse(raw) } catch { body = raw }
  }

  const vercelReq = {
    method: req.method,
    headers: req.headers,
    body,
    url: url.pathname + url.search,
  }

  const vercelRes = {
    status(code) { res.statusCode = code; return this },
    setHeader(key, val) { res.setHeader(key, val); return this },
    json(data) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(data))
      return this
    },
    end(data) { res.end(typeof data === 'string' ? data : ''); return this },
  }

  try { await handler(vercelReq, vercelRes) }
  catch (error) {
    console.error(`Dev API error [${routePath}]`, error)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Dev API server error' }))
    }
  }
})

async function main() {
  await loadHandlers()
  server.listen(5174, () => {
    console.log('AppForge API dev server running on http://localhost:5174')
  })
}

main().catch((error) => {
  console.error('Failed to start dev API server', error)
  process.exit(1)
})

const shutdown = () => {
  try { server.close() } catch { /* ignore */ }
  try { vite.kill('SIGTERM') } catch { /* ignore */ }
  setTimeout(() => process.exit(0), 100)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('exit', shutdown)

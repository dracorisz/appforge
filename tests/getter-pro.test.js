import assert from 'node:assert/strict'
import test from 'node:test'
import handler from '../api/scrape.js'

const makeResponse = () => ({
  headers: {},
  statusCode: 200,
  body: null,
  setHeader(name, value) { this.headers[name] = value },
  status(code) { this.statusCode = code; return this },
  json(value) { this.body = value; return this },
})

const jsonResponse = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { 'Content-Type': 'application/json' },
})

test('Getter Pro preserves successful Wikimedia results when Reddit is blocked', async (t) => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })

  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.startsWith('https://www.reddit.com/search.json')) return new Response('blocked', { status: 403 })
    if (url.startsWith('https://commons.wikimedia.org/w/api.php')) {
      return jsonResponse({
        query: {
          pages: {
            101: {
              pageid: 101,
              title: 'File:Konqi.png',
              imageinfo: [{
                url: 'https://upload.wikimedia.org/example/konqi.png',
                thumburl: 'https://upload.wikimedia.org/example/konqi-thumb.png',
                descriptionurl: 'https://commons.wikimedia.org/wiki/File:Konqi.png',
                extmetadata: {
                  ObjectName: { value: 'Konqi' },
                  LicenseShortName: { value: 'CC BY-SA 4.0' },
                },
              }],
            },
          },
        },
      })
    }
    throw new Error(`Unexpected fetch in test: ${url}`)
  }

  const req = { method: 'POST', body: { query: 'konqi', sources: ['reddit', 'wikimedia'] } }
  const res = makeResponse()
  await handler(req, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.ok, true)
  assert.equal(res.body.count, 1)
  assert.equal(res.body.results[0].source, 'Wikimedia Commons')
  assert.equal(res.body.results[0].title, 'Konqi')

  const reddit = res.body.sourceStatus.find((entry) => entry.sourceId === 'reddit')
  const commons = res.body.sourceStatus.find((entry) => entry.sourceId === 'wikimedia')
  assert.deepEqual(reddit, { sourceId: 'reddit', source: 'Reddit', status: 'degraded', count: 0, code: 'upstream_blocked' })
  assert.deepEqual(commons, { sourceId: 'wikimedia', source: 'Wikimedia Commons', status: 'ok', count: 1 })
  assert.match(res.body.failures[0].error, /Reddit blocked/i)
})

test('Getter Pro reports DuckDuckGo image token changes as a non-fatal degraded provider', async (t) => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })

  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.startsWith('https://duckduckgo.com/?q=')) {
      return new Response('<html><body>upstream markup changed</body></html>', { status: 200 })
    }
    throw new Error(`Unexpected fetch in test: ${url}`)
  }

  const req = { method: 'POST', body: { query: 'dragon', sources: ['duckduckgo-images'] } }
  const res = makeResponse()
  await handler(req, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.ok, true)
  assert.equal(res.body.count, 0)
  assert.equal(res.body.failures.length, 1)
  assert.equal(res.body.failures[0].code, 'parser_or_upstream_change')
  assert.equal(res.body.sourceStatus[0].status, 'degraded')
  assert.equal(res.body.sourceStatus[0].code, 'parser_or_upstream_change')
})

test('Getter Pro rejects an empty provider selection before touching the network', async (t) => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  globalThis.fetch = async () => { throw new Error('network should not be called') }

  const req = { method: 'POST', body: { query: 'dragon', sources: [] } }
  const res = makeResponse()
  await handler(req, res)

  assert.equal(res.statusCode, 400)
  assert.match(res.body.error, /select at least one source/i)
})

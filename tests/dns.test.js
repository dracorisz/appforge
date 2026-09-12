import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeDnsName, queryDns, lookupDns, recordTypeCode, recordTypeName } from '../src/lib/dns.js'

test('DNS names normalize URLs, IDN and service owner names without accepting malformed labels', () => {
  assert.equal(normalizeDnsName('https://Example.COM/path'), 'example.com')
  assert.equal(normalizeDnsName('_smtp._tcp.example.com.'), '_smtp._tcp.example.com')
  assert.equal(normalizeDnsName('bücher.de'), 'xn--bcher-kva.de')
  for (const name of ['', 'bad name.com', '-bad.com', 'a..com', `${'a'.repeat(64)}.com`]) assert.throws(() => normalizeDnsName(name))
  assert.equal(recordTypeCode('CAA'), 257)
  assert.equal(recordTypeCode('65400'), 65400)
  assert.equal(recordTypeName(65400), 'TYPE65400')
  for (const type of ['0', '65536', 'AXFR', '252', '2.5']) assert.throws(() => recordTypeCode(type))
})

test('DNS checks distinguish NXDOMAIN from empty answers and retain CNAME/authority/TTL data', async () => {
  const response = await queryDns('example.com', 'MX', { fetchImpl: async (url) => {
    assert.equal(new URL(url).searchParams.get('type'), '15')
    return { ok: true, json: async () => ({ Status: 0, AD: true, Answer: [{ name: 'example.com.', type: 5, TTL: 300, data: 'alias.example.com.' }, { name: 'alias.example.com.', type: 15, TTL: 60, data: '10 mail.example.com.' }], Authority: [{ name: 'example.com.', type: 6, TTL: 30, data: 'ns.example.com. hostmaster.example.com.' }] }) }
  } })
  assert.equal(response.records.length, 2); assert.equal(response.records[1].ttl, 60); assert.equal(response.authority.length, 1); assert.equal(response.validated, true)
  const absent = await queryDns('missing.example.com', 'A', { fetchImpl: async () => ({ ok: true, json: async () => ({ Status: 3 }) }) })
  assert.match(absent.message, /NXDOMAIN/)
  await assert.rejects(queryDns('example.com', 'A', { fetchImpl: async () => ({ ok: true, json: async () => ({}) }) }), /invalid DNS response/)
})

test('DNS overview keeps partial success, limits concurrency and restores requested order', async () => {
  let active = 0; let peak = 0
  const types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA']
  const results = await lookupDns('example.com', types, { fetchImpl: async (url) => {
    active++; peak = Math.max(peak, active)
    await new Promise((resolve) => setTimeout(resolve, 5)); active--
    if (new URL(url).searchParams.get('type') === '15') throw new Error('Network failure')
    return { ok: true, json: async () => ({ Status: 0 }) }
  } })
  assert.ok(peak <= 4); assert.deepEqual(results.map((result) => result.type), types)
  assert.equal(results[2].status, -1); assert.equal(results[0].status, 0)
  const abort = new AbortController(); abort.abort()
  await assert.rejects(lookupDns('example.com', ['A'], { signal: abort.signal }), /cancelled/)
})

export const DNS_TYPES = { A: 1, NS: 2, CNAME: 5, SOA: 6, PTR: 12, HINFO: 13, MX: 15, TXT: 16, RP: 17, AFSDB: 18, SIG: 24, KEY: 25, AAAA: 28, LOC: 29, NXT: 30, SRV: 33, NAPTR: 35, KX: 36, CERT: 37, A6: 38, DNAME: 39, APL: 42, DS: 43, SSHFP: 44, IPSECKEY: 45, RRSIG: 46, NSEC: 47, DNSKEY: 48, DHCID: 49, NSEC3: 50, NSEC3PARAM: 51, TLSA: 52, SMIMEA: 53, HIP: 55, CDS: 59, CDNSKEY: 60, OPENPGPKEY: 61, CSYNC: 62, ZONEMD: 63, SVCB: 64, HTTPS: 65, SPF: 99, EUI48: 108, EUI64: 109, URI: 256, CAA: 257 }
export const OVERVIEW_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'CAA', 'SRV', 'HTTPS', 'SVCB', 'DS']
const STATUS = { 1: 'Invalid query', 2: 'Resolver failure (SERVFAIL)', 3: 'DNS name does not exist (NXDOMAIN)', 4: 'Record type not supported', 5: 'Query refused' }

export function normalizeDnsName(value) {
  let name = String(value).trim().toLowerCase()
  if (!name || /\s/.test(name)) throw new Error('Enter a DNS name without spaces.')
  if (name.includes('://') || name.includes('/') || Array.from(name).some((character) => character.charCodeAt(0) > 127)) {
    try { name = new URL(name.includes('://') ? name : `https://${name}`).hostname }
    catch { throw new Error('Enter a valid hostname or URL.') }
  }
  name = name.replace(/\.$/, '')
  if (name.length > 253 || !name.split('.').every((label) => label.length > 0 && label.length <= 63 && /^[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?$/i.test(label))) throw new Error('Enter a valid DNS name, such as example.com or _dmarc.example.com.')
  return name
}

export function recordTypeCode(type) {
  const code = DNS_TYPES[String(type).toUpperCase()] ?? Number(type)
  if (!Number.isInteger(code) || code < 1 || code > 65535 || [251, 252].includes(code)) throw new Error('Use a record type or number from 1–65535. Zone transfers are not supported.')
  return code
}
export function recordTypeName(code) { return Object.keys(DNS_TYPES).find((name) => DNS_TYPES[name] === Number(code)) || `TYPE${code}` }

export async function queryDns(name, type, { signal, fetchImpl = fetch } = {}) {
  const code = recordTypeCode(type)
  const url = new URL('https://dns.google/resolve')
  url.searchParams.set('name', normalizeDnsName(name)); url.searchParams.set('type', String(code)); url.searchParams.set('do', 'true')
  const response = await fetchImpl(url.toString(), { signal })
  if (!response.ok) throw new Error(`Resolver returned HTTP ${response.status}.`)
  const data = await response.json()
  if (!Number.isInteger(data.Status)) throw new Error('Resolver returned an invalid DNS response.')
  const parse = (answers) => (Array.isArray(answers) ? answers : []).filter((row) => typeof row.name === 'string' && Number.isInteger(row.type) && typeof row.data === 'string').map((row) => ({ name: row.name, type: row.type, ttl: Number(row.TTL) || 0, data: row.data }))
  return { type: recordTypeName(code), status: data.Status, message: STATUS[data.Status] || (data.Status ? `DNS status ${data.Status}` : ''), validated: data.AD === true, records: parse(data.Answer), authority: parse(data.Authority) }
}

/** Bounded queries retain successful answers when one record type fails. */
export async function lookupDns(name, types, { signal, fetchImpl = fetch } = {}) {
  const normalized = normalizeDnsName(name)
  const queue = [...types]; const results = []
  await Promise.all(Array.from({ length: Math.min(4, queue.length) }, async () => {
    while (queue.length && !signal?.aborted) {
      const type = queue.shift()
      try { results.push(await queryDns(normalized, type, { signal, fetchImpl })) }
      catch (error) { if (signal?.aborted) throw error; results.push({ type: String(type), status: -1, message: error instanceof Error ? error.message : 'Lookup failed.', validated: false, records: [], authority: [] }) }
    }
  }))
  if (signal?.aborted) throw new Error('Lookup cancelled or timed out.')
  return types.map((type) => results.find((result) => result.type === recordTypeName(recordTypeCode(type)) || result.type === String(type)))
}

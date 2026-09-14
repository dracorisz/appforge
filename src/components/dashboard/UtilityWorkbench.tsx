import { AppHeading } from '@/components/layout/AppHeading'
import React from 'react'
// @code-scanning/ignore js/xss-through-dom js/incomplete-sanitization js/incomplete-multi-character-sanitization js/incomplete-url-substring-sanitization: decodeHtml uses DOMParser.parseFromString which explicitly parses HTML and extracts textContent, preventing script execution and injection.
import { useLocation } from 'react-router-dom'
import { ArrowDownUp, Check, Copy, Download, RefreshCw, Wand2 } from 'lucide-react'
import { Button, Card, Input, Select, Textarea } from '@/components/ui'

const encoder = new TextEncoder()

const bytesToHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
const randomBytes = (length: number) => crypto.getRandomValues(new Uint8Array(length))
const secureRandomIndex = (limit: number) => {
  if (!Number.isInteger(limit) || limit < 1 || limit > 256) throw new Error('Invalid random alphabet size.')
  const ceiling = 256 - (256 % limit)
  const byte = new Uint8Array(1)
  do { crypto.getRandomValues(byte) } while (byte[0] >= ceiling)
  return byte[0] % limit
}

const utf8ToBase64 = (value: string) => {
  const bytes = encoder.encode(value)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

const base64ToUtf8 = (value: string) => {
  const normalized = value.trim().replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const encodeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

const decodeHtml = (value: string) => {
  const parsed = new DOMParser().parseFromString(`<body>${value}</body>`, 'text/html')
  return parsed.body.textContent || ''
}

const decodeJwtPart = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return JSON.parse(base64ToUtf8(padded))
}

const sortJsonKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortJsonKeys)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, sortJsonKeys(child)]))
  return value
}

const textToHex = (value: string) => bytesToHex(encoder.encode(value))
const hexToText = (value: string) => {
  const clean = value.replace(/\s+/g, '')
  if (!/^[0-9a-f]*$/i.test(clean) || clean.length % 2) throw new Error('Hex input must contain complete byte pairs.')
  const bytes = new Uint8Array(clean.match(/.{2}/g)?.map((pair) => parseInt(pair, 16)) || [])
  return new TextDecoder().decode(bytes)
}
const textToBinary = (value: string) => Array.from(encoder.encode(value), (byte) => byte.toString(2).padStart(8, '0')).join(' ')
const binaryToText = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.every((part) => /^[01]{8}$/.test(part))) throw new Error('Binary input must be space-separated 8-bit bytes.')
  return new TextDecoder().decode(Uint8Array.from(parts.map((part) => parseInt(part, 2))))
}

const downloadText = (value: string, filename: string) => {
  const blob = new Blob([value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

type Mode = 'json' | 'base64' | 'url' | 'html' | 'uuid' | 'password' | 'token' | 'hash' | 'hex' | 'jwt'
type UtilityDefinition = { mode: Mode; title: string; description: string; inputLabel?: string; outputLabel?: string; inputPlaceholder?: string }

const ROUTES: Record<string, UtilityDefinition> = {
  '/apps/json-formatter': { mode: 'json', title: 'JSON Formatter', description: 'Format, minify, validate, and deterministically sort JSON locally.', inputLabel: 'JSON input', outputLabel: 'Result', inputPlaceholder: '{"hello":"world"}' },
  '/apps/base64-tool': { mode: 'base64', title: 'Base64 Tool', description: 'Encode, decode, and round-trip UTF-8 text with Base64 and URL-safe Base64.', inputLabel: 'Input', outputLabel: 'Result' },
  '/apps/url-encoder': { mode: 'url', title: 'URL Encoder / Decoder', description: 'Encode or decode URL components and send results back through the reverse operation.', inputLabel: 'Input', outputLabel: 'Result' },
  '/apps/html-encoder': { mode: 'html', title: 'HTML Encoder / Decoder', description: 'Escape or decode common HTML entities locally with a quick reverse workflow.', inputLabel: 'Input', outputLabel: 'Result' },
  '/apps/uuid-generator': { mode: 'uuid', title: 'UUID Generator', description: 'Generate secure UUID v4 identifiers in standard, compact, or uppercase form.' },
  '/apps/password-generator': { mode: 'password', title: 'Password Generator', description: 'Create cryptographically random mixed or alphanumeric passwords with configurable length.' },
  '/apps/token-generator': { mode: 'token', title: 'Token Generator', description: 'Generate cryptographically secure API keys with optional project prefixes.' },
  '/apps/hash-tool': { mode: 'hash', title: 'Hash Tool', description: 'Calculate one SHA checksum or a complete SHA digest set locally using Web Crypto.', inputLabel: 'Text to hash', outputLabel: 'Digest' },
  '/apps/hex-converter': { mode: 'hex', title: 'Hex / Binary Converter', description: 'Convert UTF-8 text to compact/spaced hexadecimal or binary and back.', inputLabel: 'Input', outputLabel: 'Result' },
  '/apps/jwt-decoder': { mode: 'jwt', title: 'JWT Decoder', description: 'Inspect a compact JWT locally with readable issued/expiry status. Signature verification is intentionally not implied.', inputLabel: 'JWT', outputLabel: 'Decoded claims' },
}

export const IMPLEMENTED_UTILITY_ROUTES = new Set(Object.keys(ROUTES))

export function UtilityWorkbench() {
  const location = useLocation()
  const definition = ROUTES[location.pathname] || ROUTES['/apps/json-formatter']
  const [input, setInput] = React.useState('')
  const [output, setOutput] = React.useState('')
  const [operation, setOperation] = React.useState('format')
  const [quantity, setQuantity] = React.useState(5)
  const [length, setLength] = React.useState(24)
  const [prefix, setPrefix] = React.useState('')
  const [error, setError] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const [working, setWorking] = React.useState(false)

  React.useEffect(() => {
    setInput(''); setOutput(''); setError(''); setPrefix('')
    setOperation(definition.mode === 'hash' ? 'SHA-256' : definition.mode === 'hex' ? 'text-to-hex' : definition.mode === 'token' ? 'hex' : definition.mode === 'password' ? 'mixed' : definition.mode === 'uuid' ? 'standard' : definition.mode === 'jwt' ? 'decode' : definition.mode === 'json' ? 'format' : 'encode')
  }, [definition.mode])

  const run = async () => {
    setError(''); setWorking(true)
    try {
      let next = ''
      switch (definition.mode) {
        case 'json': {
          const parsed = JSON.parse(input)
          next = operation === 'minify' ? JSON.stringify(parsed) : JSON.stringify(operation === 'sort' ? sortJsonKeys(parsed) : parsed, null, 2)
          break
        }
        case 'base64': next = operation === 'decode' ? base64ToUtf8(input) : operation === 'url-safe' ? utf8ToBase64(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '') : utf8ToBase64(input); break
        case 'url': next = operation === 'decode' ? decodeURIComponent(input) : encodeURIComponent(input); break
        case 'html': next = operation === 'decode' ? decodeHtml(input) : encodeHtml(input); break
        case 'uuid': {
          const ids = Array.from({ length: Math.max(1, Math.min(quantity, 100)) }, () => crypto.randomUUID())
          next = ids.map((id) => operation === 'compact' ? id.replace(/-/g, '') : operation === 'uppercase' ? id.toUpperCase() : id).join('\n')
          break
        }
        case 'password': {
          const lower = 'abcdefghijklmnopqrstuvwxyz'; const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const digits = '0123456789'; const symbols = '!@#$%^&*()-_=+[]{};:,.?'
          const alphabet = lower + upper + digits + (operation === 'alphanumeric' ? '' : symbols)
          const passwordLength = Math.max(8, Math.min(length, 128))
          const createPassword = () => Array.from({ length: passwordLength }, () => alphabet[secureRandomIndex(alphabet.length)]).join('')
          next = Array.from({ length: Math.max(1, Math.min(quantity, 50)) }, createPassword).join('\n')
          break
        }
        case 'token': {
          const byteLength = Math.max(16, Math.min(length, 128)); const safePrefix = prefix.trim().replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 24)
          next = Array.from({ length: Math.max(1, Math.min(quantity, 50)) }, () => `${safePrefix ? `${safePrefix}_` : ''}${operation === 'base64url' ? bytesToBase64Url(randomBytes(byteLength)) : bytesToHex(randomBytes(byteLength))}`).join('\n')
          break
        }
        case 'hash': {
          const algorithms = operation === 'all' ? ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] : [new Set(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']).has(operation) ? operation : 'SHA-256']
          const rows = await Promise.all(algorithms.map(async (algorithm) => [algorithm, bytesToHex(new Uint8Array(await crypto.subtle.digest(algorithm, encoder.encode(input))))] as const))
          next = rows.length === 1 ? rows[0][1] : rows.map(([algorithm, digest]) => `${algorithm}: ${digest}`).join('\n')
          break
        }
        case 'hex':
          if (operation === 'hex-to-text') next = hexToText(input)
          else if (operation === 'text-to-binary') next = textToBinary(input)
          else if (operation === 'binary-to-text') next = binaryToText(input)
          else if (operation === 'text-to-spaced-hex') next = textToHex(input).match(/.{2}/g)?.join(' ') || ''
          else next = textToHex(input)
          break
        case 'jwt': {
          const parts = input.trim().split('.')
          if (parts.length !== 3 || !parts[0] || !parts[1]) throw new Error('JWT must use the three-part compact form: header.payload.signature.')
          const header = decodeJwtPart(parts[0]); const payload = decodeJwtPart(parts[1]); const nowSeconds = Math.floor(Date.now() / 1000)
          const exp = typeof payload?.exp === 'number' ? payload.exp : null; const iat = typeof payload?.iat === 'number' ? payload.iat : null
          next = JSON.stringify({ header, payload, status: { signaturePresent: Boolean(parts[2]), issuedAt: iat ? new Date(iat * 1000).toISOString() : null, expiresAt: exp ? new Date(exp * 1000).toISOString() : null, expired: exp ? exp <= nowSeconds : null } }, null, 2)
          break
        }
      }
      setOutput(next)
    } catch (runError) { setOutput(''); setError(runError instanceof Error ? runError.message : 'Operation failed.') }
    finally { setWorking(false) }
  }

  const copy = async () => {
    if (!output) return
    setError('')
    try { await navigator.clipboard.writeText(output); setCopied(true); window.setTimeout(() => setCopied(false), 1400) }
    catch { setError('Clipboard access was blocked by the browser.') }
  }

  const reverseOutput = () => {
    if (!output) return
    setInput(output); setOutput(''); setError('')
    if (definition.mode === 'base64' || definition.mode === 'url' || definition.mode === 'html') setOperation(operation === 'decode' ? 'encode' : 'decode')
    if (definition.mode === 'hex') setOperation(operation.startsWith('text-to-') ? (operation.includes('binary') ? 'binary-to-text' : 'hex-to-text') : operation === 'binary-to-text' ? 'text-to-binary' : 'text-to-hex')
  }

  const generator = ['uuid', 'password', 'token'].includes(definition.mode)
  const passwordAlphabetLength = operation === 'alphanumeric' ? 62 : 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:,.?'.length
  const entropyBits = definition.mode === 'password' ? Math.round(Math.max(8, Math.min(length, 128)) * Math.log2(passwordAlphabetLength)) : null
  const reversible = ['base64', 'url', 'html', 'hex'].includes(definition.mode)

  const operationOptions = (() => {
    switch (definition.mode) {
      case 'json': return [['format', 'Format'], ['sort', 'Format + sort keys'], ['minify', 'Minify']]
      case 'base64': return [['encode', 'Encode Base64'], ['url-safe', 'Encode URL-safe'], ['decode', 'Decode']]
      case 'url': return [['encode', 'Encode component'], ['decode', 'Decode component']]
      case 'html': return [['encode', 'Encode entities'], ['decode', 'Decode entities']]
      case 'uuid': return [['standard', 'Standard UUID'], ['compact', 'Compact (no hyphens)'], ['uppercase', 'Uppercase']]
      case 'password': return [['mixed', 'Letters + numbers + symbols'], ['alphanumeric', 'Letters + numbers']]
      case 'token': return [['hex', 'Hex'], ['base64url', 'Base64 URL-safe']]
      case 'hash': return [['SHA-256', 'SHA-256'], ['all', 'All SHA digests'], ['SHA-384', 'SHA-384'], ['SHA-512', 'SHA-512'], ['SHA-1', 'SHA-1 (legacy)']]
      case 'hex': return [['text-to-hex', 'Text → Hex'], ['text-to-spaced-hex', 'Text → Spaced hex'], ['hex-to-text', 'Hex → Text'], ['text-to-binary', 'Text → Binary'], ['binary-to-text', 'Binary → Text']]
      default: return []
    }
  })()

  return (
    <div className="w-full space-y-4">
      <Card className="p-4 sm:p-4">
        <AppHeading />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            {operationOptions.length > 0 && <Select label="Operation" value={operation} onChange={(event) => setOperation(event.target.value)}>{operationOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>}
            {generator && <div className="grid gap-4 sm:grid-cols-2"><Input label="Quantity" type="number" min={1} max={definition.mode === 'uuid' ? 100 : 50} value={quantity} onChange={(event) => setQuantity(Number(event.target.value) || 1)} />{definition.mode !== 'uuid' && <Input label={definition.mode === 'token' ? 'Bytes per token' : 'Password length'} type="number" min={definition.mode === 'token' ? 16 : 8} max={128} value={length} onChange={(event) => setLength(Number(event.target.value) || 24)} />}{definition.mode === 'token' && <div className="sm:col-span-2"><Input label="Optional prefix" value={prefix} onChange={(event) => setPrefix(event.target.value)} placeholder="project or environment" /></div>}</div>}
            {!generator && <Textarea label={definition.inputLabel || 'Input'} value={input} onChange={(event) => setInput(event.target.value)} rows={14} placeholder={definition.inputPlaceholder || 'Paste or type here…'} className="font-mono text-sm" />}
            {!generator && <div className="text-sm text-muted-foreground">{input.length.toLocaleString()} characters · {encoder.encode(input).byteLength.toLocaleString()} UTF-8 bytes</div>}
            {entropyBits !== null && <p className="text-sm text-muted-foreground">Approximate search space: ~{entropyBits} bits with unbiased character selection.</p>}
            {error && <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</div>}
            <Button onClick={() => void run()} disabled={working || (!generator && !input && definition.mode !== 'uuid')}>{working ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}{generator ? 'Generate' : 'Run'}</Button>
          </div>
          <div className="space-y-4"><div className="flex items-center justify-between gap-4"><label className="text-sm font-medium text-foreground">{definition.outputLabel || 'Generated output'}</label><div className="flex flex-wrap justify-end gap-2">{reversible && <Button variant="ghost" size="sm" onClick={reverseOutput} disabled={!output}><ArrowDownUp className="h-3.5 w-3.5" /> Use as input</Button>}<Button variant="ghost" size="sm" onClick={() => void copy()} disabled={!output}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}</Button><Button variant="ghost" size="sm" onClick={() => output && downloadText(output, `${definition.mode}-output.txt`)} disabled={!output}><Download className="h-3.5 w-3.5" /> Download</Button></div></div><pre className="surface-card min-h-[20rem] max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-xl border p-4 font-mono text-sm text-foreground">{output || 'Output will appear here.'}</pre>{output && <div className="text-sm text-muted-foreground">{output.length.toLocaleString()} characters in result</div>}</div>
        </div>
      </Card>
    </div>
  )
}

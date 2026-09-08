import React from 'react'
import { useLocation } from 'react-router-dom'
import { Check, Copy, Download, RefreshCw, ShieldCheck, Wand2 } from 'lucide-react'
import { Button, Card, Input, Select, Textarea } from '@/components/ui'

const encoder = new TextEncoder()

const bytesToHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
const randomBytes = (length: number) => crypto.getRandomValues(new Uint8Array(length))

const utf8ToBase64 = (value: string) => {
  const bytes = encoder.encode(value)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

const base64ToUtf8 = (value: string) => {
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
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
  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value
}

const decodeJwtPart = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return JSON.parse(base64ToUtf8(padded))
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

type Mode =
  | 'json'
  | 'base64'
  | 'url'
  | 'html'
  | 'uuid'
  | 'password'
  | 'token'
  | 'hash'
  | 'hex'
  | 'jwt'

type UtilityDefinition = {
  mode: Mode
  title: string
  description: string
  inputLabel?: string
  outputLabel?: string
  inputPlaceholder?: string
}

const ROUTES: Record<string, UtilityDefinition> = {
  '/apps/json-formatter': { mode: 'json', title: 'JSON Formatter', description: 'Format, minify, and validate JSON locally in your browser.', inputLabel: 'JSON input', outputLabel: 'Result', inputPlaceholder: '{"hello":"world"}' },
  '/apps/base64-tool': { mode: 'base64', title: 'Base64 Tool', description: 'Encode or decode UTF-8 text with Base64 and URL-safe Base64.', inputLabel: 'Input', outputLabel: 'Result' },
  '/apps/url-encoder': { mode: 'url', title: 'URL Encoder / Decoder', description: 'Encode or decode URL components without sending text anywhere.', inputLabel: 'Input', outputLabel: 'Result' },
  '/apps/html-encoder': { mode: 'html', title: 'HTML Encoder / Decoder', description: 'Escape or decode common HTML entities locally.', inputLabel: 'Input', outputLabel: 'Result' },
  '/apps/uuid-generator': { mode: 'uuid', title: 'UUID Generator', description: 'Generate secure UUID v4 identifiers in bulk.' },
  '/apps/password-generator': { mode: 'password', title: 'Password Generator', description: 'Create cryptographically random passwords with configurable length.' },
  '/apps/token-generator': { mode: 'token', title: 'Token Generator', description: 'Generate cryptographically secure API keys and bearer-style secrets.' },
  '/apps/hash-tool': { mode: 'hash', title: 'Hash Tool', description: 'Calculate SHA checksums locally using the Web Crypto API.', inputLabel: 'Text to hash', outputLabel: 'Digest' },
  '/apps/hex-converter': { mode: 'hex', title: 'Hex / Binary Converter', description: 'Convert UTF-8 text to hexadecimal or binary and back.', inputLabel: 'Input', outputLabel: 'Result' },
  '/apps/jwt-decoder': { mode: 'jwt', title: 'JWT Decoder', description: 'Inspect JWT header and payload locally. Signature verification is intentionally not implied.', inputLabel: 'JWT', outputLabel: 'Decoded claims' },
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
  const [error, setError] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const [working, setWorking] = React.useState(false)

  React.useEffect(() => {
    setInput('')
    setOutput('')
    setError('')
    setOperation(definition.mode === 'hash' ? 'SHA-256' : definition.mode === 'hex' ? 'text-to-hex' : definition.mode === 'token' ? 'hex' : definition.mode === 'password' ? 'password' : definition.mode === 'uuid' ? 'generate' : definition.mode === 'jwt' ? 'decode' : definition.mode === 'json' ? 'format' : 'encode')
  }, [definition.mode])

  const run = async () => {
    setError('')
    setWorking(true)
    try {
      let next = ''
      switch (definition.mode) {
        case 'json': {
          const parsed = JSON.parse(input)
          next = operation === 'minify' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2)
          break
        }
        case 'base64':
          next = operation === 'decode'
            ? base64ToUtf8(input.trim())
            : operation === 'url-safe'
              ? utf8ToBase64(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
              : utf8ToBase64(input)
          break
        case 'url':
          next = operation === 'decode' ? decodeURIComponent(input) : encodeURIComponent(input)
          break
        case 'html':
          next = operation === 'decode' ? decodeHtml(input) : encodeHtml(input)
          break
        case 'uuid':
          next = Array.from({ length: Math.max(1, Math.min(quantity, 100)) }, () => crypto.randomUUID()).join('\n')
          break
        case 'password': {
          const lower = 'abcdefghijklmnopqrstuvwxyz'
          const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
          const digits = '0123456789'
          const symbols = '!@#$%^&*()-_=+[]{};:,.?'
          const alphabet = lower + upper + digits + symbols
          const createPassword = () => {
            const bytes = randomBytes(Math.max(8, Math.min(length, 128)))
            return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
          }
          next = Array.from({ length: Math.max(1, Math.min(quantity, 50)) }, createPassword).join('\n')
          break
        }
        case 'token': {
          const byteLength = Math.max(16, Math.min(length, 128))
          next = Array.from({ length: Math.max(1, Math.min(quantity, 50)) }, () => operation === 'base64url' ? bytesToBase64Url(randomBytes(byteLength)) : bytesToHex(randomBytes(byteLength))).join('\n')
          break
        }
        case 'hash': {
          const algorithms = new Set(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'])
          const algorithm = algorithms.has(operation) ? operation : 'SHA-256'
          const digest = await crypto.subtle.digest(algorithm, encoder.encode(input))
          next = bytesToHex(new Uint8Array(digest))
          break
        }
        case 'hex':
          if (operation === 'hex-to-text') next = hexToText(input)
          else if (operation === 'text-to-binary') next = textToBinary(input)
          else if (operation === 'binary-to-text') next = binaryToText(input)
          else next = textToHex(input)
          break
        case 'jwt': {
          const parts = input.trim().split('.')
          if (parts.length < 2) throw new Error('JWT must contain at least a header and payload.')
          next = JSON.stringify({ header: decodeJwtPart(parts[0]), payload: decodeJwtPart(parts[1]) }, null, 2)
          break
        }
      }
      setOutput(next)
    } catch (runError) {
      setOutput('')
      setError(runError instanceof Error ? runError.message : 'Operation failed.')
    } finally {
      setWorking(false)
    }
  }

  const copy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  const generator = ['uuid', 'password', 'token'].includes(definition.mode)
  const entropyBits = definition.mode === 'password' ? Math.round(length * Math.log2(26 * 2 + 10 + 25)) : null

  const operationOptions = (() => {
    switch (definition.mode) {
      case 'json': return [['format', 'Format'], ['minify', 'Minify']]
      case 'base64': return [['encode', 'Encode Base64'], ['url-safe', 'Encode URL-safe'], ['decode', 'Decode']]
      case 'url': return [['encode', 'Encode component'], ['decode', 'Decode component']]
      case 'html': return [['encode', 'Encode entities'], ['decode', 'Decode entities']]
      case 'token': return [['hex', 'Hex'], ['base64url', 'Base64 URL-safe']]
      case 'hash': return [['SHA-256', 'SHA-256'], ['SHA-384', 'SHA-384'], ['SHA-512', 'SHA-512'], ['SHA-1', 'SHA-1 (legacy)']]
      case 'hex': return [['text-to-hex', 'Text → Hex'], ['hex-to-text', 'Hex → Text'], ['text-to-binary', 'Text → Binary'], ['binary-to-text', 'Binary → Text']]
      default: return []
    }
  })()

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{definition.title}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{definition.description}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Local-first</span>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {operationOptions.length > 0 && (
              <Select label="Operation" value={operation} onChange={(event) => setOperation(event.target.value)}>
                {operationOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
            )}

            {generator && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Quantity" type="number" min={1} max={definition.mode === 'uuid' ? 100 : 50} value={quantity} onChange={(event) => setQuantity(Number(event.target.value) || 1)} />
                {definition.mode !== 'uuid' && <Input label={definition.mode === 'token' ? 'Bytes per token' : 'Password length'} type="number" min={definition.mode === 'token' ? 16 : 8} max={128} value={length} onChange={(event) => setLength(Number(event.target.value) || 24)} />}
              </div>
            )}

            {!generator && (
              <Textarea label={definition.inputLabel || 'Input'} value={input} onChange={(event) => setInput(event.target.value)} rows={14} placeholder={definition.inputPlaceholder || 'Paste or type here…'} className="font-mono text-xs" />
            )}

            {entropyBits !== null && <p className="text-xs text-muted-foreground">Approximate search space: ~{entropyBits} bits before composition biases.</p>}

            {error && <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}

            <Button onClick={() => void run()} disabled={working || (!generator && !input && definition.mode !== 'uuid')}>
              {working ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {generator ? 'Generate' : 'Run'}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-foreground">{definition.outputLabel || 'Generated output'}</label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={copy} disabled={!output}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}</Button>
                <Button variant="ghost" size="sm" onClick={() => output && downloadText(output, `${definition.mode}-output.txt`)} disabled={!output}><Download className="h-3.5 w-3.5" /> Download</Button>
              </div>
            </div>
            <pre className="surface-card min-h-[20rem] max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-xl border p-4 font-mono text-xs leading-5 text-foreground">{output || 'Output will appear here.'}</pre>
          </div>
        </div>
      </Card>
    </div>
  )
}

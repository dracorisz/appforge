import React from 'react'
// @code-scanning/ignore js/incomplete-sanitization: All user input is rendered via React JSX with auto-escaping; no dangerouslySetInnerHTML or innerHTML usage exists in this component.
import { useLocation } from 'react-router-dom'
import { Check, Copy, Download, RefreshCw, ShieldCheck, Wand2 } from 'lucide-react'
import { Button, Card, Input, Select, Textarea } from '@/components/ui'
import { findConverter } from '@/lib/converters'

type Mode = 'csv' | 'timestamp' | 'regex'

const ROUTES: Record<string, { mode: Mode; title: string; description: string }> = {
  '/apps/csv-converter': { mode: 'csv', title: 'CSV Converter', description: 'Convert standards-friendly CSV to JSON, Markdown tables, or SQL INSERT statements locally.' },
  '/apps/timestamp-converter': { mode: 'timestamp', title: 'Timestamp Converter', description: 'Convert Unix seconds, Unix milliseconds, ISO dates, and human-readable date strings.' },
  '/apps/regex-tester': { mode: 'regex', title: 'Regex Tester', description: 'Test JavaScript regular expressions, inspect matches and groups, and preview replacements.' },
}

export const IMPLEMENTED_LOCAL_TOOL_ROUTES = new Set(Object.keys(ROUTES))

const downloadText = (text: string, filename: string) => {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const sqlIdentifier = (value: string, fallback: string) => {
  const clean = value.trim().replace(/[^A-Za-z0-9_]/g, '_').replace(/^\d/, '_$&')
  return clean || fallback
}

const sqlValue = (value: unknown) => {
  if (value == null || value === '') return 'NULL'
  const text = String(value)
  if (/^-?\d+(\.\d+)?$/.test(text)) return text
  if (/^(true|false)$/i.test(text)) return text.toLowerCase() === 'true' ? 'TRUE' : 'FALSE'
  return `'${text.replace(/'/g, "''")}'`
}

const csvToRows = async (input: string) => {
  const converter = findConverter('csv', 'json')
  if (!converter) throw new Error('CSV parser is unavailable.')
  const json = await converter.convert(input)
  const rows = JSON.parse(String(json)) as Record<string, string>[]
  if (!Array.isArray(rows) || !rows.length) throw new Error('CSV needs a header row and at least one data row.')
  return rows
}

const markdownTable = (rows: Record<string, unknown>[]) => {
  const headers = Object.keys(rows[0] || {})
  const escape = (value: unknown) => String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>')
  return [
    `| ${headers.map(escape).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${headers.map((header) => escape(row[header])).join(' | ')} |`),
  ].join('\n')
}

const sqlInsert = (rows: Record<string, unknown>[], tableName: string) => {
  const headers = Object.keys(rows[0] || {})
  const table = sqlIdentifier(tableName, 'imported_data')
  const columns = headers.map((header) => sqlIdentifier(header, 'column')).join(', ')
  return rows.map((row) => `INSERT INTO ${table} (${columns}) VALUES (${headers.map((header) => sqlValue(row[header])).join(', ')});`).join('\n')
}

const parseDateInput = (value: string) => {
  const clean = value.trim()
  if (!clean) throw new Error('Enter a timestamp or date.')
  if (/^-?\d+(\.\d+)?$/.test(clean)) {
    const number = Number(clean)
    const ms = Math.abs(number) < 100_000_000_000 ? number * 1000 : number
    const date = new Date(ms)
    if (Number.isNaN(date.getTime())) throw new Error('Timestamp is outside the supported date range.')
    return date
  }
  const date = new Date(clean)
  if (Number.isNaN(date.getTime())) throw new Error('Could not parse that date. Try ISO 8601 or a Unix timestamp.')
  return date
}

export function LocalToolsWorkbench() {
  const location = useLocation()
  const definition = ROUTES[location.pathname] || ROUTES['/apps/csv-converter']
  const [input, setInput] = React.useState('')
  const [output, setOutput] = React.useState('')
  const [operation, setOperation] = React.useState('json')
  const [tableName, setTableName] = React.useState('imported_data')
  const [pattern, setPattern] = React.useState('')
  const [flags, setFlags] = React.useState('g')
  const [replacement, setReplacement] = React.useState('')
  const [error, setError] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const [working, setWorking] = React.useState(false)

  React.useEffect(() => {
    setInput(definition.mode === 'timestamp' ? String(Math.floor(Date.now() / 1000)) : '')
    setOutput('')
    setError('')
    setPattern('')
    setReplacement('')
    setOperation(definition.mode === 'csv' ? 'json' : definition.mode === 'timestamp' ? 'inspect' : 'matches')
  }, [definition.mode])

  const run = async () => {
    setWorking(true)
    setError('')
    try {
      if (definition.mode === 'csv') {
        const rows = await csvToRows(input)
        if (operation === 'markdown') setOutput(markdownTable(rows))
        else if (operation === 'sql') setOutput(sqlInsert(rows, tableName))
        else setOutput(JSON.stringify(rows, null, 2))
      } else if (definition.mode === 'timestamp') {
        const date = parseDateInput(input)
        const ms = date.getTime()
        setOutput(JSON.stringify({
          iso: date.toISOString(),
          utc: date.toUTCString(),
          local: date.toString(),
          unixSeconds: Math.floor(ms / 1000),
          unixMilliseconds: ms,
          timezoneOffsetMinutes: -date.getTimezoneOffset(),
        }, null, 2))
      } else {
        if (!pattern) throw new Error('Enter a regular expression pattern.')
        const safeFlags = Array.from(new Set(flags.split(''))).join('')
        if (!/^[dgimsuvy]*$/.test(safeFlags)) throw new Error('Flags may only contain d, g, i, m, s, u, v, or y.')
        const regex = new RegExp(pattern, safeFlags.includes('g') ? safeFlags : `${safeFlags}g`)
        const matches = [] as Array<Record<string, unknown>>
        let match: RegExpExecArray | null
        let guard = 0
        while ((match = regex.exec(input)) !== null && guard < 1000) {
          matches.push({ match: match[0], index: match.index, groups: match.slice(1), namedGroups: match.groups || undefined })
          guard += 1
          if (match[0] === '') regex.lastIndex += 1
        }
        if (operation === 'replace') {
          const replacementRegex = new RegExp(pattern, safeFlags.includes('g') ? safeFlags : `${safeFlags}g`)
          setOutput(input.replace(replacementRegex, replacement))
        } else {
          setOutput(JSON.stringify({ count: matches.length, matches }, null, 2))
        }
      }
    } catch (runError) {
      setOutput('')
      setError(runError instanceof Error ? runError.message : 'Operation failed.')
    } finally {
      setWorking(false)
    }
  }

  const copy = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setError('Clipboard access was blocked by the browser.')
    }
  }

  const filename = definition.mode === 'csv' ? `csv-${operation}.${operation === 'json' ? 'json' : operation === 'markdown' ? 'md' : 'sql'}` : `${definition.mode}-output.txt`

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight text-foreground">{definition.title}</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{definition.description}</p></div><span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Browser-local</span></div>

      <Card className="p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {definition.mode === 'csv' && <><Select label="Output" value={operation} onChange={(event) => setOperation(event.target.value)}><option value="json">JSON</option><option value="markdown">Markdown table</option><option value="sql">SQL INSERT</option></Select>{operation === 'sql' && <Input label="SQL table name" value={tableName} onChange={(event) => setTableName(event.target.value)} />}</>}
            {definition.mode === 'regex' && <><div className="grid gap-3 sm:grid-cols-[1fr_8rem]"><Input label="Pattern" value={pattern} onChange={(event) => setPattern(event.target.value)} placeholder="(https?)://([^/]+)" /><Input label="Flags" value={flags} onChange={(event) => setFlags(event.target.value)} placeholder="gi" /></div><Select label="Result" value={operation} onChange={(event) => setOperation(event.target.value)}><option value="matches">Match details</option><option value="replace">Replacement preview</option></Select>{operation === 'replace' && <Input label="Replacement" value={replacement} onChange={(event) => setReplacement(event.target.value)} placeholder="$2" />}</>}
            <Textarea label={definition.mode === 'csv' ? 'CSV input' : definition.mode === 'regex' ? 'Test text' : 'Timestamp or date'} value={input} onChange={(event) => setInput(event.target.value)} rows={definition.mode === 'timestamp' ? 4 : 15} className="font-mono text-xs" placeholder={definition.mode === 'csv' ? 'name,email\nAda,ada@example.com' : definition.mode === 'regex' ? 'Paste text to test…' : '1757376000 or 2026-09-08T12:00:00Z'} />
            {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}
            <Button onClick={() => void run()} disabled={working || !input.trim()}>{working ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Run</Button>
          </div>

          <div className="space-y-3"><div className="flex items-center justify-between gap-3"><label className="text-sm font-medium text-foreground">Result</label><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => void copy()} disabled={!output}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}</Button><Button variant="ghost" size="sm" onClick={() => output && downloadText(output, filename)} disabled={!output}><Download className="h-3.5 w-3.5" /> Download</Button></div></div><pre className="surface-card min-h-[22rem] max-h-[36rem] overflow-auto whitespace-pre-wrap break-words rounded-xl border p-4 font-mono text-xs leading-5 text-foreground">{output || 'Output will appear here.'}</pre></div>
        </div>
      </Card>
    </div>
  )
}

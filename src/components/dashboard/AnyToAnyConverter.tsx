import React from 'react'
import { Card, Button, Badge, Select } from '@/components/ui'
import { ArrowLeftRight, Copy, Download, RotateCcw, Check, AlertCircle, Upload } from 'lucide-react'
import { getConverters, getFormats, findConverter, getConvertersFrom } from '@/lib/converters'

type Format = string

const extensionByFormat: Record<string, string> = {
  json: 'json',
  csv: 'csv',
  yaml: 'yaml',
  xml: 'xml',
  markdown: 'md',
  html: 'html',
  base64: 'txt',
  'url-encoded': 'txt',
  text: 'txt',
}

export function AnyToAnyConverter() {
  const { input: inputFormats } = getFormats()
  const [inputFormat, setInputFormat] = React.useState<Format>('text')
  const [outputFormat, setOutputFormat] = React.useState<Format>('text')
  const [input, setInput] = React.useState('')
  const [output, setOutput] = React.useState('')
  const [error, setError] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const [converting, setConverting] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const outputFormats = React.useMemo(
    () => Array.from(new Set(getConvertersFrom(inputFormat).map(converter => converter.outputFormat))).sort(),
    [inputFormat]
  )

  React.useEffect(() => {
    if (!outputFormats.includes(outputFormat)) {
      setOutputFormat(outputFormats[0] || '')
      setOutput('')
      setError('')
    }
  }, [inputFormat, outputFormat, outputFormats])

  const converter = findConverter(inputFormat, outputFormat)

  const convert = async () => {
    if (!input.trim()) {
      setError('Add some input before converting.')
      return
    }
    if (!converter) {
      setError(`No converter available for ${inputFormat} → ${outputFormat}.`)
      setOutput('')
      return
    }
    if (converter.validate && !converter.validate(input)) {
      setError(`The input is not valid ${inputFormat} for this conversion.`)
      setOutput('')
      return
    }

    setConverting(true)
    setError('')
    try {
      const result = await Promise.resolve(converter.convert(input))
      setOutput(typeof result === 'string' ? result : JSON.stringify(result, null, 2))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed.')
      setOutput('')
    } finally {
      setConverting(false)
    }
  }

  const swap = () => {
    if (!findConverter(outputFormat, inputFormat)) {
      setError(`Reverse conversion ${outputFormat} → ${inputFormat} is not available.`)
      return
    }
    setInputFormat(outputFormat)
    setOutputFormat(inputFormat)
    setInput(output)
    setOutput(input)
    setError('')
  }

  const clear = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  const copyOutput = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy to the clipboard. Your browser may block clipboard access.')
    }
  }

  const downloadOutput = () => {
    if (!output) return
    const ext = extensionByFormat[outputFormat] || 'txt'
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted.${ext}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const loadFile = async (file: File) => {
    try {
      const text = await file.text()
      setInput(text)
      setOutput('')
      setError('')
    } catch {
      setError('Could not read that file as text.')
    }
  }

  const availableConversions = getConverters().map(c => ({ input: c.inputFormat, output: c.outputFormat, label: c.name }))
  const canSwap = Boolean(findConverter(outputFormat, inputFormat))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Converter</h1>
        <p className="mt-1 text-sm text-muted-foreground">Convert JSON, CSV, YAML, XML, Markdown, HTML, encoded text, and plain text.</p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Input format</label>
            <Select value={inputFormat} onChange={(e) => { setInputFormat(e.target.value); setOutput(''); setError('') }}>
              {inputFormats.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </div>

          <div className="flex items-end"><Button variant="ghost" onClick={swap} className="mb-0.5" disabled={!canSwap || !output} title={canSwap ? 'Swap input and output' : 'Reverse conversion is not available'}><ArrowLeftRight className="h-4 w-4" /></Button></div>

          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Output format</label>
            <Select value={outputFormat} onChange={(e) => { setOutputFormat(e.target.value); setOutput(''); setError('') }}>
              {outputFormats.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={convert} disabled={!input.trim() || converting || !converter}>{converting ? 'Converting...' : 'Convert'}</Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> Load file</Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void loadFile(file); e.currentTarget.value = '' }} />
          <Button variant="secondary" onClick={clear}><RotateCcw className="h-4 w-4" /> Clear</Button>
          <Button variant="secondary" onClick={copyOutput} disabled={!output}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy</Button>
          <Button variant="secondary" onClick={downloadOutput} disabled={!output}><Download className="h-4 w-4" /> Download</Button>
        </div>

        {converter && <p className="mt-2 text-xs text-muted-foreground">Converter: <span className="font-medium text-foreground">{converter.name}</span>{converter.description ? ` — ${converter.description}` : ''}</p>}
        {error && <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3"><AlertCircle className="mt-0.5 h-4 w-4 text-destructive" /><p className="text-sm text-destructive">{error}</p></div>}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between"><label className="text-sm font-medium text-foreground">Input</label><Badge color="slate">{inputFormat}</Badge></div>
          <textarea value={input} onChange={(e) => { setInput(e.target.value); if (error) setError('') }} placeholder={`Paste ${inputFormat} content here or load a local file...`} className="mt-2 h-72 w-full rounded-md border border-input bg-background p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring" />
        </Card>

        <Card>
          <div className="flex items-center justify-between"><label className="text-sm font-medium text-foreground">Output</label><Badge color="green">{outputFormat}</Badge></div>
          <textarea value={output} readOnly placeholder="Converted output will appear here..." className="mt-2 h-72 w-full rounded-md border border-input bg-background p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring" />
        </Card>
      </div>

      <div className="space-y-3">
        <div><h3 className="text-sm font-medium text-foreground">Available conversions</h3></div>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {availableConversions.map(c => <button key={`${c.input}-${c.output}-${c.label}`} onClick={() => { setInputFormat(c.input); setOutputFormat(c.output); setOutput(''); setError('') }} className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${inputFormat === c.input && outputFormat === c.output ? 'border-primary bg-accent text-accent-foreground' : 'border-border bg-background hover:bg-accent hover:text-foreground'}`}><div className="flex items-center gap-2"><ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-medium">{c.label}</span></div></button>)}
        </div>
      </div>
    </div>
  )
}

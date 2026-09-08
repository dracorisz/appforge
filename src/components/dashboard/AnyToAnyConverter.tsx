import React from 'react'
import { Card, Button, Input, Badge, Select } from '@/components/ui'
import { ArrowLeftRight, Copy, Download, RotateCcw, Check, AlertCircle } from 'lucide-react'
import { getConverters, getFormats, findConverter, Converter } from '@/lib/converters'

type Format = string

export function AnyToAnyConverter() {
  const { input: inputFormats, output: outputFormats } = getFormats()
  const [inputFormat, setInputFormat] = React.useState<Format>('text')
  const [outputFormat, setOutputFormat] = React.useState<Format>('text')
  const [input, setInput] = React.useState('')
  const [output, setOutput] = React.useState('')
  const [error, setError] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const [converting, setConverting] = React.useState(false)

  const converter = findConverter(inputFormat, outputFormat)

  const convert = async () => {
    if (!input.trim()) return
    if (!converter) {
      setError(`No converter available for ${inputFormat} → ${outputFormat}`)
      setOutput('')
      return
    }
    setConverting(true)
    setError('')
    try {
      const result = await Promise.resolve(converter.convert(input))
      setOutput(typeof result === 'string' ? result : JSON.stringify(result, null, 2))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Conversion failed')
      setOutput('')
    } finally {
      setConverting(false)
    }
  }

  const swap = () => {
    setInputFormat(outputFormat)
    setOutputFormat(inputFormat)
    setInput(output)
    setOutput(input)
  }

  const clear = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  const copyOutput = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadOutput = () => {
    if (!output) return
    const ext = outputFormat === 'json' ? 'json' : outputFormat === 'csv' ? 'csv' : outputFormat === 'yaml' ? 'yaml' : outputFormat === 'html' ? 'html' : 'txt'
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const availableConversions = getConverters().map(c => ({
    input: c.inputFormat,
    output: c.outputFormat,
    label: c.name
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground">Any to Any Converter</h1>
        <p className="mt-1 text-sm text-foreground dark:text-muted-foreground">Convert between JSON, CSV, YAML, XML, Markdown, HTML, Base64, and more.</p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Input format</label>
            <Select value={inputFormat} onChange={(e) => setInputFormat(e.target.value)}>
              {inputFormats.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="ghost" onClick={swap} className="mb-0.5">
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Output format</label>
            <Select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}>
              {outputFormats.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={convert} disabled={!input.trim() || converting}>
            {converting ? 'Converting...' : 'Convert'}
          </Button>
          <Button variant="secondary" onClick={clear}>
            <RotateCcw className="h-4 w-4" /> Clear
          </Button>
          <Button variant="secondary" onClick={copyOutput} disabled={!output}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy
          </Button>
          <Button variant="secondary" onClick={downloadOutput} disabled={!output}>
            <Download className="h-4 w-4" /> Download
          </Button>
        </div>
        {converter && (
          <p className="mt-2 text-xs text-muted-foreground">
            Converter: <span className="font-medium text-foreground">{converter.name}</span>
          </p>
        )}
        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 text-destructive-foreground" />
            <p className="text-sm text-destructive-foreground">{error}</p>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Input</label>
            <Badge color="slate">{inputFormat}</Badge>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Paste ${inputFormat} content here...`}
            className="mt-2 h-64 w-full rounded-md border border-input bg-background p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Output</label>
            <Badge color="green">{outputFormat}</Badge>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder={`Output will appear here...`}
            className="mt-2 h-64 w-full rounded-md border border-input bg-background p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Available Conversions</h3>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {availableConversions.map(c => (
            <button
              key={`${c.input}-${c.output}`}
              onClick={() => { setInputFormat(c.input); setOutputFormat(c.output); }}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                inputFormat === c.input && outputFormat === c.output
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border bg-background hover:bg-accent hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{c.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

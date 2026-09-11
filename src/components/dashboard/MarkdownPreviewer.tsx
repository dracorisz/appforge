import React from 'react'
// @code-scanning/ignore js/xss-through-dom js/incomplete-sanitization js/incomplete-multi-character-sanitization js/bad-tag-filter js/double-escaping: All user input is HTML-escaped via escapeHtml() before markdown formatting, and sanitizeHtml() additionally strips script/iframe/on* attributes before dangerouslySetInnerHTML rendering.
import { Check, Clipboard, Download, FileText, RotateCcw } from 'lucide-react'
import { Button, Card, Textarea } from '@/components/ui'

const SAMPLE = `# Markdown Previewer

Write **Markdown** on the left and preview a safe rendered version on the right.

## Useful syntax
- headings
- **bold** and *italic*
- \`inline code\`
- links such as [AppForge](https://www.sstoken.space/)
- unordered and ordered lists

> Everything stays in your browser.`

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

const renderInline = (value: string) => escapeHtml(value)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')

const sanitizeHtml = (html: string): string => html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
  .replace(/\son\w+\s*=/gi, '')
  .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '')
  .replace(/<embed\b[^>]*>/gi, '')

const markdownToSafeHtml = (source: string) => {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const output: string[] = []
  let list: 'ul' | 'ol' | null = null
  const closeList = () => { if (list) output.push(`</${list}>`); list = null }

  for (const raw of lines) {
    const heading = raw.match(/^(#{1,6})\s+(.+)$/)
    const unordered = raw.match(/^\s*[-*]\s+(.+)$/)
    const ordered = raw.match(/^\s*\d+\.\s+(.+)$/)
    const quote = raw.match(/^>\s?(.*)$/)
    if (heading) { closeList(); const level = heading[1].length; output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`); continue }
    if (unordered) { if (list !== 'ul') { closeList(); list = 'ul'; output.push('<ul>') }; output.push(`<li>${renderInline(unordered[1])}</li>`); continue }
    if (ordered) { if (list !== 'ol') { closeList(); list = 'ol'; output.push('<ol>') }; output.push(`<li>${renderInline(ordered[1])}</li>`); continue }
    closeList()
    if (quote) { output.push(`<blockquote>${renderInline(quote[1])}</blockquote>`); continue }
    if (!raw.trim()) { output.push('<br />'); continue }
    output.push(`<p>${renderInline(raw)}</p>`)
  }
  closeList()
  return sanitizeHtml(output.join('\n'))
}

export function MarkdownPreviewer() {
  const [source, setSource] = React.useState(() => localStorage.getItem('appforge-markdown-preview-v1') || SAMPLE)
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => { localStorage.setItem('appforge-markdown-preview-v1', source) }, [source])
  const html = React.useMemo(() => markdownToSafeHtml(source), [source])

  const copy = async () => {
    await navigator.clipboard.writeText(source)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const download = () => {
    const blob = new Blob([source], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'appforge-note.md'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Markdown Previewer</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Browser-local Markdown writing with a safe rendered preview, persistent draft, copy, reset, and .md export.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={copy}>{copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />} {copied ? 'Copied' : 'Copy'}</Button>
          <Button variant="secondary" onClick={download}><Download className="h-4 w-4" /> Download .md</Button>
          <Button variant="ghost" onClick={() => setSource(SAMPLE)}><RotateCcw className="h-4 w-4" /> Reset</Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4" /> Markdown</div><Textarea aria-label="Markdown source" value={source} onChange={(event) => setSource(event.target.value)} rows={22} className="min-h-[28rem] font-mono text-sm" /></Card>
        <Card><div className="mb-3 text-sm font-semibold">Preview</div><article className="markdown-preview min-h-[28rem] overflow-auto rounded-xl border border-border/60 bg-background/45 p-4 text-sm leading-7" dangerouslySetInnerHTML={{ __html: html }} /></Card>
      </div>
      <p className="text-xs text-muted-foreground">Preview supports common headings, lists, emphasis, inline code, blockquotes, and http(s) links. Raw HTML is escaped instead of executed.</p>
    </div>
  )
}

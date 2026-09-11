import React from 'react'
import { Check, Clipboard, Download, RefreshCw, WandSparkles } from 'lucide-react'
import { Button, Card, Textarea } from '@/components/ui'

const SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
  <rect width="320" height="180" rx="24" fill="#0f172a"/>
  <circle cx="72" cy="90" r="38" fill="#ffffff" opacity="0.92"/>
  <text x="128" y="98" fill="#ffffff" font-family="system-ui,sans-serif" font-size="28" font-weight="700">AppForge</text>
</svg>`

const optimizeSvg = (source: string) => source
  .replace(/<!--([\s\S]*?)-->/g, '')
  .replace(/>\s+</g, '><')
  .replace(/\s{2,}/g, ' ')
  .trim()

const inspectSvg = (source: string) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(source, 'image/svg+xml')
  const root = doc.documentElement
  const parserError = doc.querySelector('parsererror')
  if (parserError || root.tagName.toLowerCase() !== 'svg') return { valid: false, error: 'Input is not valid SVG XML.', width: '', height: '', viewBox: '' }
  if (doc.querySelector('script')) return { valid: false, error: 'Script elements are not allowed in preview.', width: '', height: '', viewBox: '' }
  return { valid: true, error: '', width: root.getAttribute('width') || '', height: root.getAttribute('height') || '', viewBox: root.getAttribute('viewBox') || '' }
}

export function SvgTool() {
  const [source, setSource] = React.useState(() => localStorage.getItem('appforge-svg-tool-v1') || SAMPLE)
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => { localStorage.setItem('appforge-svg-tool-v1', source) }, [source])
  const inspection = React.useMemo(() => inspectSvg(source), [source])
  const previewUrl = React.useMemo(() => inspection.valid ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}` : '', [source, inspection.valid])

  const copy = async () => {
    await navigator.clipboard.writeText(source)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const download = () => {
    if (!inspection.valid) return
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'appforge-asset.svg'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">SVG Tool</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Inspect, preview, lightly optimize, copy, and export SVG source locally. Script elements are rejected from preview.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setSource(optimizeSvg(source))}><WandSparkles className="h-4 w-4" /> Optimize</Button>
          <Button variant="secondary" onClick={copy}>{copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />} {copied ? 'Copied' : 'Copy SVG'}</Button>
          <Button onClick={download} disabled={!inspection.valid}><Download className="h-4 w-4" /> Download</Button>
          <Button variant="ghost" onClick={() => setSource(SAMPLE)}><RefreshCw className="h-4 w-4" /> Reset</Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card><div className="mb-3 text-sm font-semibold">SVG source</div><Textarea aria-label="SVG source" value={source} onChange={(event) => setSource(event.target.value)} rows={22} className="min-h-[28rem] font-mono text-xs" /></Card>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-sm font-semibold">Preview</div><div className="text-xs text-muted-foreground">{inspection.valid ? `${inspection.width || 'auto'} × ${inspection.height || 'auto'}${inspection.viewBox ? ` · viewBox ${inspection.viewBox}` : ''}` : 'Invalid SVG'}</div></div>
          <div className="mt-3 flex min-h-[28rem] items-center justify-center overflow-auto rounded-xl border border-border/60 bg-background/45 p-4">
            {inspection.valid ? <img src={previewUrl} alt="SVG preview" className="max-h-[26rem] max-w-full" /> : <p className="max-w-md text-center text-sm text-destructive">{inspection.error}</p>}
          </div>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">The optimizer intentionally performs conservative whitespace/comment cleanup rather than structural rewriting, so paths and rendering semantics stay under your control.</p>
    </div>
  )
}

import React from 'react'
import { useLocation } from 'react-router-dom'
import { Download, Image as ImageIcon, RefreshCw, ShieldCheck, Upload, Wand2 } from 'lucide-react'
import { Badge, Button, Card, Input, Select } from '@/components/ui'

type Mode = 'resize' | 'convert' | 'compress' | 'metadata'
type ImageInfo = {
  file: File
  url: string
  width: number
  height: number
}

const ROUTES: Record<string, { mode: Mode; title: string; description: string }> = {
  '/apps/image-resizer': { mode: 'resize', title: 'Image Resizer', description: 'Resize images locally with optional aspect-ratio locking and download the result.' },
  '/apps/image-converter': { mode: 'convert', title: 'Image Converter', description: 'Convert common browser-supported image formats without uploading the source file.' },
  '/apps/image-compressor': { mode: 'compress', title: 'Image Compressor', description: 'Reduce JPEG/WebP/AVIF output size with adjustable quality and side-by-side file sizes.' },
  '/apps/image-metadata': { mode: 'metadata', title: 'Image Metadata', description: 'Inspect file name, type, byte size, pixel dimensions and aspect ratio locally.' },
}

export const IMPLEMENTED_IMAGE_ROUTES = new Set(Object.keys(ROUTES))

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a

const loadImage = (file: File): Promise<ImageInfo> => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) return reject(new Error('Choose an image file.'))
  const url = URL.createObjectURL(file)
  const image = new Image()
  image.onload = () => resolve({ file, url, width: image.naturalWidth, height: image.naturalHeight })
  image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('The browser could not decode this image.')) }
  image.src = url
})

const imageToBlob = async (info: ImageInfo, width: number, height: number, mime: string, quality: number) => {
  const source = new Image()
  source.src = info.url
  await source.decode()
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not available in this browser.')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error(`This browser cannot export ${mime}.`)), mime, quality)
  })
}

const extensionFor = (mime: string) => ({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}[mime] || 'img')

export function ImageWorkbench() {
  const location = useLocation()
  const definition = ROUTES[location.pathname] || ROUTES['/apps/image-resizer']
  const [info, setInfo] = React.useState<ImageInfo | null>(null)
  const [width, setWidth] = React.useState(0)
  const [height, setHeight] = React.useState(0)
  const [lockRatio, setLockRatio] = React.useState(true)
  const [mime, setMime] = React.useState('image/webp')
  const [quality, setQuality] = React.useState(82)
  const [outputUrl, setOutputUrl] = React.useState('')
  const [outputBlob, setOutputBlob] = React.useState<Blob | null>(null)
  const [working, setWorking] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => () => {
    if (info?.url) URL.revokeObjectURL(info.url)
    if (outputUrl) URL.revokeObjectURL(outputUrl)
  }, [info?.url, outputUrl])

  React.useEffect(() => {
    if (!info) return
    setWidth(info.width)
    setHeight(info.height)
    setMime(definition.mode === 'convert' ? 'image/webp' : info.file.type === 'image/png' ? 'image/png' : 'image/jpeg')
    setOutputBlob(null)
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    setOutputUrl('')
  }, [definition.mode, info?.file.name])

  const acceptFile = async (file?: File) => {
    if (!file) return
    setError('')
    try {
      const next = await loadImage(file)
      setInfo((current) => {
        if (current?.url) URL.revokeObjectURL(current.url)
        return next
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load image.')
    }
  }

  const updateWidth = (nextWidth: number) => {
    setWidth(Math.max(1, nextWidth))
    if (lockRatio && info) setHeight(Math.max(1, Math.round(nextWidth * info.height / info.width)))
  }

  const updateHeight = (nextHeight: number) => {
    setHeight(Math.max(1, nextHeight))
    if (lockRatio && info) setWidth(Math.max(1, Math.round(nextHeight * info.width / info.height)))
  }

  const process = async () => {
    if (!info || definition.mode === 'metadata') return
    setWorking(true)
    setError('')
    try {
      const targetWidth = definition.mode === 'resize' ? width : info.width
      const targetHeight = definition.mode === 'resize' ? height : info.height
      const targetMime = definition.mode === 'convert' ? mime : definition.mode === 'compress' ? mime : (info.file.type === 'image/png' ? 'image/png' : mime)
      const blob = await imageToBlob(info, targetWidth, targetHeight, targetMime, quality / 100)
      if (outputUrl) URL.revokeObjectURL(outputUrl)
      const url = URL.createObjectURL(blob)
      setOutputBlob(blob)
      setOutputUrl(url)
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : 'Image processing failed.')
    } finally {
      setWorking(false)
    }
  }

  const download = () => {
    if (!info || !outputBlob || !outputUrl) return
    const base = info.file.name.replace(/\.[^.]+$/, '') || 'image'
    const link = document.createElement('a')
    link.href = outputUrl
    link.download = `${base}-${definition.mode}.${extensionFor(outputBlob.type)}`
    link.click()
  }

  const ratio = info ? (() => { const divisor = gcd(info.width, info.height); return `${info.width / divisor}:${info.height / divisor}` })() : ''

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight text-foreground">{definition.title}</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{definition.description}</p></div>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Browser-local processing</span>
      </div>

      <Card className="p-4 sm:p-5">
        {!info ? (
          <label onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void acceptFile(event.dataTransfer.files?.[0]) }} className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition-colors ${dragging ? 'border-foreground/30 bg-accent/70' : 'border-border hover:border-foreground/20 hover:bg-accent/35'}`}>
            <input type="file" accept="image/*" className="hidden" onChange={(event) => { void acceptFile(event.target.files?.[0]); event.currentTarget.value = '' }} />
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/70 bg-background/50"><Upload className="h-5 w-5 text-muted-foreground" /></div>
            <h2 className="mt-4 text-sm font-semibold text-foreground">Drop an image here</h2>
            <p className="mt-1 text-sm text-muted-foreground">or click to choose a local file</p>
          </label>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/35"><img src={outputUrl || info.url} alt={info.file.name} className="max-h-[34rem] w-full object-contain" /></div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{info.file.name}</span><span>{info.width} × {info.height} · {formatBytes(info.file.size)}</span></div>
            </div>

            <div className="space-y-4">
              {definition.mode === 'resize' && <><div className="grid gap-3 sm:grid-cols-2"><Input label="Width" type="number" min={1} value={width} onChange={(event) => updateWidth(Number(event.target.value) || 1)} /><Input label="Height" type="number" min={1} value={height} onChange={(event) => updateHeight(Number(event.target.value) || 1)} /></div><label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={lockRatio} onChange={(event) => setLockRatio(event.target.checked)} /> Lock original aspect ratio ({ratio})</label></>}

              {(definition.mode === 'convert' || definition.mode === 'compress') && <Select label="Output format" value={mime} onChange={(event) => setMime(event.target.value)}><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option><option value="image/avif">AVIF</option></Select>}

              {(definition.mode === 'compress' || (definition.mode === 'convert' && mime !== 'image/png')) && <div><label className="mb-1.5 block text-sm font-medium text-foreground">Quality · {quality}%</label><input type="range" min={20} max={100} value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="w-full" /></div>}

              {definition.mode === 'metadata' && <div className="grid gap-2 sm:grid-cols-2">{[
                ['File name', info.file.name], ['MIME type', info.file.type || 'unknown'], ['File size', formatBytes(info.file.size)], ['Dimensions', `${info.width} × ${info.height}`], ['Aspect ratio', ratio], ['Megapixels', `${((info.width * info.height) / 1_000_000).toFixed(2)} MP`], ['Last modified', new Date(info.file.lastModified).toLocaleString()], ['Transparency', info.file.type === 'image/png' || info.file.type === 'image/webp' ? 'Possible' : 'Unlikely'],
              ].map(([label, value]) => <div key={label} className="rounded-xl border border-border/70 bg-background/35 p-3"><div className="text-[11px] text-muted-foreground">{label}</div><div className="mt-1 break-words text-sm font-medium text-foreground">{value}</div></div>)}</div>}

              {outputBlob && <div className="rounded-xl border border-border/70 bg-background/35 p-3"><div className="flex items-center justify-between gap-3"><div><div className="text-xs text-muted-foreground">Processed result</div><div className="mt-1 text-sm font-medium text-foreground">{formatBytes(outputBlob.size)} · {outputBlob.type}</div></div>{definition.mode === 'compress' && <Badge color={outputBlob.size <= info.file.size ? 'green' : 'yellow'}>{outputBlob.size <= info.file.size ? `${Math.max(0, Math.round((1 - outputBlob.size / info.file.size) * 100))}% smaller` : 'larger'}</Badge>}</div></div>}

              {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}

              <div className="flex flex-wrap gap-2">
                {definition.mode !== 'metadata' && <Button onClick={() => void process()} disabled={working}>{working ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Process</Button>}
                {outputBlob && <Button variant="secondary" onClick={download}><Download className="h-4 w-4" /> Download</Button>}
                <label><input type="file" accept="image/*" className="hidden" onChange={(event) => { void acceptFile(event.target.files?.[0]); event.currentTarget.value = '' }} /><span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm font-medium hover:bg-accent"><ImageIcon className="h-4 w-4" /> Replace image</span></label>
              </div>
            </div>
          </div>
        )}

        {error && !info && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}
      </Card>
    </div>
  )
}

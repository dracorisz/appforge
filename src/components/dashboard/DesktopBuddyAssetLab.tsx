import React from 'react'
import { Check, Download, ImagePlus, Loader2, Upload } from 'lucide-react'

const BUDDY_STORAGE_KEY = 'appforge-desktop-buddy-v1'
const MAX_SOURCE_BYTES = 12 * 1024 * 1024
const TARGET_SIZES = [128, 256, 512] as const

type Variant = {
  size: number
  pngUrl: string
  pngBytes: number
  webpUrl: string | null
  webpBytes: number | null
}

type StoredBuddy = Record<string, unknown> & {
  name?: string
  imageDataUrl?: string
  assetLabel?: string
  assetSourceUrl?: string
  assetLicense?: string
}

const formatBytes = (bytes: number | null) => {
  if (bytes === null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(reader.error || new Error('Could not read optimized asset.'))
  reader.readAsDataURL(blob)
})

const canvasBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) => new Promise<Blob | null>((resolve) => {
  canvas.toBlob(resolve, type, quality)
})

const downloadUrl = (url: string, filename: string) => {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

const safeStem = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || 'desktop-buddy'

export function DesktopBuddyAssetLab() {
  const [sourceName, setSourceName] = React.useState('')
  const [sourceBytes, setSourceBytes] = React.useState(0)
  const [variants, setVariants] = React.useState<Variant[]>([])
  const [processing, setProcessing] = React.useState(false)
  const [message, setMessage] = React.useState('Choose a character image to create local optimized variants. Nothing is uploaded.')
  const objectUrls = React.useRef<string[]>([])

  React.useEffect(() => () => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const clearVariantUrls = () => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url))
    objectUrls.current = []
    setVariants([])
  }

  const optimize = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setMessage('Choose an image file: PNG, JPEG, WebP, GIF or SVG.')
      return
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setMessage('Choose a source image smaller than 12 MB.')
      return
    }

    setProcessing(true)
    setMessage('Optimizing locally…')
    clearVariantUrls()
    try {
      const sourceUrl = URL.createObjectURL(file)
      const image = new Image()
      image.src = sourceUrl
      await image.decode()

      if (!image.naturalWidth || !image.naturalHeight) throw new Error('Image dimensions could not be read.')
      if (image.naturalWidth > 12000 || image.naturalHeight > 12000) throw new Error('Image dimensions are too large for safe browser processing.')

      const next: Variant[] = []
      for (const size of TARGET_SIZES) {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas processing is unavailable in this browser.')

        context.clearRect(0, 0, size, size)
        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'

        const inset = Math.round(size * 0.04)
        const available = size - inset * 2
        const scale = Math.min(available / image.naturalWidth, available / image.naturalHeight)
        const width = Math.max(1, Math.round(image.naturalWidth * scale))
        const height = Math.max(1, Math.round(image.naturalHeight * scale))
        const x = Math.round((size - width) / 2)
        const y = Math.round((size - height) / 2)
        context.drawImage(image, x, y, width, height)

        const pngBlob = await canvasBlob(canvas, 'image/png')
        if (!pngBlob) throw new Error(`Could not create ${size}px PNG.`)
        const pngUrl = URL.createObjectURL(pngBlob)
        objectUrls.current.push(pngUrl)

        const webpBlob = await canvasBlob(canvas, 'image/webp', 0.88)
        const webpUrl = webpBlob ? URL.createObjectURL(webpBlob) : null
        if (webpUrl) objectUrls.current.push(webpUrl)

        next.push({
          size,
          pngUrl,
          pngBytes: pngBlob.size,
          webpUrl,
          webpBytes: webpBlob?.size ?? null,
        })
      }

      URL.revokeObjectURL(sourceUrl)
      setSourceName(file.name)
      setSourceBytes(file.size)
      setVariants(next)
      const totalPng = next.reduce((sum, item) => sum + item.pngBytes, 0)
      setMessage(`Created ${next.length} transparent PNG sizes${next.every((item) => item.webpUrl) ? ' plus WebP variants' : ''}. PNG total: ${formatBytes(totalPng)}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not optimize this image.')
    } finally {
      setProcessing(false)
    }
  }

  const useAsBuddy = async () => {
    const variant = variants.find((item) => item.size === 512)
    if (!variant) return
    try {
      const blob = await fetch(variant.pngUrl).then((response) => response.blob())
      const imageDataUrl = await blobToDataUrl(blob)
      const raw = localStorage.getItem(BUDDY_STORAGE_KEY)
      const current = raw ? JSON.parse(raw) as StoredBuddy : {}
      const next: StoredBuddy = {
        ...current,
        imageDataUrl,
        assetLabel: `${sourceName || 'Local character'} · optimized 512px`,
        assetSourceUrl: '',
        assetLicense: 'User-supplied asset · locally optimized by AppForge',
      }
      localStorage.setItem(BUDDY_STORAGE_KEY, JSON.stringify(next))
      window.dispatchEvent(new CustomEvent('appforge:desktop-buddy-updated'))
      setMessage('Optimized 512px PNG is now the active Desktop Buddy character.')
    } catch {
      setMessage('The optimized image could not be saved to Desktop Buddy browser storage.')
    }
  }

  return (
    <section className="mx-auto mt-6 w-full max-w-6xl rounded-3xl border bg-card p-5 shadow-sm md:p-6" aria-label="Desktop Buddy asset optimizer">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2"><ImagePlus className="h-5 w-5" /><h2 className="font-semibold">Local asset optimizer</h2></div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">Prepare lightweight character assets entirely in your browser. AppForge fits the source inside transparent square canvases and exports 128, 256 and 512 pixel PNGs, with WebP alternatives when the browser supports them.</p>
        </div>
        <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium hover:bg-accent">
          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {processing ? 'Optimizing…' : 'Choose source image'}
          <input type="file" accept="image/*" disabled={processing} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void optimize(file); event.target.value = '' }} />
        </label>
      </div>

      <div aria-live="polite" className="mt-3 text-xs text-muted-foreground">{message}</div>
      {sourceName && <div className="mt-1 text-[11px] text-muted-foreground">Source: {sourceName} · {formatBytes(sourceBytes)}</div>}

      {variants.length > 0 && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {variants.map((variant) => (
              <article key={variant.size} className="overflow-hidden rounded-2xl border bg-background/45">
                <div className="grid aspect-square place-items-center bg-muted/35 p-3"><img src={variant.pngUrl} alt={`${variant.size}px optimized preview`} className="h-full w-full object-contain" /></div>
                <div className="space-y-3 p-3">
                  <div><div className="text-sm font-semibold">{variant.size} × {variant.size}</div><div className="mt-0.5 text-[11px] text-muted-foreground">PNG {formatBytes(variant.pngBytes)} · WebP {formatBytes(variant.webpBytes)}</div></div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => downloadUrl(variant.pngUrl, `${safeStem(sourceName)}-${variant.size}.png`)} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold hover:bg-accent"><Download className="h-3.5 w-3.5" /> PNG</button>
                    <button type="button" disabled={!variant.webpUrl} onClick={() => variant.webpUrl && downloadUrl(variant.webpUrl, `${safeStem(sourceName)}-${variant.size}.webp`)} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold hover:bg-accent disabled:opacity-40"><Download className="h-3.5 w-3.5" /> WebP</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background/45 p-3">
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground">Use the optimized 512px PNG as the persistent companion image. This updates only browser-local Desktop Buddy storage and keeps your source file on this device.</p>
            <button type="button" onClick={() => void useAsBuddy()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Check className="h-4 w-4" /> Use 512px in Buddy</button>
          </div>
        </>
      )}
    </section>
  )
}

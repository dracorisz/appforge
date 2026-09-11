import React from 'react'
import { Check, Download, Eraser, ImagePlus, Loader2, WandSparkles } from 'lucide-react'

const BUDDY_STORAGE_KEY = 'appforge-desktop-buddy-v1'
const MAX_IMAGE_BYTES = 12 * 1024 * 1024
const MAX_EDGE = 2048

type SourceImage = {
  name: string
  dataUrl: string
}

type RepairResult = {
  dataUrl: string
  blob: Blob
  width: number
  height: number
  transparentPercent: number
  backgroundColors: Array<[number, number, number]>
}

const readAsDataUrl = (file: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(reader.error || new Error('Could not read image.'))
  reader.readAsDataURL(file)
})

const canvasBlob = (canvas: HTMLCanvasElement) => new Promise<Blob>((resolve, reject) => {
  canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not encode repaired PNG.')), 'image/png')
})

const distance = (r: number, g: number, b: number, color: [number, number, number]) => {
  const dr = r - color[0]
  const dg = g - color[1]
  const db = b - color[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

const quantizeKey = (r: number, g: number, b: number) => `${Math.round(r / 24) * 24},${Math.round(g / 24) * 24},${Math.round(b / 24) * 24}`

const edgeColors = (pixels: Uint8ClampedArray, width: number, height: number) => {
  const counts = new Map<string, number>()
  const add = (x: number, y: number) => {
    const index = (y * width + x) * 4
    if (pixels[index + 3] < 245) return
    const key = quantizeKey(pixels[index], pixels[index + 1], pixels[index + 2])
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  const stepX = Math.max(1, Math.floor(width / 80))
  const stepY = Math.max(1, Math.floor(height / 80))
  const bandX = Math.max(2, Math.floor(width * 0.035))
  const bandY = Math.max(2, Math.floor(height * 0.035))

  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < bandX; x += Math.max(1, Math.floor(bandX / 3))) add(x, y)
    for (let x = width - 1; x >= Math.max(0, width - bandX); x -= Math.max(1, Math.floor(bandX / 3))) add(x, y)
  }
  for (let x = 0; x < width; x += stepX) {
    for (let y = 0; y < bandY; y += Math.max(1, Math.floor(bandY / 3))) add(x, y)
    for (let y = height - 1; y >= Math.max(0, height - bandY); y -= Math.max(1, Math.floor(bandY / 3))) add(x, y)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key]) => key.split(',').map(Number) as [number, number, number])
}

const repairTransparency = async (source: SourceImage, tolerance: number): Promise<RepairResult> => {
  const image = new Image()
  image.src = source.dataUrl
  await image.decode()
  if (!image.naturalWidth || !image.naturalHeight) throw new Error('Image dimensions could not be read.')

  const longest = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas pixel processing is unavailable in this browser.')
  context.clearRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  const frame = context.getImageData(0, 0, width, height)
  const pixels = frame.data
  const colors = edgeColors(pixels, width, height)
  if (!colors.length) throw new Error('Could not estimate the image background from its edges.')

  const feather = Math.max(8, tolerance * 0.65)
  let transparent = 0
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 245) {
      transparent += 1
      continue
    }
    let nearest = Number.POSITIVE_INFINITY
    for (const color of colors) nearest = Math.min(nearest, distance(pixels[index], pixels[index + 1], pixels[index + 2], color))
    if (nearest <= tolerance) {
      pixels[index + 3] = 0
      transparent += 1
    } else if (nearest < tolerance + feather) {
      const alpha = Math.round(255 * ((nearest - tolerance) / feather))
      pixels[index + 3] = Math.min(pixels[index + 3], alpha)
      if (alpha < 245) transparent += 1
    }
  }

  context.putImageData(frame, 0, 0)
  const blob = await canvasBlob(canvas)
  const dataUrl = await readAsDataUrl(blob)
  return {
    dataUrl,
    blob,
    width,
    height,
    transparentPercent: (transparent / (width * height)) * 100,
    backgroundColors: colors,
  }
}

const downloadResult = (result: RepairResult, name: string) => {
  const url = URL.createObjectURL(result.blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'desktop-buddy'}-transparent.png`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function DesktopBuddyTransparencyLab() {
  const [source, setSource] = React.useState<SourceImage | null>(null)
  const [result, setResult] = React.useState<RepairResult | null>(null)
  const [tolerance, setTolerance] = React.useState(38)
  const [processing, setProcessing] = React.useState(false)
  const [message, setMessage] = React.useState('Use this when an AI model paints gray/white checkerboard squares instead of returning real transparent pixels.')

  const loadActiveBuddy = () => {
    try {
      const raw = localStorage.getItem(BUDDY_STORAGE_KEY)
      const current = raw ? JSON.parse(raw) as { imageDataUrl?: string; assetLabel?: string } : null
      if (!current?.imageDataUrl) throw new Error('No active Desktop Buddy image is stored in this browser.')
      setSource({ name: current.assetLabel || 'active-desktop-buddy', dataUrl: current.imageDataUrl })
      setResult(null)
      setMessage('Loaded the active Desktop Buddy. Run background repair and inspect the preview before applying it.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load the active Desktop Buddy.')
    }
  }

  const importImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setMessage('Choose a PNG, WebP, JPEG, GIF, or SVG image.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMessage('Choose an image smaller than 12 MB.')
      return
    }
    try {
      setSource({ name: file.name, dataUrl: await readAsDataUrl(file) })
      setResult(null)
      setMessage('Image loaded locally. Run repair to convert the edge/background colors into real alpha transparency.')
    } catch {
      setMessage('That image could not be loaded.')
    }
  }

  const runRepair = async () => {
    if (!source || processing) return
    setProcessing(true)
    setMessage('Detecting dominant edge colors and converting the background to alpha…')
    try {
      const next = await repairTransparency(source, tolerance)
      setResult(next)
      const colors = next.backgroundColors.map((color) => `rgb(${color.join(', ')})`).join(' · ')
      setMessage(`Repair created real alpha on ${next.transparentPercent.toFixed(1)}% of pixels. Edge colors: ${colors}. Inspect the preview before applying.`)
    } catch (error) {
      setResult(null)
      setMessage(error instanceof Error ? error.message : 'Background repair failed.')
    } finally {
      setProcessing(false)
    }
  }

  const applyToBuddy = () => {
    if (!result || !source) return
    try {
      const raw = localStorage.getItem(BUDDY_STORAGE_KEY)
      const current = raw ? JSON.parse(raw) as Record<string, unknown> : {}
      localStorage.setItem(BUDDY_STORAGE_KEY, JSON.stringify({
        ...current,
        imageDataUrl: result.dataUrl,
        assetLabel: `${source.name} · transparency repaired`,
        assetSourceUrl: '',
        assetLicense: typeof current.assetLicense === 'string' ? current.assetLicense : 'User-supplied or AI-generated asset',
        transparencyRepair: {
          tolerance,
          transparentPercent: Number(result.transparentPercent.toFixed(2)),
          repairedAt: new Date().toISOString(),
        },
      }))
      window.dispatchEvent(new Event('appforge:desktop-buddy-updated'))
      setMessage('Repaired PNG is now the active Desktop Buddy. The checkerboard/background pixels are stored as actual alpha.')
    } catch {
      setMessage('The repaired image is too large for Desktop Buddy browser storage. Download the PNG and optimize it in the Local Asset Optimizer.')
    }
  }

  return (
    <section className="mx-auto mt-6 w-full max-w-6xl rounded-3xl border bg-card p-5 shadow-sm md:p-6" aria-label="Desktop Buddy transparency repair">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2"><Eraser className="h-5 w-5" /><h2 className="font-semibold">Transparency repair</h2></div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">Some image models draw a checkerboard pattern even when asked for transparency. This local tool samples dominant edge colors, removes matching background pixels, feathers the edge, and exports a PNG with a real alpha channel. Nothing is uploaded.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={loadActiveBuddy} className="inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium hover:bg-accent"><WandSparkles className="h-4 w-4" /> Use active Buddy</button>
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-medium hover:bg-accent"><ImagePlus className="h-4 w-4" /> Choose image<input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importImage(file); event.currentTarget.value = '' }} /></label>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="rounded-2xl border bg-background/45 p-3">
          <div className="text-xs font-medium text-foreground">Background tolerance: {tolerance}</div>
          <input type="range" min="14" max="78" step="2" value={tolerance} onChange={(event) => setTolerance(Number(event.target.value))} className="mt-2 w-full" />
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Lower values preserve more of the character; higher values remove more checkerboard/flat background. Re-run repair after changing this value.</p>
        </div>
        <button type="button" disabled={!source || processing} onClick={() => void runRepair()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eraser className="h-4 w-4" />} Repair background</button>
      </div>

      <div aria-live="polite" className="mt-3 text-xs text-muted-foreground">{message}</div>

      {(source || result) && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border bg-background/45">
            <div className="border-b px-3 py-2 text-xs font-medium">Source</div>
            <div className="grid aspect-square place-items-center bg-[linear-gradient(45deg,#d4d4d8_25%,transparent_25%),linear-gradient(-45deg,#d4d4d8_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#d4d4d8_75%),linear-gradient(-45deg,transparent_75%,#d4d4d8_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] p-3 dark:bg-[linear-gradient(45deg,#27272a_25%,transparent_25%),linear-gradient(-45deg,#27272a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#27272a_75%),linear-gradient(-45deg,transparent_75%,#27272a_75%)]">
              {source ? <img src={source.dataUrl} alt="Transparency repair source" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-muted-foreground">Choose an image</span>}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-background/45">
            <div className="border-b px-3 py-2 text-xs font-medium">Real-alpha preview</div>
            <div className="grid aspect-square place-items-center bg-[linear-gradient(45deg,#d4d4d8_25%,transparent_25%),linear-gradient(-45deg,#d4d4d8_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#d4d4d8_75%),linear-gradient(-45deg,transparent_75%,#d4d4d8_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] p-3 dark:bg-[linear-gradient(45deg,#27272a_25%,transparent_25%),linear-gradient(-45deg,#27272a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#27272a_75%),linear-gradient(-45deg,transparent_75%,#27272a_75%)]">
              {result ? <img src={result.dataUrl} alt="Transparency repaired preview" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-muted-foreground">Run repair to preview alpha</span>}
            </div>
          </div>
        </div>
      )}

      {result && source && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background/45 p-3">
          <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{result.width} × {result.height}</span> · {result.transparentPercent.toFixed(1)}% transparent/feathered pixels</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => downloadResult(result, source.name)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold hover:bg-accent"><Download className="h-3.5 w-3.5" /> Download PNG</button>
            <button type="button" onClick={applyToBuddy} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"><Check className="h-3.5 w-3.5" /> Use in Buddy</button>
          </div>
        </div>
      )}
    </section>
  )
}

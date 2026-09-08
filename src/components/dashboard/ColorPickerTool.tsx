import React from 'react'
import { Check, Copy, ImagePlus, Palette, ShieldCheck, Upload } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'

type RGB = { r: number; g: number; b: number }

const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)))
const rgbToHex = ({ r, g, b }: RGB) => `#${[r, g, b].map((value) => clamp(value).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
const hexToRgb = (hex: string): RGB => {
  const clean = hex.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(clean)) throw new Error('Use a six-digit HEX color.')
  return { r: parseInt(clean.slice(0, 2), 16), g: parseInt(clean.slice(2, 4), 16), b: parseInt(clean.slice(4, 6), 16) }
}

const rgbToHsl = ({ r, g, b }: RGB) => {
  const red = r / 255; const green = g / 255; const blue = b / 255
  const max = Math.max(red, green, blue); const min = Math.min(red, green, blue)
  let h = 0; let s = 0; const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === red) h = (green - blue) / d + (green < blue ? 6 : 0)
    else if (max === green) h = (blue - red) / d + 2
    else h = (red - green) / d + 4
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

const contrastColor = ({ r, g, b }: RGB) => ((r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111111' : '#FFFFFF')

export function ColorPickerTool() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [imageUrl, setImageUrl] = React.useState('')
  const [fileName, setFileName] = React.useState('')
  const [hex, setHex] = React.useState('#5B6CFF')
  const [palette, setPalette] = React.useState<string[]>([])
  const [copied, setCopied] = React.useState('')
  const [error, setError] = React.useState('')

  React.useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl) }, [imageUrl])

  const rgb = React.useMemo(() => {
    try { return hexToRgb(hex) } catch { return { r: 91, g: 108, b: 255 } }
  }, [hex])
  const hsl = rgbToHsl(rgb)

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      window.setTimeout(() => setCopied(''), 1200)
    } catch { setError('Clipboard access was blocked by the browser.') }
  }

  const drawImage = async (file: File) => {
    if (!file.type.startsWith('image/')) return setError('Choose an image file.')
    setError('')
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const maxDimension = 1600
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return setError('Canvas is unavailable in this browser.')
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      if (imageUrl) URL.revokeObjectURL(imageUrl)
      setImageUrl(url)
      setFileName(file.name)
      extractPalette(context, canvas.width, canvas.height)
    }
    image.onerror = () => { URL.revokeObjectURL(url); setError('The browser could not decode this image.') }
    image.src = url
  }

  const extractPalette = (context: CanvasRenderingContext2D, width: number, height: number) => {
    const sampleCanvas = document.createElement('canvas')
    sampleCanvas.width = 72; sampleCanvas.height = 72
    const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true })
    if (!sampleContext) return
    sampleContext.drawImage(context.canvas, 0, 0, width, height, 0, 0, 72, 72)
    const data = sampleContext.getImageData(0, 0, 72, 72).data
    const counts = new Map<string, number>()
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] < 180) continue
      const quantized = rgbToHex({ r: Math.round(data[index] / 32) * 32, g: Math.round(data[index + 1] / 32) * 32, b: Math.round(data[index + 2] / 32) * 32 })
      counts.set(quantized, (counts.get(quantized) || 0) + 1)
    }
    setPalette([...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([color]) => color))
  }

  const pickFromCanvas = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor((event.clientX - rect.left) * canvas.width / rect.width)))
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((event.clientY - rect.top) * canvas.height / rect.height)))
    const pixel = canvas.getContext('2d', { willReadFrequently: true })?.getImageData(x, y, 1, 1).data
    if (pixel) setHex(rgbToHex({ r: pixel[0], g: pixel[1], b: pixel[2] }))
  }

  const updateHex = (value: string) => {
    const normalized = value.startsWith('#') ? value : `#${value}`
    setHex(normalized.toUpperCase())
  }

  const values = [
    ['HEX', hex.toUpperCase()],
    ['RGB', `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`],
    ['HSL', `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`],
  ]

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight text-foreground">Color Picker</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Choose a color directly or sample pixels from a local image. Copy HEX, RGB, HSL, and a compact extracted palette.</p></div><span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Browser-local</span></div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-foreground">Image sampling</h2><p className="mt-0.5 text-xs text-muted-foreground">Click anywhere on the image to sample that pixel.</p></div><Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> {imageUrl ? 'Replace image' : 'Load image'}</Button></div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void drawImage(file); event.currentTarget.value = '' }} />
          <div className="mt-4 overflow-hidden rounded-xl border border-border/70 bg-muted/30">
            <canvas ref={canvasRef} onClick={pickFromCanvas} className={`max-h-[34rem] w-full object-contain ${imageUrl ? 'cursor-crosshair' : 'hidden'}`} />
            {!imageUrl && <button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-h-72 w-full flex-col items-center justify-center p-8 text-center text-muted-foreground hover:bg-accent/30"><ImagePlus className="h-6 w-6" /><span className="mt-3 text-sm font-medium text-foreground">Choose an image</span><span className="mt-1 text-xs">PNG, JPEG, WebP, GIF, or another browser-supported format</span></button>}
          </div>
          {fileName && <p className="mt-2 truncate text-xs text-muted-foreground">{fileName}</p>}
          {palette.length > 0 && <div className="mt-4"><div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Palette className="h-3.5 w-3.5" /> Extracted palette</div><div className="grid grid-cols-4 gap-2 sm:grid-cols-8">{palette.map((color) => <button key={color} type="button" onClick={() => setHex(color)} title={color} className="aspect-square rounded-lg border border-border/70 shadow-sm transition-colors hover:border-foreground/25" style={{ backgroundColor: color }} />)}</div></div>}
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-foreground">Selected color</h2>
          <div className="mt-4 aspect-[16/8] rounded-xl border border-border/70 shadow-inner" style={{ backgroundColor: hex }} />
          <div className="mt-4 grid gap-3 sm:grid-cols-[5rem_1fr]"><input type="color" value={/^#[0-9A-F]{6}$/i.test(hex) ? hex : '#5B6CFF'} onChange={(event) => setHex(event.target.value.toUpperCase())} className="h-10 w-full cursor-pointer rounded-lg border border-border bg-transparent p-1" /><Input value={hex} onChange={(event) => updateHex(event.target.value)} aria-label="HEX color" /></div>
          <div className="mt-4 space-y-2">{values.map(([label, value]) => <div key={label} className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/35 p-3"><div className="w-10 text-[11px] font-medium text-muted-foreground">{label}</div><code className="min-w-0 flex-1 truncate text-xs text-foreground">{value}</code><button onClick={() => void copy(label, value)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={`Copy ${label}`}>{copied === label ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button></div>)}</div>
          <div className="mt-4 rounded-xl border border-border/70 p-3" style={{ backgroundColor: hex, color: contrastColor(rgb) }}><div className="text-sm font-semibold">Contrast preview</div><div className="mt-1 text-xs opacity-80">Automatic black/white foreground preview for quick UI checks.</div></div>
          {error && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}
        </Card>
      </div>
    </div>
  )
}

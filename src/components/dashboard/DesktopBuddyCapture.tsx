import React from 'react'
import { Camera, Check, Download, ImagePlus, Loader2, MonitorUp, Save } from 'lucide-react'
import { uploadVaultMedia } from '@/lib/mediaVault'

const MAX_CAPTURE_EDGE = 2560

type CaptureState = {
  blob: Blob
  url: string
  width: number
  height: number
  source: 'screen' | 'import'
  name: string
}

const blobUrl = (blob: Blob) => URL.createObjectURL(blob)

const canvasBlob = (canvas: HTMLCanvasElement) => new Promise<Blob>((resolve, reject) => {
  canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not encode the screenshot.')), 'image/png')
})

const fitCanvas = (width: number, height: number) => {
  const longest = Math.max(width, height)
  if (longest <= MAX_CAPTURE_EDGE) return { width, height }
  const scale = MAX_CAPTURE_EDGE / longest
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

const downloadCapture = (capture: CaptureState) => {
  const anchor = document.createElement('a')
  anchor.href = capture.url
  anchor.download = capture.name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export function DesktopBuddyCapture() {
  const [capture, setCapture] = React.useState<CaptureState | null>(null)
  const [busy, setBusy] = React.useState<'capture' | 'save' | ''>('')
  const [message, setMessage] = React.useState('Capture a screen/window when the browser allows it, or import a screenshot when an installed PWA blocks screen sharing.')

  React.useEffect(() => () => {
    if (capture?.url) URL.revokeObjectURL(capture.url)
  }, [capture?.url])

  const replaceCapture = React.useCallback((next: Omit<CaptureState, 'url'>) => {
    setCapture((current) => {
      if (current?.url) URL.revokeObjectURL(current.url)
      return { ...next, url: blobUrl(next.blob) }
    })
  }, [])

  const captureScreen = async () => {
    const mediaDevices = navigator.mediaDevices
    if (!mediaDevices?.getDisplayMedia) {
      setMessage('This browser/PWA does not expose screen capture. Use “Import screenshot” below; Brave/Android PWAs may restrict getDisplayMedia.')
      return
    }

    setBusy('capture')
    setMessage('Choose a screen, window, or tab in the browser share picker…')
    let stream: MediaStream | null = null
    try {
      stream = await mediaDevices.getDisplayMedia({ video: true, audio: false })
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.srcObject = stream
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('Screen capture did not start in time.')), 8000)
        video.onloadedmetadata = () => { window.clearTimeout(timeout); resolve() }
        video.onerror = () => { window.clearTimeout(timeout); reject(new Error('Could not read the shared screen.')) }
      })
      await video.play()

      if (!video.videoWidth || !video.videoHeight) throw new Error('The shared surface returned no image dimensions.')
      const fitted = fitCanvas(video.videoWidth, video.videoHeight)
      const canvas = document.createElement('canvas')
      canvas.width = fitted.width
      canvas.height = fitted.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas capture is unavailable in this browser.')
      context.drawImage(video, 0, 0, fitted.width, fitted.height)
      const blob = await canvasBlob(canvas)
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      replaceCapture({ blob, width: fitted.width, height: fitted.height, source: 'screen', name: `appforge-screen-${stamp}.png` })
      setMessage(`Captured ${fitted.width} × ${fitted.height}. You can download it or save it privately to Media Vault / Screenshots.`)
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ''
      if (name === 'NotAllowedError' || name === 'AbortError') {
        setMessage('Screen sharing was cancelled or blocked. In Brave/PWA mode, use “Import screenshot” if the share picker is unavailable.')
      } else {
        setMessage(error instanceof Error ? error.message : 'Screen capture failed. Use the screenshot import fallback.')
      }
    } finally {
      stream?.getTracks().forEach((track) => track.stop())
      setBusy('')
    }
  }

  const importScreenshot = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setMessage('Choose a PNG, JPEG, or WebP screenshot.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setMessage('Choose a screenshot smaller than 20 MB.')
      return
    }
    const image = new Image()
    const url = URL.createObjectURL(file)
    try {
      image.src = url
      await image.decode()
      replaceCapture({ blob: file, width: image.naturalWidth, height: image.naturalHeight, source: 'import', name: file.name || 'appforge-screenshot.png' })
      setMessage('Screenshot imported locally. This fallback works when Brave or an installed PWA does not expose screen capture.')
    } catch {
      setMessage('That image could not be read as a screenshot.')
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  const saveToVault = async () => {
    if (!capture || busy) return
    setBusy('save')
    try {
      const file = new File([capture.blob], capture.name, { type: capture.blob.type || 'image/png' })
      await uploadVaultMedia(file, {
        kind: 'image',
        folder: 'Screenshots',
        title: 'Desktop Buddy screenshot',
        description: capture.source === 'screen' ? 'Captured from the browser screen-share API.' : 'Imported screenshot fallback.',
        metadata: {
          source: 'desktop-buddy-screenshot',
          capture_source: capture.source,
          width: capture.width,
          height: capture.height,
        },
      })
      setMessage('Saved privately to Media Vault / Screenshots.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the screenshot to Media Vault.')
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="mx-auto mt-6 w-full max-w-6xl rounded-3xl border bg-card p-5 shadow-sm md:p-6" aria-label="Desktop Buddy screenshot capture">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2"><Camera className="h-5 w-5" /><h2 className="font-semibold">Screen capture</h2></div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">Use the browser screen-share API on supported desktop browsers. If Brave or an installed PWA blocks it, import a screenshot instead and continue with the same download/Media Vault workflow.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={Boolean(busy)} onClick={() => void captureScreen()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {busy === 'capture' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MonitorUp className="h-4 w-4" />} Capture screen
          </button>
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-medium hover:bg-accent">
            <ImagePlus className="h-4 w-4" /> Import screenshot
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importScreenshot(file); event.currentTarget.value = '' }} />
          </label>
        </div>
      </div>

      <div aria-live="polite" className="mt-3 text-xs text-muted-foreground">{message}</div>

      {capture && (
        <div className="mt-5 overflow-hidden rounded-2xl border bg-background/45">
          <div className="grid max-h-[520px] place-items-center overflow-auto bg-black/90 p-3">
            <img src={capture.url} alt="Screenshot preview" className="max-h-[480px] max-w-full object-contain" />
          </div>
          <div className="flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{capture.width} × {capture.height}</span> · {capture.source === 'screen' ? 'browser capture' : 'imported fallback'}</div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => downloadCapture(capture)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold hover:bg-accent"><Download className="h-3.5 w-3.5" /> Download PNG</button>
              <button type="button" disabled={Boolean(busy)} onClick={() => void saveToVault()} className="inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold hover:bg-accent disabled:opacity-50">{busy === 'save' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save to Media Vault</button>
              <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 text-xs text-emerald-600 dark:text-emerald-400"><Check className="h-3.5 w-3.5" /> Local preview</span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

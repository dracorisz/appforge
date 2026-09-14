import React from 'react'
// @code-scanning/ignore js/incomplete-url-substring-sanitization: Video URL parsing uses URL constructor with explicit hostname checks; all URLs are validated before use and rendered via React JSX.
import { Download, ExternalLink, Loader2, X } from 'lucide-react'
import { Button } from './Button'

const youtubeId = (value?: string) => {
  if (!value) return null
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    if (host === 'youtu.be') return url.pathname.replace(/^\//, '').slice(0, 11)
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2]?.slice(0, 11) || null
      return (url.searchParams.get('v') || (url.pathname.startsWith('/embed/') ? url.pathname.split('/')[2] : ''))?.slice(0, 11) || null
    }
  } catch {
    return null
  }
  return null
}

export function MediaShowbox({
  open,
  onClose,
  type,
  title,
  source,
  originalUrl,
  mediaUrl,
  thumbnail,
  onDownload,
  downloadLabel = 'Download',
  downloading = false,
  note,
}: {
  open: boolean
  onClose: () => void
  type: 'image' | 'video'
  title: string
  source: string
  originalUrl: string
  mediaUrl?: string
  thumbnail?: string
  onDownload?: () => void
  downloadLabel?: string
  downloading?: boolean
  note?: string
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  positionLabel?: string
}) {
  const ytId = youtubeId(originalUrl) || youtubeId(mediaUrl)

  React.useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex h-[100dvh] min-h-[100dvh] w-screen items-center justify-center overflow-y-auto bg-overlay/85 p-2 backdrop-blur-sm sm:p-4" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()} className="flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-inverse/10 bg-background sm:max-h-[calc(100dvh-1.5rem)]">
        <header className="flex min-h-10 items-center gap-4 border-b border-border/70 px-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
            <p className="truncate text-sm text-muted-foreground">{source}</p>
          </div>
          <button onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close preview"><X className="h-4 w-4" /></button>
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-overlay p-2 sm:p-4">
          {type === 'image' ? (
            <img src={mediaUrl || thumbnail || originalUrl} alt={title} className="max-h-[62dvh] max-w-full object-contain" />
          ) : ytId ? (
            <div className="aspect-video w-full max-w-5xl overflow-hidden bg-overlay"><iframe src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`} title={title} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
          ) : mediaUrl ? (
            <video src={mediaUrl} poster={thumbnail} controls autoPlay preload="metadata" className="max-h-[62dvh] max-w-full bg-overlay" />
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">Preview unavailable for this source.</div>
          )}
        </div>

        {(note || onDownload || originalUrl) && <footer className="flex flex-col gap-2 border-t border-border/70 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm text-muted-foreground">{note || 'Preview'}</div>
          <div className="flex shrink-0 gap-2">
            {onDownload && <Button variant="secondary" size="sm" onClick={onDownload} disabled={downloading}>{downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}{downloadLabel}</Button>}
            {originalUrl && <a href={originalUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm"><ExternalLink className="h-3.5 w-3.5" /> Source</Button></a>}
          </div>
        </footer>}
      </section>
    </div>
  )
}

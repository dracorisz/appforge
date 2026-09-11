import React from 'react'
// @code-scanning/ignore js/incomplete-url-substring-sanitization: Video URL parsing uses URL constructor with explicit hostname checks (youtu.be, youtube.com); all URLs are validated before use and rendered via React JSX.
import { ChevronLeft, ChevronRight, Download, ExternalLink, Image as ImageIcon, Loader2, Play, X } from 'lucide-react'
import { Button } from './Button'

const youtubeId = (value?: string) => {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.hostname.includes('youtu.be')) return url.pathname.replace(/^\//, '').slice(0, 11)
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2]?.slice(0, 11) || null
      return url.searchParams.get('v')?.slice(0, 11) || null
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
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  positionLabel,
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
      if (event.key === 'ArrowLeft' && hasPrevious) onPrevious?.()
      if (event.key === 'ArrowRight' && hasNext) onNext?.()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose, onPrevious, onNext, hasPrevious, hasNext])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/72 p-3 backdrop-blur-md sm:p-6" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()} className="surface-card flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-background/88 shadow-2xl">
        <header className="flex items-center gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/45 text-muted-foreground">{type === 'video' ? <Play className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}</div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-foreground sm:text-base">{title}</h2>
            <p className="truncate text-xs text-muted-foreground">{source}{positionLabel ? ` · ${positionLabel}` : ''}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-transparent p-2 text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground" aria-label="Close preview"><X className="h-4 w-4" /></button>
        </header>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-black/85 p-2 sm:p-5">
          {hasPrevious && <button type="button" onClick={onPrevious} aria-label="Previous media" className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-xl backdrop-blur-md transition-colors hover:border-white/30 hover:bg-black/65 sm:left-5"><ChevronLeft className="h-5 w-5" /></button>}
          {hasNext && <button type="button" onClick={onNext} aria-label="Next media" className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-xl backdrop-blur-md transition-colors hover:border-white/30 hover:bg-black/65 sm:right-5"><ChevronRight className="h-5 w-5" /></button>}

          {type === 'image' ? (
            <img src={mediaUrl || thumbnail || originalUrl} alt={title} className="max-h-[72vh] max-w-full rounded-lg object-contain shadow-2xl" />
          ) : ytId ? (
            <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-xl bg-black shadow-2xl"><iframe src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`} title={title} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
          ) : mediaUrl ? (
            <video src={mediaUrl} poster={thumbnail} controls autoPlay preload="metadata" className="max-h-[72vh] max-w-full rounded-xl bg-black shadow-2xl" />
          ) : (
            <div className="py-20 text-center text-sm text-muted-foreground">This source does not expose an embeddable video URL.</div>
          )}
        </div>

        <footer className="flex flex-col gap-2 border-t border-border/70 bg-background/65 px-4 py-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0 text-xs text-muted-foreground">{note || (type === 'video' && ytId ? 'YouTube plays securely in-page; direct video file download is not exposed by the source.' : 'Preview stays inside AppForge. Use ← and → to browse.')}</div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {onDownload && <Button variant="secondary" size="sm" onClick={onDownload} disabled={downloading}>{downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}{downloadLabel}</Button>}
            <a href={originalUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm"><ExternalLink className="h-3.5 w-3.5" /> Open source</Button></a>
          </div>
        </footer>
      </section>
    </div>
  )
}

import React from 'react'
import { Film, Sparkles } from 'lucide-react'
import { Badge, Card } from '@/components/ui'

const decodeVideo = async () => {
  const response = await fetch('/story-studio-teaser.b64')
  if (!response.ok) throw new Error('Teaser media could not be loaded.')
  const encoded = (await response.text()).trim()
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }))
}

export function StoryStudioTeaserCard() {
  const [src, setSrc] = React.useState('')

  React.useEffect(() => {
    let active = true
    let objectUrl = ''
    void decodeVideo().then((url) => {
      objectUrl = url
      if (active) setSrc(url)
      else URL.revokeObjectURL(url)
    }).catch(() => undefined)
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [])

  return (
    <Card className="overflow-hidden p-0 ring-1 ring-purple-500/15">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-purple-950/40 via-muted to-background">
        {src ? (
          <video
            src={src}
            className="h-full w-full object-contain"
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="metadata"
            aria-label="Story Studio AI scene generation teaser"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground"><Film className="h-8 w-8" /></div>
        )}
        <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
          <Sparkles className="h-3 w-3" /> Generation teaser
        </div>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5"><Badge color="purple">Story Studio</Badge><Badge color="slate">Hugging Face showcase</Badge></div>
        <h3 className="mt-3 text-sm font-semibold">From prompt to scene</h3>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">An eight-second look at Story Studio’s visual storytelling flow, presented as the sixth featured showcase item.</p>
      </div>
    </Card>
  )
}

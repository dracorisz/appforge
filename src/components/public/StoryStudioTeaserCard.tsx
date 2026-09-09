import { ExternalLink, Sparkles } from 'lucide-react'
import { Badge, Card } from '@/components/ui'

const TEASER_VIDEO_ID = '5dAQXJXbvhI'
const TEASER_WATCH_URL = `https://youtu.be/${TEASER_VIDEO_ID}`
const TEASER_EMBED_URL = `https://www.youtube.com/embed/${TEASER_VIDEO_ID}?rel=0&modestbranding=1`

export function StoryStudioTeaserCard() {
  return (
    <Card className="overflow-hidden p-0 ring-1 ring-purple-500/15">
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-purple-950/40 via-muted to-background">
        <iframe
          src={TEASER_EMBED_URL}
          title="Dragon Arena teaser — AppForge Story Studio"
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
          <Sparkles className="h-3 w-3" /> Generation teaser
        </div>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5"><Badge color="purple">Story Studio</Badge><Badge color="slate">YouTube showcase</Badge></div>
        <h3 className="mt-3 text-sm font-semibold">Dragon Arena teaser</h3>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">A short look at Story Studio’s visual storytelling direction, featured as the sixth showcase item.</p>
        <a
          href={TEASER_WATCH_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/80 hover:text-foreground"
        >
          Watch on YouTube <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </Card>
  )
}

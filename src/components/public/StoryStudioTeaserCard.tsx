import { ExternalLink, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui'

const TEASER_VIDEO_ID = '5dAQXJXbvhI'
const TEASER_WATCH_URL = `https://youtu.be/${TEASER_VIDEO_ID}`
const TEASER_EMBED_URL = `https://www.youtube.com/embed/${TEASER_VIDEO_ID}?rel=0&modestbranding=1`

export function StoryStudioTeaserCard() {
  return (
    <article className="group overflow-hidden rounded-xl border border-white/10 bg-[#080d16] transition-transform duration-200 hover:-translate-y-0.5">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        <iframe
          src={TEASER_EMBED_URL}
          title="Dragon Arena teaser — AppForge Story Studio"
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent px-4 pb-4 pt-8 sm:px-4 sm:pb-4">
          <div className="mb-2 flex flex-wrap gap-2"><Badge color="purple">Story Studio</Badge><Badge color="slate">YouTube</Badge></div>
          <h3 className="text-sm font-semibold tracking-tight text-white sm:text-lg">Dragon Arena teaser</h3>
          <p className="mt-2 text-xs text-white/55">Visual storytelling showcase</p>
        </div>
        <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/55 px-2 py-2 text-xs font-medium text-white backdrop-blur-sm">
          <Sparkles className="h-3 w-3" /> Teaser
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-4">
        <p className="line-clamp-1 text-xs text-white/50">A short look at Story Studio’s visual direction.</p>
        <a href={TEASER_WATCH_URL} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-2 py-2 text-xs font-medium text-white/75 backdrop-blur hover:bg-white/10 hover:text-white">
          Watch <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  )
}

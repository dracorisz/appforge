import { ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui";

const TEASER_VIDEO_ID = "5dAQXJXbvhI";
const TEASER_WATCH_URL = `https://youtu.be/${TEASER_VIDEO_ID}`;
const TEASER_EMBED_URL = `https://www.youtube.com/embed/${TEASER_VIDEO_ID}?rel=0&modestbranding=1`;

export function StoryStudioTeaserCard() {
  return (
    <article className="group overflow-hidden rounded-xl border border-inverse/10 bg-[#080d16] transition-transform duration-200 hover:-translate-y-0.5">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <iframe src={TEASER_EMBED_URL} title="Dragon Arena teaser — AppForge Story Studio" className="h-full w-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-overlay/90 via-overlay/20 to-transparent px-4 pb-4 pt-8 sm:px-4 sm:pb-4">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge color="purple">Story Studio</Badge>
            <Badge color="slate">YouTube</Badge>
          </div>
          <h3 className="text-sm font-semibold tracking-tight text-inverse sm:text-lg">Dragon Arena teaser</h3>
          <p className="mt-2 text-sm text-inverse/55">Visual storytelling showcase</p>
        </div>
        <Badge className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-2 rounded-xl border border-inverse/15 bg-overlay/55 px-2 py-2 text-sm font-medium text-inverse backdrop-blur-sm">
          <Sparkles className="h-3 w-3" /> Teaser
        </Badge>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-inverse/10 px-4 py-4">
        <p className="line-clamp-1 text-sm text-inverse/50">A short look at Story Studio’s visual direction.</p>
        <a href={TEASER_WATCH_URL} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-inverse/10 bg-overlay/35 px-2 py-2 text-sm font-medium text-inverse/75 backdrop-blur hover:bg-inverse/10 hover:text-inverse">
          Watch <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}

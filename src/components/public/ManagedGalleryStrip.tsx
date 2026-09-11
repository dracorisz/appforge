import React from 'react'
import { ArrowLeft, ArrowRight, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react'
import { loadPublishedFrontendContent, type FrontendContentRecord } from '@/lib/frontendContent'

const wrap = (value: number, length: number) => length ? (value + length) % length : 0

function ManagedSlide({ item, active, onSelect }: { item: FrontendContentRecord; active: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={`group relative shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#080d16] text-left transition-all duration-500 ${active ? 'z-10 w-[78vw] max-w-3xl scale-100 opacity-100 md:w-[58vw]' : 'w-[52vw] max-w-xl scale-[.82] opacity-45 md:w-[34vw]'}`} aria-current={active ? 'true' : undefined}>
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        {item.image_url ? <img src={item.image_url} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" loading="lazy" /> : <div className="flex h-full items-center justify-center text-white/35"><ImageIcon className="h-10 w-10" /></div>}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/65"><Sparkles className="h-3 w-3" /> Curated by AppForge</div>
          <h3 className={`${active ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'} line-clamp-2 font-semibold tracking-tight text-white`}>{item.title}</h3>
          {active && item.summary && <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/55">{item.summary}</p>}
        </div>
      </div>
    </button>
  )
}

export function ManagedGalleryStrip() {
  const [items, setItems] = React.useState<FrontendContentRecord[]>([])
  const [index, setIndex] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    loadPublishedFrontendContent('gallery_image')
      .then((records) => { if (active) setItems(records.filter((item) => Boolean(item.image_url))) })
      .catch((error) => console.warn('Managed Hugging Face gallery unavailable.', error))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  React.useEffect(() => {
    if (paused || items.length < 2) return
    const timer = window.setInterval(() => setIndex((value) => wrap(value + 1, items.length)), 5200)
    return () => window.clearInterval(timer)
  }, [items.length, paused])

  React.useEffect(() => setIndex((value) => wrap(value, items.length)), [items.length])

  if (loading) return <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-sm text-white/45"><Loader2 className="h-4 w-4 animate-spin" /> Loading curated slider…</div>
  if (!items.length) return null

  const positions = items.length === 1 ? [0] : [-1, 0, 1]
  return (
    <section>
      <div className="mb-2 flex items-end justify-between gap-3"><div><div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/45"><Sparkles className="h-4 w-4" /> Frontend content</div><h2 className="mt-1 text-xl font-semibold tracking-tight text-white">AppForge curated gallery</h2><p className="mt-1 text-sm text-white/45">Images selected in the TOTP-protected frontend content manager.</p></div><span className="text-xs text-white/40">{items.length} selected</span></div>
      <div className="relative overflow-hidden py-7" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
        <div className="flex items-center justify-center gap-0 md:gap-2">{positions.map((offset) => { const assetIndex = wrap(index + offset, items.length); return <ManagedSlide key={`${offset}-${items[assetIndex].id}`} item={items[assetIndex]} active={offset === 0} onSelect={() => setIndex(assetIndex)} /> })}</div>
        {items.length > 1 && <div className="mt-5 flex items-center justify-center gap-3"><button type="button" onClick={() => setIndex((value) => wrap(value - 1, items.length))} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/75 hover:bg-white/10" aria-label="Previous curated image"><ArrowLeft className="h-4 w-4" /></button><span className="min-w-16 text-center text-xs text-white/45">{index + 1} / {items.length}</span><button type="button" onClick={() => setIndex((value) => wrap(value + 1, items.length))} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/75 hover:bg-white/10" aria-label="Next curated image"><ArrowRight className="h-4 w-4" /></button></div>}
      </div>
    </section>
  )
}

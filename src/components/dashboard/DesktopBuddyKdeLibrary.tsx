import React from 'react'
import { Check, ExternalLink } from 'lucide-react'

const STORAGE_KEY = 'appforge-desktop-buddy-v1'

type KdeStarter = {
  id: string
  name: string
  file: string
  author: string
  license: string
  note: string
}

const TYSON_LICENSE = 'CC BY-SA · Tyson Tan / KDE Community'
const COMMUNITY_LICENSE = 'CC BY-SA 4.0 · KDE Community'

export const KDE_BUDDY_LIBRARY: KdeStarter[] = [
  { id: 'konqi-classic', name: 'Classic Konqi', file: 'Mascot_konqi.png', author: 'Tyson Tan / KDE Community', license: TYSON_LICENSE, note: 'Classic modern Konqi mascot.' },
  { id: 'konqi-kde-dev', name: 'KDE Developer Konqi', file: 'Mascot_konqi-dev-kde.png', author: 'Tyson Tan', license: TYSON_LICENSE, note: 'KDE development and engineering pose.' },
  { id: 'katie-developer', name: 'Developer Katie', file: 'Mascot_konqi-app-dev-katie.png', author: 'Tyson Tan', license: TYSON_LICENSE, note: 'Katie with laptop; useful for coding responses.' },
  { id: 'konqi-graphics', name: 'Graphics Konqi', file: 'Mascot_konqi-app-graphics.png', author: 'Tyson Tan', license: TYSON_LICENSE, note: 'Painting pose for image and creative tools.' },
  { id: 'konqi-hardware', name: 'Hardware Konqi', file: 'Mascot_konqi-app-hardware.png', author: 'Tyson Tan', license: TYSON_LICENSE, note: 'Hardware / CPU / GPU themed pose.' },
  { id: 'konqi-internet', name: 'Internet Konqi', file: 'Mascot_konqi-app-internet.png', author: 'Tyson Tan', license: TYSON_LICENSE, note: 'Internet and networking themed pose.' },
  { id: 'konqi-presentation', name: 'Presentation Konqi', file: 'Mascot_konqi-app-presentation.png', author: 'Tyson Tan', license: TYSON_LICENSE, note: 'Presentation, teaching and mentoring pose.' },
  { id: 'konqi-science', name: 'Science Konqi', file: 'Mascot_konqi-app-science.png', author: 'Tyson Tan', license: TYSON_LICENSE, note: 'Laboratory pose for experiments and AI work.' },
  { id: 'konqi-system', name: 'System Konqi', file: 'Mascot_konqi-app-system.png', author: 'Tyson Tan', license: TYSON_LICENSE, note: 'System-settings / gear themed pose.' },
  { id: 'konqi-utilities', name: 'Utilities Konqi', file: 'Mascot_konqi-app-utilities.png', author: 'Tyson Tan', license: TYSON_LICENSE, note: 'Engineering/tools pose already used by KDE Utils.' },
  { id: 'konqi-frameworks', name: 'Frameworks Konqi', file: 'Mascot_konqi-base-framework.png', author: 'Tyson Tan', license: TYSON_LICENSE, note: 'Frameworks mascot pose.' },
  { id: 'konqi-qt', name: 'Qt Konqi', file: 'Mascot_konqi-dev-qt.png', author: 'Tyson Tan', license: TYSON_LICENSE, note: 'Qt-under-the-hood developer pose.' },
  { id: 'konqi-akademy', name: 'Akademy Konqi', file: 'Mascot_konqi-commu-akademy.png', author: 'Tyson Tan / KDE Community', license: TYSON_LICENSE, note: 'Lecture / conference pose.' },
  { id: 'konqi-carrying', name: 'Carrying Konqi', file: 'Mascot_konqi-carrying_base.png', author: 'Julius Enriquez, based on Tyson Tan', license: COMMUNITY_LICENSE, note: 'Reusable carrying pose, published by KDE in 2024.' },
  { id: 'konqi-box', name: 'Third-party Box Konqi', file: 'Mascot_konqi-3rdparty.png', author: 'Julius Enriquez, based on Tyson Tan', license: COMMUNITY_LICENSE, note: 'Konqi carrying a box of items.' },
  { id: 'konqi-pixel', name: 'Pixel Konqi', file: 'Konqi_Pixel.png', author: 'KDE Community', license: COMMUNITY_LICENSE, note: 'Compact pixel-art style character.' },
  { id: 'konqi-gang', name: 'Konqi and the Gang', file: 'Konqi_and_the_Gang.png', author: 'KDE Community', license: COMMUNITY_LICENSE, note: 'Konqi, Katie and other KDE dragons.' },
  { id: 'konqi-box-scene', name: 'Konqi and the Box', file: 'Konqi_and_the_box.png', author: 'KDE Community', license: COMMUNITY_LICENSE, note: 'Recent KDE Community Konqi artwork.' },
]

const imageUrl = (file: string) => `https://community.kde.org/Special:Redirect/file/${encodeURIComponent(file)}`
const sourceUrl = (file: string) => `https://community.kde.org/File:${encodeURIComponent(file)}`

function readCurrentSource() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? String(JSON.parse(raw)?.assetSourceUrl || '') : ''
  } catch {
    return ''
  }
}

export function DesktopBuddyKdeLibrary() {
  const [currentSource, setCurrentSource] = React.useState(readCurrentSource)

  const useStarter = (starter: KdeStarter) => {
    const source = sourceUrl(starter.file)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const previous = raw ? JSON.parse(raw) : {}
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...previous,
        imageDataUrl: imageUrl(starter.file),
        assetLabel: starter.name,
        assetSourceUrl: source,
        assetLicense: `${starter.license}; author: ${starter.author}`,
      }))
      setCurrentSource(source)
      window.dispatchEvent(new Event('appforge:desktop-buddy-updated'))
    } catch {
      // Keep the current character if local browser storage is unavailable.
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl rounded-3xl border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">KDE Community library</p>
          <h2 className="mt-1 text-xl font-semibold">More verified Konqi & Katie poses</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Choose from KDE Community Wiki PNG artwork. Desktop Buddy links to the original files instead of silently redistributing them, while preserving source, author and license metadata in your local buddy configuration.</p>
        </div>
        <a href="https://community.kde.org/Promo/Material/Mascots" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium hover:bg-accent">KDE mascot catalog <ExternalLink className="h-3.5 w-3.5" /></a>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {KDE_BUDDY_LIBRARY.map((starter) => {
          const source = sourceUrl(starter.file)
          const active = currentSource === source
          return (
            <article key={starter.id} className={`overflow-hidden rounded-2xl border bg-background/40 ${active ? 'ring-2 ring-primary/35' : ''}`}>
              <div className="grid aspect-square place-items-center bg-muted/30 p-4">
                <img src={imageUrl(starter.file)} alt={starter.name} loading="lazy" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2"><h3 className="text-sm font-semibold">{starter.name}</h3>{active && <Check className="h-4 w-4 shrink-0" />}</div>
                <p className="min-h-8 text-[11px] leading-4 text-muted-foreground">{starter.note}</p>
                <p className="text-[10px] leading-4 text-muted-foreground">{starter.author}<br />{starter.license}</p>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => useStarter(starter)} className="flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold hover:bg-accent">{active ? 'Active' : 'Use character'}</button>
                  <a href={source} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg border text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={`Open source page for ${starter.name}`}><ExternalLink className="h-3.5 w-3.5" /></a>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

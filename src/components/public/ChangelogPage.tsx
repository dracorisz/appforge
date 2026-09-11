import React from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import changelogSource from '../../../CHANGELOG.md?raw'
import { BUILD_INFO } from '@/lib/buildInfo'

const APPFORGE_MARK = '/favicon.svg?v=2'

type ChangelogGroup = { title: string; items: string[] }
type ChangelogRelease = { title: string; groups: ChangelogGroup[] }

function parseChangelog(source: string): ChangelogRelease[] {
  const releases: ChangelogRelease[] = []
  let release: ChangelogRelease | null = null
  let group: ChangelogGroup | null = null

  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim()
    if (line.startsWith('## ')) {
      release = { title: line.slice(3), groups: [] }
      releases.push(release)
      group = null
      continue
    }
    if (line.startsWith('### ') && release) {
      group = { title: line.slice(4), items: [] }
      release.groups.push(group)
      continue
    }
    if (line.startsWith('- ') && group) group.items.push(line.slice(2).replace(/\*\*/g, '').replace(/`/g, ''))
  }

  return releases.filter((item) => item.groups.some((entry) => entry.items.length > 0))
}

export function ChangelogPage() {
  const releases = React.useMemo(() => parseChangelog(changelogSource), [])

  React.useEffect(() => { document.title = 'AppForge Changelog' }, [])

  return (
    <div className="dark min-h-dvh bg-black text-foreground" style={{ colorScheme: 'dark', '--background': '0 0% 0%' } as React.CSSProperties}>
      <header className="sticky top-0 z-20 border-b border-border/60 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/landing" className="inline-flex items-center gap-3">
            <img src={APPFORGE_MARK} alt="AppForge" className="h-9 w-9 rounded-xl" />
            <div><div className="text-sm font-semibold">AppForge Changelog</div><div className="text-xs text-muted-foreground">Synced from CHANGELOG.md on main</div></div>
          </Link>
          <nav className="flex items-center gap-2 text-xs font-semibold">
            <Link to="/blog" className="rounded-lg border border-border/70 px-3 py-2 text-muted-foreground hover:text-foreground">Blog</Link>
            <Link to="/landing" className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Front</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="border-b border-border/60 pb-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"><FileText className="h-4 w-4" /> Release history</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">What changed in AppForge.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">This page is generated directly from the repository changelog, so editorial release notes only need to be maintained once. Updating <code className="rounded bg-accent/50 px-1.5 py-0.5">CHANGELOG.md</code> on <code className="rounded bg-accent/50 px-1.5 py-0.5">main</code> updates the public release history on the next build.</p>
          <div className="mt-4 text-xs text-muted-foreground">Current app version: v{BUILD_INFO.version}</div>
        </section>

        <div className="space-y-8 py-8">
          {releases.map((release) => (
            <section key={release.title} className="rounded-2xl border border-border/70 bg-background/45 p-5 sm:p-6">
              <h2 className="text-3xl font-semibold tracking-[-0.03em]">{release.title}</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {release.groups.map((group) => (
                  <div key={`${release.title}-${group.title}`}>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.12em]">{group.title}</h3>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                      {group.items.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">•</span><span>{item}</span></li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}

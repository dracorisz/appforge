import React from 'react'
import { CheckCircle2, Clipboard, ExternalLink, Film, Send, Youtube } from 'lucide-react'
import { getAllApps } from '@/lib/registry'
import { BUILD_INFO } from '@/lib/buildInfo'
import { APPFORGE_CHANNEL_URL, DemoPackage, DemoStatus, makeDemoPackage, makePublication, MarketingFormat, PLAYLISTS, PublicationRecord, PublicationStatus } from '@/lib/marketing'

const DEMOS_KEY = 'appforge-marketing-demos-v1'
const PUBLICATIONS_KEY = 'appforge-marketing-publications-v1'

const readArray = <T,>(key: string): T[] => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value as T[] : []
  } catch { return [] }
}

const writeArray = (key: string, value: unknown[]) => localStorage.setItem(key, JSON.stringify(value))

const copy = async (value: string) => navigator.clipboard.writeText(value)

export default function MarketingStudio() {
  const apps = React.useMemo(() => getAllApps().filter((app) => app.status !== 'idea' && app.status !== 'deprecated'), [])
  const [appId, setAppId] = React.useState(apps[0]?.id || '')
  const [demos, setDemos] = React.useState<DemoPackage[]>(() => readArray<DemoPackage>(DEMOS_KEY))
  const [publications, setPublications] = React.useState<PublicationRecord[]>(() => readArray<PublicationRecord>(PUBLICATIONS_KEY))
  const [selectedDemoId, setSelectedDemoId] = React.useState<string>('')
  const [message, setMessage] = React.useState('')

  React.useEffect(() => { writeArray(DEMOS_KEY, demos) }, [demos])
  React.useEffect(() => { writeArray(PUBLICATIONS_KEY, publications) }, [publications])

  const selectedDemo = demos.find((demo) => demo.id === selectedDemoId) || demos[0]
  React.useEffect(() => { if (!selectedDemoId && demos[0]) setSelectedDemoId(demos[0].id) }, [demos, selectedDemoId])

  const buildFingerprint = `${BUILD_INFO.version} · ${BUILD_INFO.sha || 'local'} · ${BUILD_INFO.buildTime || 'unknown build time'}`

  const generate = () => {
    const app = apps.find((item) => item.id === appId)
    if (!app) return
    const demo = makeDemoPackage(app, buildFingerprint)
    setDemos((current) => [demo, ...current])
    setSelectedDemoId(demo.id)
    setMessage(`Generated demo package for ${app.name}.`)
  }

  const updateDemo = (id: string, patch: Partial<DemoPackage>) => setDemos((current) => current.map((demo) => demo.id === id ? { ...demo, ...patch, updatedAt: new Date().toISOString() } : demo))
  const updatePublication = (id: string, patch: Partial<PublicationRecord>) => setPublications((current) => current.map((record) => record.id === id ? { ...record, ...patch, updatedAt: new Date().toISOString() } : record))

  const createPublication = (format: MarketingFormat) => {
    if (!selectedDemo) return
    const next = makePublication(selectedDemo, format)
    setPublications((current) => [next, ...current])
    setMessage(`Created ${format === 'short-9x16' ? 'Short' : '16:9'} YouTube publication draft.`)
  }

  const selectedPublications = selectedDemo ? publications.filter((record) => record.demoId === selectedDemo.id) : []

  const markPublished = (record: PublicationRecord) => {
    const remoteUrl = (record.remoteUrl || '').trim()
    if (!remoteUrl) {
      setMessage('Add the published YouTube URL before marking the publication complete.')
      return
    }
    const videoIdMatch = remoteUrl.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{6,})/)
    updatePublication(record.id, { status: 'published', remoteId: videoIdMatch?.[1] || record.remoteId, remoteUrl, publishedAt: new Date().toISOString(), attempts: Math.max(record.attempts, 1) })
    if (selectedDemo) updateDemo(selectedDemo.id, { status: 'published', publishedUrl: remoteUrl })
    setMessage('Publication marked as published and linked back to the demo record.')
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <section className="surface-card rounded-2xl border p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Demo package + publication ledger</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Marketing Studio</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Generate repeatable walkthrough scripts and channel-neutral publication records from the canonical AppForge registry. YouTube publishing remains review-first; delegated upload stays disabled until the narrow upload scope is approved.</p>
          </div>
          <a href={APPFORGE_CHANNEL_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium hover:bg-accent"><Youtube className="h-4 w-4" /> AppForge Studio <ExternalLink className="h-3.5 w-3.5" /></a>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(240px,1fr)_auto]">
          <label className="grid gap-1.5 text-sm font-medium">App<select value={appId} onChange={(event) => setAppId(event.target.value)} className="h-11 rounded-xl border bg-background px-3">{apps.map((app) => <option key={app.id} value={app.id}>{app.name} · {app.version} · {app.status}</option>)}</select></label>
          <button type="button" onClick={generate} className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"><Film className="h-4 w-4" /> Generate demo package</button>
        </div>
        <div aria-live="polite" className="mt-3 min-h-5 text-xs text-muted-foreground">{message}</div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="surface-card self-start rounded-2xl border p-3 xl:sticky xl:top-4">
          <div className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Demo packages</div>
          <div className="grid max-h-[70dvh] gap-2 overflow-auto">{demos.map((demo) => <button key={demo.id} type="button" onClick={() => setSelectedDemoId(demo.id)} className={`rounded-xl border p-3 text-left ${selectedDemo?.id === demo.id ? 'bg-accent' : 'bg-background/50 hover:bg-accent/60'}`}><div className="text-sm font-semibold">{demo.appName}</div><div className="mt-1 text-xs text-muted-foreground">{demo.status} · {demo.appVersion}</div></button>)}{demos.length === 0 && <div className="p-4 text-sm text-muted-foreground">Generate the first package from the registry.</div>}</div>
        </aside>

        {selectedDemo ? <main className="grid gap-5">
          <section className="surface-card rounded-2xl border p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">{selectedDemo.title}</h2><p className="mt-1 text-xs text-muted-foreground">{selectedDemo.buildFingerprint}</p></div><label className="grid gap-1 text-xs font-medium text-muted-foreground">Recording status<select value={selectedDemo.status} onChange={(event) => updateDemo(selectedDemo.id, { status: event.target.value as DemoStatus })} className="h-10 rounded-lg border bg-background px-3 text-sm text-foreground"><option value="planned">Planned</option><option value="recorded">Recorded</option><option value="edited">Edited</option><option value="published">Published</option></select></label></div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold">30–90s script</h3><button type="button" onClick={() => void copy(selectedDemo.script.join('\n'))} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Clipboard className="h-3.5 w-3.5" /> Copy</button></div><ol className="grid gap-2 text-sm text-muted-foreground">{selectedDemo.script.map((line, index) => <li key={`${line}-${index}`} className="rounded-xl border bg-background/50 p-3"><strong className="mr-2 text-foreground">{index + 1}.</strong>{line}</li>)}</ol></div>
              <div><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold">Shot/click list</h3><button type="button" onClick={() => void copy(selectedDemo.shots.join('\n'))} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Clipboard className="h-3.5 w-3.5" /> Copy</button></div><ol className="grid gap-2 text-sm text-muted-foreground">{selectedDemo.shots.map((line, index) => <li key={`${line}-${index}`} className="rounded-xl border bg-background/50 p-3"><strong className="mr-2 text-foreground">{index + 1}.</strong>{line}</li>)}</ol></div>
            </div>

            <label className="mt-5 grid gap-1.5 text-sm font-semibold">Narration<textarea value={selectedDemo.narration} onChange={(event) => updateDemo(selectedDemo.id, { narration: event.target.value })} rows={4} className="rounded-xl border bg-background p-3 text-sm font-normal leading-6" /></label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-semibold">Thumbnail text<input value={selectedDemo.thumbnailText} onChange={(event) => updateDemo(selectedDemo.id, { thumbnailText: event.target.value })} className="h-11 rounded-xl border bg-background px-3 font-normal" /></label><label className="grid gap-1.5 text-sm font-semibold">Playlist<select value={selectedDemo.playlist} onChange={(event) => updateDemo(selectedDemo.id, { playlist: event.target.value })} className="h-11 rounded-xl border bg-background px-3 font-normal">{PLAYLISTS.map((playlist) => <option key={playlist}>{playlist}</option>)}</select></label></div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => createPublication('youtube-16x9')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold hover:bg-accent"><Youtube className="h-4 w-4" /> Prepare 16:9 publication</button><button type="button" onClick={() => createPublication('short-9x16')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold hover:bg-accent"><Film className="h-4 w-4" /> Prepare Short</button></div>
          </section>

          <section className="grid gap-4">
            {selectedPublications.map((record) => <article key={record.id} className="surface-card rounded-2xl border p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{record.channel} · {record.format}</div><h3 className="mt-2 font-semibold">{record.title}</h3></div><select value={record.status} onChange={(event) => updatePublication(record.id, { status: event.target.value as PublicationStatus })} className="h-10 rounded-lg border bg-background px-3 text-sm"><option value="draft">Draft</option><option value="ready">Ready</option><option value="publishing">Publishing</option><option value="published">Published</option><option value="failed">Failed</option></select></div>
              <label className="mt-4 grid gap-1.5 text-sm font-medium">Title<input value={record.title} onChange={(event) => updatePublication(record.id, { title: event.target.value })} className="h-11 rounded-xl border bg-background px-3" /></label>
              <label className="mt-3 grid gap-1.5 text-sm font-medium">Description<textarea value={record.description} onChange={(event) => updatePublication(record.id, { description: event.target.value })} rows={8} className="rounded-xl border bg-background p-3 text-sm leading-6" /></label>
              <label className="mt-3 grid gap-1.5 text-sm font-medium">Tags<input value={record.tags.join(', ')} onChange={(event) => updatePublication(record.id, { tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} className="h-11 rounded-xl border bg-background px-3" /></label>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><label className="grid gap-1.5 text-sm font-medium">Published URL<input value={record.remoteUrl || ''} onChange={(event) => updatePublication(record.id, { remoteUrl: event.target.value })} placeholder="https://youtu.be/…" className="h-11 rounded-xl border bg-background px-3" /></label><button type="button" onClick={() => markPublished(record)} className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-xl border px-4 text-sm font-semibold hover:bg-accent"><CheckCircle2 className="h-4 w-4" /> Mark published</button></div>
              <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void copy(`${record.title}\n\n${record.description}\n\nTags: ${record.tags.join(', ')}`)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-semibold hover:bg-accent"><Clipboard className="h-3.5 w-3.5" /> Copy publication package</button><button type="button" disabled title="Enable only after Google approves the narrow delegated YouTube upload scope" className="inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-xl border px-3 text-xs font-semibold opacity-50"><Send className="h-3.5 w-3.5" /> Upload via YouTube OAuth · approval required</button></div>
            </article>)}
            {selectedPublications.length === 0 && <div className="surface-card rounded-2xl border p-8 text-center text-sm text-muted-foreground">Create a 16:9 or Short publication draft from this demo package.</div>}
          </section>
        </main> : <div className="surface-card rounded-2xl border p-10 text-center text-sm text-muted-foreground">Generate a demo package to begin.</div>}
      </div>

      <section className="mt-5 rounded-2xl border border-border/70 bg-background/60 p-4 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Publishing boundary:</strong> Marketing Studio prepares, reviews, and records publication metadata today. It does not request broad YouTube account access and does not upload until the production delegated upload feature exists and the minimum necessary OAuth scope is approved. TikTok remains metadata-ready only until its developer product/scopes are approved.</section>
    </div>
  )
}

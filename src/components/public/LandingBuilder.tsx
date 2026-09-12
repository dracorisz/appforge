import React from 'react'
import { ArrowDown, ArrowUp, Download, Image as ImageIcon, Plus, Save, Trash2, Upload } from 'lucide-react'

type SectionKind = 'hero' | 'features' | 'gallery' | 'cta' | 'faq' | 'footer'
type LandingSection = { id: string; kind: SectionKind; title: string; body: string; linkLabel?: string; linkUrl?: string; image?: string }
type LandingProject = { version: 1; name: string; preset: 'slate' | 'paper' | 'midnight'; accent: string; sections: LandingSection[]; updatedAt: string }

const STORAGE_KEY = 'appforge-landing-builder-project-v1'
const PROJECTS_KEY = 'appforge-landing-builder-projects-v1'
const MAX_IMAGE_BYTES = 5_000_000
const MAX_PROJECT_BYTES = 2_000_000
const MAX_IMAGE_DATA_CHARS = 7_000_000
const SECTION_KINDS = new Set<SectionKind>(['hero', 'features', 'gallery', 'cta', 'faq', 'footer'])

const makeId = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `section-${Date.now()}-${Math.random().toString(16).slice(2)}`
const makeSection = (kind: SectionKind): LandingSection => {
  const defaults: Record<SectionKind, Omit<LandingSection, 'id' | 'kind'>> = {
    hero: { title: 'Build something people understand instantly', body: 'A focused headline, one useful promise, and a clear next action.', linkLabel: 'Get started', linkUrl: '#features' },
    features: { title: 'Why it works', body: 'Fast setup • Responsive by default • Exportable as static HTML' },
    gallery: { title: 'Show the product', body: 'Add a local image to make the page tangible.' },
    cta: { title: 'Ready to ship?', body: 'Export the page or save the project JSON and keep editing later.', linkLabel: 'Start now', linkUrl: '#' },
    faq: { title: 'Frequently asked', body: 'Is it browser-local? Yes. Can I continue later? Export/import the project JSON or save it in this browser.' },
    footer: { title: 'Your brand', body: 'Built with AppForge Landing Builder.', linkLabel: 'Home', linkUrl: '#' },
  }
  return { id: makeId(), kind, ...defaults[kind] }
}

const defaultProject = (): LandingProject => ({
  version: 1,
  name: 'My landing page',
  preset: 'slate',
  accent: '#2563eb',
  sections: [makeSection('hero'), makeSection('features'), makeSection('cta'), makeSection('footer')],
  updatedAt: new Date().toISOString(),
})

const safeImageData = (value: unknown) => typeof value === 'string'
  && value.length <= MAX_IMAGE_DATA_CHARS
  && /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=\r\n]+$/i.test(value)
    ? value
    : undefined

const safeHref = (value: string | undefined) => {
  const href = (value || '').trim()
  if (!href) return ''
  if (href.startsWith('#') || href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) return href
  try {
    const parsed = new URL(href)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol) ? href : ''
  } catch {
    return ''
  }
}

const safeProject = (value: unknown): LandingProject | null => {
  if (!value || typeof value !== 'object') return null
  const project = value as Partial<LandingProject>
  if (project.version !== 1 || !Array.isArray(project.sections)) return null
  const sections = project.sections.slice(0, 100).flatMap((section) => {
    if (!section || typeof section !== 'object') return []
    const next = section as Partial<LandingSection>
    if (typeof next.id !== 'string' || !SECTION_KINDS.has(next.kind as SectionKind) || typeof next.title !== 'string' || typeof next.body !== 'string') return []
    return [{
      id: next.id.slice(0, 120),
      kind: next.kind as SectionKind,
      title: next.title.slice(0, 500),
      body: next.body.slice(0, 10_000),
      linkLabel: typeof next.linkLabel === 'string' ? next.linkLabel.slice(0, 200) : undefined,
      linkUrl: typeof next.linkUrl === 'string' ? safeHref(next.linkUrl.slice(0, 2_000)) : undefined,
      image: safeImageData(next.image),
    }]
  })
  if (!sections.length) return null
  return {
    version: 1,
    name: typeof project.name === 'string' ? project.name.slice(0, 200) : 'Imported landing page',
    preset: project.preset === 'paper' || project.preset === 'midnight' ? project.preset : 'slate',
    accent: typeof project.accent === 'string' && /^#[0-9a-f]{6}$/i.test(project.accent) ? project.accent : '#2563eb',
    sections,
    updatedAt: typeof project.updatedAt === 'string' ? project.updatedAt : new Date().toISOString(),
  }
}

const downloadText = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
const sectionDomId = (section: LandingSection) => `${section.kind}-${section.id.replace(/[^a-z0-9_-]/gi, '-').slice(0, 80)}`

const buildHtml = (project: LandingProject) => {
  const palette = project.preset === 'paper'
    ? { bg: '#fafaf9', card: '#ffffff', text: '#1c1917', muted: '#57534e', border: '#e7e5e4' }
    : project.preset === 'midnight'
      ? { bg: '#020617', card: '#0f172a', text: '#f8fafc', muted: '#94a3b8', border: '#1e293b' }
      : { bg: '#0f172a', card: '#111827', text: '#f8fafc', muted: '#cbd5e1', border: '#334155' }

  const sectionHtml = project.sections.map((section) => {
    const image = safeImageData(section.image) ? `<img src="${section.image}" alt="" style="max-width:100%;border-radius:18px;border:1px solid ${palette.border};margin-top:20px">` : ''
    const href = safeHref(section.linkUrl)
    const link = section.linkLabel && href ? `<a href="${escapeHtml(href)}" class="button">${escapeHtml(section.linkLabel)}</a>` : ''
    return `<section id="${escapeHtml(sectionDomId(section))}"><div class="card"><p class="eyebrow">${escapeHtml(section.kind)}</p><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.body).replaceAll('\n', '<br>')}</p>${image}${link}</div></section>`
  }).join('\n')

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(project.name)}</title><style>
:root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color-scheme:${project.preset === 'paper' ? 'light' : 'dark'};background:${palette.bg};color:${palette.text}}
*{box-sizing:border-box}body{margin:0;background:${palette.bg};color:${palette.text}}main{width:min(1120px,calc(100% - 32px));margin:0 auto;padding:48px 0 72px;display:grid;gap:22px}.card{border:1px solid ${palette.border};background:${palette.card};border-radius:24px;padding:clamp(24px,5vw,64px)}h2{font-size:clamp(2rem,6vw,4.75rem);line-height:1;letter-spacing:-.04em;margin:10px 0 20px}p{color:${palette.muted};font-size:clamp(1rem,2vw,1.2rem);line-height:1.7;max-width:760px}.eyebrow{font-size:.75rem;text-transform:uppercase;letter-spacing:.15em}.button{display:inline-flex;margin-top:22px;padding:12px 18px;border-radius:12px;background:${project.accent};color:white;text-decoration:none;font-weight:700}@media(max-width:640px){main{padding-top:20px}.card{border-radius:18px}}
</style></head><body><main>${sectionHtml}</main></body></html>`
}

export default function LandingBuilder() {
  const [project, setProject] = React.useState<LandingProject>(() => {
    try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); return safeProject(parsed) || defaultProject() } catch { return defaultProject() }
  })
  const [viewport, setViewport] = React.useState<'phone' | 'tablet' | 'desktop'>('desktop')
  const [savedProjects, setSavedProjects] = React.useState<Record<string, LandingProject>>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '{}')
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
      return Object.fromEntries(Object.entries(parsed).flatMap(([name, value]) => {
        const safe = safeProject(value)
        return safe ? [[name.slice(0, 200), safe]] : []
      }))
    } catch { return {} }
  })
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...project, updatedAt: new Date().toISOString() })) }
    catch { setMessage('This project is too large for browser storage. Export project JSON to keep a portable copy.') }
  }, [project])
  React.useEffect(() => {
    try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(savedProjects)) }
    catch { setMessage('Saved-project storage is full. Export project JSON before clearing browser data.') }
  }, [savedProjects])

  const updateSection = (id: string, patch: Partial<LandingSection>) => setProject((current) => ({ ...current, sections: current.sections.map((section) => section.id === id ? { ...section, ...patch } : section) }))
  const move = (index: number, direction: -1 | 1) => setProject((current) => {
    const target = index + direction
    if (target < 0 || target >= current.sections.length) return current
    const sections = [...current.sections]
    const [item] = sections.splice(index, 1)
    sections.splice(target, 0, item)
    return { ...current, sections }
  })
  const remove = (id: string) => setProject((current) => ({ ...current, sections: current.sections.filter((section) => section.id !== id) }))
  const add = (kind: SectionKind) => setProject((current) => ({ ...current, sections: [...current.sections, makeSection(kind)] }))

  const uploadImage = (sectionId: string, file?: File) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) { setMessage('Choose a PNG, JPEG, WebP, GIF, or AVIF image.'); return }
    if (file.size > MAX_IMAGE_BYTES) { setMessage('Choose an image under 5 MB so the project remains portable.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string' && safeImageData(reader.result)) {
        updateSection(sectionId, { image: reader.result })
        setMessage('Image added locally.')
      } else setMessage('That image could not be stored safely in the project.')
    }
    reader.onerror = () => setMessage('Could not read that image.')
    reader.readAsDataURL(file)
  }

  const importProject = (file?: File) => {
    if (!file) return
    if (file.size > MAX_PROJECT_BYTES) { setMessage('Project JSON must be under 2 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const next = safeProject(JSON.parse(String(reader.result || '')))
        if (!next) throw new Error('Unsupported project file.')
        setProject(next)
        setMessage('Project imported.')
      } catch (error) { setMessage(error instanceof Error ? error.message : 'Import failed.') }
    }
    reader.onerror = () => setMessage('Could not read that project file.')
    reader.readAsText(file)
  }

  const saveNamed = () => {
    const name = project.name.trim() || 'Untitled landing page'
    setSavedProjects((current) => ({ ...current, [name]: { ...project, name, updatedAt: new Date().toISOString() } }))
    setMessage(`Saved “${name}” in this browser.`)
  }

  const previewWidth = viewport === 'phone' ? '390px' : viewport === 'tablet' ? '768px' : '100%'
  const palette = project.preset === 'paper'
    ? { bg: '#fafaf9', card: '#ffffff', text: '#1c1917', muted: '#57534e', border: '#e7e5e4' }
    : project.preset === 'midnight'
      ? { bg: '#020617', card: '#0f172a', text: '#f8fafc', muted: '#94a3b8', border: '#1e293b' }
      : { bg: '#0f172a', card: '#111827', text: '#f8fafc', muted: '#cbd5e1', border: '#334155' }

  return (
    <div className="mx-auto grid w-full max-w-[1500px] gap-5 p-4 sm:p-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <aside className="surface-card self-start rounded-2xl border p-4 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:overflow-auto">
        <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">No-login core</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Landing Builder</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Compose a responsive page locally, save/import project JSON, and export standalone HTML.</p></div>

        <div className="mt-5 grid gap-3">
          <label className="grid gap-1.5 text-sm font-medium">Project name<input value={project.name} onChange={(event) => setProject((current) => ({ ...current, name: event.target.value }))} className="h-11 rounded-xl border bg-background px-3" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-sm font-medium">Appearance<select value={project.preset} onChange={(event) => setProject((current) => ({ ...current, preset: event.target.value as LandingProject['preset'] }))} className="h-11 rounded-xl border bg-background px-3"><option value="slate">Slate</option><option value="paper">Paper</option><option value="midnight">Midnight</option></select></label><label className="grid gap-1.5 text-sm font-medium">Accent<input type="color" value={project.accent} onChange={(event) => setProject((current) => ({ ...current, accent: event.target.value }))} className="h-11 w-full rounded-xl border bg-background p-1" /></label></div>
        </div>

        <div className="mt-5"><div className="mb-2 text-sm font-semibold">Add section</div><div className="grid grid-cols-3 gap-2">{(['hero','features','gallery','cta','faq','footer'] as SectionKind[]).map((kind) => <button key={kind} type="button" onClick={() => add(kind)} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border px-2 text-xs font-medium capitalize hover:bg-accent"><Plus className="h-3.5 w-3.5" /> {kind}</button>)}</div></div>

        <div className="mt-5 grid gap-3">
          {project.sections.map((section, index) => (
            <article key={section.id} className="rounded-xl border bg-background/70 p-3">
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{index + 1}. {section.kind}</span><div className="flex gap-1"><button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="grid h-8 w-8 place-items-center rounded-lg border disabled:opacity-40" aria-label={`Move ${section.kind} up`}><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" onClick={() => move(index, 1)} disabled={index === project.sections.length - 1} className="grid h-8 w-8 place-items-center rounded-lg border disabled:opacity-40" aria-label={`Move ${section.kind} down`}><ArrowDown className="h-3.5 w-3.5" /></button><button type="button" onClick={() => remove(section.id)} className="grid h-8 w-8 place-items-center rounded-lg border hover:bg-destructive/10" aria-label={`Remove ${section.kind}`}><Trash2 className="h-3.5 w-3.5" /></button></div></div>
              <div className="mt-3 grid gap-2"><input value={section.title} onChange={(event) => updateSection(section.id, { title: event.target.value })} className="h-10 rounded-lg border bg-background px-3 text-sm font-medium" aria-label={`${section.kind} title`} /><textarea value={section.body} onChange={(event) => updateSection(section.id, { body: event.target.value })} rows={3} className="rounded-lg border bg-background p-3 text-sm" aria-label={`${section.kind} body`} />{(section.kind === 'hero' || section.kind === 'cta' || section.kind === 'footer') && <div className="grid grid-cols-2 gap-2"><input value={section.linkLabel || ''} onChange={(event) => updateSection(section.id, { linkLabel: event.target.value })} placeholder="Button label" className="h-10 rounded-lg border bg-background px-3 text-sm" /><input value={section.linkUrl || ''} onChange={(event) => updateSection(section.id, { linkUrl: event.target.value })} placeholder="https://… or #section" className="h-10 rounded-lg border bg-background px-3 text-sm" /></div>}{section.kind === 'gallery' && <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border text-xs font-medium hover:bg-accent"><ImageIcon className="h-3.5 w-3.5" /> Local image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="sr-only" onChange={(event) => { uploadImage(section.id, event.target.files?.[0]); event.currentTarget.value = '' }} /></label>}</div>
            </article>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={saveNamed} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold hover:bg-accent"><Save className="h-4 w-4" /> Save local</button><button type="button" onClick={() => downloadText(JSON.stringify({ ...project, updatedAt: new Date().toISOString() }, null, 2), `${project.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'landing'}.appforge.json`, 'application/json')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold hover:bg-accent"><Download className="h-4 w-4" /> Project JSON</button><label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-semibold hover:bg-accent"><Upload className="h-4 w-4" /> Import JSON<input type="file" accept="application/json,.json" className="sr-only" onChange={(event) => { importProject(event.target.files?.[0]); event.currentTarget.value = '' }} /></label><button type="button" onClick={() => downloadText(buildHtml(project), `${project.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'landing'}.html`, 'text/html;charset=utf-8')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground"><Download className="h-4 w-4" /> Static HTML</button></div>

        {Object.keys(savedProjects).length > 0 && <label className="mt-3 grid gap-1.5 text-xs font-medium text-muted-foreground">Saved browser projects<select defaultValue="" onChange={(event) => { const saved = savedProjects[event.target.value]; if (saved) setProject(saved); event.currentTarget.value = '' }} className="h-10 rounded-lg border bg-background px-3 text-sm text-foreground"><option value="" disabled>Load a saved project…</option>{Object.keys(savedProjects).sort().map((name) => <option key={name} value={name}>{name}</option>)}</select></label>}
        <div aria-live="polite" className="mt-3 min-h-5 text-xs text-muted-foreground">{message}</div>
      </aside>

      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div className="text-sm font-semibold">Responsive preview</div><div className="flex rounded-xl border bg-background p-1">{(['phone','tablet','desktop'] as const).map((item) => <button key={item} type="button" onClick={() => setViewport(item)} className={`rounded-lg px-3 py-2 text-xs font-medium capitalize ${viewport === item ? 'bg-accent text-foreground' : 'text-muted-foreground'}`}>{item}</button>)}</div></div>
        <div className="overflow-auto rounded-2xl border bg-muted/20 p-3 sm:p-5"><div className="mx-auto min-h-[720px] overflow-hidden rounded-2xl border shadow-2xl transition-[width] duration-200" style={{ width: previewWidth, maxWidth: '100%', background: palette.bg, color: palette.text }}>
          <main className="grid gap-4 p-4 sm:p-6">
            {project.sections.map((section) => {
              const href = safeHref(section.linkUrl)
              return <section key={section.id} id={`preview-${sectionDomId(section)}`} className="rounded-2xl border p-6 sm:p-8" style={{ background: palette.card, borderColor: palette.border }}><div className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: palette.muted }}>{section.kind}</div><h2 className={`${section.kind === 'hero' ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-3xl'} mt-2 font-semibold tracking-tight`}>{section.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 sm:text-base" style={{ color: palette.muted }}>{section.body}</p>{safeImageData(section.image) && <img src={section.image} alt="Local project visual" className="mt-5 max-h-96 w-full rounded-xl border object-contain" style={{ borderColor: palette.border }} />}{section.linkLabel && href && <a href={href} onClick={(event) => event.preventDefault()} className="mt-5 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ background: project.accent }}>{section.linkLabel}</a>}</section>
            })}
          </main>
        </div></div>
      </section>
    </div>
  )
}

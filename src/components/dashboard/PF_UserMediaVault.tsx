import React from 'react'
import {
  Camera,
  Download,
  FileVideo,
  FileImage,
  FileText,
  Folder,
  Gamepad2,
  Maximize2,
  PanelsTopLeft,
  Play,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import {
  listVaultMedia,
  getVaultQuota,
  uploadVaultMediaWithProgress,
  deleteVaultMedia,
  vaultItemUrl,
  vaultFolder,
  type VaultFolder,
  type VaultMedia,
} from '@/lib/mediaVault'

const FOLDERS: { id: VaultFolder | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All files', icon: Folder },
  { id: 'general', label: 'General', icon: Folder },
  { id: 'Screenshots', label: 'Screenshots', icon: Camera },
  { id: 'dragon-arena', label: 'Dragon Arena', icon: Gamepad2 },
  { id: 'scrapper-pro', label: 'Getter Pro', icon: Search },
]

const kindIcon = (kind: VaultMedia['kind']) => {
  if (kind === 'video') return FileVideo
  if (kind === 'image') return FileImage
  return FileText
}

const kindBadge = (kind: VaultMedia['kind']) => (
  <Badge color={kind === 'video' ? 'blue' : kind === 'image' ? 'green' : 'slate'}>{kind}</Badge>
)

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const sourceLabel = (item: VaultMedia) => {
  if (item.source_app === 'scrapper-pro') return 'reference'
  if (item.source_bucket === 'dragon-arena-assets') return 'game asset'
  return item.size_bytes ? formatBytes(item.size_bytes) : 'stored'
}

const displaySource = (item: VaultMedia) => item.source_app === 'scrapper-pro' ? 'Getter Pro' : item.source_app || item.source_bucket || 'Media Vault'

const metadataUrl = (item: VaultMedia, key: 'media_url' | 'thumbnail' | 'original_url') => {
  const value = item.metadata?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

const uniqueUrls = (values: Array<string | null | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value)))]

const VaultThumb = ({ item }: { item: VaultMedia }) => {
  const [urls, setUrls] = React.useState<string[]>([])
  const [urlIndex, setUrlIndex] = React.useState(0)
  React.useEffect(() => {
    let cancelled = false
    setUrls([])
    setUrlIndex(0)
    void vaultItemUrl(item).then((primary) => {
      if (cancelled) return
      const fallbacks = item.source_bucket === 'external'
        ? uniqueUrls([primary, metadataUrl(item, 'media_url'), metadataUrl(item, 'thumbnail')])
        : uniqueUrls([primary])
      setUrls(fallbacks)
    }).catch(() => {
      if (!cancelled && item.source_bucket === 'external') setUrls(uniqueUrls([metadataUrl(item, 'media_url'), metadataUrl(item, 'thumbnail')]))
    })
    return () => { cancelled = true }
  }, [item])

  const Icon = kindIcon(item.kind)
  const url = urls[urlIndex] || null
  if (item.kind === 'image' && url) return <img src={url} alt={item.title || item.file_name || ''} loading="lazy" onError={() => setUrlIndex((index) => index + 1)} className="h-full w-full object-cover" />
  if (item.kind === 'video' && url) return (
    <>
      <video src={url} muted preload="metadata" className="h-full w-full object-cover" />
      <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-xl"><Play className="ml-0.5 h-5 w-5" /></span>
    </>
  )
  return <div className="flex h-full items-center justify-center text-5xl text-muted-foreground"><Icon /></div>
}

const VaultActions = ({ item, onPreview, onDelete, dark = false }: { item: VaultMedia; onPreview: () => void; onDelete: () => void; dark?: boolean }) => {
  const [downloadUrl, setDownloadUrl] = React.useState('#')
  React.useEffect(() => {
    let cancelled = false
    if (item.source_bucket === 'external') {
      setDownloadUrl(metadataUrl(item, 'original_url') || item.external_url || '#')
      return () => { cancelled = true }
    }
    void vaultItemUrl(item).then((value) => { if (!cancelled && value) setDownloadUrl(value) }).catch(() => undefined)
    return () => { cancelled = true }
  }, [item])

  const actionClass = dark
    ? 'rounded-lg border border-white/10 bg-black/35 p-2 text-white/75 backdrop-blur hover:bg-white/10 hover:text-white'
    : 'rounded p-1.5 hover:bg-accent'

  return (
    <div className="flex items-center gap-1">
      <button onClick={onPreview} className={actionClass} aria-label="Preview"><Maximize2 className="h-4 w-4" /></button>
      <a href={downloadUrl} download={item.source_bucket !== 'external'} target={item.source_bucket === 'external' ? '_blank' : undefined} rel={item.source_bucket === 'external' ? 'noreferrer' : undefined} className={actionClass} aria-label={item.source_bucket === 'external' ? 'Open original source' : 'Download'}><Download className="h-4 w-4" /></a>
      <button onClick={onDelete} className={dark ? `${actionClass} hover:border-red-400/30 hover:text-red-300` : 'rounded p-1.5 text-destructive hover:bg-destructive/10'} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
    </div>
  )
}

const ShowcaseCard = ({ item, onPreview, onDelete }: { item: VaultMedia; onPreview: () => void; onDelete: () => void }) => (
  <article className="group overflow-hidden rounded-2xl border border-white/10 bg-[#080d16] shadow-[0_18px_70px_rgba(0,0,0,.28)] transition-transform duration-200 hover:-translate-y-0.5">
    <button type="button" onClick={onPreview} className="relative block aspect-[16/10] w-full overflow-hidden bg-slate-950 text-left" aria-label={`Preview ${item.title || item.file_name || 'file'}`}>
      <VaultThumb item={item} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">{kindBadge(item.kind)}<Badge color="slate">{vaultFolder(item)}</Badge>{item.is_public && <Badge color="green">public</Badge>}</div>
        <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-white sm:text-lg">{item.title || item.file_name || 'Untitled'}</h3>
        <p className="mt-1 text-[11px] text-white/55">{sourceLabel(item)} · {new Date(item.created_at).toLocaleDateString()}</p>
      </div>
    </button>
    <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-2.5">
      <div className="min-w-0 text-[11px] text-white/50"><span className="block truncate">{displaySource(item)}</span></div>
      <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">Actions</span>
    </div>
    <div className="max-h-20 overflow-hidden border-t border-white/10 px-4 py-3 transition-[max-height,opacity,padding] duration-200 sm:max-h-0 sm:border-t-0 sm:py-0 sm:opacity-0 sm:group-hover:max-h-20 sm:group-hover:border-t sm:group-hover:py-3 sm:group-hover:opacity-100 sm:group-focus-within:max-h-20 sm:group-focus-within:border-t sm:group-focus-within:py-3 sm:group-focus-within:opacity-100">
      <div className="flex justify-end"><VaultActions item={item} onPreview={onPreview} onDelete={onDelete} dark /></div>
    </div>
  </article>
)

export function PF_UserMediaVault() {
  const [media, setMedia] = React.useState<VaultMedia[]>([])
  const [loading, setLoading] = React.useState(false)
  const [filterKind, setFilterKind] = React.useState<VaultMedia['kind'] | 'all'>('all')
  const [folder, setFolder] = React.useState<VaultFolder | 'all'>('all')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list' | 'showcase'>('grid')
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({})
  const [error, setError] = React.useState('')
  const [quota, setQuota] = React.useState({ quota_bytes: 0, used_bytes: 0, remaining_bytes: 0 })
  const [preview, setPreview] = React.useState<{ item: VaultMedia; url: string; fallbacks: string[] } | null>(null)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [items, nextQuota] = await Promise.all([
        listVaultMedia(filterKind === 'all' ? undefined : filterKind, folder === 'all' ? undefined : folder),
        getVaultQuota(),
      ])
      setMedia(items)
      setQuota(nextQuota)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load media vault.')
    } finally {
      setLoading(false)
    }
  }, [filterKind, folder])

  React.useEffect(() => { void refresh() }, [refresh])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const files = Array.from(input.files || [])
    input.value = ''
    if (!files.length) return
    setUploading(true)
    setError('')
    const failures: string[] = []
    for (const file of files) {
      try {
        setUploadProgress((current) => ({ ...current, [file.name]: 0 }))
        const item = await uploadVaultMediaWithProgress(file, {
          title: file.name,
          folder: 'general',
          metadata: { source: 'manual-upload' },
          onProgress: (progress) => setUploadProgress((current) => ({ ...current, [file.name]: progress })),
        })
        if (folder === 'all' || folder === 'general') setMedia((current) => [item, ...current])
        setUploadProgress((current) => ({ ...current, [file.name]: 100 }))
      } catch (uploadError) {
        failures.push(`${file.name}: ${uploadError instanceof Error ? uploadError.message : 'upload failed'}`)
      } finally {
        window.setTimeout(() => setUploadProgress((current) => { const next = { ...current }; delete next[file.name]; return next }), 350)
      }
    }
    setUploading(false)
    if (failures.length) setError(failures.join(' · '))
    await refresh()
  }

  const handleDelete = async (item: VaultMedia) => {
    const label = item.title || item.file_name || 'this item'
    const warning = item.source_bucket === 'dragon-arena-assets'
      ? `Delete "${label}" from Dragon Arena and remove its stored image?`
      : item.source_app === 'scrapper-pro'
        ? `Remove "${label}" from the Getter Pro folder? The original source is not deleted.`
        : `Delete "${label}" from Media Vault?`
    if (!confirm(warning)) return
    try {
      await deleteVaultMedia(item)
      setMedia((current) => current.filter((row) => row.id !== item.id))
      void refresh()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete item.')
    }
  }

  const openPreview = async (item: VaultMedia) => {
    try {
      const primary = await vaultItemUrl(item)
      const urls = item.source_bucket === 'external'
        ? uniqueUrls([primary, metadataUrl(item, 'media_url'), metadataUrl(item, 'thumbnail')])
        : uniqueUrls([primary])
      if (urls.length) setPreview({ item, url: urls[0], fallbacks: urls.slice(1) })
      else setError('No preview URL is available for this item.')
    } catch {
      const fallbacks = uniqueUrls([metadataUrl(item, 'media_url'), metadataUrl(item, 'thumbnail')])
      if (fallbacks.length) setPreview({ item, url: fallbacks[0], fallbacks: fallbacks.slice(1) })
      else setError('Could not open preview.')
    }
  }

  const advancePreviewFallback = () => {
    setPreview((current) => current && current.fallbacks.length
      ? { ...current, url: current.fallbacks[0], fallbacks: current.fallbacks.slice(1) }
      : current)
  }

  const usedPct = quota.quota_bytes ? Math.min(100, Math.round((quota.used_bytes / quota.quota_bytes) * 100)) : 0

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge color="purple">Private vault</Badge>
            <span className="text-xs text-muted-foreground">General uploads · Screenshots · Dragon Arena assets · Getter Pro references</span>
          </div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight"><Upload className="h-6 w-6" /> Media Vault</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Media Vault is AppForge's shared asset surface. Manual files live in General, Desktop Buddy viewport captures live in Screenshots, Dragon Arena scenes stay linked to the game ledger, and signed-in Getter Pro saves are archived here as deduplicated source references.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => void refresh()} disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</Button>
          <input type="file" multiple accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.json" className="hidden" onChange={handleUpload} disabled={uploading} id="vault-upload" />
          <label htmlFor="vault-upload" title="Manual uploads are stored in General" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 bg-background/45 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"><Upload className="h-4 w-4" />{uploading ? ' Uploading…' : ' Upload to General'}</label>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {FOLDERS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setFolder(id)} className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition-colors ${folder === id ? 'border-foreground/25 bg-accent' : 'border-border/70 bg-background/35 hover:bg-accent/60'}`}>
            <Icon className="h-4 w-4" /><span>{label}</span>
          </button>
        ))}
      </div>

      {uploading && Object.keys(uploadProgress).length > 0 && (
        <Card className="p-3"><div className="space-y-2">{Object.entries(uploadProgress).map(([name, pct]) => (
          <div key={name} className="flex items-center gap-2 text-xs"><span className="w-40 truncate text-muted-foreground">{name}</span><div className="h-2 flex-1 rounded-full bg-muted"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} /></div><span>{pct}%</span></div>
        ))}</div></Card>
      )}

      <Card className="p-3">
        <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Private upload quota used</span><span>{formatBytes(quota.used_bytes)} / {formatBytes(quota.quota_bytes)} ({usedPct}%)</span></div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${usedPct}%` }} /></div>
        <p className="mt-2 text-xs text-muted-foreground">{formatBytes(quota.remaining_bytes)} remaining. Dragon Arena scenes and Getter Pro references are not double-counted against the General upload quota.</p>
      </Card>

      {error && <Card className="border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</Card>}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterKind('all')} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filterKind === 'all' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>All kinds</button>
        {(['image', 'video', 'document', 'audio', 'other'] as VaultMedia['kind'][]).map((kind) => <button key={kind} onClick={() => setFilterKind(kind)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filterKind === kind ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{kind}</button>)}
        <div className="flex-1" />
        <div className="flex items-center rounded-lg border border-border/60 bg-background/40 p-0.5" aria-label="Media view">
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} title="Grid view"><FileImage className="h-4 w-4" /></Button>
          <Button variant={viewMode === 'showcase' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('showcase')} title="Showcase view"><PanelsTopLeft className="h-4 w-4" /></Button>
          <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} title="List view"><FileText className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className={viewMode === 'list' ? 'space-y-2' : viewMode === 'showcase' ? 'grid gap-5 md:grid-cols-2' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}>
        {loading ? Array.from({ length: 6 }).map((_, index) => <Card key={index} className="overflow-hidden p-0 animate-pulse"><div className="aspect-video bg-muted" /><div className="h-16 p-3" /></Card>) : !media.length ? (
          <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground"><Upload className="mx-auto h-10 w-10 text-muted-foreground/50" /><p className="mt-2">No media in this folder/filter yet.</p></div>
        ) : media.map((item) => {
          const Icon = kindIcon(item.kind)
          if (viewMode === 'showcase') return <ShowcaseCard key={`${item.metadata?.source_table || item.source_app || 'vault'}-${item.id}`} item={item} onPreview={() => void openPreview(item)} onDelete={() => void handleDelete(item)} />
          return <Card key={`${item.metadata?.source_table || item.source_app || 'vault'}-${item.id}`} className={viewMode === 'list' ? 'flex items-center gap-3 p-3' : 'overflow-hidden p-0'}>
            {viewMode === 'grid' && <button type="button" onClick={() => void openPreview(item)} className="relative block aspect-video w-full overflow-hidden bg-muted" aria-label={`Preview ${item.title || item.file_name || 'file'}`}><VaultThumb item={item} /></button>}
            <div className={viewMode === 'grid' ? 'p-3' : 'min-w-0 flex-1'}>
              <div className="flex items-start justify-between gap-2"><div className={viewMode === 'list' ? 'flex min-w-0 items-center gap-2' : 'flex min-w-0 flex-col gap-1'}>{viewMode === 'list' && <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />}<div className="min-w-0"><p className="truncate text-sm font-medium">{item.title || item.file_name || 'Untitled'}</p><div className="flex flex-wrap items-center gap-1.5">{kindBadge(item.kind)}<Badge color="slate">{vaultFolder(item)}</Badge>{item.is_public && <Badge color="green">public</Badge>}<span className="text-[10px] text-muted-foreground">{sourceLabel(item)}</span></div></div></div><VaultActions item={item} onPreview={() => void openPreview(item)} onDelete={() => void handleDelete(item)} /></div>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
            </div>
          </Card>
        })}
      </div>

      {preview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setPreview(null)}>{preview.item.kind === 'video' ? <video src={preview.url} controls autoPlay className="max-h-[90vh] max-w-[90vw] rounded-xl" onClick={(event) => event.stopPropagation()} /> : preview.item.kind === 'image' ? <img src={preview.url} alt={preview.item.title || ''} onError={advancePreviewFallback} className="max-h-[90vh] max-w-[90vw] rounded-xl" onClick={(event) => event.stopPropagation()} /> : <div className="max-w-md rounded-xl border border-border/70 bg-background p-6 text-center text-muted-foreground">Preview is not available for this item type. Use the source/download action to open it.</div>}<button onClick={() => setPreview(null)} className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"><X className="h-5 w-5" /></button></div>}
    </div>
  )
}

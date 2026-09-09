import React from 'react'
import {
  Download,
  FileVideo,
  FileImage,
  FileText,
  Loader2,
  Maximize2,
  Play,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Badge, Button, Card, Input } from '@/components/ui'
import {
  listVaultMedia,
  getVaultQuota,
  uploadVaultMedia,
  uploadVaultMediaWithProgress,
  deleteVaultMedia,
  vaultSignedUrl,
  type VaultMedia,
} from '@/lib/mediaVault'

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

const VaultThumb = ({ item, onPreview }: { item: VaultMedia; onPreview: (url: string) => void }) => {
  const [url, setUrl] = React.useState<string | null>(null)
  React.useEffect(() => {
    let cancelled = false
    void vaultSignedUrl(item.storage_path).then((u) => { if (!cancelled && u) setUrl(u) })
    return () => { cancelled = true }
  }, [item.storage_path])
  const Icon = kindIcon(item.kind)
  const isImage = item.kind === 'image'
  const isVideo = item.kind === 'video'
  if (isImage && url) return <img src={url} alt={item.title || item.file_name || ''} loading="lazy" className="h-full w-full object-cover" />
  if (isVideo && url) return (
    <>
      <video src={url} muted preload="metadata" className="h-full w-full object-cover" />
      <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-xl"><Play className="ml-0.5 h-5 w-5" /></span>
    </>
  )
  if (isImage) return <div className="flex h-full items-center justify-center text-5xl text-muted-foreground"><FileImage /></div>
  return <div className="flex h-full items-center justify-center text-5xl text-muted-foreground"><Icon /></div>
}

const VaultActions = ({ item, onPreview, onDelete }: { item: VaultMedia; onPreview: () => void; onDelete: () => void }) => {
  const [downloadUrl, setDownloadUrl] = React.useState('#')
  React.useEffect(() => {
    let cancelled = false
    void vaultSignedUrl(item.storage_path).then((u) => { if (!cancelled && u) setDownloadUrl(u) })
    return () => { cancelled = true }
  }, [item.storage_path])
  return (
    <div className="flex items-center gap-1">
      <button onClick={onPreview} className="p-1.5 rounded hover:bg-accent" aria-label="Preview"><Maximize2 className="h-4 w-4" /></button>
      <a href={downloadUrl} download className="p-1.5 rounded hover:bg-accent" aria-label="Download"><Download className="h-4 w-4" /></a>
      <button onClick={onDelete} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
    </div>
  )
}

export function PF_UserMediaVault() {
  const [media, setMedia] = React.useState<VaultMedia[]>([])
  const [loading, setLoading] = React.useState(false)
  const [filterKind, setFilterKind] = React.useState<VaultMedia['kind'] | 'all'>('all')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({})
  const [error, setError] = React.useState('')
  const [quota, setQuota] = React.useState({ quota_bytes: 0, used_bytes: 0, remaining_bytes: 0 })
  const [preview, setPreview] = React.useState<{ item: VaultMedia; url: string } | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const [items, q] = await Promise.all([
        listVaultMedia(filterKind === 'all' ? undefined : filterKind),
        getVaultQuota(),
      ])
      setMedia(items)
      setQuota(q)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load media vault.')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { void refresh() }, [filterKind])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    setUploading(true)
    setError('')
    for (const file of files) {
      try {
        setUploadProgress((p) => ({ ...p, [file.name]: 0 }))
        const item = await uploadVaultMediaWithProgress(file, {
          title: file.name,
          onProgress: (progress) => {
            setUploadProgress((p) => ({ ...p, [file.name]: progress }))
          }
        })
        setMedia((m) => [item, ...m])
        setUploadProgress((p) => ({ ...p, [file.name]: 100 }))
        await new Promise((r) => setTimeout(r, 300))
      } catch (e) {
        setError(e instanceof Error ? e.message : `Failed to upload ${file.name}`)
      } finally {
        setUploadProgress((p) => { const n = { ...p }; delete n[file.name]; return n })
      }
    }
    setUploading(false)
    void refresh()
  }

  const handleDelete = async (item: VaultMedia) => {
    if (!confirm(`Delete "${item.title || item.file_name || 'this file'}"?`)) return
    try {
      await deleteVaultMedia(item.id)
      setMedia((m) => m.filter((i) => i.id !== item.id))
      void refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete file.')
    }
  }

  const openPreview = async (item: VaultMedia) => {
    try {
      const url = await vaultSignedUrl(item.storage_path)
      if (url) setPreview({ item, url })
    } catch {
      setError('Could not open preview.')
    }
  }

  const usedPct = quota.quota_bytes ? Math.min(100, Math.round((quota.used_bytes / quota.quota_bytes) * 100)) : 0

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge color="purple">Private vault</Badge>
            <span className="text-xs text-muted-foreground">Direct-to-Supabase uploads · 200 MB default quota</span>
          </div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight"><Upload className="h-6 w-6" /> Media Vault</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Store images, videos, and documents with per-user quota. Files upload directly to Supabase storage, bypassing Vercel payload limits.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void refresh()} disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</Button>
          <input type="file" multiple accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.json" className="hidden" onChange={handleUpload} disabled={uploading} id="vault-upload" />
          <label htmlFor="vault-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 bg-background/45 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"><Upload className="h-4 w-4" />{uploading ? ' Uploading…' : ' Upload'}</label>
        </div>
      </div>

      {uploading && Object.keys(uploadProgress).length > 0 && (
        <Card className="p-3">
          <div className="space-y-1">
            {Object.entries(uploadProgress).map(([name, pct]) => (
              <div key={name} className="flex items-center gap-2 text-xs">
                <span className="truncate w-40 text-muted-foreground">{name}</span>
                <div className="flex-1 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} /></div>
                <span>{pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Quota used</span>
          <span>{formatBytes(quota.used_bytes)} / {formatBytes(quota.quota_bytes)} ({usedPct}%)</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${usedPct}%` }} /></div>
        <p className="mt-2 text-xs text-muted-foreground">{formatBytes(quota.remaining_bytes)} remaining. Admin can override quota in settings.</p>
      </Card>

      {error && <Card className="border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</Card>}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterKind('all')} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filterKind === 'all' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>All</button>
        {(['image', 'video', 'document', 'audio', 'other'] as VaultMedia['kind'][]).map((k) => (
          <button key={k} onClick={() => setFilterKind(k)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filterKind === k ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{k}</button>
        ))}
        <div className="flex-1" />
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('grid')}><FileImage className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}><FileText className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className={viewMode === 'grid' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-2'}>
        {loading ? Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-0 overflow-hidden animate-pulse">
            <div className="aspect-video bg-muted" />
            <div className="p-3 space-y-2"><div className="h-4 w-3/4 bg-muted rounded" /><div className="h-3 w-1/2 bg-muted rounded" /></div>
          </Card>
        )) : !media.length ? (
          <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            <Upload className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2">No media yet. Click Upload to add files.</p>
          </div>
        ) : (
          media.map((item) => {
            const Icon = kindIcon(item.kind)
            const isVideo = item.kind === 'video'
            const isImage = item.kind === 'image'
            return (
              <Card key={item.id} className={viewMode === 'list' ? 'p-3 flex items-center gap-3' : 'p-0 overflow-hidden'}>
                {viewMode === 'grid' && (
                  <button
                    type="button"
                    onClick={() => void openPreview(item)}
                    className="relative block aspect-video w-full overflow-hidden bg-muted"
                    aria-label={`Preview ${item.title || item.file_name || 'file'}`}
                  >
                    <VaultThumb item={item} onPreview={(u) => setPreview({ item, url: u })} />
                  </button>
                )}
                <div className={viewMode === 'grid' ? 'p-3' : 'flex-1 min-w-0'}>
                  <div className="flex items-start justify-between gap-2">
                    <div className={viewMode === 'list' ? 'flex items-center gap-2' : 'flex flex-col gap-1'}>
                      {viewMode === 'list' && <Icon className="h-5 w-5 text-muted-foreground" />}
                      <p className="truncate text-sm font-medium">{item.title || item.file_name || 'Untitled'}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {kindBadge(item.kind)}
                        <span className="text-[10px] text-muted-foreground">{formatBytes(item.size_bytes)}</span>
                      </div>
                    </div>
                    <VaultActions item={item} onPreview={() => void openPreview(item)} onDelete={() => void handleDelete(item)} />
                  </div>
                  {viewMode === 'list' && item.description && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.description}</p>}
                  <p className={viewMode === 'grid' ? 'mt-1 text-xs text-muted-foreground' : 'mt-0 text-xs text-muted-foreground'}>{new Date(item.created_at).toLocaleString()}</p>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setPreview(null)}>
          {preview.item.kind === 'video' ? (
            <video src={preview.url} controls autoPlay className="max-h-[90vh] max-w-[90vw] rounded-xl" onClick={(e) => e.stopPropagation()} />
          ) : preview.item.kind === 'image' ? (
            <img src={preview.url} alt={preview.item.title || ''} className="max-h-[90vh] max-w-[90vw] rounded-xl" onClick={(e) => e.stopPropagation()} />
          ) : (
            <div className="max-w-md rounded-xl border border-border/70 bg-background p-6 text-center text-muted-foreground">Preview not available for this file type.</div>
          )}
          <button onClick={() => setPreview(null)} className="absolute right-4 top-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"><X className="h-5 w-5" /></button>
        </div>
      )}
    </div>
  )
}
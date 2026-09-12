import React from 'react'
import {
  Camera,
  Download,
  FileVideo,
  FileImage,
  FileText,
  Folder,
  FolderPlus,
  Gamepad2,
  Maximize2,
  PanelsTopLeft,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  listVaultMedia,
  getVaultQuota,
  uploadVaultMediaWithProgress,
  deleteVaultMedia,
  updateVaultMedia,
  vaultItemUrl,
  vaultFolder,
  type VaultFolder,
  type VaultMedia,
} from '@/lib/mediaVault'

type UserFolder = { id: string; name: string }
type SortMode = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'size-desc' | 'type'

const SYSTEM_FOLDERS: { id: VaultFolder | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All files', icon: Folder },
  { id: 'general', label: 'General', icon: Folder },
  { id: 'desktop-buddies', label: 'Desktop Buddies', icon: Sparkles },
  { id: 'Screenshots', label: 'Screenshots', icon: Camera },
  { id: 'dragon-arena', label: 'Story Studio', icon: Gamepad2 },
  { id: 'scrapper-pro', label: 'Getter Pro', icon: Search },
]
const RESERVED_FOLDERS = new Set(SYSTEM_FOLDERS.filter((item) => item.id !== 'all').map((item) => String(item.id).toLowerCase()))

const kindIcon = (kind: VaultMedia['kind']) => kind === 'video' ? FileVideo : kind === 'image' ? FileImage : FileText
const kindBadge = (kind: VaultMedia['kind']) => <Badge color={kind === 'video' ? 'blue' : kind === 'image' ? 'green' : 'slate'}>{kind}</Badge>
const formatBytes = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : bytes < 1024 ** 3 ? `${(bytes / 1024 ** 2).toFixed(1)} MB` : `${(bytes / 1024 ** 3).toFixed(2)} GB`
const sourceLabel = (item: VaultMedia) => item.source_app === 'scrapper-pro' ? 'reference' : item.source_bucket === 'dragon-arena-assets' ? 'story asset' : item.size_bytes ? formatBytes(item.size_bytes) : 'stored'
const metadataUrl = (item: VaultMedia, key: 'media_url' | 'thumbnail' | 'original_url') => typeof item.metadata?.[key] === 'string' && String(item.metadata[key]).trim() ? String(item.metadata[key]).trim() : null
const uniqueUrls = (values: Array<string | null | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value)))]
const isPinnedAsset = (item: VaultMedia) => item.metadata?.source_table === 'dragon_arena_assets' || vaultFolder(item) === 'desktop-buddies'

const VaultThumb = ({ item }: { item: VaultMedia }) => {
  const [urls, setUrls] = React.useState<string[]>([])
  const [urlIndex, setUrlIndex] = React.useState(0)
  React.useEffect(() => {
    let cancelled = false
    setUrls([])
    setUrlIndex(0)
    void vaultItemUrl(item).then((primary) => {
      if (!cancelled) setUrls(item.source_bucket === 'external' ? uniqueUrls([primary, metadataUrl(item, 'media_url'), metadataUrl(item, 'thumbnail')]) : uniqueUrls([primary]))
    }).catch(() => { if (!cancelled && item.source_bucket === 'external') setUrls(uniqueUrls([metadataUrl(item, 'media_url'), metadataUrl(item, 'thumbnail')])) })
    return () => { cancelled = true }
  }, [item])
  const Icon = kindIcon(item.kind)
  const url = urls[urlIndex] || null
  if (item.kind === 'image' && url) return <img src={url} alt={item.title || item.file_name || ''} loading="lazy" onError={() => setUrlIndex((index) => index + 1)} className="h-full w-full object-cover" />
  if (item.kind === 'video' && url) return <><video src={url} muted preload="metadata" className="h-full w-full object-cover" /><span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white"><Play className="ml-0.5 h-5 w-5" /></span></>
  return <div className="flex h-full items-center justify-center text-5xl text-muted-foreground"><Icon /></div>
}

const VaultActions = ({ item, onPreview, onDelete }: { item: VaultMedia; onPreview: () => void; onDelete: () => void }) => {
  const [downloadUrl, setDownloadUrl] = React.useState('#')
  React.useEffect(() => {
    let cancelled = false
    if (item.source_bucket === 'external') setDownloadUrl(metadataUrl(item, 'original_url') || item.external_url || '#')
    else void vaultItemUrl(item).then((value) => { if (!cancelled && value) setDownloadUrl(value) }).catch(() => undefined)
    return () => { cancelled = true }
  }, [item])
  const cls = 'rounded-lg border border-border/60 p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
  return <div className="flex items-center gap-1"><button onClick={onPreview} className={cls} aria-label="Preview"><Maximize2 className="h-4 w-4" /></button><a href={downloadUrl} download={item.source_bucket !== 'external'} target={item.source_bucket === 'external' ? '_blank' : undefined} rel={item.source_bucket === 'external' ? 'noreferrer' : undefined} className={cls} aria-label="Download or open source"><Download className="h-4 w-4" /></a><button onClick={onDelete} className={`${cls} hover:border-destructive/40 hover:text-destructive`} aria-label="Delete"><Trash2 className="h-4 w-4" /></button></div>
}

export function PF_UserMediaVault() {
  const [media, setMedia] = React.useState<VaultMedia[]>([])
  const [userFolders, setUserFolders] = React.useState<UserFolder[]>([])
  const [loading, setLoading] = React.useState(false)
  const [filterKind, setFilterKind] = React.useState<VaultMedia['kind'] | 'all'>('all')
  const [folder, setFolder] = React.useState<VaultFolder | 'all'>('all')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list' | 'showcase'>('grid')
  const [sortMode, setSortMode] = React.useState<SortMode>('newest')
  const [newFolder, setNewFolder] = React.useState('')
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({})
  const [error, setError] = React.useState('')
  const [quota, setQuota] = React.useState({ quota_bytes: 0, used_bytes: 0, remaining_bytes: 0 })
  const [preview, setPreview] = React.useState<{ item: VaultMedia; url: string; fallbacks: string[] } | null>(null)

  const loadFolders = React.useCallback(async () => {
    const { data, error: folderError } = await supabase.from('user_media_folders').select('id,name').order('name')
    if (folderError) throw folderError
    setUserFolders((data || []) as UserFolder[])
  }, [])

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [items, nextQuota] = await Promise.all([
        listVaultMedia(filterKind === 'all' ? undefined : filterKind, folder === 'all' ? undefined : folder),
        getVaultQuota(),
        loadFolders(),
      ])
      setMedia(items)
      setQuota(nextQuota)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load Media Vault.')
    } finally { setLoading(false) }
  }, [filterKind, folder, loadFolders])

  React.useEffect(() => { void refresh() }, [refresh])

  const createFolder = async () => {
    const name = newFolder.trim().replace(/\s+/g, ' ')
    if (!name) return
    if (RESERVED_FOLDERS.has(name.toLowerCase())) { setError('That name is reserved for an AppForge folder.'); return }
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { setError('Sign in to create a folder.'); return }
    const { error: createError } = await supabase.from('user_media_folders').insert({ user_id: auth.user.id, name })
    if (createError) { setError(createError.code === '23505' ? 'A folder with that name already exists.' : createError.message); return }
    setNewFolder('')
    await loadFolders()
    setFolder(name)
  }

  const uploadTarget = folder !== 'all' && folder !== 'dragon-arena' && folder !== 'scrapper-pro' ? folder : 'general'
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const files = Array.from(input.files || [])
    input.value = ''
    if (!files.length) return
    setUploading(true); setError('')
    const failures: string[] = []
    for (const file of files) {
      try {
        setUploadProgress((current) => ({ ...current, [file.name]: 0 }))
        await uploadVaultMediaWithProgress(file, { title: file.name, folder: uploadTarget, metadata: { source: 'manual-upload' }, onProgress: (progress) => setUploadProgress((current) => ({ ...current, [file.name]: progress })) })
      } catch (uploadError) { failures.push(`${file.name}: ${uploadError instanceof Error ? uploadError.message : 'upload failed'}`) }
      finally { window.setTimeout(() => setUploadProgress((current) => { const next = { ...current }; delete next[file.name]; return next }), 350) }
    }
    setUploading(false)
    if (failures.length) setError(failures.join(' · '))
    await refresh()
  }

  const moveItem = async (item: VaultMedia, destination: string) => {
    if (isPinnedAsset(item) || !destination || destination === vaultFolder(item)) return
    try {
      await updateVaultMedia(item.id, { metadata: { ...(item.metadata || {}), folder: destination } })
      await refresh()
    } catch (moveError) { setError(moveError instanceof Error ? moveError.message : 'Could not move file.') }
  }

  const handleDelete = async (item: VaultMedia) => {
    const label = item.title || item.file_name || 'this item'
    if (!confirm(item.source_bucket === 'dragon-arena-assets' ? `Delete "${label}" from Story Studio and its stored image?` : `Delete "${label}" from Media Vault?`)) return
    try { await deleteVaultMedia(item); await refresh() } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Could not delete item.') }
  }

  const openPreview = async (item: VaultMedia) => {
    try {
      const primary = await vaultItemUrl(item)
      const urls = item.source_bucket === 'external' ? uniqueUrls([primary, metadataUrl(item, 'media_url'), metadataUrl(item, 'thumbnail')]) : uniqueUrls([primary])
      if (urls.length) setPreview({ item, url: urls[0], fallbacks: urls.slice(1) }); else setError('No preview URL is available for this item.')
    } catch { setError('Could not open preview.') }
  }

  const allFolderOptions = React.useMemo(() => [...SYSTEM_FOLDERS.filter((item) => !['all', 'dragon-arena'].includes(String(item.id))).map((item) => ({ value: String(item.id), label: item.label })), ...userFolders.map((item) => ({ value: item.name, label: item.name }))], [userFolders])
  const folders = React.useMemo(() => [...SYSTEM_FOLDERS, ...userFolders.map((item) => ({ id: item.name as VaultFolder, label: item.name, icon: Folder }))], [userFolders])
  const sortedMedia = React.useMemo(() => [...media].sort((a, b) => {
    const nameA = (a.title || a.file_name || '').toLocaleLowerCase(); const nameB = (b.title || b.file_name || '').toLocaleLowerCase()
    if (sortMode === 'oldest') return a.created_at.localeCompare(b.created_at)
    if (sortMode === 'name-asc') return nameA.localeCompare(nameB)
    if (sortMode === 'name-desc') return nameB.localeCompare(nameA)
    if (sortMode === 'size-desc') return Number(b.size_bytes || 0) - Number(a.size_bytes || 0)
    if (sortMode === 'type') return a.kind.localeCompare(b.kind) || nameA.localeCompare(nameB)
    return b.created_at.localeCompare(a.created_at)
  }), [media, sortMode])
  const usedPct = quota.quota_bytes ? Math.min(100, Math.round((quota.used_bytes / quota.quota_bytes) * 100)) : 0

  return (
    <div className="w-full space-y-5 pb-10">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div><div className="flex flex-wrap items-center gap-2"><Badge color="purple">Private vault</Badge><span className="text-xs text-muted-foreground">Folders, sorting, private uploads and app-generated assets</span></div><h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight"><Upload className="h-6 w-6" /> Media Vault</h1><p className="mt-1 max-w-4xl text-sm leading-6 text-muted-foreground">Organize your files into personal folders. Desktop Buddy generations are automatically archived in Desktop Buddies, while Story Studio assets stay linked to their authoritative story records.</p></div>
        <div className="flex flex-wrap items-center gap-2"><Button variant="secondary" onClick={() => void refresh()} disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</Button><input type="file" multiple accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.json" className="hidden" onChange={handleUpload} disabled={uploading} id="vault-upload" /><label htmlFor="vault-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 bg-background/45 px-3 py-2 text-sm font-medium hover:bg-accent"><Upload className="h-4 w-4" />{uploading ? 'Uploading…' : `Upload to ${uploadTarget === 'general' ? 'General' : uploadTarget}`}</label></div>
      </div>

      <Card className="p-3"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="flex flex-1 gap-2"><input value={newFolder} onChange={(event) => setNewFolder(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void createFolder() }} maxLength={60} placeholder="Create a folder…" className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30" /><Button variant="secondary" onClick={() => void createFolder()} disabled={!newFolder.trim()}><FolderPlus className="h-4 w-4" /> New folder</Button></div><label className="flex items-center gap-2 text-xs text-muted-foreground">Sort<select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="size-desc">Largest first</option><option value="type">Type</option></select></label></div></Card>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">{folders.map(({ id, label, icon: Icon }) => <button key={String(id)} onClick={() => setFolder(id)} className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition-colors ${folder === id ? 'border-foreground/25 bg-accent' : 'border-border/70 bg-background/35 hover:bg-accent/60'}`}><Icon className="h-4 w-4" /><span className="truncate">{label}</span></button>)}</div>

      {uploading && Object.keys(uploadProgress).length > 0 && <Card className="p-3"><div className="space-y-2">{Object.entries(uploadProgress).map(([name, pct]) => <div key={name} className="flex items-center gap-2 text-xs"><span className="w-40 truncate text-muted-foreground">{name}</span><div className="h-2 flex-1 rounded-full bg-muted"><div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${pct}%` }} /></div><span>{pct}%</span></div>)}</div></Card>}
      <Card className="p-3"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Private upload quota used</span><span>{formatBytes(quota.used_bytes)} / {formatBytes(quota.quota_bytes)} ({usedPct}%)</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${usedPct}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">{formatBytes(quota.remaining_bytes)} remaining. Linked Story Studio assets and Getter Pro references are not double-counted against upload storage.</p></Card>
      {error && <Card className="border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</Card>}

      <div className="flex flex-wrap gap-2"><button onClick={() => setFilterKind('all')} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filterKind === 'all' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>All kinds</button>{(['image', 'video', 'document', 'audio', 'other'] as VaultMedia['kind'][]).map((kind) => <button key={kind} onClick={() => setFilterKind(kind)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${filterKind === kind ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{kind}</button>)}<div className="flex-1" /><div className="flex items-center rounded-lg border border-border/60 p-0.5"><Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} title="Grid view"><FileImage className="h-4 w-4" /></Button><Button variant={viewMode === 'showcase' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('showcase')} title="Showcase view"><PanelsTopLeft className="h-4 w-4" /></Button><Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} title="List view"><FileText className="h-4 w-4" /></Button></div></div>

      <div className={viewMode === 'list' ? 'space-y-2' : viewMode === 'showcase' ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-3' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}>
        {loading ? Array.from({ length: 6 }).map((_, index) => <Card key={index} className="overflow-hidden p-0 animate-pulse"><div className="aspect-video bg-muted" /><div className="h-16" /></Card>) : !sortedMedia.length ? <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground"><Folder className="mx-auto h-10 w-10 opacity-50" /><p className="mt-2">No media in this folder/filter yet.</p></div> : sortedMedia.map((item) => {
          const Icon = kindIcon(item.kind); const list = viewMode === 'list'; const showcase = viewMode === 'showcase'
          return <Card key={`${item.metadata?.source_table || item.source_app || 'vault'}-${item.id}`} className={list ? 'flex items-center gap-3 p-3' : `overflow-hidden p-0 ${showcase ? 'bg-card/70' : ''}`}>
            {!list && <button type="button" onClick={() => void openPreview(item)} className={`relative block w-full overflow-hidden bg-muted ${showcase ? 'aspect-[16/10]' : 'aspect-video'}`}><VaultThumb item={item} /></button>}
            <div className={list ? 'min-w-0 flex-1' : 'p-3'}><div className="flex items-start justify-between gap-2"><div className={list ? 'flex min-w-0 items-center gap-2' : 'min-w-0'}>{list && <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />}<div className="min-w-0"><p className="truncate text-sm font-medium">{item.title || item.file_name || 'Untitled'}</p><div className="mt-1 flex flex-wrap items-center gap-1.5">{kindBadge(item.kind)}<Badge color="slate">{vaultFolder(item)}</Badge><span className="text-[10px] text-muted-foreground">{sourceLabel(item)}</span></div></div></div><VaultActions item={item} onPreview={() => void openPreview(item)} onDelete={() => void handleDelete(item)} /></div><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-[11px] text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>{!isPinnedAsset(item) && <select aria-label="Move file to folder" value={vaultFolder(item)} onChange={(event) => void moveItem(item, event.target.value)} className="h-8 max-w-44 rounded-lg border border-input bg-background px-2 text-[11px] text-foreground">{allFolderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}</div></div>
          </Card>
        })}
      </div>

      {preview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setPreview(null)}>{preview.item.kind === 'video' ? <video src={preview.url} controls autoPlay className="max-h-[90vh] max-w-[90vw] rounded-xl" onClick={(event) => event.stopPropagation()} /> : preview.item.kind === 'image' ? <img src={preview.url} alt={preview.item.title || ''} onError={() => setPreview((current) => current && current.fallbacks.length ? { ...current, url: current.fallbacks[0], fallbacks: current.fallbacks.slice(1) } : current)} className="max-h-[90vh] max-w-[90vw] rounded-xl" onClick={(event) => event.stopPropagation()} /> : <div className="max-w-md rounded-xl border border-border/70 bg-background p-6 text-center text-muted-foreground">Preview is not available for this item type. Use the source/download action.</div>}<button onClick={() => setPreview(null)} className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"><X className="h-5 w-5" /></button></div>}
    </div>
  )
}

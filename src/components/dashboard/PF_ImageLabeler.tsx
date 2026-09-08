import React from 'react'
import { Card, Button, Input, Badge } from '@/components/ui'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderOpen,
  Image as ImageIcon,
  Maximize2,
  RotateCcw,
  Tag,
  Upload,
  X,
} from 'lucide-react'

export interface ImageLabel {
  filename: string
  path?: string
  label: string
  tags: string[]
  approved: boolean
}

interface ImageAsset {
  id: string
  name: string
  path: string
  url: string
  size: number
  type: string
  lastModified: number
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif']
const STORAGE_KEY = 'appforge-image-labeler-labels-v2'

const isImageName = (name: string) => IMAGE_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext))

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function PF_ImageLabeler() {
  const [folderName, setFolderName] = React.useState('No folder selected')
  const [images, setImages] = React.useState<ImageAsset[]>([])
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [labels, setLabels] = React.useState<Record<string, ImageLabel>>({})
  const [tagInput, setTagInput] = React.useState('')
  const [error, setError] = React.useState('')
  const [lightbox, setLightbox] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const importInputRef = React.useRef<HTMLInputElement | null>(null)
  const urlsRef = React.useRef<string[]>([])

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setLabels(JSON.parse(raw))
    } catch {
      // Ignore malformed local data.
    }

    return () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(labels))
  }, [labels])

  React.useEffect(() => {
    if (!fileInputRef.current) return
    fileInputRef.current.setAttribute('webkitdirectory', '')
    fileInputRef.current.setAttribute('directory', '')
  }, [])

  const replaceAssets = (assets: ImageAsset[], name: string) => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    urlsRef.current = assets.map((asset) => asset.url)
    setImages(assets)
    setFolderName(name || 'Selected images')
    setCurrentIndex(0)
    setTagInput('')
    setError(assets.length ? '' : 'No supported images were found in that selection.')
  }

  const assetsFromFiles = (files: File[], folder = 'Selected images') => {
    const assets = files
      .filter((file) => isImageName(file.name))
      .map((file) => {
        const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
        return {
          id: relativePath,
          name: file.name,
          path: relativePath,
          url: URL.createObjectURL(file),
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        }
      })
      .sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }))

    replaceAssets(assets, folder)
  }

  const walkDirectory = async (directoryHandle: any, prefix = ''): Promise<{ file: File; path: string }[]> => {
    const found: { file: File; path: string }[] = []
    for await (const entry of directoryHandle.values()) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.kind === 'file' && isImageName(entry.name)) {
        found.push({ file: await entry.getFile(), path })
      } else if (entry.kind === 'directory') {
        found.push(...await walkDirectory(entry, path))
      }
    }
    return found
  }

  const loadFolder = async () => {
    setError('')
    try {
      if ('showDirectoryPicker' in window) {
        const handle = await (window as Window & { showDirectoryPicker?: () => Promise<any> }).showDirectoryPicker?.()
        if (!handle) return
        const found = await walkDirectory(handle)
        const assets = found
          .map(({ file, path }) => ({
            id: path,
            name: file.name,
            path,
            url: URL.createObjectURL(file),
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
          }))
          .sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }))
        replaceAssets(assets, handle.name || 'Selected folder')
      } else {
        fileInputRef.current?.click()
      }
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === 'AbortError') return
      setError(loadError instanceof Error ? loadError.message : 'Could not open that folder.')
    }
  }

  const currentImage = images[currentIndex]
  const currentLabel = currentImage ? labels[currentImage.id] : undefined

  const updateLabel = (patch: Partial<ImageLabel>) => {
    if (!currentImage) return
    setLabels((current) => ({
      ...current,
      [currentImage.id]: {
        filename: currentImage.name,
        path: currentImage.path,
        label: current[currentImage.id]?.label || '',
        tags: current[currentImage.id]?.tags || [],
        approved: current[currentImage.id]?.approved || false,
        ...patch,
      },
    }))
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (!tag || !currentImage) return
    const next = Array.from(new Set([...(currentLabel?.tags || []), tag]))
    updateLabel({ tags: next })
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    updateLabel({ tags: (currentLabel?.tags || []).filter((item) => item !== tag) })
  }

  const goTo = (index: number) => {
    if (!images.length) return
    setCurrentIndex(Math.max(0, Math.min(images.length - 1, index)))
    setTagInput('')
  }

  const saveCurrentImage = () => {
    if (!currentImage) return
    const link = document.createElement('a')
    link.href = currentImage.url
    link.download = currentImage.name
    link.click()
  }

  const exportLabels = () => {
    const payload = images.map((image) => labels[image.id] || {
      filename: image.name,
      path: image.path,
      label: '',
      tags: [],
      approved: false,
    })
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'image-labels.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importLabels = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text())
      if (!Array.isArray(parsed)) throw new Error('Expected a JSON array of label records.')
      const imported: Record<string, ImageLabel> = {}
      parsed.forEach((item) => {
        if (!item || typeof item !== 'object') return
        const key = String(item.path || item.filename || '').trim()
        if (!key) return
        imported[key] = {
          filename: String(item.filename || key.split('/').pop() || key),
          path: String(item.path || key),
          label: String(item.label || ''),
          tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
          approved: Boolean(item.approved),
        }
      })
      setLabels((current) => ({ ...current, ...imported }))
      setError('')
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Could not import labels.')
    }
  }

  const clearFolderLabels = () => {
    if (!images.length) return
    const ids = new Set(images.map((image) => image.id))
    setLabels((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !ids.has(key))))
  }

  const labeledCount = images.filter((image) => {
    const item = labels[image.id]
    return Boolean(item?.label || item?.tags?.length)
  }).length
  const approvedCount = images.filter((image) => labels[image.id]?.approved).length
  const completion = images.length ? Math.round((approvedCount / images.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Image Labeler</h1>
          <Badge color="green">Local-first</Badge>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Review and label local image folders without uploading the images. Works well with ComfyUI output folders and other generated-image collections.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current selection</p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">{folderName}</p>
            <p className="mt-1 text-xs text-muted-foreground">Images stay in your browser. Folder paths are selected through the browser picker rather than typed manually.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={loadFolder}><FolderOpen className="h-4 w-4" /> Open folder</Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /> Choose files</Button>
            <Button variant="secondary" onClick={() => importInputRef.current?.click()}>Import labels</Button>
            <Button variant="secondary" onClick={exportLabels} disabled={!images.length}><Download className="h-4 w-4" /> Export JSON</Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files || [])
            const firstPath = (files[0] as File & { webkitRelativePath?: string } | undefined)?.webkitRelativePath
            const root = firstPath?.split('/')[0] || 'Selected images'
            assetsFromFiles(files, root)
            event.target.value = ''
          }}
        />
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) importLabels(file)
            event.target.value = ''
          }}
        />

        {error && <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">{error}</div>}

        {images.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Images</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{images.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Labeled</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{labeledCount}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{approvedCount} <span className="text-xs font-normal text-muted-foreground">({completion}%)</span></p>
            </div>
          </div>
        )}
      </Card>

      {currentImage ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge color="slate">{currentIndex + 1} / {images.length}</Badge>
                <span className="max-w-[55vw] truncate text-xs text-muted-foreground">{currentImage.path}</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => goTo(currentIndex + 1)} disabled={currentIndex === images.length - 1}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={saveCurrentImage} title="Download original"><Download className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setLightbox(currentImage.url)} title="Full screen"><Maximize2 className="h-4 w-4" /></Button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLightbox(currentImage.url)}
              className="mt-4 flex min-h-[360px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-black/5 p-2 dark:bg-black/30"
            >
              <img src={currentImage.url} alt={currentImage.name} className="max-h-[62vh] max-w-full object-contain" />
            </button>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{currentImage.name}</span>
              <span>{formatBytes(currentImage.size)}</span>
              <span>{currentImage.type || 'image'}</span>
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <label className="text-sm font-medium text-foreground">Label</label>
              <Input
                value={currentLabel?.label || ''}
                onChange={(event) => updateLabel({ label: event.target.value })}
                placeholder="e.g. portrait, product shot, motion reference…"
                className="mt-2"
              />

              <label className="mt-4 block text-sm font-medium text-foreground">Tags</label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="Add tag"
                />
                <Button variant="secondary" onClick={addTag}><Tag className="h-4 w-4" /></Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(currentLabel?.tags || []).map((tag) => (
                  <button key={tag} onClick={() => removeTag(tag)} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-foreground hover:bg-accent">
                    {tag}<X className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
              </div>

              <Button
                className="mt-5 w-full"
                variant={currentLabel?.approved ? 'secondary' : 'primary'}
                onClick={() => updateLabel({ approved: !currentLabel?.approved })}
              >
                <Check className="h-4 w-4" /> {currentLabel?.approved ? 'Approved' : 'Approve image'}
              </Button>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-foreground">Folder queue</h2>
                <span className="text-xs text-muted-foreground">{completion}% approved</span>
              </div>
              <div className="mt-3 max-h-[340px] space-y-1 overflow-y-auto pr-1">
                {images.map((image, index) => {
                  const item = labels[image.id]
                  return (
                    <button
                      key={image.id}
                      onClick={() => goTo(index)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs ${
                        index === currentIndex ? 'border-foreground/30 bg-accent' : 'border-transparent hover:bg-accent/50'
                      }`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item?.approved ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                        {item?.approved ? <Check className="h-3 w-3" /> : index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-foreground">{image.path}</span>
                    </button>
                  )
                })}
              </div>
              <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={clearFolderLabels}>
                <RotateCcw className="h-3.5 w-3.5" /> Clear labels for this folder
              </Button>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <div className="py-12 text-center">
            <ImageIcon className="mx-auto h-7 w-7 text-muted-foreground" />
            <h2 className="mt-3 text-sm font-medium text-foreground">Open a local image folder</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Supported formats: PNG, JPEG, WebP, GIF, and AVIF. Images are previewed through local object URLs and are not uploaded.</p>
          </div>
        </Card>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute right-4 top-4 rounded-lg bg-black/40 p-2 text-white hover:bg-black/60" aria-label="Close preview">
            <X className="h-6 w-6" />
          </button>
          <img src={lightbox} alt="Full-size preview" className="max-h-[92vh] max-w-[96vw] object-contain" />
        </div>
      )}
    </div>
  )
}

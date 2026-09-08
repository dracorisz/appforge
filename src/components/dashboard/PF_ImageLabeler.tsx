import React from 'react'
import { Card, Button, Input, Badge, Checkbox } from '@/components/ui'
import { FolderOpen, Image as ImageIcon, ChevronLeft, ChevronRight, Tag, Check, Download, X, Maximize2 } from 'lucide-react'

export interface ImageLabel {
  filename: string
  label: string
  tags: string[]
  approved: boolean
}

const DEFAULT_FOLDER = '/home/dragoljub/Projects/ComfyUI/output'
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif']

export function PF_ImageLabeler() {
  const [folder, setFolder] = React.useState(DEFAULT_FOLDER)
  const [images, setImages] = React.useState<string[]>([])
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [labels, setLabels] = React.useState<Record<string, ImageLabel>>({})
  const [labelInput, setLabelInput] = React.useState('')
  const [tagInput, setTagInput] = React.useState('')
  const [loaded, setLoaded] = React.useState(false)
  const [imageUrls, setImageUrls] = React.useState<Record<string, string>>({})
  const [error, setError] = React.useState('')
  const [lightbox, setLightbox] = React.useState<string | null>(null)

  const loadFolder = async () => {
    setError('')
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker()
        const files: string[] = []
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file' && IMAGE_EXTENSIONS.some(ext => entry.name.toLowerCase().endsWith(ext))) {
            files.push(entry.name)
          }
        }
        setImages(files.sort())
        const urls: Record<string, string> = {}
        for (const file of files) {
          const fileHandle = await dirHandle.getFileHandle(file)
          const fileData = await fileHandle.getFile()
          urls[file] = URL.createObjectURL(fileData)
        }
        setImageUrls(urls)
        setCurrentIndex(0)
        setLoaded(true)
      } else {
        const input = document.createElement('input')
        input.type = 'file'
        input.webkitdirectory = true
        input.multiple = true
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement
          const files = Array.from(target.files || [])
          const imageFiles = files.filter(f => IMAGE_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext)))
          const names = imageFiles.map(f => f.name)
          setImages(names.sort())
          const urls: Record<string, string> = {}
          for (const f of imageFiles) {
            urls[f.name] = URL.createObjectURL(f)
          }
          setImageUrls(urls)
          setCurrentIndex(0)
          setLoaded(true)
        }
        input.click()
      }
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const saveCurrentImage = () => {
    const currentImage = images[currentIndex]
    if (!currentImage || !imageUrls[currentImage]) return
    const a = document.createElement('a')
    a.href = imageUrls[currentImage]
    a.download = currentImage
    a.click()
  }

  const currentImage = images[currentIndex]
  const currentLabel = currentImage ? labels[currentImage] : undefined

  const updateLabel = (patch: Partial<ImageLabel>) => {
    if (!currentImage) return
    setLabels(prev => ({
      ...prev,
      [currentImage]: {
        filename: currentImage,
        label: prev[currentImage]?.label || '',
        tags: prev[currentImage]?.tags || [],
        approved: prev[currentImage]?.approved || false,
        ...patch
      }
    }))
  }

  const approveCurrent = () => {
    updateLabel({ approved: !currentLabel?.approved })
  }

  const addTag = () => {
    if (!tagInput.trim() || !currentImage) return
    setLabels(prev => ({
      ...prev,
      [currentImage]: {
        ...prev[currentImage],
        filename: currentImage,
        label: prev[currentImage]?.label || '',
        tags: [...(prev[currentImage]?.tags || []), tagInput.trim()],
        approved: prev[currentImage]?.approved || false
      }
    }))
    setTagInput('')
  }

  const exportLabels = () => {
    const data = Object.values(labels)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'image-labels.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const approvedCount = Object.values(labels).filter(l => l.approved).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground">Image Labeler</h1>
        <p className="mt-1 text-sm text-foreground dark:text-muted-foreground">Label images from a local folder. Connected to ComfyUI generation flow.</p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-foreground dark:text-foreground">Image folder</label>
            <Input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="/path/to/images" />
          </div>
          <div className="flex gap-2">
            <Button onClick={loadFolder}><FolderOpen className="h-4 w-4" /> Load folder</Button>
          </div>
        </div>
        {error && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
            {error}
          </div>
        )}
        {loaded && (
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground dark:text-muted-foreground">
            <span>{images.length} images found</span>
            <span>{approvedCount} approved</span>
            <span>{Object.keys(labels).length} labeled</span>
          </div>
        )}
      </Card>

      {loaded && images.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <Badge color="slate">{currentIndex + 1} / {images.length}</Badge>
              <div className="flex gap-1">
                <Button variant="ghost" onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" onClick={() => setCurrentIndex(i => Math.min(images.length - 1, i + 1))} disabled={currentIndex === images.length - 1}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="secondary" onClick={saveCurrentImage} disabled={!currentImage}><Download className="h-4 w-4" /> Save</Button>
                {currentImage && imageUrls[currentImage] && (
                  <Button variant="ghost" onClick={() => setLightbox(imageUrls[currentImage])}><Maximize2 className="h-4 w-4" /></Button>
                )}
              </div>
            </div>
            <div className="mt-4 flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-input bg-muted dark:border-border dark:bg-background">
              {currentImage && imageUrls[currentImage] ? (
                <img src={imageUrls[currentImage]} alt={currentImage} className="max-h-full max-w-full cursor-pointer rounded-lg object-contain" onClick={() => setLightbox(imageUrls[currentImage])} />
              ) : (
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-foreground">{currentImage || 'No image selected'}</p>
                  <p className="text-xs text-muted-foreground">Image preview</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-foreground dark:text-foreground">Label</label>
              <Input value={currentLabel?.label || ''} onChange={(e) => updateLabel({ label: e.target.value })} placeholder="e.g. portrait, landscape, abstract..." />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-foreground dark:text-foreground">Tags</label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag..." onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <Button variant="secondary" onClick={addTag}><Tag className="h-4 w-4" /> Add</Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {currentLabel?.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground dark:bg-secondary dark:text-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <Checkbox label="Approved" checked={currentLabel?.approved || false} onChange={approveCurrent} />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-foreground dark:text-foreground">Labeled images ({Object.keys(labels).length})</h3>
            <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
              {Object.values(labels).length === 0 ? (
                <p className="text-sm text-foreground">No images labeled yet.</p>
              ) : (
                Object.values(labels).map(label => (
                  <div key={label.filename} className="flex items-center justify-between rounded-lg border border-border p-2 dark:border-border">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground dark:text-foreground">{label.filename}</p>
                      <p className="text-xs text-foreground">{label.label || 'Untitled'}</p>
                    </div>
                    {label.approved && <Check className="h-4 w-4 text-emerald-500" />}
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <Button variant="secondary" onClick={exportLabels} disabled={Object.keys(labels).length === 0}>Export labels JSON</Button>
            </div>
          </Card>
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <div className="relative w-full max-w-5xl">
            <button onClick={() => setLightbox(null)} className="absolute -right-10 top-0 rounded-lg p-2 text-white hover:bg-white/10">
              <X className="h-6 w-6" />
            </button>
            <img src={lightbox} alt="Full size" className="max-h-[85vh] w-full rounded-lg object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}

import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { Button, Card, Select } from '@/components/ui'
import { loadAllFrontendContent, updateFrontendContent, type FrontendContentRecord } from '@/lib/frontendContent'
import { toast } from '@/lib/toast'

export function AdminFeaturedBlogControl() {
  const [articles, setArticles] = React.useState<FrontendContentRecord[]>([])
  const [selectedId, setSelectedId] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  const refresh = React.useCallback(async () => {
    const rows = await loadAllFrontendContent()
    const published = rows.filter((item) => item.content_type === 'blog_article' && item.published)
    setArticles(published)
    setSelectedId(published.find((item) => item.metadata?.featured === true)?.id || published[0]?.id || '')
  }, [])

  React.useEffect(() => { void refresh().catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load blog articles.')) }, [refresh])

  const save = async () => {
    if (!selectedId || busy) return
    setBusy(true)
    try {
      await Promise.all(articles.map((article) => updateFrontendContent(article.id, {
        metadata: { ...(article.metadata || {}), featured: article.id === selectedId },
      })))
      await refresh()
      toast.success('Featured blog article updated.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the featured article.')
    } finally { setBusy(false) }
  }

  if (!articles.length) return null

  return <Card className="p-3">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4" /> Featured blog article</div>
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">Choose the single published article highlighted on the public Blog page.</p>
        <div className="mt-2 max-w-xl"><Select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} aria-label="Featured blog article">{articles.map((article) => <option key={article.id} value={article.id}>{article.title}</option>)}</Select></div>
      </div>
      <Button variant="secondary" onClick={() => void save()} disabled={busy}>{busy ? 'Saving…' : 'Set featured'}</Button>
    </div>
  </Card>
}

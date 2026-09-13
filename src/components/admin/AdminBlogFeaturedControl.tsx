import * as React from 'react'
import { Check, Loader2, Star } from 'lucide-react'
import { Button, Card, Select } from '@/components/ui'
import { loadAllFrontendContent, updateFrontendContent, type FrontendContentRecord } from '@/lib/frontendContent'
import { toast } from '@/lib/toast'

export function AdminBlogFeaturedControl() {
  const [articles, setArticles] = React.useState<FrontendContentRecord[]>([])
  const [selected, setSelected] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      const rows = (await loadAllFrontendContent()).filter((row) => row.content_type === 'blog_article' && row.published)
      setArticles(rows)
      const featured = rows.find((row) => row.metadata?.featured === true)
      setSelected(featured?.id || rows[0]?.id || '')
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not load blog articles.')
    } finally { setLoading(false) }
  }, [])

  React.useEffect(() => { void refresh() }, [refresh])

  const save = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await Promise.all(articles.map((article) => updateFrontendContent(article.id, {
        metadata: { ...(article.metadata || {}), featured: article.id === selected },
      })))
      toast.success('Featured article updated.')
      await refresh()
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not update the featured article.')
    } finally { setSaving(false) }
  }

  return <Card className="p-3">
    <div className="flex items-start gap-2"><Star className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><h2 className="text-sm font-semibold">Featured blog article</h2><p className="mt-1 text-[11px] leading-4 text-muted-foreground">Choose the single published article highlighted on the public Blog landing page.</p></div></div>
    <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <Select value={selected} onChange={(event) => setSelected(event.target.value)} disabled={loading || !articles.length} aria-label="Featured blog article">
        {!articles.length && <option value="">No published blog articles</option>}
        {articles.map((article) => <option key={article.id} value={article.id}>{article.title}</option>)}
      </Select>
      <Button onClick={() => void save()} disabled={loading || saving || !selected}>{saving ? <Loader2 className="animate-spin" /> : <Check />} Save featured</Button>
    </div>
  </Card>
}

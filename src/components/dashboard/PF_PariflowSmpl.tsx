import React from 'react'
import { Card, Button, Input, Badge } from '@/components/ui'
import { ExternalLink, RefreshCw, AlertCircle, FileText } from 'lucide-react'

export interface PariflowDoc {
  id: string
  title: string
  url: string
  section: string
  scrapedAt: string
}

const DEFAULT_DOCS: PariflowDoc[] = [
  { id: 'doc-1', title: 'Getting Started with Pariflow', url: 'https://docs.pariflow.com/', section: 'General', scrapedAt: new Date().toISOString() },
  { id: 'doc-2', title: 'Agent MCP CLI', url: 'https://docs.pariflow.com/developers/agent-mcp-cli', section: 'Developers', scrapedAt: new Date().toISOString() },
  { id: 'doc-3', title: 'Pariflow API Reference', url: 'https://docs.pariflow.com/api', section: 'Developers', scrapedAt: new Date().toISOString() },
  { id: 'doc-4', title: 'Prediction Markets Guide', url: 'https://pariflow.com/', section: 'General', scrapedAt: new Date().toISOString() },
]

const MCP_GUIDE = [
  { step: 1, title: 'Install Pariflow CLI', description: 'npm install -g @pariflow/agent-cli', code: 'npm install -g @pariflow/agent-cli' },
  { step: 2, title: 'Authenticate', description: 'pariflow login --api-key <your-key>', code: 'pariflow login --api-key <your-key>' },
  { step: 3, title: 'Connect MCP Server', description: 'Add to your MCP config file', code: '{\n  "mcpServers": {\n    "pariflow": {\n      "command": "pariflow",\n      "args": ["mcp", "start"],\n      "env": {\n        "PARIFLOW_API_KEY": "<your-key>"\n      }\n    }\n  }\n}' },
  { step: 4, title: 'Verify Connection', description: 'Test the MCP connection', code: 'pariflow mcp status' }
]

export function PF_PariflowSmpl() {
  const [docs, setDocs] = React.useState<PariflowDoc[]>(DEFAULT_DOCS)
  const [query, setQuery] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const getApiKey = () => {
    try {
      const keys = localStorage.getItem('projectforge-api-keys')
        ? JSON.parse(localStorage.getItem('projectforge-api-keys') || '{}')
        : {}
      return keys.pariflow || import.meta.env.VITE_PARIFLOW_API_KEY || '7e6829465e93c09071ad30f9c61bd88a08807aad46476bfb73e8b321782fc4c8'
    } catch {
      return import.meta.env.VITE_PARIFLOW_API_KEY || '7e6829465e93c09071ad30f9c61bd88a08807aad46476bfb73e8b321782fc4c8'
    }
  }
  const apiKey = getApiKey()
  const [useApi, setUseApi] = React.useState(false)

  const fetchDocs = async () => {
    setLoading(true)
    setError('')
    try {
      if (!useApi) {
        const res = await fetch('https://docs.pariflow.com/', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        })
        if (!res.ok) throw new Error('Failed to fetch docs')
        const text = await res.text()
        setDocs(prev => prev.map(d => ({ ...d, scrapedAt: new Date().toISOString() })))
        return
      }
      const res2 = await fetch('https://docs.pariflow.com/developers/agent-mcp-cli', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })
      if (!res2.ok) throw new Error('Failed to fetch developer docs')
      const text2 = await res2.text()
      setDocs(prev => prev.map(d => ({ ...d, scrapedAt: new Date().toISOString() })))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchDocs()
  }, [])

  const filtered = query
    ? docs.filter(d => d.title.toLowerCase().includes(query.toLowerCase()) || d.section.toLowerCase().includes(query.toLowerCase()))
    : docs

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground">PariflowSmpl</h1>
        <p className="mt-1 text-sm text-foreground dark:text-muted-foreground">Pariflow.com docs scraper with MCP CLI integration and data persistence.</p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-foreground dark:text-foreground">Search docs</label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by title or section..." />
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchDocs} disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button variant="secondary" onClick={() => setUseApi(!useApi)}>
              {useApi ? 'Use Dummy' : 'Use API'}
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground dark:bg-secondary dark:text-muted-foreground">
            Mode: {useApi ? 'Live API' : 'Dummy'}
          </span>
          <span className="text-foreground">API Key: {apiKey.slice(0, 8)}...</span>
        </div>
        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Showing default docs. Click Refresh to retry.</p>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(doc => (
          <Card key={doc.id} className="transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground dark:text-foreground">{doc.title}</h3>
              </div>
              <Badge color="slate">{doc.section}</Badge>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-foreground truncate">{doc.url}</p>
              <p className="text-xs text-muted-foreground">Scraped: {new Date(doc.scrapedAt).toLocaleString()}</p>
            </div>
            <div className="mt-3">
              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" className="w-full"><ExternalLink className="h-4 w-4" /> Open</Button>
              </a>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold text-foreground dark:text-foreground">MCP CLI Connection Guide</h2>
        <p className="text-sm text-muted-foreground">Follow these steps to connect Pariflow to your MCP client.</p>
        <div className="space-y-4">
          {MCP_GUIDE.map((item) => (
            <Card key={item.step} className="transition-all hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground dark:text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  <div className="mt-2 rounded-md bg-muted p-2">
                    <code className="text-xs text-foreground font-mono whitespace-pre-wrap break-all">{item.code}</code>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

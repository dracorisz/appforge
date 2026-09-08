import React from 'react'
import { Card, Button, Input, Textarea, Select, Modal } from '@/components/ui'
import { Moon, Sun, Monitor, Download, Upload, RotateCcw, Printer, GitFork, RefreshCw } from 'lucide-react'
import type { AppState, Settings } from '@/types'

const STORAGE_KEY = 'appforge-api-keys'
const GITHUB_STORAGE_KEY = 'appforge-github-token'

type ThemeMode = 'light' | 'dark' | 'system'

interface GitHubRepo {
  id: string
  name: string
  full_name: string
  forks_count: number
  html_url: string
}

export function SettingsPage({ state, setState }: { state: AppState; setState: (s: AppState) => void }) {
  const [settings, setSettings] = React.useState<Settings>(state.settings)
  const [confirmAction, setConfirmAction] = React.useState<string | null>(null)
  const [apiKeys, setApiKeys] = React.useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
       return {
      weather: import.meta.env.VITE_WEATHERAPI_KEY || '',
      pariflow: import.meta.env.VITE_PARIFLOW_API_KEY || '',
      coinmarketcap: import.meta.env.VITE_COINMARKETCAP_API_KEY || '',
      coinpaprika: import.meta.env.VITE_COINPAPRIKA_API_KEY || '',
    }
  })
  const [githubToken, setGithubToken] = React.useState<string>(() => {
    try {
      const raw = localStorage.getItem(GITHUB_STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return ''
  })
  const [liveUrl, setLiveUrl] = React.useState<string>(() => {
    try {
      const raw = localStorage.getItem('appforge-live-url')
      if (raw) return JSON.parse(raw)
      const legacy = localStorage.getItem('projectforge-live-url')
      if (legacy) return JSON.parse(legacy)
    } catch { /* ignore */ }
    return 'https://appforge.sstoken.space'
  })
  const [githubRepos, setGithubRepos] = React.useState<GitHubRepo[]>([])
  const [githubLoading, setGithubLoading] = React.useState(false)
  const [themeMode, setThemeMode] = React.useState<ThemeMode>('system')
  const [activeTab, setActiveTab] = React.useState<'theming' | 'api' | 'integrations' | 'pwa' | 'data' | 'deployment' | 'about'>('theming')

  React.useEffect(() => {
    const saved = localStorage.getItem('appforge-theme')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setThemeMode(parsed.mode || 'system')
      } catch { /* ignore */ }
    }
  }, [])

  React.useEffect(() => {
    const root = window.document.documentElement
    const isDark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.toggle('dark', isDark)
    localStorage.setItem('appforge-theme', JSON.stringify({ mode: themeMode }))
  }, [themeMode])

  const applySettings = (s: Settings) => {
    setSettings(s)
    setState({ ...state, settings: s })
  }

  const updateApiKey = (key: string, value: string) => {
    setApiKeys(prev => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const updateGithubToken = (value: string) => {
    setGithubToken(value)
    localStorage.setItem(GITHUB_STORAGE_KEY, JSON.stringify(value))
  }

  const fetchGitHubForks = async () => {
    if (!githubToken) return
    setGithubLoading(true)
    try {
      const owner = 'appforge'
      const repos: GitHubRepo[] = []
      for (const app of state.miniApps) {
        if (!app.codename) continue
        const repoName = app.codename.replace('PF_', '').toLowerCase()
        try {
          const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
            headers: { 'Authorization': `token ${githubToken}`, 'Accept': 'application/vnd.github.v3+json' }
          })
          if (res.ok) {
            const data = await res.json()
            repos.push({
              id: app.id,
              name: data.name || app.name,
              full_name: data.full_name || `${owner}/${repoName}`,
              forks_count: data.forks_count || 0,
              html_url: data.html_url || `https://github.com/${owner}/${repoName}`
            })
          }
        } catch { /* skip */ }
      }
      setGithubRepos(repos)
      if (repos.length > 0) {
        setState({
          ...state,
          miniApps: state.miniApps.map(a => {
            const repo = repos.find(r => r.id === a.id)
            return repo ? { ...a, forks: repo.forks_count } : a
          })
        })
      }
    } catch { /* ignore */ }
    setGithubLoading(false)
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'appforge-backup.json'; a.click(); URL.revokeObjectURL(url)
  }

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        if (parsed && typeof parsed === 'object') {
          setState(parsed as AppState)
        } else {
          alert('Invalid JSON')
        }
      } catch { alert('Invalid JSON') }
    }
    reader.readAsText(file)
  }

  const resetDemo = () => {
    setState({
      ...state,
      plan: state.plan.map(p => ({ ...p, status: 'Not started', items: [] })),
      article: { ...state.article, body: '' },
      pitches: state.pitches.map(p => ({ ...p, subject: '', body: '' })),
      sources: [],
      outreach: [],
      checklist: state.checklist.map(c => ({ ...c, checked: false }))
    })
    setConfirmAction(null)
  }

  const clearAll = () => {
    localStorage.removeItem('appforge-workplan-v1')
    setState({
      ...state,
      plan: [],
      article: { ...state.article, body: '' },
      pitches: [],
      sources: [],
      outreach: [],
      checklist: []
    })
    setConfirmAction(null)
  }

  const tabs = [
    { id: 'theming', label: 'Theming' },
    { id: 'api', label: 'API Keys' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'pwa', label: 'PWA' },
    { id: 'data', label: 'Data' },
    { id: 'deployment', label: 'Deployment' },
    { id: 'about', label: 'About' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Application preferences, API keys, and integrations.</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'theming' && (
        <Card>
          <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Theme</label>
              <div className="mt-2 flex gap-2">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor }
                ].map(opt => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setThemeMode(opt.value as ThemeMode)}
                      className={`flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors ${
                        themeMode === opt.value ? 'border-primary bg-accent' : 'hover:bg-accent'
                      }`}
                    >
                      <Icon className="h-4 w-4" /> {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Default shadcn/ui B&W theme. Clean, minimal, monochrome.</p>
          </div>
        </Card>
      )}

      {activeTab === 'api' && (
        <Card>
          <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
          <p className="mt-1 text-xs text-muted-foreground">Keys are stored locally. Apps use dummy data by default unless keys are provided.</p>
          <div className="mt-4 space-y-3">
            <Input label="WeatherAPI Key" value={apiKeys.weather || ''} onChange={(e) => updateApiKey('weather', e.target.value)} placeholder="Enter WeatherAPI key..." />
            <Input label="Pariflow API Key" value={apiKeys.pariflow || ''} onChange={(e) => updateApiKey('pariflow', e.target.value)} placeholder="Enter Pariflow key..." />
             <Input label="CoinMarketCap API Key" value={apiKeys.coinmarketcap || ''} onChange={(e) => updateApiKey('coinmarketcap', e.target.value)} placeholder="Enter CoinMarketCap key..." />
             <Input label="CoinPaprika API Key" value={apiKeys.coinpaprika || ''} onChange={(e) => updateApiKey('coinpaprika', e.target.value)} placeholder="Enter CoinPaprika key..." />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Keys are saved to localStorage automatically.</p>
        </Card>
      )}

      {activeTab === 'integrations' && (
        <Card>
          <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
          <p className="mt-1 text-xs text-muted-foreground">Connect external services to sync real data.</p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">GitHub Personal Access Token</label>
              <p className="text-xs text-muted-foreground">Used to fetch real fork counts from GitHub repos. Token is stored locally.</p>
              <div className="mt-2 flex gap-2">
                <Input
                  type="password"
                  value={githubToken}
                  onChange={(e) => updateGithubToken(e.target.value)}
                  placeholder="ghp_..."
                  className="flex-1"
                />
                <Button onClick={fetchGitHubForks} disabled={!githubToken || githubLoading}>
                  {githubLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <GitFork className="h-4 w-4" />}
                  {githubLoading ? 'Syncing...' : 'Sync forks'}
                </Button>
              </div>
            </div>
            {githubRepos.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Synced Repositories</p>
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {githubRepos.map(repo => (
                    <div key={repo.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{repo.name}</p>
                        <p className="text-xs text-muted-foreground">{repo.full_name}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <GitFork className="h-3 w-3" />
                        {repo.forks_count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground">Supabase + Google Login</p>
              <p className="mt-1 text-xs text-muted-foreground">Project is prepared for Supabase backend and Google authentication. Configure in <code className="rounded bg-muted px-1 py-0.5">.env</code>:</p>
              <ul className="mt-2 ml-4 list-disc text-xs text-muted-foreground">
                <li><code className="rounded bg-muted px-1 py-0.5">VITE_SUPABASE_URL</code></li>
                <li><code className="rounded bg-muted px-1 py-0.5">VITE_SUPABASE_ANON_KEY</code></li>
                <li><code className="rounded bg-muted px-1 py-0.5">VITE_GOOGLE_CLIENT_ID</code></li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">Backend tables and auth providers are ready to be enabled in Supabase dashboard.</p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'pwa' && (
        <Card>
          <h2 className="text-lg font-semibold text-foreground">Progressive Web App</h2>
          <p className="mt-1 text-xs text-muted-foreground">Configure PWA settings and live deployment URL.</p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Live URL</label>
              <p className="text-xs text-muted-foreground">The public URL where this app is deployed. Used for PWA manifest and sharing.</p>
              <div className="mt-2 flex gap-2">
                <Input
                  value={liveUrl}
                  onChange={(e) => {
                    setLiveUrl(e.target.value)
                    localStorage.setItem('appforge-live-url', JSON.stringify(e.target.value))
                  }}
                  placeholder="https://appforge.sstoken.space"
                  className="flex-1"
                />
                <Button variant="secondary" onClick={() => window.open(liveUrl, '_blank')}>Open</Button>
              </div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground">PWA Features</p>
              <ul className="mt-2 ml-4 list-disc text-xs text-muted-foreground">
                <li>Installable on desktop and mobile</li>
                <li>Offline support via service worker</li>
                <li>App manifest with icons and theme</li>
                <li>Push notifications ready</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-foreground">sstoken.space Deployment</p>
              <p className="mt-1 text-xs text-muted-foreground">Upload the <code className="rounded bg-muted px-1 py-0.5">dist/</code> folder to sstoken.space via FTP/SFTP. The live URL will be automatically detected.</p>
              <p className="mt-2 text-xs text-muted-foreground">Current live URL: <code className="rounded bg-muted px-1 py-0.5">{liveUrl}</code></p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'data' && (
        <Card>
          <h2 className="text-lg font-semibold text-foreground">Data</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print report</Button>
            <Button variant="secondary" onClick={exportJSON}><Download className="h-4 w-4" /> Export all data</Button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground hover:bg-accent">
              <Upload className="h-4 w-4" /> Import data
              <input type="file" accept="application/json" onChange={importJSON} className="hidden" />
            </label>
            <Button variant="secondary" onClick={() => setConfirmAction('reset')}><RotateCcw className="h-4 w-4" /> Reset demo data</Button>
            <Button variant="secondary" onClick={() => setConfirmAction('clear')} className="text-destructive">Clear local data</Button>
          </div>
        </Card>
      )}

      {activeTab === 'deployment' && (
        <Card>
          <h2 className="text-lg font-semibold text-foreground">Deployment</h2>
          <p className="mt-2 text-sm text-muted-foreground">Deploy to Vercel, GitHub Pages, or sstoken.space.</p>
          <div className="mt-3 space-y-2 text-xs text-muted-foreground">
            <p><strong>Vercel:</strong> connect this repo in Vercel dashboard. Build command: <code className="rounded bg-muted px-1 py-0.5">npm run build</code>. Output dir: <code className="rounded bg-muted px-1 py-0.5">dist</code>.</p>
            <p><strong>GitHub Pages:</strong> enable Pages in repo Settings → Pages → Source: GitHub Actions, or use <code className="rounded bg-muted px-1 py-0.5">npm run build && npm run preview</code>.</p>
            <p><strong>sstoken.space:</strong> upload the <code className="rounded bg-muted px-1 py-0.5">dist/</code> folder via FTP/SFTP.</p>
            <p><strong>Environment variables:</strong> set in Vercel dashboard under Settings → Environment Variables:</p>
            <ul className="ml-4 list-disc">
              <li><code className="rounded bg-muted px-1 py-0.5">VITE_WEATHERAPI_KEY</code></li>
              <li><code className="rounded bg-muted px-1 py-0.5">VITE_PARIFLOW_API_KEY</code></li>
               <li><code className="rounded bg-muted px-1 py-0.5">VITE_COINMARKETCAP_API_KEY</code></li>
               <li><code className="rounded bg-muted px-1 py-0.5">VITE_COINPAPRIKA_API_KEY</code></li>
              <li><code className="rounded bg-muted px-1 py-0.5">VITE_SUPABASE_URL</code></li>
              <li><code className="rounded bg-muted px-1 py-0.5">VITE_SUPABASE_ANON_KEY</code></li>
              <li><code className="rounded bg-muted px-1 py-0.5">VITE_GOOGLE_CLIENT_ID</code></li>
            </ul>
            <p className="mt-2 rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-destructive-foreground">Note: exposing API keys in client-side code is visible to users. For production, proxy requests through a backend.</p>
          </div>
        </Card>
      )}

      {activeTab === 'about' && (
        <Card>
          <h2 className="text-lg font-semibold text-foreground">About</h2>
          <p className="mt-2 text-sm text-muted-foreground">AppForge — Simple, powerful tools for everyday work.</p>
          <p className="text-xs text-muted-foreground">Local-first. No backend. No analytics. No tracking. All data stays in your browser. Open source.</p>
        </Card>
      )}

      <Modal open={confirmAction === 'reset'} onClose={() => setConfirmAction(null)} title="Confirm reset">
        <p className="text-sm text-muted-foreground">This will reset all demo data while preserving structure. Are you sure?</p>
        <div className="mt-4 flex gap-2">
          <Button onClick={resetDemo}>Reset</Button>
          <Button variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</Button>
        </div>
      </Modal>

      <Modal open={confirmAction === 'clear'} onClose={() => setConfirmAction(null)} title="Confirm clear">
        <p className="text-sm text-destructive">This will permanently delete all local data. This cannot be undone. Are you sure?</p>
        <div className="mt-4 flex gap-2">
          <Button onClick={clearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Clear</Button>
          <Button variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}

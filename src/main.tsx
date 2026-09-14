import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, useLocation } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import { PwaLifecycle } from './components/pwa/PwaLifecycle'
import { ChangelogPage } from './components/public/ChangelogPage'
import { CookieNotice } from './components/public/CookieNotice'
import { DocsPage } from './components/public/DocsPage'
import { PublicBlogArticlePage, PublicBlogPage } from './components/public/PublicContentPages'
import { ToastViewport } from './components/ui/ToastViewport'
import { updateSeo } from './lib/seo'
import './index.css'
import './presentation.css'

type ThemeMode = 'light' | 'dark' | 'system'

const readSavedTheme = (): ThemeMode | null => {
  try {
    const raw = localStorage.getItem('appforge-theme')
    if (raw) {
      const mode = JSON.parse(raw)?.mode
      if (mode === 'light' || mode === 'dark' || mode === 'system') return mode
    }
  } catch { /* ignore malformed local preference */ }

  try {
    const raw = localStorage.getItem('appforge-workplan-v1')
    if (raw) {
      const mode = JSON.parse(raw)?.settings?.theme
      if (mode === 'light' || mode === 'dark' || mode === 'system') return mode
    }
  } catch { /* ignore malformed legacy state */ }

  return null
}

const initialTheme = readSavedTheme() || 'dark'
const initialDark = initialTheme === 'dark' || (initialTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
document.documentElement.classList.toggle('dark', initialDark)
if (!localStorage.getItem('appforge-theme')) localStorage.setItem('appforge-theme', JSON.stringify({ mode: initialTheme }))

const docsSlugFromPath = (pathname: string, prefix = '') => {
  const relative = prefix && pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname
  const clean = relative.replace(/^\/+|\/+$/g, '').replace(/\.(?:html|md)$/i, '')
  if (clean === 'DESIGN_SYSTEM') return 'design-system-reference'
  if (/^apps\/index$/i.test(clean) || clean.toLowerCase() === 'apps') return 'apps'
  return clean.replace(/_/g, '-').toLowerCase() || 'index'
}

function RootApp() {
  const location = useLocation()
  const docsHost = window.location.hostname.toLowerCase() === 'docs.sstoken.space'

  React.useEffect(() => { updateSeo(location.pathname) }, [location.pathname])

  if (docsHost) return <DocsPage slug={docsSlugFromPath(location.pathname)} />
  if (location.pathname === '/docs' || location.pathname.startsWith('/docs/')) return <DocsPage slug={docsSlugFromPath(location.pathname, '/docs')} />
  if (location.pathname === '/blog') return <PublicBlogPage />
  if (location.pathname === '/changelog') return <ChangelogPage />
  if (location.pathname === '/admin/content') return <Navigate to="/settings/admin" replace />
  if (location.pathname.startsWith('/blog/')) {
    const slug = location.pathname.slice('/blog/'.length).replace(/\/+$/, '')
    return <PublicBlogArticlePage slug={slug} />
  }

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <RootApp />
      <ToastViewport />
      <CookieNotice />
      <PwaLifecycle />
    </AuthProvider>
  </BrowserRouter>,
)

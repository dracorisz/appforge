import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, useLocation } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import { PwaLifecycle } from './components/pwa/PwaLifecycle'
import { CookieNotice } from './components/public/CookieNotice'
import { ChangelogPage } from './components/public/ChangelogPage'
import { PublicBlogArticlePage, PublicBlogPage } from './components/public/PublicContentPages'
import { updateSeo } from './lib/seo'
import './index.css'
import './media.css'

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

function RootApp() {
  const location = useLocation()

  React.useEffect(() => { updateSeo(location.pathname) }, [location.pathname])

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
      <CookieNotice />
      <PwaLifecycle />
    </AuthProvider>
  </BrowserRouter>,
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useLocation } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import { AdminContentManager } from './components/admin/AdminContentManager'
import { PwaLifecycle } from './components/pwa/PwaLifecycle'
import { CookieNotice } from './components/public/CookieNotice'
import { ChangelogPage } from './components/public/ChangelogPage'
import { PublicBlogArticlePage, PublicBlogPage } from './components/public/PublicContentPages'
import { updateSeo } from './lib/seo'
import './index.css'
import './media.css'

function RootApp() {
  const location = useLocation()

  React.useEffect(() => {
    updateSeo(location.pathname)
  }, [location.pathname])

  if (location.pathname === '/blog') return <PublicBlogPage />
  if (location.pathname === '/changelog') return <ChangelogPage />
  if (location.pathname === '/admin/content') return <AdminContentManager />
  if (location.pathname.startsWith('/blog/')) {
    const slug = location.pathname.slice('/blog/'.length).replace(/\/+$/, '')
    return <PublicBlogArticlePage slug={slug} />
  }

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider>
      <RootApp />
      <CookieNotice />
      <PwaLifecycle />
    </AuthProvider>
  </BrowserRouter>,
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import { PwaLifecycle } from './components/pwa/PwaLifecycle'
import { ToastViewport } from './components/ui/ToastViewport'
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
  } catch {
    /* ignore malformed local preference */
  }
  return null
}

const initialTheme = readSavedTheme() || 'dark'
const initialDark =
  initialTheme === 'dark' ||
  (initialTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
document.documentElement.classList.toggle('dark', initialDark)
if (!localStorage.getItem('appforge-theme')) {
  localStorage.setItem('appforge-theme', JSON.stringify({ mode: initialTheme }))
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <ToastViewport />
      <PwaLifecycle />
    </AuthProvider>
  </BrowserRouter>
)

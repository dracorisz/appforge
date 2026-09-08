import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import { PwaLifecycle } from './components/pwa/PwaLifecycle'
import { CookieNotice } from './components/public/CookieNotice'
import './index.css'
import './media.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider>
      <App />
      <CookieNotice />
      <PwaLifecycle />
    </AuthProvider>
  </BrowserRouter>,
)

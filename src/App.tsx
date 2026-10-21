import React from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { LoginPage } from '@/auth/LoginPage'
import { normalizeReturnPath } from '@/auth/returnPath'
import { Companion } from '@/components/dashboard/Companion'

export function App() {
  const location = useLocation()
  const { user, loading } = useAuth()

  if (location.pathname.startsWith('/auth/')) {
    return <Navigate to="/login" replace />
  }

  if (location.pathname === '/login') {
    const returnTo = normalizeReturnPath(new URLSearchParams(location.search).get('returnTo'))
    return <LoginPage returnTo={returnTo} />
  }

  if (loading && !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4 text-sm text-muted-foreground">
        Loading Lamat…
      </div>
    )
  }

  if (!user) {
    const returnTo = normalizeReturnPath(`${location.pathname}${location.search}`)
    return <LoginPage returnTo={returnTo} />
  }

  return (
    <Routes>
      <Route path="/" element={<Companion />} />
      <Route path="/apps/companion" element={<Companion />} />
      <Route path="/apps/maya" element={<Navigate to="/" replace />} />
      <Route path="/apps/lamet" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

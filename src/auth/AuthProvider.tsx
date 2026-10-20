import React from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { activateAccountLocalStorage } from '@/lib/accountLocalStorage'
import { rememberReturnPath } from './returnPath'

type OAuthProvider = 'google' | 'github'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signInWithGoogle: (returnTo?: string) => Promise<void>
  signInWithGitHub: (returnTo?: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true

    const syncGoogleProviderToken = (s: Session | null) => {
      if (!s?.provider_token || !s?.access_token) return
      try {
        localStorage.setItem('lamat-google-provider-token', s.provider_token)
      } catch {
        /* ignore */
      }
      void fetch('/api/lamat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${s.access_token}`,
        },
        body: JSON.stringify({
          action: 'save_google_token',
          providerToken: s.provider_token,
          providerRefreshToken: s.provider_refresh_token || null,
        }),
      }).catch(() => {})
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      activateAccountLocalStorage(data.session?.user.id || null)
      setSession(data.session)
      syncGoogleProviderToken(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      activateAccountLocalStorage(nextSession?.user.id || null)
      setSession(nextSession)
      syncGoogleProviderToken(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signInWithProvider = async (provider: OAuthProvider, returnTo = '/') => {
    rememberReturnPath(returnTo)

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/login`,
        ...(provider === 'google'
          ? {
              scopes:
                'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/spreadsheets.readonly',
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            }
          : {}),
      },
    })

    if (error) throw error
  }

  const signInWithGoogle = (returnTo = '/') => signInWithProvider('google', returnTo)
  const signInWithGitHub = (returnTo = '/') => signInWithProvider('github', returnTo)
  const signInWithEmail = async (email: string, password: string) => { const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (error) throw error }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user || null, loading, signInWithGoogle, signInWithGitHub, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

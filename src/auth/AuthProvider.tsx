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
  oauthError: string | null
  signInWithGoogle: (returnTo?: string) => Promise<void>
  signInWithGitHub: (returnTo?: string) => Promise<void>
  connectGoogleWorkspace: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

function readOAuthCallbackError(): string | null {
  if (typeof window === 'undefined') return null
  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const raw =
    searchParams.get('error_description') ||
    hashParams.get('error_description') ||
    searchParams.get('error') ||
    hashParams.get('error')
  if (!raw) return null
  return decodeURIComponent(raw.replace(/\+/g, ' ')).slice(0, 220)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [oauthError, setOauthError] = React.useState<string | null>(() => readOAuthCallbackError())

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

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) setOauthError(error.message)
      activateAccountLocalStorage(data.session?.user.id || null)
      setSession(data.session)
      syncGoogleProviderToken(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      activateAccountLocalStorage(nextSession?.user.id || null)
      setSession(nextSession)
      if (nextSession) setOauthError(null)
      syncGoogleProviderToken(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signInWithProvider = async (provider: OAuthProvider, returnTo = '/', forceConsent = false) => {
    rememberReturnPath(returnTo)
    setOauthError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/login`,
        ...(provider === 'google'
          ? {
              scopes:
                'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/spreadsheets',
              queryParams: {
                access_type: 'offline',
                prompt: forceConsent ? 'consent' : 'select_account',
              },
            }
          : {}),
      },
    })

    if (error) throw error
  }

  const signInWithGoogle = (returnTo = '/') => signInWithProvider('google', returnTo, false)
  const signInWithGitHub = (returnTo = '/') => signInWithProvider('github', returnTo, false)
  const connectGoogleWorkspace = () => signInWithProvider('google', '/', true)

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        loading,
        oauthError,
        signInWithGoogle,
        signInWithGitHub,
        connectGoogleWorkspace,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

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
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      activateAccountLocalStorage(data.session?.user.id || null)
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      activateAccountLocalStorage(nextSession?.user.id || null)
      setSession(nextSession)
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

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user || null, loading, signInWithGoogle, signInWithGitHub, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

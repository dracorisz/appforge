import React from 'react'
import { SiGithub as Github, SiGoogle as Google } from 'react-icons/si'
import { useNavigate } from 'react-router-dom'
import { Button, Card, LamatLogo } from '@/components/ui'
import { useAuth } from './AuthProvider'
import { consumeReturnPath, normalizeReturnPath } from './returnPath'

type AuthProviderName = 'google' | 'github'

export function LoginPage({ returnTo = '/' }: { returnTo?: string; landingOnly?: boolean }) {
  const navigate = useNavigate()
  const { user, loading, oauthError, signInWithGoogle, signInWithGitHub } = useAuth()
  const [busyProvider, setBusyProvider] = React.useState<AuthProviderName | null>(null)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    document.title = 'Lamat'
  }, [])

  React.useEffect(() => {
    if (loading || !user) return
    navigate(consumeReturnPath(returnTo), { replace: true })
  }, [loading, navigate, returnTo, user])

  const login = async (provider: AuthProviderName) => {
    if (user) {
      navigate('/')
      return
    }
    setBusyProvider(provider)
    setError('')
    try {
      const normalized = normalizeReturnPath(returnTo)
      if (provider === 'github') await signInWithGitHub(normalized)
      else await signInWithGoogle(normalized)
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : `${provider === 'github' ? 'GitHub' : 'Google'} authentication could not start.`
      )
      setBusyProvider(null)
    }
  }

  const displayError = error || oauthError || ''

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8 text-foreground">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-secondary">
            <LamatLogo className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Continue to Lamat</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in or create your account with Google or GitHub
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-2" aria-busy={Boolean(busyProvider) || loading}>
          <Button
            type="button"
            variant="primary"
            onClick={() => void login('google')}
            disabled={Boolean(busyProvider) || loading}
            className="w-full justify-center gap-2"
          >
            <Google className="h-4 w-4" />
            {busyProvider === 'google' ? 'Connecting to Google…' : 'Continue with Google'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void login('github')}
            disabled={Boolean(busyProvider) || loading}
            className="w-full justify-center gap-2"
          >
            <Github className="h-4 w-4" />
            {busyProvider === 'github' ? 'Connecting to GitHub…' : 'Continue with GitHub'}
          </Button>
        </div>

        {displayError && (
          <div
            role="alert"
            aria-live="polite"
            className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive"
          >
            {displayError}
          </div>
        )}
      </Card>
    </div>
  )
}

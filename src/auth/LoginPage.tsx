import React from 'react'
import { SiGithub as Github, SiGoogle as Google } from 'react-icons/si'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Input, LamatLogo } from '@/components/ui'
import { useAuth } from './AuthProvider'
import { consumeReturnPath, normalizeReturnPath } from './returnPath'

type AuthProviderName = 'google' | 'github'

export function LoginPage({ returnTo = '/' }: { returnTo?: string; landingOnly?: boolean }) {
  const navigate = useNavigate()
  const { user, loading, signInWithGoogle, signInWithGitHub, signInWithEmail } = useAuth()
  const [busyProvider, setBusyProvider] = React.useState<AuthProviderName | null>(null)
  const [error, setError] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [submittingEmail, setSubmittingEmail] = React.useState(false)

  React.useEffect(() => {
    document.title = 'Sign in · Lamat'
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
          : `${provider === 'github' ? 'GitHub' : 'Google'} sign-in could not start.`
      )
      setBusyProvider(null)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8 text-foreground">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-secondary">
            <LamatLogo className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Sign in to Lamat</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Persistent, goal-oriented autonomous AI operator
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-2" aria-busy={Boolean(busyProvider) || loading}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void login('google')}
            disabled={Boolean(busyProvider) || loading}
            className="w-full justify-center gap-2"
          >
            <Google className="h-4 w-4" /> Continue with Google
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void login('github')}
            disabled={Boolean(busyProvider) || loading}
            className="w-full justify-center gap-2"
          >
            <Github className="h-4 w-4" /> Continue with GitHub
          </Button>
        </div>

        <div className="my-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>or continue with email</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form
          className="grid grid-cols-1 gap-2"
          onSubmit={async (event) => {
            event.preventDefault()
            setError('')
            setSubmittingEmail(true)
            try {
              await signInWithEmail(email, password)
              navigate(consumeReturnPath(returnTo), { replace: true })
            } catch (emailError) {
              setError(emailError instanceof Error ? emailError.message : 'Email sign-in failed.')
            } finally {
              setSubmittingEmail(false)
            }
          }}
        >
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            aria-label="Email address"
          />
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            aria-label="Password"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <Link to="/auth/forgot-password" className="font-medium text-foreground hover:underline">
              Forgot password?
            </Link>
            <Link to="/auth/confirm" className="text-muted-foreground hover:text-foreground hover:underline">
              Resend confirmation
            </Link>
          </div>
          <Button
            type="submit"
            variant="primary"
            className="mt-2 w-full"
            disabled={!email.trim() || !password || submittingEmail}
          >
            {submittingEmail ? 'Signing in…' : 'Continue with email'}
          </Button>
        </form>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}
      </Card>
    </div>
  )
}

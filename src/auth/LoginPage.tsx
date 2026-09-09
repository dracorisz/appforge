import React from 'react'
import { ArrowLeftRight, ArrowRight, Cloud, Github, Lock, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { BuildBadge, Button } from '@/components/ui'
import { getAllApps } from '@/lib/registry'
import { useAuth } from './AuthProvider'
import { consumeReturnPath, normalizeReturnPath } from './returnPath'

const publicEntries = [
  { label: 'Hugging Face Gallery', path: '/huggingface', logo: 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg' },
  { label: 'Weather Now', path: '/apps/weather-now', icon: Cloud },
  { label: 'Any Converter', path: '/apps/any-converter', icon: ArrowLeftRight },
  { label: 'Scrapper Pro', path: '/apps/scrapper-pro', icon: Search },
]

export function LoginPage({ returnTo = '/' }: { returnTo?: string }) {
  const navigate = useNavigate()
  const { user, loading, signInWithGoogle } = useAuth()
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const apps = React.useMemo(() => getAllApps(), [])
  const liveCount = apps.filter((app) => app.status === 'launched' || app.status === 'beta' || app.status === 'building').length

  React.useEffect(() => {
    if (loading || !user) return
    navigate(consumeReturnPath(returnTo), { replace: true })
  }, [loading, navigate, returnTo, user])

  const login = async () => {
    setBusy(true)
    setError('')
    try { await signInWithGoogle(normalizeReturnPath(returnTo)) }
    catch (loginError) { setError(loginError instanceof Error ? loginError.message : 'Google sign-in could not start.'); setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-6 lg:h-dvh lg:min-h-0 lg:px-8 lg:py-4">
        <header className="flex shrink-0 items-center justify-between gap-4"><div className="flex items-center gap-2.5"><img src="/favicon.svg" alt="AppForge" className="h-10 w-10" /><div><div className="text-sm font-semibold tracking-tight">AppForge</div><div className="text-xs text-muted-foreground">Open-source utility workspace</div></div></div><BuildBadge compact /></header>

        <main className="grid flex-1 items-center gap-10 py-12 lg:min-h-0 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:py-5">
          <section className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/55 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-xl"><Sparkles className="h-3.5 w-3.5" /> Public beta · open development</div>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl lg:mt-4 lg:text-5xl xl:text-6xl">Useful tools,<span className="block text-muted-foreground">kept calm and connected.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg lg:mt-3 lg:text-base lg:leading-6 xl:text-lg xl:leading-7">Explore the public Hugging Face showcase and three AppForge tools without an account. Sign in when you want synced profile data, story projects, favorites, history and private storage.</p>

            <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-3 lg:mt-5">{[[String(apps.length), 'registered apps'], [String(liveCount), 'active or building'], ['4', 'public entries']].map(([value, label]) => <div key={label} className="surface-card rounded-xl border p-3.5 lg:p-3"><div className="text-xl font-semibold tracking-tight">{value}</div><div className="mt-0.5 text-xs text-muted-foreground">{label}</div></div>)}</div>

            <div className="mt-8 lg:mt-5">
              <div className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Explore</div>
              <div className="grid max-w-xl gap-2 sm:grid-cols-2">{publicEntries.map(({ label, path, icon: Icon, logo }) => <Link key={path} to={path} className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/70 px-3 py-2.5 text-sm font-medium shadow-sm hover:border-foreground/20 hover:bg-accent/65">{logo ? <img src={logo} alt="Hugging Face" className="h-5 w-5 object-contain" /> : Icon ? <Icon className="h-4 w-4" /> : null} {label}<ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" /></Link>)}</div>
              <div className="mt-2 flex flex-wrap gap-2"><a href="https://github.com/dracorisz/appforge" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/70 bg-background/50 px-4 py-2 text-sm font-medium text-muted-foreground hover:border-foreground/20 hover:text-foreground"><Github className="h-4 w-4" /> Follow development</a></div>
            </div>
          </section>

          <section className="surface-card rounded-2xl border p-5 shadow-xl sm:p-6 lg:p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-background/55 shadow-sm backdrop-blur-md"><ShieldCheck className="h-5 w-5" /></div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight lg:mt-4">Enter the full workspace</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Continue with Google. Direct links are preserved, so after sign-in you return to the exact protected tool you requested.</p>
            <div className="mt-5 space-y-2 lg:mt-4"><div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/35 p-3"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><div><div className="text-sm font-medium">Personal data stays scoped</div><div className="mt-0.5 text-xs leading-5 text-muted-foreground">Profiles, preferences and roles use Supabase row-level security.</div></div></div><div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/35 p-3"><Cloud className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><div><div className="text-sm font-medium">Cross-device continuity</div><div className="mt-0.5 text-xs leading-5 text-muted-foreground">Favorites, recent tools, settings and category overrides can sync with your account.</div></div></div><div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/35 p-3"><Github className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><div><div className="text-sm font-medium">Build in the open</div><div className="mt-0.5 text-xs leading-5 text-muted-foreground">Test a live build, report its footer fingerprint, or contribute through a focused pull request.</div></div></div></div>
            {error && <div className="mt-4 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}
            <div className="mt-5 lg:mt-4"><Button className="w-full" onClick={login} disabled={busy || loading || Boolean(user)}>{loading ? 'Checking session…' : user ? 'Opening AppForge…' : busy ? 'Opening Google…' : 'Continue with Google'}{!loading && !user && !busy && <ArrowRight className="h-4 w-4" />}</Button></div>
            <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground lg:mt-3">Google handles identity. AppForge requests basic identity scopes only; workspace data is stored under your authenticated Supabase user ID.</p>
          </section>
        </main>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-border/60 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:py-3"><span className="inline-flex items-center gap-2"><img src="/favicon.svg" alt="" className="h-4 w-4" /> AppForge · public beta</span><span className="flex flex-wrap items-center gap-x-4 gap-y-1"><Link to="/privacy" className="hover:text-foreground">Privacy</Link><Link to="/terms" className="hover:text-foreground">Terms</Link><span>Google OAuth · Supabase Auth · Vercel · PWA</span></span></footer>
      </div>
    </div>
  )
}

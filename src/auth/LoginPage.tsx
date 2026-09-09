import React from 'react'
import { ArrowLeftRight, ArrowRight, Cloud, Github, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { BuildBadge, Button } from '@/components/ui'
import { getAllApps } from '@/lib/registry'
import { useAuth } from './AuthProvider'
import { consumeReturnPath, normalizeReturnPath } from './returnPath'

const publicTools = [
  { label: 'Weather Now', description: 'Live weather lookup', path: '/apps/weather-now', icon: Cloud },
  { label: 'Any Converter', description: 'Local format conversion', path: '/apps/any-converter', icon: ArrowLeftRight },
  { label: 'Scrapper Pro', description: 'Public media discovery', path: '/apps/scrapper-pro', icon: Search },
]

export function LoginPage({ returnTo = '/', landingOnly = false }: { returnTo?: string; landingOnly?: boolean }) {
  const navigate = useNavigate()
  const { user, loading, signInWithGoogle } = useAuth()
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const apps = React.useMemo(() => getAllApps(), [])
  const liveCount = apps.filter((app) => app.status === 'launched' || app.status === 'beta' || app.status === 'building' || app.status === 'full').length

  React.useEffect(() => {
    if (landingOnly || loading || !user) return
    navigate(consumeReturnPath(returnTo), { replace: true })
  }, [landingOnly, loading, navigate, returnTo, user])

  const login = async () => {
    if (user) { navigate('/'); return }
    setBusy(true)
    setError('')
    try { await signInWithGoogle(normalizeReturnPath(returnTo)) }
    catch (loginError) { setError(loginError instanceof Error ? loginError.message : 'Google sign-in could not start.'); setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-6 lg:h-dvh lg:min-h-0 lg:px-8 lg:py-4">
        <header className="flex shrink-0 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5"><img src="/favicon.svg" alt="AppForge" className="h-10 w-10" /><div><div className="text-sm font-semibold tracking-tight">AppForge</div><div className="text-xs text-muted-foreground">Open-source utility workshop</div></div></Link>
          <div className="flex items-center gap-2">
            <a href="https://github.com/dracorisz/appforge" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/15 dark:text-red-400"><Github className="h-4 w-4" /> GitHub</a>
            <BuildBadge compact />
          </div>
        </header>

        <main className="grid flex-1 items-center gap-10 py-10 lg:min-h-0 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:py-5">
          <section className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground"><Sparkles className="h-3.5 w-3.5" /> Public beta · open development</div>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl lg:mt-4 lg:text-5xl xl:text-6xl">Useful apps today.<span className="block text-muted-foreground">Forkable PWAs tomorrow.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg lg:mt-3 lg:text-base lg:leading-6 xl:text-lg xl:leading-7">Explore public tools now. Sign in for synced projects, Story Studio, private storage, profile theming and the full AppForge workspace.</p>

            <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-3">{[[String(apps.length), 'registered apps'], [String(liveCount), 'active builds'], ['Full', 'fork-ready goal']].map(([value, label]) => <div key={label} className="surface-card rounded-xl border p-3.5"><div className="text-xl font-semibold tracking-tight">{value}</div><div className="mt-0.5 text-xs text-muted-foreground">{label}</div></div>)}</div>

            <div className="mt-6 max-w-xl">
              <div className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Hugging Face</div>
              <Link to="/huggingface" className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm font-medium transition-colors hover:border-foreground/20 hover:bg-accent/65"><img src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg" alt="Hugging Face" className="h-7 w-7 object-contain" /><div className="min-w-0 flex-1"><div>Hugging Face</div><div className="text-xs font-normal text-muted-foreground">Models, providers and public generated showcase</div></div><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link>
            </div>

            <div className="mt-4 max-w-xl">
              <div className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Public tools</div>
              <div className="grid gap-2 sm:grid-cols-3">{publicTools.map(({ label, description, path, icon: Icon }) => <Link key={path} to={path} className="flex min-h-[92px] flex-col justify-between rounded-xl border border-border/70 bg-background/70 p-3 text-sm font-medium transition-colors hover:border-foreground/20 hover:bg-accent/65"><div className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</div><div className="mt-3 flex items-end justify-between gap-2"><span className="text-xs font-normal leading-4 text-muted-foreground">{description}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /></div></Link>)}</div>
            </div>
          </section>

          <section className="surface-card rounded-2xl border p-5 sm:p-6 lg:p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-background/55"><ShieldCheck className="h-5 w-5" /></div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight lg:mt-4">Enter the full workspace</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Continue with Google for synced projects, private data and creator features. Direct links return you to the requested tool after sign-in.</p>
            <div className="mt-5 grid gap-2 lg:mt-4">
              {[
                ['Private by account', 'Profile, projects and storage stay scoped to your authenticated account.'],
                ['Synced creator state', 'Settings, appearance, favorites and project state can follow you across devices.'],
                ['Open development', 'Every mini-app moves toward a documented, independently forkable Full PWA.'],
              ].map(([title, copy]) => <div key={title} className="min-h-[78px] rounded-xl border border-border/60 bg-background/35 p-3"><div className="text-sm font-medium">{title}</div><div className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</div></div>)}
            </div>
            {error && <div className="mt-4 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}
            <div className="mt-5 lg:mt-4"><Button className="w-full" onClick={login} disabled={busy || loading}>{loading ? 'Checking session…' : user ? 'Open workspace' : busy ? 'Opening Google…' : 'Continue with Google'}{!loading && !busy && <ArrowRight className="h-4 w-4" />}</Button></div>
            <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground lg:mt-3">Google handles identity. AppForge requests basic identity scopes; workspace data is stored under your authenticated Supabase user ID.</p>
          </section>
        </main>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-border/60 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:py-3"><span className="inline-flex items-center gap-2"><img src="/favicon.svg" alt="" className="h-4 w-4" /> AppForge · public beta</span><span className="flex flex-wrap items-center gap-x-4 gap-y-1"><Link to="/privacy" className="hover:text-foreground">Privacy</Link><Link to="/terms" className="hover:text-foreground">Terms</Link><span>Google OAuth · Supabase Auth · Vercel · PWA</span></span></footer>
      </div>
    </div>
  )
}

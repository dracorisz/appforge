import React from 'react'
import { ArrowLeftRight, ArrowRight, Cloud, Github, Heart, PlayCircle, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { BuildBadge, Button } from '@/components/ui'
import { getAllApps } from '@/lib/registry'
import { useAuth } from './AuthProvider'
import { consumeReturnPath, normalizeReturnPath } from './returnPath'

const YOUTUBE_EMBED_URL = 'https://www.youtube-nocookie.com/embed/tWnZNkPxlOo?rel=0&modestbranding=1'
const APPFORGE_MARK = '/favicon.svg?v=2'

const publicTools = [
  { label: 'Weather Now', description: 'Live weather lookup', path: '/apps/weather-now', icon: Cloud },
  { label: 'Any Converter', description: 'Local format conversion', path: '/apps/any-converter', icon: ArrowLeftRight },
  { label: 'Scrapper Pro', description: 'Public media discovery', path: '/apps/scrapper-pro', icon: Search },
]

type AuthProviderName = 'google' | 'github'

export function LoginPage({ returnTo = '/', landingOnly = false }: { returnTo?: string; landingOnly?: boolean }) {
  const navigate = useNavigate()
  const { user, loading, signInWithGoogle } = useAuth()
  const [busyProvider, setBusyProvider] = React.useState<AuthProviderName | null>(null)
  const [error, setError] = React.useState('')
  const apps = React.useMemo(() => getAllApps(), [])
  const liveCount = apps.filter((app) => app.status === 'launched' || app.status === 'beta' || app.status === 'building').length

  React.useEffect(() => {
    if (landingOnly || loading || !user) return
    navigate(consumeReturnPath(returnTo), { replace: true })
  }, [landingOnly, loading, navigate, returnTo, user])

  const login = async (provider: AuthProviderName) => {
    if (user) {
      navigate('/')
      return
    }

    if (provider === 'github') return

    setBusyProvider(provider)
    setError('')
    try {
      const normalized = normalizeReturnPath(returnTo)
      await signInWithGoogle(normalized)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Google sign-in could not start.')
      setBusyProvider(null)
    }
  }

  const openWorkspace = () => navigate('/')

  return (
    <div className="dark min-h-dvh overflow-x-hidden bg-black text-foreground" style={{ colorScheme: 'dark', '--background': '0 0% 0%' } as React.CSSProperties}>
      <div className="relative isolate flex min-h-dvh flex-col overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-28rem] h-[52rem] w-[52rem] -translate-x-1/2 rounded-full border border-border/35 bg-accent/20 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
        </div>

        <header className="mx-auto flex w-full max-w-7xl shrink-0 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="group inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <img src={APPFORGE_MARK} alt="AppForge" className="h-10 w-10 shrink-0 rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-[1.04]" decoding="async" />
            <div>
              <div className="text-sm font-semibold tracking-tight">AppForge</div>
              <div className="hidden text-xs text-muted-foreground sm:block">Open-source utility workshop</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <a href="https://paypal.me/dracorisz" target="_blank" rel="noopener noreferrer" aria-label="Support AppForge via PayPal" title="Support AppForge" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-background/70 text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <Heart className="h-4 w-4" />
            </a>
            <a href="https://github.com/dracorisz/appforge" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:text-red-400">
              <Github className="h-4 w-4" /> <span className="hidden sm:inline">GitHub</span>
            </a>
            <BuildBadge compact />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-3 sm:px-6 sm:pt-6 lg:px-8">
          <div className="grid items-center gap-8 lg:min-h-[calc(100dvh-8rem)] lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)] lg:gap-12">
            <section className="max-w-3xl py-4 lg:py-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" /> Public beta · open development
              </div>
              <h1 className="mt-5 max-w-3xl text-balance text-5xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl xl:text-[5.25rem] xl:leading-[0.96]">
                Build useful things.
                <span className="block text-muted-foreground">Own the workflow.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                AppForge brings practical web tools, creator workflows and experiments into one workspace — with a path for every mini-app to become a documented, forkable PWA.
              </p>

              <div className="mt-7 flex flex-wrap gap-3" aria-busy={Boolean(busyProvider) || loading}>
                {user ? (
                  <Button className="h-11 px-5" onClick={openWorkspace} disabled={loading}>
                    Open workspace <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    <Button className="h-11 px-5" onClick={() => void login('google')} disabled={Boolean(busyProvider) || loading}>
                      {loading ? 'Checking session…' : busyProvider === 'google' ? 'Opening Google…' : 'Continue with Google'}
                      {!loading && busyProvider !== 'google' && <ArrowRight className="h-4 w-4" />}
                    </Button>
                    <Button variant="secondary" className="h-11 px-5 opacity-65" disabled title="GitHub sign-in is coming soon">
                      <Github className="h-4 w-4" />
                      Continue with GitHub · coming soon
                    </Button>
                  </>
                )}
                <Link to="/apps/weather-now" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background/70 px-5 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  Try a public tool <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {error && <div role="alert" aria-live="polite" className="mt-4 max-w-xl rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-border/60 pt-5 text-xs text-muted-foreground">
                <span><strong className="font-semibold text-foreground">{apps.length}</strong> registered apps</span>
                <span><strong className="font-semibold text-foreground">{liveCount}</strong> active builds</span>
                <span><strong className="font-semibold text-foreground">Full</strong> fork-ready target</span>
              </div>
            </section>

            <section className="relative mx-auto w-full max-w-xl lg:max-w-none" aria-label="AppForge public tools and workspace access">
              <div aria-hidden="true" className="absolute inset-8 -z-10 rounded-[3rem] border border-border/50 bg-accent/25 blur-2xl" />
              <div className="rounded-[2rem] border border-border/70 bg-background/80 p-4 shadow-2xl shadow-foreground/5 backdrop-blur-xl sm:p-5">
                <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background"><img src={APPFORGE_MARK} alt="" className="h-9 w-9 rounded-lg" decoding="async" /></div>
                    <div><div className="text-sm font-semibold">One workshop, many tools</div><div className="text-xs text-muted-foreground">Public first · workspace when you need it</div></div>
                  </div>
                  <ShieldCheck className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>

                <div className="grid gap-2 py-4">
                  {publicTools.map(({ label, description, path, icon: Icon }) => (
                    <Link key={path} to={path} className="group flex min-h-14 items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-border/70 hover:bg-accent/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background"><Icon className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{label}</span><span className="block text-xs text-muted-foreground">{description}</span></span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>

                <Link to="/huggingface" className="group flex min-h-14 items-center gap-3 rounded-xl border border-border/70 bg-background/65 px-3 py-3 transition-colors hover:bg-accent/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-background text-base" aria-hidden="true">
                    <img
                      src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
                      alt=""
                      className="h-9 w-9 object-contain"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                        const fallback = event.currentTarget.nextElementSibling
                        fallback?.classList.remove('hidden')
                      }}
                    />
                    <span className="hidden">🤗</span>
                  </span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium">Hugging Face showcase</span><span className="block text-xs text-muted-foreground">Models, providers and creator-selected scenes</span></span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </section>
          </div>

          <section className="border-t border-border/60 py-8 sm:py-10" aria-labelledby="walkthrough-title">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:items-center lg:gap-8">
              <div className="lg:pr-3">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><PlayCircle className="h-4 w-4" /> Product walkthrough</div>
                <h2 id="walkthrough-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">See AppForge in action</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">A concise walkthrough of the current AppForge experience, including the public tools and authenticated workspace. The privacy-enhanced YouTube embed loads only when this section enters the browser viewport.</p>
                <a href="https://www.youtube.com/watch?v=tWnZNkPxlOo" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Open on YouTube <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-black shadow-xl shadow-foreground/5">
                <iframe
                  src={YOUTUBE_EMBED_URL}
                  title="AppForge product walkthrough"
                  className="aspect-video w-full border-0"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
          </section>
        </main>

        <footer className="mx-auto flex w-full max-w-7xl shrink-0 flex-col gap-3 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2"><img src={APPFORGE_MARK} alt="" className="h-5 w-5 rounded-md" decoding="async" /> AppForge · public beta</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link to="/privacy" className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Terms</Link>
            <a href="https://paypal.me/dracorisz" target="_blank" rel="noopener noreferrer" className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Support</a>
            <a href="https://www.youtube.com/@AppForgeDragon" target="_blank" rel="noopener noreferrer" className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">YouTube</a>
            <span>Google OAuth · Supabase Auth · Vercel · PWA</span>
          </span>
        </footer>
      </div>
    </div>
  )
}

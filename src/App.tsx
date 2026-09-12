import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ArrowLeftRight, Bitcoin, Image as ImageIcon, Palette, PanelsTopLeft, QrCode } from 'lucide-react'
import { Layout } from './components/layout/Layout'
import { PublicToolShell } from './components/public/PublicToolShell'
import { PublicDashboard } from './components/dashboard/PublicDashboard'
import { WeatherNowIcon } from './components/dashboard/AppIcons'
import {
  PF_ScrapperPro,
  PF_ImageLabeler,
  PF_CreatorSVG,
  PF_CryptoTrack,
  PF_WeatherNow,
  PF_AIDragonArena,
  PF_DnsTxtChecker,
  AnyToAnyConverter,
  UtilityWorkbench,
  ImageWorkbench,
  LocalToolsWorkbench,
  ColorPickerTool,
  TaskList,
  DesktopBuddy,
  RegistryAppFallback,
  PF_UserMediaVault,
  QrGenerator,
} from './components/dashboard'
import type { AppState } from './types'
import {
  defaultArticle,
  defaultPitches,
  defaultSources,
  defaultOutreach,
  defaultChecklist,
  defaultPlan,
  defaultMiniApps,
  defaultVersions,
  defaultDocumentReadiness,
  defaultMessages,
} from './types'
import { BUILD_INFO } from './lib/buildInfo'
import { useAuth } from './auth/AuthProvider'
import { LoginPage } from './auth/LoginPage'
import { loadUserPreferences, saveUserPreferences } from './lib/preferences'
import { loadCategoryOverrides, saveCategoryOverrides, setCategoryOverrideScope, subscribeCategoryOverrides } from './lib/categories'
import { stripLegacyMiniAppCommerce } from './lib/legacyMiniApps'
import { updateSeo } from './lib/seo'

const SettingsPage = React.lazy(() => import('./components/resources/Settings').then((module) => ({ default: module.SettingsPage })))
const PeoplePage = React.lazy(() => import('./components/resources/People').then((module) => ({ default: module.PeoplePage })))
const AdminConsolePage = React.lazy(() => import('./components/admin/AdminConsolePage').then((module) => ({ default: module.AdminConsolePage })))
const HuggingFaceGalleryPage = React.lazy(() => import('./components/public/HuggingFaceGalleryPage').then((module) => ({ default: module.HuggingFaceGalleryPage })))
const PrivacyPolicyPage = React.lazy(() => import('./components/public/LegalPages').then((module) => ({ default: module.PrivacyPolicyPage })))
const TermsOfServicePage = React.lazy(() => import('./components/public/LegalPages').then((module) => ({ default: module.TermsOfServicePage })))
const FaviconStudio = React.lazy(() => import('./components/public/FaviconStudio'))
const SvgIconsBrowser = React.lazy(() => import('./components/public/SvgIconsBrowser'))
const LandingBuilder = React.lazy(() => import('./components/public/LandingBuilder'))
const PublicAppsPage = React.lazy(() => import('./components/public/PublicAppsPage').then((module) => ({ default: module.PublicAppsPage })))

const defaultSettings = { theme: 'dark' as const }
const defaultState: AppState = {
  plan: defaultPlan,
  article: defaultArticle,
  pitches: defaultPitches,
  sources: defaultSources,
  outreach: defaultOutreach,
  checklist: defaultChecklist,
  documentReadiness: defaultDocumentReadiness,
  messages: defaultMessages,
  settings: defaultSettings,
  miniApps: stripLegacyMiniAppCommerce(defaultMiniApps),
  versions: defaultVersions,
  favorites: [],
  recentApps: [],
}

const normalizeState = (parsed: Partial<AppState>, base: AppState = defaultState): AppState => ({
  ...base,
  ...parsed,
  settings: { ...base.settings, ...(parsed.settings || {}) },
  miniApps: stripLegacyMiniAppCommerce(Array.isArray(parsed.miniApps) ? parsed.miniApps : base.miniApps),
  favorites: Array.isArray(parsed.favorites) ? parsed.favorites : base.favorites,
  recentApps: Array.isArray(parsed.recentApps) ? parsed.recentApps : base.recentApps,
  documentReadiness: Array.isArray(parsed.documentReadiness) ? parsed.documentReadiness : base.documentReadiness,
  messages: Array.isArray(parsed.messages) ? parsed.messages : base.messages,
})

const hydrateStoredState = (raw: string, base: AppState = defaultState): AppState => normalizeState(JSON.parse(raw) as Partial<AppState>, base)
const workspaceStorageKey = (userId: string) => `appforge-workplan-v1:${userId}`
const persistedWorkspace = (state: AppState) => ({ ...state, miniApps: stripLegacyMiniAppCommerce(state.miniApps) })

const loadScopedWorkspace = (userId: string): AppState => {
  try {
    const raw = localStorage.getItem(workspaceStorageKey(userId))
    if (raw) return hydrateStoredState(raw)
  } catch { /* ignore malformed or unavailable local cache */ }
  return defaultState
}

const routeFallback = <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-muted-foreground">Loading AppForge…</div>
const lazyPage = (page: React.ReactNode) => <React.Suspense fallback={routeFallback}>{page}</React.Suspense>
const utilitySlugs = new Set(['json-formatter','uuid-generator','password-generator','token-generator','base64-tool','hash-tool','url-encoder','html-encoder','jwt-decoder','hex-converter'])
const imageSlugs = new Set(['image-resizer','image-converter','image-compressor','image-metadata'])
const localSlugs = new Set(['csv-converter','timestamp-converter','regex-tester'])
const privatePaths = new Set(['/apps/getter-pro','/apps/scrapper-pro','/apps/media-vault','/apps/desktop-buddy','/apps/ai-dragon-arena'])

function publicAppPage(pathname: string): React.ReactNode | null {
  const slug = pathname.startsWith('/apps/') ? pathname.slice('/apps/'.length) : ''
  if (pathname === '/apps/weather-now' || pathname === '/pf-weather-now') return <PublicToolShell toolName="Weather Now" toolIcon={<WeatherNowIcon />}><PF_WeatherNow /></PublicToolShell>
  if (pathname === '/apps/crypto-track' || pathname === '/pf-crypto-track') return <PublicToolShell toolName="Crypto Track" toolIcon={<Bitcoin className="h-4 w-4" />}><PF_CryptoTrack /></PublicToolShell>
  if (pathname === '/apps/data-converter' || pathname === '/apps/any-converter') return <PublicToolShell toolName="Data Converter" toolIcon={<ArrowLeftRight className="h-4 w-4" />}><AnyToAnyConverter /></PublicToolShell>
  if (pathname === '/apps/favicon-studio') return <PublicToolShell toolName="Favicon Studio" toolIcon={<ImageIcon className="h-4 w-4" />}>{lazyPage(<FaviconStudio />)}</PublicToolShell>
  if (pathname === '/apps/svg-icons') return <PublicToolShell toolName="SVG Icons" toolIcon={<Palette className="h-4 w-4" />}>{lazyPage(<SvgIconsBrowser />)}</PublicToolShell>
  if (pathname === '/apps/landing-builder') return <PublicToolShell toolName="Landing Builder" toolIcon={<PanelsTopLeft className="h-4 w-4" />}>{lazyPage(<LandingBuilder />)}</PublicToolShell>
  if (pathname === '/apps/image-labeler') return <PublicToolShell toolName="Image Labeler"><PF_ImageLabeler /></PublicToolShell>
  if (pathname === '/apps/creator-svg') return <PublicToolShell toolName="Creator SVG"><PF_CreatorSVG /></PublicToolShell>
  if (pathname === '/apps/dns-txt-checker') return <PublicToolShell toolName="DNS TXT Checker"><PF_DnsTxtChecker /></PublicToolShell>
  if (pathname === '/apps/task-list') return <PublicToolShell toolName="Task List"><TaskList /></PublicToolShell>
  if (pathname === '/apps/qr-generator') return <PublicToolShell toolName="QR Generator" toolIcon={<QrCode className="h-4 w-4" />}><QrGenerator /></PublicToolShell>
  if (pathname === '/apps/color-picker') return <PublicToolShell toolName="Color Picker"><ColorPickerTool /></PublicToolShell>
  if (utilitySlugs.has(slug)) return <PublicToolShell toolName={slug}><UtilityWorkbench /></PublicToolShell>
  if (imageSlugs.has(slug)) return <PublicToolShell toolName={slug}><ImageWorkbench /></PublicToolShell>
  if (localSlugs.has(slug)) return <PublicToolShell toolName={slug}><LocalToolsWorkbench /></PublicToolShell>
  return null
}

function App() {
  const location = useLocation()
  const { user, loading } = useAuth()
  const [remoteReady, setRemoteReady] = React.useState(false)
  const [state, setState] = React.useState<AppState>(defaultState)

  React.useEffect(() => { updateSeo(location.pathname) }, [location.pathname])

  React.useEffect(() => {
    let cancelled = false
    setRemoteReady(false)

    if (!user) {
      setCategoryOverrideScope(null)
      setState(defaultState)
      return () => { cancelled = true }
    }

    setCategoryOverrideScope(user.id)
    const localState = loadScopedWorkspace(user.id)
    setState(localState)

    const hydrate = async () => {
      try {
        const remote = await loadUserPreferences(user.id)
        if (cancelled) return
        if (remote) {
          setState(remote.appState ? normalizeState(remote.appState, localState) : localState)
          saveCategoryOverrides(remote.categoryOverrides || {})
        } else {
          saveCategoryOverrides({})
          await saveUserPreferences(user.id, { appState: persistedWorkspace(localState), categoryOverrides: {} })
        }
      } catch (error) {
        console.error('AppForge remote preference hydration failed', error)
      } finally {
        if (!cancelled) setRemoteReady(true)
      }
    }

    void hydrate()
    return () => { cancelled = true }
  }, [user?.id])

  React.useEffect(() => {
    if (!user || !remoteReady) return
    const nextState = persistedWorkspace(state)
    try { localStorage.setItem(workspaceStorageKey(user.id), JSON.stringify(nextState)) } catch { /* local cache is best-effort */ }
    const timer = window.setTimeout(() => void saveUserPreferences(user.id, { appState: nextState }).catch((error) => console.error('AppForge remote state sync failed', error)), 650)
    return () => window.clearTimeout(timer)
  }, [state, user?.id, remoteReady])

  React.useEffect(() => {
    if (!user || !remoteReady) return
    return subscribeCategoryOverrides(() => { void saveUserPreferences(user.id, { categoryOverrides: loadCategoryOverrides() }).catch((error) => console.error('AppForge category sync failed', error)) })
  }, [user?.id, remoteReady])

  const addToRecent = (appId: string) => setState((prev) => ({ ...prev, recentApps: [appId, ...(prev.recentApps || []).filter((id) => id !== appId)].slice(0, 20) }))
  const toggleFavorite = (appId: string) => setState((prev) => ({ ...prev, favorites: (prev.favorites || []).includes(appId) ? (prev.favorites || []).filter((id) => id !== appId) : [...(prev.favorites || []), appId] }))
  const dashboard = <PublicDashboard state={state} onOpenApp={addToRecent} onToggleFavorite={toggleFavorite} />
  const requestedPath = `${location.pathname}${location.search}${location.hash}`

  if (location.pathname === '/privacy') return lazyPage(<PrivacyPolicyPage />)
  if (location.pathname === '/terms') return lazyPage(<TermsOfServicePage />)
  if (location.pathname === '/landing') return <LoginPage landingOnly />
  if (location.pathname === '/explore') return lazyPage(<PublicAppsPage />)
  if (location.pathname === '/login') return <LoginPage />
  if (location.pathname === '/apps/any-converter') return <Navigate to="/apps/data-converter" replace />
  if (!user && !loading && location.pathname === '/apps') return <Navigate to="/explore" replace />

  if (!user && !loading) {
    if (privatePaths.has(location.pathname) || location.pathname === '/huggingface') return <LoginPage returnTo={requestedPath} />
    const publicPage = publicAppPage(location.pathname)
    if (publicPage) return publicPage
  }

  if (loading || !user) return <LoginPage returnTo={requestedPath} />
  if (location.pathname === '/huggingface') return lazyPage(<HuggingFaceGalleryPage />)

  return (
    <Layout currentVersion={BUILD_INFO.version}>
      <Routes>
        <Route path="/" element={dashboard} />
        <Route path="/apps" element={dashboard} />
        <Route path="/favorites" element={dashboard} />
        <Route path="/recent" element={dashboard} />
        <Route path="/workspace" element={dashboard} />
        <Route path="/categories" element={<Navigate to="/workspace" replace />} />
        <Route path="/category/:id" element={dashboard} />
        <Route path="/people" element={lazyPage(<PeoplePage />)} />
        <Route path="/settings" element={lazyPage(<SettingsPage state={state} setState={setState} />)} />
        <Route path="/settings/admin" element={lazyPage(<AdminConsolePage />)} />

        <Route path="/apps/getter-pro" element={<PF_ScrapperPro />} />
        <Route path="/apps/scrapper-pro" element={<Navigate to="/apps/getter-pro" replace />} />
        <Route path="/apps/image-labeler" element={<PF_ImageLabeler />} />
        <Route path="/apps/creator-svg" element={<PF_CreatorSVG />} />
        <Route path="/apps/crypto-track" element={<PF_CryptoTrack />} />
        <Route path="/apps/weather-now" element={<PF_WeatherNow />} />
        <Route path="/apps/ai-dragon-arena" element={<PF_AIDragonArena />} />
        <Route path="/apps/dns-txt-checker" element={<PF_DnsTxtChecker />} />
        <Route path="/apps/data-converter" element={<AnyToAnyConverter />} />
        <Route path="/apps/any-converter" element={<Navigate to="/apps/data-converter" replace />} />
        <Route path="/apps/task-list" element={<TaskList />} />
        <Route path="/apps/media-vault" element={<PF_UserMediaVault />} />
        <Route path="/apps/desktop-buddy" element={<DesktopBuddy />} />
        <Route path="/apps/qr-generator" element={<QrGenerator />} />
        <Route path="/apps/favicon-studio" element={lazyPage(<FaviconStudio />)} />
        <Route path="/apps/svg-icons" element={lazyPage(<SvgIconsBrowser />)} />
        <Route path="/apps/landing-builder" element={lazyPage(<LandingBuilder />)} />

        {Array.from(utilitySlugs).map((slug) => <Route key={slug} path={`/apps/${slug}`} element={<UtilityWorkbench />} />)}
        {Array.from(imageSlugs).map((slug) => <Route key={slug} path={`/apps/${slug}`} element={<ImageWorkbench />} />)}
        {Array.from(localSlugs).map((slug) => <Route key={slug} path={`/apps/${slug}`} element={<LocalToolsWorkbench />} />)}
        <Route path="/apps/color-picker" element={<ColorPickerTool />} />

        <Route path="/pf-scrapper-pro" element={<Navigate to="/apps/getter-pro" replace />} />
        <Route path="/pf-getter-pro" element={<Navigate to="/apps/getter-pro" replace />} />
        <Route path="/pf-image-labeler" element={<Navigate to="/apps/image-labeler" replace />} />
        <Route path="/pf-creator-svg" element={<Navigate to="/apps/creator-svg" replace />} />
        <Route path="/pf-crypto-track" element={<Navigate to="/apps/crypto-track" replace />} />
        <Route path="/pf-weather-now" element={<Navigate to="/apps/weather-now" replace />} />
        <Route path="/pf-ai-dragon-arena" element={<Navigate to="/apps/ai-dragon-arena" replace />} />
        <Route path="/pf-dns-txt-checker" element={<Navigate to="/apps/dns-txt-checker" replace />} />
        <Route path="/pf-qr-generator" element={<Navigate to="/apps/qr-generator" replace />} />
        <Route path="/pf-color-picker" element={<Navigate to="/apps/color-picker" replace />} />
        <Route path="/pf-media-vault" element={<Navigate to="/apps/media-vault" replace />} />
        <Route path="/apps/:slug" element={<RegistryAppFallback />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App

import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ArrowLeftRight, Image as ImageIcon, Palette, PanelsTopLeft } from 'lucide-react'
import { Layout } from './components/layout/Layout'
import { PublicToolShell } from './components/public/PublicToolShell'
import { PublicDashboard } from './components/dashboard/PublicDashboard'
import { ScrapperProIcon, WeatherNowIcon } from './components/dashboard/AppIcons'
import { DragonArenaIcon } from './components/dashboard/DragonArenaIcon'
import {
  PF_ScrapperPro,
  PF_ImageLabeler,
  PF_CreatorSVG,
  PF_CryptoTrack,
  PF_WeatherNow,
  PF_PariflowSmpl,
  PF_AIDragonArena,
  PF_DnsTxtChecker,
  MiniAppShell,
  AnyToAnyConverter,
  UtilityWorkbench,
  ImageWorkbench,
  LocalToolsWorkbench,
  ColorPickerTool,
  PF_UserMediaVault,
} from './components/dashboard'
import { PF_GuestDragonArena } from './components/dashboard/PF_GuestDragonArena'
import type { AppState, MiniApp } from './types'
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
import { loadCategoryOverrides, saveCategoryOverrides, subscribeCategoryOverrides } from './lib/categories'
import { stripLegacyMiniAppCommerce } from './lib/legacyMiniApps'
import { updateSeo } from './lib/seo'

const SettingsPage = React.lazy(() => import('./components/resources/Settings').then((module) => ({ default: module.SettingsPage })))
const PeoplePage = React.lazy(() => import('./components/resources/People').then((module) => ({ default: module.PeoplePage })))
const MarketingStudio = React.lazy(() => import('./components/resources/MarketingStudio'))
const HuggingFaceGalleryPage = React.lazy(() => import('./components/public/HuggingFaceGalleryPage').then((module) => ({ default: module.HuggingFaceGalleryPage })))
const PrivacyPolicyPage = React.lazy(() => import('./components/public/LegalPages').then((module) => ({ default: module.PrivacyPolicyPage })))
const TermsOfServicePage = React.lazy(() => import('./components/public/LegalPages').then((module) => ({ default: module.TermsOfServicePage })))
const FaviconStudio = React.lazy(() => import('./components/public/FaviconStudio'))
const SvgIconsBrowser = React.lazy(() => import('./components/public/SvgIconsBrowser'))
const LandingBuilder = React.lazy(() => import('./components/public/LandingBuilder'))

const defaultSettings = { theme: 'system' as const }
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

const hydrateStoredState = (raw: string): AppState => {
  const parsed = JSON.parse(raw) as Partial<AppState>
  return {
    ...defaultState,
    ...parsed,
    settings: { ...defaultState.settings, ...(parsed.settings || {}) },
    miniApps: stripLegacyMiniAppCommerce(Array.isArray(parsed.miniApps) ? parsed.miniApps : defaultState.miniApps),
    favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
    recentApps: Array.isArray(parsed.recentApps) ? parsed.recentApps : [],
    documentReadiness: Array.isArray(parsed.documentReadiness) ? parsed.documentReadiness : defaultDocumentReadiness,
    messages: Array.isArray(parsed.messages) ? parsed.messages : defaultMessages,
  }
}

const routeFallback = (
  <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-muted-foreground">
    Loading AppForge…
  </div>
)

const lazyPage = (page: React.ReactNode) => <React.Suspense fallback={routeFallback}>{page}</React.Suspense>

function App() {
  const location = useLocation()
  const { user, loading } = useAuth()
  const [remoteReady, setRemoteReady] = React.useState(false)
  const [state, setState] = React.useState<AppState>(() => {
    try { const raw = localStorage.getItem('appforge-workplan-v1'); if (raw) return hydrateStoredState(raw) } catch { /* ignore */ }
    try { const raw = localStorage.getItem('projectforge-workplan-v1'); if (raw) return hydrateStoredState(raw) } catch { /* ignore */ }
    return defaultState
  })

  React.useEffect(() => { updateSeo(location.pathname) }, [location.pathname])
  React.useEffect(() => {
    const current = { ...state, miniApps: stripLegacyMiniAppCommerce(state.miniApps) }
    localStorage.setItem('appforge-workplan-v1', JSON.stringify(current))
  }, [state])

  React.useEffect(() => {
    let cancelled = false
    setRemoteReady(false)
    if (!user) return () => { cancelled = true }
    const hydrate = async () => {
      try {
        const remote = await loadUserPreferences(user.id)
        if (cancelled) return
        if (remote) {
          if (remote.appState) {
            setState((current) => ({
              ...current,
              ...remote.appState,
              settings: { ...current.settings, ...(remote.appState?.settings || {}) },
              miniApps: stripLegacyMiniAppCommerce(Array.isArray(remote.appState?.miniApps) ? remote.appState.miniApps : current.miniApps),
            }))
          }
          saveCategoryOverrides(remote.categoryOverrides || {})
        } else {
          await saveUserPreferences(user.id, { appState: { ...state, miniApps: stripLegacyMiniAppCommerce(state.miniApps) }, categoryOverrides: loadCategoryOverrides() })
        }
      } catch (error) { console.error('AppForge remote preference hydration failed', error) }
      finally { if (!cancelled) setRemoteReady(true) }
    }
    void hydrate()
    return () => { cancelled = true }
  }, [user?.id])

  React.useEffect(() => {
    if (!user || !remoteReady) return
    const timer = window.setTimeout(() => {
      const current = { ...state, miniApps: stripLegacyMiniAppCommerce(state.miniApps) }
      void saveUserPreferences(user.id, { appState: current }).catch((error) => console.error('AppForge remote state sync failed', error))
    }, 650)
    return () => window.clearTimeout(timer)
  }, [state, user, remoteReady])

  React.useEffect(() => {
    if (!user || !remoteReady) return
    return subscribeCategoryOverrides(() => { void saveUserPreferences(user.id, { categoryOverrides: loadCategoryOverrides() }).catch((error) => console.error('AppForge category sync failed', error)) })
  }, [user, remoteReady])

  const addToRecent = (appId: string) => setState((prev) => ({ ...prev, recentApps: [appId, ...(prev.recentApps || []).filter((id) => id !== appId)].slice(0, 20) }))
  const toggleFavorite = (appId: string) => setState((prev) => ({ ...prev, favorites: (prev.favorites || []).includes(appId) ? (prev.favorites || []).filter((id) => id !== appId) : [...(prev.favorites || []), appId] }))
  const updateMiniApp = (updated: MiniApp) => setState((prev) => ({ ...prev, miniApps: prev.miniApps.map((app) => app.id === updated.id ? updated : app) }))
  const miniAppRoute = (miniAppId: string) => {
    const app = state.miniApps.find((item) => item.id === miniAppId)
    if (!app) return <Navigate to="/apps" replace />
    return <MiniAppShell app={app} onUpdate={updateMiniApp} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes(miniAppId)} />
  }

  const dashboard = <PublicDashboard state={state} onOpenApp={addToRecent} onToggleFavorite={toggleFavorite} />
  const requestedPath = `${location.pathname}${location.search}${location.hash}`

  if (location.pathname === '/privacy') return lazyPage(<PrivacyPolicyPage />)
  if (location.pathname === '/terms') return lazyPage(<TermsOfServicePage />)
  if (location.pathname === '/huggingface') return lazyPage(<HuggingFaceGalleryPage />)
  if (location.pathname === '/landing') return <LoginPage landingOnly />
  if (location.pathname === '/login') return <LoginPage />

  if (!user && !loading) {
    if (location.pathname === '/apps/scrapper-pro' || location.pathname === '/pf-scrapper-pro') return <PublicToolShell toolName="Scrapper Pro" toolIcon={<ScrapperProIcon />}><PF_ScrapperPro /></PublicToolShell>
    if (location.pathname === '/apps/weather-now' || location.pathname === '/pf-weather-now') return <PublicToolShell toolName="Weather Now" toolIcon={<WeatherNowIcon />}><PF_WeatherNow /></PublicToolShell>
    if (location.pathname === '/apps/any-converter') return <PublicToolShell toolName="Any Converter" toolIcon={<ArrowLeftRight className="h-4 w-4" />}><AnyToAnyConverter /></PublicToolShell>
    if (location.pathname === '/apps/favicon-studio') return <PublicToolShell toolName="Favicon Studio" toolIcon={<ImageIcon className="h-4 w-4" />}>{lazyPage(<FaviconStudio />)}</PublicToolShell>
    if (location.pathname === '/apps/svg-icons') return <PublicToolShell toolName="SVG Icons" toolIcon={<Palette className="h-4 w-4" />}>{lazyPage(<SvgIconsBrowser />)}</PublicToolShell>
    if (location.pathname === '/apps/landing-builder') return <PublicToolShell toolName="Landing Builder" toolIcon={<PanelsTopLeft className="h-4 w-4" />}>{lazyPage(<LandingBuilder />)}</PublicToolShell>
    if (location.pathname === '/apps/ai-dragon-arena' || location.pathname === '/pf-ai-dragon-arena') return <PublicToolShell toolName="Story Studio" toolIcon={<DragonArenaIcon className="h-4 w-4" />}><PF_GuestDragonArena /></PublicToolShell>
  }

  if (loading || !user) return <LoginPage returnTo={requestedPath} />

  return (
    <Layout currentVersion={BUILD_INFO.version}>
      <Routes>
        <Route path="/" element={dashboard} />
        <Route path="/apps" element={dashboard} />
        <Route path="/favorites" element={dashboard} />
        <Route path="/recent" element={dashboard} />
        <Route path="/categories" element={dashboard} />
        <Route path="/category/:id" element={dashboard} />
        <Route path="/people" element={lazyPage(<PeoplePage />)} />
        <Route path="/workspace" element={<Navigate to="/apps" replace />} />

        <Route path="/apps/scrapper-pro" element={<PF_ScrapperPro />} />
        <Route path="/apps/image-labeler" element={<PF_ImageLabeler />} />
        <Route path="/apps/creator-svg" element={<PF_CreatorSVG />} />
        <Route path="/apps/crypto-track" element={<PF_CryptoTrack />} />
        <Route path="/apps/weather-now" element={<PF_WeatherNow />} />
        <Route path="/apps/pariflow-smpl" element={<PF_PariflowSmpl />} />
        <Route path="/apps/ai-dragon-arena" element={<PF_AIDragonArena />} />
        <Route path="/apps/dns-txt-checker" element={<PF_DnsTxtChecker />} />
        <Route path="/apps/any-converter" element={<AnyToAnyConverter />} />
        <Route path="/apps/media-vault" element={<PF_UserMediaVault />} />
        <Route path="/apps/favicon-studio" element={lazyPage(<FaviconStudio />)} />
        <Route path="/apps/svg-icons" element={lazyPage(<SvgIconsBrowser />)} />
        <Route path="/apps/landing-builder" element={lazyPage(<LandingBuilder />)} />
        <Route path="/marketing" element={lazyPage(<MarketingStudio />)} />
        <Route path="/settings" element={lazyPage(<SettingsPage state={state} setState={setState} />)} />

        {['json-formatter','uuid-generator','password-generator','token-generator','base64-tool','hash-tool','url-encoder','html-encoder','jwt-decoder','hex-converter'].map((slug) => <Route key={slug} path={`/apps/${slug}`} element={<UtilityWorkbench />} />)}
        {['image-resizer','image-converter','image-compressor','image-metadata'].map((slug) => <Route key={slug} path={`/apps/${slug}`} element={<ImageWorkbench />} />)}
        {['csv-converter','timestamp-converter','regex-tester'].map((slug) => <Route key={slug} path={`/apps/${slug}`} element={<LocalToolsWorkbench />} />)}
        <Route path="/apps/color-picker" element={<ColorPickerTool />} />

        <Route path="/apps/pitch-deck" element={miniAppRoute('mini-2')} />
        <Route path="/apps/invoice-studio" element={miniAppRoute('mini-3')} />
        <Route path="/apps/source-grade" element={miniAppRoute('mini-5')} />
        <Route path="/apps/link-checker" element={miniAppRoute('mini-9')} />
        <Route path="/apps/qr-generator" element={miniAppRoute('mini-13')} />
        <Route path="/apps/resume-forge" element={miniAppRoute('mini-1')} />

        <Route path="/pf-scrapper-pro" element={<Navigate to="/apps/scrapper-pro" replace />} />
        <Route path="/pf-image-labeler" element={<Navigate to="/apps/image-labeler" replace />} />
        <Route path="/pf-creator-svg" element={<Navigate to="/apps/creator-svg" replace />} />
        <Route path="/pf-crypto-track" element={<Navigate to="/apps/crypto-track" replace />} />
        <Route path="/pf-weather-now" element={<Navigate to="/apps/weather-now" replace />} />
        <Route path="/pf-pariflow-smpl" element={<Navigate to="/apps/pariflow-smpl" replace />} />
        <Route path="/pf-ai-dragon-arena" element={<Navigate to="/apps/ai-dragon-arena" replace />} />
        <Route path="/pf-dns-txt-checker" element={<Navigate to="/apps/dns-txt-checker" replace />} />
        <Route path="/pf-pitch-deck" element={<Navigate to="/apps/pitch-deck" replace />} />
        <Route path="/pf-invoice-studio" element={<Navigate to="/apps/invoice-studio" replace />} />
        <Route path="/pf-source-grade" element={<Navigate to="/apps/source-grade" replace />} />
        <Route path="/pf-link-checker" element={<Navigate to="/apps/link-checker" replace />} />
        <Route path="/pf-json-formatter" element={<Navigate to="/apps/json-formatter" replace />} />
        <Route path="/pf-csv-converter" element={<Navigate to="/apps/csv-converter" replace />} />
        <Route path="/pf-qr-generator" element={<Navigate to="/apps/qr-generator" replace />} />
        <Route path="/pf-color-picker" element={<Navigate to="/apps/color-picker" replace />} />
        <Route path="/pf-resume-forge" element={<Navigate to="/apps/resume-forge" replace />} />
        <Route path="/pf-media-vault" element={<Navigate to="/apps/media-vault" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { AppWorkspace } from './components/dashboard/AppWorkspace'
import { PF_ScrapperPro, PF_ImageLabeler, PF_CreatorSVG, PF_CryptoTrack, PF_WeatherNow, PF_PariflowSmpl, MiniAppShell, AnyToAnyConverter } from './components/dashboard'
import { SettingsPage } from './components/resources/Settings'
import type { AppState, MiniApp } from './types'
import { defaultArticle, defaultPitches, defaultSources, defaultOutreach, defaultChecklist, defaultPlan, defaultMiniApps, defaultVersions } from './types'
import { APPFORGE_VERSION } from './lib/registry'

const defaultSettings = { theme: 'system' as const }

const defaultState: AppState = {
  plan: defaultPlan,
  article: defaultArticle,
  pitches: defaultPitches,
  sources: defaultSources,
  outreach: defaultOutreach,
  checklist: defaultChecklist,
  settings: defaultSettings,
  miniApps: defaultMiniApps,
  versions: defaultVersions,
  favorites: [],
  recentApps: []
}

function App() {
  const [state, setState] = React.useState<AppState>(() => {
    try {
      const raw = localStorage.getItem('projectforge-workplan-v1')
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem('appforge-workplan-v1')
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return defaultState
  })

  React.useEffect(() => {
    localStorage.setItem('appforge-workplan-v1', JSON.stringify(state))
  }, [state])

  const addToRecent = (appId: string) => {
    setState(prev => {
      const recent = [appId, ...(prev.recentApps || []).filter(id => id !== appId)].slice(0, 20)
      return { ...prev, recentApps: recent }
    })
  }

  const toggleFavorite = (appId: string) => {
    setState(prev => ({
      ...prev,
      favorites: (prev.favorites || []).includes(appId)
        ? (prev.favorites || []).filter(id => id !== appId)
        : [...(prev.favorites || []), appId]
    }))
  }

  const openApp = (appId: string) => {
    addToRecent(appId)
  }

  const currentVersion = APPFORGE_VERSION

  return (
    <Layout currentVersion={currentVersion}>
      <Routes>
        <Route path="/" element={<AppWorkspace state={state} setState={setState} onOpenApp={openApp} onToggleFavorite={toggleFavorite} />} />
        <Route path="/apps" element={<AppWorkspace state={state} setState={setState} onOpenApp={openApp} onToggleFavorite={toggleFavorite} />} />
        <Route path="/favorites" element={<AppWorkspace state={state} setState={setState} onOpenApp={openApp} onToggleFavorite={toggleFavorite} />} />
        <Route path="/recent" element={<AppWorkspace state={state} setState={setState} onOpenApp={openApp} onToggleFavorite={toggleFavorite} />} />
        <Route path="/category/:id" element={<AppWorkspace state={state} setState={setState} onOpenApp={openApp} onToggleFavorite={toggleFavorite} />} />
        <Route path="/apps/scrapper-pro" element={<PF_ScrapperPro />} />
        <Route path="/apps/image-labeler" element={<PF_ImageLabeler />} />
        <Route path="/apps/creator-svg" element={<PF_CreatorSVG />} />
        <Route path="/apps/crypto-track" element={<PF_CryptoTrack />} />
        <Route path="/apps/weather-now" element={<PF_WeatherNow />} />
        <Route path="/apps/pariflow-smpl" element={<PF_PariflowSmpl />} />
        <Route path="/settings" element={<SettingsPage state={state} setState={setState} />} />
        <Route path="/apps/pitch-deck" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-2')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-2')} />} />
        <Route path="/apps/invoice-studio" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-3')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-3')} />} />
        <Route path="/apps/source-grade" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-5')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-5')} />} />
        <Route path="/apps/link-checker" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-9')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-9')} />} />
        <Route path="/apps/json-formatter" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-11')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-11')} />} />
        <Route path="/apps/csv-converter" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-12')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-12')} />} />
        <Route path="/apps/qr-generator" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-13')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-13')} />} />
        <Route path="/apps/color-picker" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-14')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-14')} />} />
        <Route path="/apps/resume-forge" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-1')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-1')} />} />
        <Route path="/apps/any-converter" element={<AnyToAnyConverter />} />
        <Route path="/apps/image-resizer" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-1')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-1')} />} />
        <Route path="/apps/image-converter" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-1')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-1')} />} />
        <Route path="/apps/image-compressor" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-1')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-1')} />} />
        <Route path="/apps/image-metadata" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-1')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-1')} />} />
        <Route path="/apps/uuid-generator" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-1')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-1')} />} />
        <Route path="/apps/password-generator" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-1')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-1')} />} />
        <Route path="/apps/token-generator" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-1')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-1')} />} />
        <Route path="/apps/base64-tool" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-1')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-1')} />} />
        <Route path="/apps/hash-tool" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-1')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-1')} />} />
        <Route path="/apps/url-encoder" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-1')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-1')} />} />
        <Route path="/apps/html-encoder" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-1')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-1')} />} />
        <Route path="/apps/jwt-decoder" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-1')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-1')} />} />
        <Route path="/apps/hex-converter" element={<MiniAppShell app={state.miniApps.find(a => a.id === 'mini-1')!} onUpdate={(updated) => setState({ ...state, miniApps: state.miniApps.map(a => a.id === updated.id ? updated : a) })} onToggleFavorite={toggleFavorite} isFavorite={(state.favorites || []).includes('mini-1')} />} />
        <Route path="/pf-scrapper-pro" element={<Navigate to="/apps/scrapper-pro" replace />} />
        <Route path="/pf-image-labeler" element={<Navigate to="/apps/image-labeler" replace />} />
        <Route path="/pf-creator-svg" element={<Navigate to="/apps/creator-svg" replace />} />
        <Route path="/pf-crypto-track" element={<Navigate to="/apps/crypto-track" replace />} />
        <Route path="/pf-weather-now" element={<Navigate to="/apps/weather-now" replace />} />
        <Route path="/pf-pariflow-smpl" element={<Navigate to="/apps/pariflow-smpl" replace />} />
        <Route path="/pf-pitch-deck" element={<Navigate to="/apps/pitch-deck" replace />} />
        <Route path="/pf-invoice-studio" element={<Navigate to="/apps/invoice-studio" replace />} />
        <Route path="/pf-source-grade" element={<Navigate to="/apps/source-grade" replace />} />
        <Route path="/pf-link-checker" element={<Navigate to="/apps/link-checker" replace />} />
        <Route path="/pf-json-formatter" element={<Navigate to="/apps/json-formatter" replace />} />
        <Route path="/pf-csv-converter" element={<Navigate to="/apps/csv-converter" replace />} />
        <Route path="/pf-qr-generator" element={<Navigate to="/apps/qr-generator" replace />} />
        <Route path="/pf-color-picker" element={<Navigate to="/apps/color-picker" replace />} />
        <Route path="/pf-resume-forge" element={<Navigate to="/apps/resume-forge" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App

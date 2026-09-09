import { getAllApps } from './registry'

export type DemoViewport = 'desktop' | 'mobile'

export interface DemoCaptureTarget {
  appId: string
  route: string
  viewports: DemoViewport[]
  requiresAuth: boolean
  fixture: 'empty-safe' | 'seeded-safe'
  note?: string
}

const TARGETS: DemoCaptureTarget[] = [
  { appId: 'scrapper-pro', route: '/apps/scrapper-pro', viewports: ['desktop', 'mobile'], requiresAuth: false, fixture: 'seeded-safe', note: 'Use public search content only; never capture private Media Vault rows.' },
  { appId: 'weather-now', route: '/apps/weather-now', viewports: ['desktop', 'mobile'], requiresAuth: false, fixture: 'seeded-safe', note: 'Use a generic city search with no personal location data.' },
  { appId: 'any-converter', route: '/apps/any-converter', viewports: ['desktop', 'mobile'], requiresAuth: false, fixture: 'seeded-safe', note: 'Use synthetic conversion data only.' },
  { appId: 'ai-dragon-arena', route: '/apps/ai-dragon-arena', viewports: ['desktop', 'mobile'], requiresAuth: false, fixture: 'seeded-safe', note: 'Capture Story Studio with demo-safe fantasy content only.' },
  { appId: 'image-labeler', route: '/apps/image-labeler', viewports: ['desktop'], requiresAuth: true, fixture: 'empty-safe' },
  { appId: 'creator-svg', route: '/apps/creator-svg', viewports: ['desktop'], requiresAuth: true, fixture: 'seeded-safe' },
  { appId: 'crypto-track', route: '/apps/crypto-track', viewports: ['desktop'], requiresAuth: true, fixture: 'seeded-safe' },
  { appId: 'dns-txt-checker', route: '/apps/dns-txt-checker', viewports: ['desktop'], requiresAuth: true, fixture: 'seeded-safe' },
  { appId: 'media-vault', route: '/apps/media-vault', viewports: ['desktop'], requiresAuth: true, fixture: 'empty-safe', note: 'Use an empty/demo account; do not capture user uploads or private filenames.' },
]

export function getDemoCaptureManifest(): DemoCaptureTarget[] {
  const registry = new Map(getAllApps().map((app) => [app.id, app]))
  return TARGETS.filter((target) => {
    const app = registry.get(target.appId)
    return Boolean(app && app.route === target.route && ['beta', 'launched'].includes(app.status))
  }).map((target) => ({ ...target, viewports: [...target.viewports] }))
}

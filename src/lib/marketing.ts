import type { AppDefinition } from './registry'

export type DemoStatus = 'planned' | 'recorded' | 'edited' | 'published'
export type PublicationStatus = 'draft' | 'ready' | 'publishing' | 'published' | 'failed'
export type MarketingFormat = 'youtube-16x9' | 'short-9x16'
export type MarketingChannel = 'youtube' | 'tiktok' | 'other'

export interface DemoPackage {
  id: string
  appId: string
  appName: string
  route: string
  appVersion: string
  buildFingerprint: string
  title: string
  script: string[]
  shots: string[]
  narration: string
  thumbnailText: string
  playlist: string
  description16x9: string
  tags16x9: string[]
  descriptionShort: string
  tagsShort: string[]
  status: DemoStatus
  publishedUrl?: string
  createdAt: string
  updatedAt: string
}

export interface PublicationRecord {
  id: string
  demoId: string
  appId: string
  channel: MarketingChannel
  format: MarketingFormat
  status: PublicationStatus
  title: string
  description: string
  tags: string[]
  playlist?: string
  thumbnailText?: string
  remoteId?: string
  remoteUrl?: string
  publishedAt?: string
  lastError?: string
  attempts: number
  createdAt: string
  updatedAt: string
}

export const APPFORGE_CHANNEL_URL = 'https://www.youtube.com/@AppForgeDragon'
export const APPFORGE_SITE_URL = 'https://www.sstoken.space/'
export const APPFORGE_GITHUB_URL = 'https://github.com/dracorisz/appforge'
export const APPFORGE_SUPPORT_URL = 'https://paypal.me/dracorisz'

export const PLAYLISTS = ['Start Here', 'Story Studio / AI Creation', 'Build AppForge', 'AppForge Tools', 'Short demos / generation showcases'] as const

const clean = (value: string) => value.replace(/\s+/g, ' ').trim()
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const makeDemoPackage = (app: AppDefinition, buildFingerprint: string): DemoPackage => {
  const createdAt = new Date().toISOString()
  const playlist = app.id === 'ai-dragon-arena' ? 'Story Studio / AI Creation' : app.status === 'launched' || app.status === 'beta' ? 'AppForge Tools' : 'Build AppForge'
  const routeLabel = app.route.startsWith('/') ? `${APPFORGE_SITE_URL.replace(/\/$/, '')}${app.route}` : app.route
  const title = `${app.name} — AppForge Product Walkthrough`
  const coreDescription = `${app.name} is part of AppForge, a growing open-source toolbox of practical web apps. ${clean(app.description)}`
  const footer = `\n\nTry AppForge: ${APPFORGE_SITE_URL}\nGitHub: ${APPFORGE_GITHUB_URL}\nChannel: ${APPFORGE_CHANNEL_URL}\nSupport: ${APPFORGE_SUPPORT_URL}`
  const commonTags = ['AppForge', 'web apps', 'open source', app.name, app.category, ...app.tags].filter(Boolean)

  return {
    id: `demo-${app.id}-${Date.now()}`,
    appId: app.id,
    appName: app.name,
    route: app.route,
    appVersion: app.version,
    buildFingerprint,
    title,
    script: [
      `Open ${app.name} from AppForge.`,
      'Show the primary input or starting state.',
      'Perform one representative successful workflow using demo-safe data.',
      'Show the result, export/save action, or next useful step.',
      'End on the AppForge product identity and canonical site link.',
    ],
    shots: [
      `Establishing shot: ${routeLabel}`,
      'Primary control/input close-up',
      'Action/result state',
      'Secondary useful feature or export state',
      'Closing frame with AppForge branding',
    ],
    narration: `${app.name} is a focused AppForge tool for ${clean(app.description).replace(/\.$/, '').toLowerCase()}. In this walkthrough, we use the current production workflow, show one complete result, and finish with the next action you can take inside AppForge.`,
    thumbnailText: app.name.length <= 24 ? app.name.toUpperCase() : `${app.name.split(' ').slice(0, 3).join(' ').toUpperCase()}`,
    playlist,
    description16x9: `${coreDescription}\n\nThis walkthrough shows the current ${app.version} workflow and the implemented product behavior only.${footer}\n\n#AppForge #WebApps #OpenSource`,
    tags16x9: Array.from(new Set(commonTags)).slice(0, 18),
    descriptionShort: `${app.name} in under 60 seconds. ${clean(app.description)}${footer}\n\n#AppForge #Shorts`,
    tagsShort: Array.from(new Set([...commonTags, 'Shorts'])).slice(0, 14),
    status: 'planned',
    createdAt,
    updatedAt: createdAt,
  }
}

export const makePublication = (demo: DemoPackage, format: MarketingFormat): PublicationRecord => {
  const createdAt = new Date().toISOString()
  const short = format === 'short-9x16'
  return {
    id: `publication-${slug(demo.appName)}-${format}-${Date.now()}`,
    demoId: demo.id,
    appId: demo.appId,
    channel: 'youtube',
    format,
    status: 'draft',
    title: short ? `${demo.appName} in 60 seconds | AppForge` : demo.title,
    description: short ? demo.descriptionShort : demo.description16x9,
    tags: short ? demo.tagsShort : demo.tags16x9,
    playlist: short ? 'Short demos / generation showcases' : demo.playlist,
    thumbnailText: demo.thumbnailText,
    attempts: 0,
    createdAt,
    updatedAt: createdAt,
  }
}

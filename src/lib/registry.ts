import { BUILD_INFO } from './buildInfo'

export type AppStatus = 'idea' | 'building' | 'beta' | 'launched' | 'deprecated'

export interface AppDefinition {
  id: string
  name: string
  description: string
  category: string
  subcategory?: string
  icon: string
  route: string
  tags: string[]
  status: AppStatus
  version: string
  coverImage?: string
  changelog?: { version: string; date: string; changes: string[] }[]
  forks?: number
  externalUrl?: string
}

export interface CategoryDefinition {
  id: string
  name: string
  description: string
  icon: string
  apps: AppDefinition[]
}

export const PRIVATE_APP_IDS = new Set(['scrapper-pro', 'media-vault', 'desktop-buddy', 'ai-dragon-arena'])
export const isPublicApp = (app: Pick<AppDefinition, 'id'>) => !PRIVATE_APP_IDS.has(app.id)

export const CATEGORIES: CategoryDefinition[] = [
  { id: 'converters', name: 'Converters', description: 'Convert files and structured data.', icon: 'ArrowLeftRight', apps: [] },
  { id: 'text', name: 'Text', description: 'Text and Markdown utilities.', icon: 'Type', apps: [] },
  { id: 'image', name: 'Image', description: 'Image tools and metadata.', icon: 'Image', apps: [] },
  { id: 'code', name: 'Code', description: 'Developer utilities.', icon: 'Code', apps: [] },
  { id: 'regex', name: 'Regex', description: 'Regular-expression tools.', icon: 'Regex', apps: [] },
  { id: 'json-data', name: 'JSON', description: 'JSON and structured data.', icon: 'Braces', apps: [] },
  { id: 'data', name: 'Data', description: 'Data conversion and inspection.', icon: 'Table2', apps: [] },
  { id: 'svg-icons', name: 'SVG & Icons', description: 'SVG, icon and branding tools.', icon: 'Palette', apps: [] },
  { id: 'crypto', name: 'Crypto', description: 'Crypto markets and secure generators.', icon: 'Lock', apps: [] },
  { id: 'encoding', name: 'Encoding', description: 'Encoding and decoding tools.', icon: 'FileCode', apps: [] },
  { id: 'dates', name: 'Dates', description: 'Date and timestamp tools.', icon: 'Calendar', apps: [] },
  { id: 'ai', name: 'AI', description: 'AI-assisted workflows.', icon: 'Sparkles', apps: [] },
  { id: 'utilities', name: 'Utilities', description: 'General-purpose tools.', icon: 'Wrench', apps: [] },
]

type AppSeed = Omit<AppDefinition, 'tags'> & { tags?: string[] }
const app = (seed: AppSeed): AppDefinition => ({ ...seed, tags: seed.tags || [] })

const APPS: AppDefinition[] = [
  app({ id: 'scrapper-pro', name: 'Getter Pro', description: 'Search public media and archive signed-in results.', category: 'utilities', icon: 'Search', route: '/apps/getter-pro', tags: ['search', 'media', 'vault'], status: 'beta', version: '1.5.0' }),
  app({ id: 'image-labeler', name: 'Image Labeler', description: 'Label local image sets and export metadata.', category: 'image', icon: 'Image', route: '/apps/image-labeler', tags: ['labeling', 'dataset'], status: 'beta', version: '1.1.0' }),
  app({ id: 'image-resizer', name: 'Image Resizer', description: 'Resize images locally.', category: 'image', icon: 'Image', route: '/apps/image-resizer', tags: ['image', 'resize'], status: 'beta', version: '0.2.0' }),
  app({ id: 'image-converter', name: 'Image Converter', description: 'Convert images to common browser formats.', category: 'image', icon: 'Image', route: '/apps/image-converter', tags: ['image', 'convert'], status: 'beta', version: '0.2.0' }),
  app({ id: 'image-compressor', name: 'Image Compressor', description: 'Compress images locally with quality control.', category: 'image', icon: 'Image', route: '/apps/image-compressor', tags: ['image', 'compress'], status: 'beta', version: '0.2.0' }),
  app({ id: 'image-metadata', name: 'Image Metadata', description: 'Inspect image dimensions and file details.', category: 'image', icon: 'Image', route: '/apps/image-metadata', tags: ['image', 'metadata'], status: 'beta', version: '0.2.0' }),
  app({ id: 'creator-svg', name: 'Creator SVG', description: 'Build reusable SVG headers and exports.', category: 'svg-icons', icon: 'Palette', route: '/apps/creator-svg', tags: ['svg', 'builder'], status: 'beta', version: '1.1.0' }),
  app({ id: 'favicon-studio', name: 'Favicon Studio', description: 'Create and export favicon assets.', category: 'svg-icons', icon: 'Image', route: '/apps/favicon-studio', tags: ['favicon', 'icons'], status: 'beta', version: '1.0.0' }),
  app({ id: 'svg-icons-browser', name: 'SVG Icons', description: 'Browse icon packs and export SVG or React snippets.', category: 'svg-icons', icon: 'Palette', route: '/apps/svg-icons', tags: ['svg', 'icons'], status: 'beta', version: '1.0.0' }),
  app({ id: 'landing-builder', name: 'Landing Builder', description: 'Compose responsive landing pages and export HTML.', category: 'utilities', icon: 'LayoutDashboard', route: '/apps/landing-builder', tags: ['landing', 'builder'], status: 'beta', version: '1.0.0' }),
  app({ id: 'crypto-track', name: 'Crypto Track', description: 'Live cryptocurrency market data and watchlists.', category: 'crypto', icon: 'Wrench', route: '/apps/crypto-track', tags: ['crypto', 'prices'], status: 'beta', version: '1.2.0' }),
  app({ id: 'weather-now', name: 'Weather Now', description: 'Current weather and city lookup.', category: 'utilities', icon: 'CloudSun', route: '/apps/weather-now', tags: ['weather', 'city'], status: 'beta', version: '1.3.0' }),
  app({ id: 'task-list', name: 'Task List', description: 'Local-first tasks with optional signed-in sync.', category: 'utilities', icon: 'FileText', route: '/apps/task-list', tags: ['tasks', 'todo'], status: 'beta', version: '0.1.0' }),
  app({ id: 'desktop-buddy', name: 'Desktop Buddy', description: 'Create and run a personal desktop character.', category: 'ai', icon: 'Sparkles', route: '/apps/desktop-buddy', tags: ['ai', 'character', 'voice'], status: 'beta', version: '0.6.0' }),
  app({ id: 'ai-dragon-arena', name: 'Story Studio', description: 'AI-assisted story creation and scene generation.', category: 'ai', icon: 'Gamepad2', route: '/apps/ai-dragon-arena', tags: ['ai', 'story', 'image'], status: 'beta', version: '1.6.2', coverImage: '/Dragon Arena.png' }),
  app({ id: 'json-formatter', name: 'JSON Formatter', description: 'Format, minify and validate JSON.', category: 'json-data', icon: 'Braces', route: '/apps/json-formatter', tags: ['json', 'format'], status: 'beta', version: '0.2.0' }),
  app({ id: 'csv-converter', name: 'CSV Converter', description: 'Convert CSV to JSON, Markdown or SQL.', category: 'converters', icon: 'Table2', route: '/apps/csv-converter', tags: ['csv', 'json'], status: 'beta', version: '0.2.0' }),
  app({ id: 'qr-generator', name: 'QR Generator', description: 'Create downloadable QR codes for text, links and Wi-Fi.', category: 'utilities', icon: 'QrCode', route: '/apps/qr-generator', tags: ['qr', 'download'], status: 'beta', version: '1.0.0' }),
  app({ id: 'color-picker', name: 'Color Picker', description: 'Sample image colors and copy common formats.', category: 'image', icon: 'Palette', route: '/apps/color-picker', tags: ['color', 'palette'], status: 'beta', version: '0.2.0' }),
  app({ id: 'dns-txt-checker', name: 'DNS TXT Checker', description: 'Inspect DNS TXT records for a domain.', category: 'utilities', icon: 'Search', route: '/apps/dns-txt-checker', tags: ['dns', 'txt'], status: 'beta', version: '1.0.0' }),
  app({ id: 'media-vault', name: 'Media Vault', description: 'Private per-user media storage and app collections.', category: 'utilities', icon: 'Lock', route: '/apps/media-vault', tags: ['media', 'storage'], status: 'beta', version: '1.3.0' }),
  app({ id: 'uuid-generator', name: 'UUID Generator', description: 'Generate secure UUID v4 identifiers.', category: 'crypto', icon: 'Hash', route: '/apps/uuid-generator', tags: ['uuid', 'id'], status: 'beta', version: '0.2.0' }),
  app({ id: 'password-generator', name: 'Password Generator', description: 'Generate cryptographically random passwords.', category: 'crypto', icon: 'Lock', route: '/apps/password-generator', tags: ['password', 'security'], status: 'beta', version: '0.2.0' }),
  app({ id: 'token-generator', name: 'Token Generator', description: 'Generate secure local tokens.', category: 'crypto', icon: 'Lock', route: '/apps/token-generator', tags: ['token', 'secret'], status: 'beta', version: '0.2.0' }),
  app({ id: 'base64-tool', name: 'Base64 Tool', description: 'Encode and decode Base64 text.', category: 'encoding', icon: 'FileCode', route: '/apps/base64-tool', tags: ['base64', 'encode'], status: 'beta', version: '0.2.0' }),
  app({ id: 'hash-tool', name: 'Hash Tool', description: 'Calculate common SHA digests locally.', category: 'crypto', icon: 'Hash', route: '/apps/hash-tool', tags: ['hash', 'sha'], status: 'beta', version: '0.2.0' }),
  app({ id: 'timestamp-converter', name: 'Timestamp Converter', description: 'Convert Unix and ISO date values.', category: 'dates', icon: 'Calendar', route: '/apps/timestamp-converter', tags: ['timestamp', 'date'], status: 'beta', version: '0.2.0' }),
  app({ id: 'regex-tester', name: 'Regex Tester', description: 'Test expressions, groups and replacements.', category: 'regex', icon: 'Regex', route: '/apps/regex-tester', tags: ['regex', 'match'], status: 'beta', version: '0.2.0' }),
  app({ id: 'data-converter', name: 'Data Converter', description: 'Convert JSON, CSV, YAML, XML, Markdown, HTML and encoded text.', category: 'data', icon: 'ArrowLeftRight', route: '/apps/data-converter', tags: ['data', 'convert', 'json', 'csv'], status: 'beta', version: '1.0.0' }),
  app({ id: 'url-encoder', name: 'URL Encoder / Decoder', description: 'Encode and decode URL components.', category: 'encoding', icon: 'Code', route: '/apps/url-encoder', tags: ['url', 'encode'], status: 'beta', version: '0.2.0' }),
  app({ id: 'html-encoder', name: 'HTML Encoder / Decoder', description: 'Escape and decode common HTML entities.', category: 'encoding', icon: 'Code', route: '/apps/html-encoder', tags: ['html', 'entities'], status: 'beta', version: '0.2.0' }),
  app({ id: 'jwt-decoder', name: 'JWT Decoder', description: 'Inspect JWT header and payload locally.', category: 'encoding', icon: 'Lock', route: '/apps/jwt-decoder', tags: ['jwt', 'decode'], status: 'beta', version: '0.2.0' }),
  app({ id: 'hex-converter', name: 'Hex / Binary Converter', description: 'Convert text, hexadecimal and binary.', category: 'encoding', icon: 'Binary', route: '/apps/hex-converter', tags: ['hex', 'binary'], status: 'beta', version: '0.2.0' }),
]

const APP_MAP = new Map(APPS.map((item) => [item.id, item]))

export function getApp(id: string): AppDefinition | undefined { return APP_MAP.get(id) }
export function getAppsByCategory(categoryId: string): AppDefinition[] { return APPS.filter((item) => item.category === categoryId) }
export function searchApps(query: string): AppDefinition[] {
  const normalized = query.toLowerCase().trim()
  if (!normalized) return APPS
  return APPS.filter((item) => item.name.toLowerCase().includes(normalized) || item.description.toLowerCase().includes(normalized) || item.category.toLowerCase().includes(normalized) || item.tags.some((tag) => tag.toLowerCase().includes(normalized)))
}
export function getAllApps(): AppDefinition[] { return APPS }
export function getPublicApps(): AppDefinition[] { return APPS.filter(isPublicApp) }
export function getAllCategories(): CategoryDefinition[] { return CATEGORIES }

export function updateApp(next: AppDefinition): void {
  const index = APPS.findIndex((item) => item.id === next.id)
  if (index < 0) throw new Error(`App not found: ${next.id}`)
  APPS[index] = next
  APP_MAP.set(next.id, next)
}

export function deleteApp(id: string): void {
  const index = APPS.findIndex((item) => item.id === id)
  if (index < 0) return
  APPS.splice(index, 1)
  APP_MAP.delete(id)
}

export function addApp(next: AppDefinition): void {
  if (APP_MAP.has(next.id)) throw new Error(`App already exists: ${next.id}`)
  APPS.push(next)
  APP_MAP.set(next.id, next)
}

export { APPS, APP_MAP }
export const APPFORGE_VERSION = BUILD_INFO.version
export const APPFORGE_CHANGELOG = [
  { version: BUILD_INFO.version, date: '2026-09-12', changes: ['Active app registry simplified', 'Data Converter consolidated', 'Private app boundary made explicit'] },
]

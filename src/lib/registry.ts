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

export const CATEGORIES: CategoryDefinition[] = [
  { id: 'converters', name: 'Converters', description: 'Convert data and files between formats.', icon: 'ArrowLeftRight', apps: [] },
  { id: 'text', name: 'Text', description: 'Case conversion, counts, sorting, cleanup, diff, Markdown, strings.', icon: 'Type', apps: [] },
  { id: 'image', name: 'Image', description: 'Resize, compress, convert, inspect, label, and work with colors.', icon: 'Image', apps: [] },
  { id: 'video', name: 'Video', description: 'Video info, conversion, thumbnails, metadata.', icon: 'Video', apps: [] },
  { id: 'code', name: 'Code', description: 'Formatters, validators, link tools, timestamps, URL tools, JWT.', icon: 'Code', apps: [] },
  { id: 'regex', name: 'Regex', description: 'Regex tester, matcher, extractor, replace.', icon: 'Regex', apps: [] },
  { id: 'json-data', name: 'JSON', description: 'JSON viewer, formatter, validator, diff.', icon: 'Braces', apps: [] },
  { id: 'data', name: 'Data', description: 'Structured-data conversion and inspection.', icon: 'Table2', apps: [] },
  { id: 'svg-icons', name: 'SVG & Icons', description: 'SVG creation, optimization, conversion, and visual assets.', icon: 'Palette', apps: [] },
  { id: 'crypto', name: 'Crypto', description: 'UUIDs, passwords, secure tokens, hashes, and security generators.', icon: 'Lock', apps: [] },
  { id: 'encoding', name: 'Encoding', description: 'Base64, URL, HTML, JWT, hex, and binary encoders and decoders.', icon: 'FileCode', apps: [] },
  { id: 'dates', name: 'Dates', description: 'Timestamp conversion, date formatting, timezone tools, and calculations.', icon: 'Calendar', apps: [] },
  { id: 'ai', name: 'AI', description: 'AI-powered interactive tools, generation workflows, and games.', icon: 'Sparkles', apps: [] },
  { id: 'utilities', name: 'Utilities', description: 'Search, weather, markets, QR codes, and general-purpose tools.', icon: 'Wrench', apps: [] },
]

type AppSeed = Omit<AppDefinition, 'tags'> & { tags?: string[] }
const app = (seed: AppSeed): AppDefinition => ({ ...seed, tags: seed.tags || [] })

const APPS: AppDefinition[] = [
  app({ id: 'scrapper-pro', name: 'Getter Pro', description: 'Search public image, video, post, and article sources with media-first previews, local saves, downloads, and signed-in Media Vault archiving.', category: 'utilities', icon: 'Search', route: '/apps/getter-pro', tags: ['search', 'media', 'images', 'videos', 'youtube', 'articles', 'vault', 'getter'], status: 'beta', version: '1.5.0', changelog: [{ version: '1.5.0', date: '2026-09-10', changes: ['Getter Pro identity aligned across route and workspace header', 'Individual result download action added for directly downloadable media'] }, { version: '1.4.0', date: '2026-09-10', changes: ['Renamed Scrapper Pro to Getter Pro while preserving compatibility routes and stored data', 'Cleaner media-first result cards with intentional action drawers'] }, { version: '1.3.0', date: '2026-09-09', changes: ['Official server-side YouTube Data API v3 ingestion', 'Channel, handle, video URL, and upload-playlist resolution', 'YouTube metadata and asset provenance retained in Media Vault', 'Clear missing-key and quota failure reporting'] }, { version: '1.2.0', date: '2026-09-09', changes: ['Signed-in Save to Media Vault flow', 'Deduplicated source references by original URL', 'Local guest saves remain browser-only', 'Removed new Getter Pro saves from legacy Story Studio asset storage'] }, { version: '1.1.0', date: '2026-09-08', changes: ['Media-first two-column grid', 'Image/video showbox with arrow navigation', 'Server-backed downloads and article PDF export'] }] }),
  app({ id: 'image-labeler', name: 'Image Labeler', description: 'Load local image folders, apply reusable labels, track review progress, and export label metadata.', category: 'image', icon: 'Image', route: '/apps/image-labeler', tags: ['labeling', 'local', 'dataset', 'comfyui'], status: 'beta', version: '1.1.0' }),
  app({ id: 'image-resizer', name: 'Image Resizer', description: 'Resize images locally with aspect-ratio locking and downloadable output.', category: 'image', icon: 'Image', route: '/apps/image-resizer', tags: ['image', 'resize', 'dimensions'], status: 'beta', version: '0.2.0' }),
  app({ id: 'image-converter', name: 'Image Converter', description: 'Convert browser-supported images to JPEG, PNG, WebP, or AVIF locally.', category: 'image', icon: 'Image', route: '/apps/image-converter', tags: ['image', 'convert', 'png', 'jpeg', 'webp', 'avif'], status: 'beta', version: '0.2.0' }),
  app({ id: 'image-compressor', name: 'Image Compressor', description: 'Compress JPEG, WebP, or AVIF output locally with adjustable quality and size comparison.', category: 'image', icon: 'Image', route: '/apps/image-compressor', tags: ['image', 'compress', 'quality', 'optimize'], status: 'beta', version: '0.2.0' }),
  app({ id: 'image-metadata', name: 'Image Metadata', description: 'Inspect local image file details, dimensions, aspect ratio, megapixels, and modification time.', category: 'image', icon: 'Image', route: '/apps/image-metadata', tags: ['image', 'metadata', 'dimensions', 'info'], status: 'beta', version: '0.2.0' }),
  app({ id: 'creator-svg', name: 'Creator SVG', description: 'Build reusable SVG headers with editable content, tech tags, live preview, and SVG/PNG export.', category: 'svg-icons', icon: 'Palette', route: '/apps/creator-svg', tags: ['svg', 'header', 'export', 'builder'], status: 'beta', version: '1.1.0' }),
  app({ id: 'favicon-studio', name: 'Favicon Studio', description: 'Create text, emoji, SVG-style, or uploaded-image favicons locally and export ICO, SVG, PNG sizes, manifest, and link tags.', category: 'svg-icons', icon: 'Image', route: '/apps/favicon-studio', tags: ['favicon', 'ico', 'manifest', 'icons', 'pwa', 'local'], status: 'beta', version: '1.0.0', changelog: [{ version: '1.0.0', date: '2026-09-09', changes: ['Browser-local text/emoji/image composition', '16/32/180/192/512 previews and PNG export', 'ICO, SVG, manifest, and HTML link export'] }] }),
  app({ id: 'svg-icons-browser', name: 'SVG Icons', description: 'Search and browse react-icons packs with lazy per-pack loading, copy-ready React/JSX snippets, SVG export, favorites, and recents.', category: 'svg-icons', icon: 'Palette', route: '/apps/svg-icons', tags: ['svg', 'icons', 'react-icons', 'components', 'export', 'favorites'], status: 'beta', version: '1.0.0', changelog: [{ version: '1.0.0', date: '2026-09-09', changes: ['Lazy-loaded catalog across react-icons packs', 'React import, JSX, rendered SVG copy/export', 'Local favorites and recent icons', 'Upstream license/attribution reminder'] }] }),
  app({ id: 'landing-builder', name: 'Landing Builder', description: 'Compose responsive landing pages locally with editable sections, local images, project import/export, and standalone HTML export.', category: 'utilities', icon: 'LayoutDashboard', route: '/apps/landing-builder', tags: ['landing', 'builder', 'html', 'responsive', 'no-code', 'local'], status: 'beta', version: '1.0.0', changelog: [{ version: '1.0.0', date: '2026-09-09', changes: ['Browser-local project schema and named saves', 'Hero/features/gallery/CTA/FAQ/footer composition', 'Phone/tablet/desktop preview', 'JSON import/export and standalone HTML export'] }] }),
  app({ id: 'crypto-track', name: 'Crypto Track', description: 'Live cryptocurrency market data through AppForge server APIs with provider failover and watchlists.', category: 'utilities', icon: 'Wrench', route: '/apps/crypto-track', tags: ['crypto', 'prices', 'market', 'coingecko', 'coinpaprika'], status: 'beta', version: '1.1.0' }),
  app({ id: 'weather-now', name: 'Weather Now', description: 'Current weather and location search through AppForge server APIs backed by Open-Meteo.', category: 'utilities', icon: 'CloudSun', route: '/apps/weather-now', tags: ['weather', 'forecast', 'open-meteo', 'city'], status: 'beta', version: '1.2.0', changelog: [{ version: '1.2.0', date: '2026-09-09', changes: ['Responsive current-condition cards with stronger visual hierarchy', 'Pressure, cloud cover, visibility, sunrise, and sunset metrics', 'Theme-aware atmospheric surfaces and improved scanability'] }] }),
  app({ id: 'task-list', name: 'Task List', description: 'Local-first TODO tracking with optional authenticated Supabase sync and a clean standalone-PWA extraction path.', category: 'utilities', icon: 'FileText', route: '/apps/task-list', tags: ['tasks', 'todo', 'productivity', 'local-first', 'pwa', 'supabase'], status: 'beta', version: '0.1.0', changelog: [{ version: '0.1.0', date: '2026-09-10', changes: ['Local create, complete and delete workflow', 'Browser persistence', 'Optional authenticated Supabase sync with RLS', 'Documented 75% standalone-PWA candidate target'] }] }),
  app({ id: 'desktop-buddy', name: 'Desktop Buddy', description: 'Create a local dragon character pack that can react to AppForge agent responses, with KDE Konqi starters, browser voice, and provider-ready Hugging Face and Vertex AI paths.', category: 'ai', icon: 'Sparkles', route: '/apps/desktop-buddy', tags: ['ai', 'dragon', 'character', 'avatar', 'konqi', 'kde', 'hugging-face', 'vertex', 'voice', 'local-first'], status: 'beta', version: '0.5.0', changelog: [{ version: '0.5.0', date: '2026-09-10', changes: ['Canonical registry entry replaces the temporary registry shim', 'KDE Konqi starter asset gallery with source/license attribution', 'Local character upload, pack import/export, framing and browser voice preview'] }] }),
  app({ id: 'ai-dragon-arena', name: 'Story Studio', description: 'AI-assisted Novel and Comics creation with persistent story sessions, cinematic scene generation, asset continuity, and creator-facing story workflows.', category: 'ai', icon: 'Gamepad2', route: '/apps/ai-dragon-arena', tags: ['ai', 'hugging-face', 'story', 'novel', 'comics', 'image', 'creator', 'gamepad'], status: 'beta', version: '1.6.2', coverImage: '/Dragon Arena.png', changelog: [{ version: '1.6.2', date: '2026-09-10', changes: ['Standardized Dragon Arena / Story Studio identity on a joypad icon across product surfaces'] }, { version: '1.6.1', date: '2026-09-09', changes: ['Generate Scene request IDs and sanitized provider/model attempt telemetry', 'Retired duplicate legacy workspace rendering so Story Studio metadata resolves from one dashboard path'] }, { version: '1.6.0', date: '2026-09-09', changes: ['Hugging Face-first GM rotation with local continuity fallback', 'Provider-aware Hugging Face scene generation', 'Server-authoritative generated-scene persistence with model/provider metadata', 'Inline compact Story scenes plus creator-selected public showcase', 'Media Vault links authoritative Story Studio scene assets'] }, { version: '1.4.0', date: '2026-09-09', changes: ['Multiple opening scenarios (Ember Vault, Sunken Library, Scale Bridge, Forgotten Bazaar) with random selection per run', 'Persists and restores the chosen opening per session', 'Session titles reflect the active scenario'] }, { version: '1.3.0', date: '2026-09-09', changes: ['Hugging Face token support with env rotation', 'HF Inference API fallback for scene generation', 'Session switcher and asset gallery per run', 'Points and public leaderboard', 'DNS TXT checker mini-app'] }, { version: '1.2.0', date: '2026-09-09', changes: ['Personal OpenRouter key support for unlimited play', 'Scene/image generation with daily allowance', 'Generated asset gallery scoped to your runs', 'Points system and public leaderboard'] }, { version: '1.0.0', date: '2026-09-09', changes: ['Interactive AI story master', 'Server-side OpenAI Responses API', 'Plus-level GPT-5.6 Sol allowlist'] }] }),

  app({ id: 'json-formatter', name: 'JSON Formatter', description: 'Format, minify, and validate JSON locally with copy-ready output.', category: 'json-data', icon: 'Braces', route: '/apps/json-formatter', tags: ['json', 'format', 'validate', 'minify'], status: 'beta', version: '0.2.0' }),
  app({ id: 'csv-converter', name: 'CSV Converter', description: 'Convert quoted CSV to JSON, Markdown tables, or SQL INSERT statements locally.', category: 'converters', icon: 'Table2', route: '/apps/csv-converter', tags: ['csv', 'json', 'sql', 'markdown'], status: 'beta', version: '0.2.0' }),
  app({ id: 'qr-generator', name: 'QR Generator', description: 'Generate QR codes for URLs, text, or Wi-Fi with downloadable output.', category: 'utilities', icon: 'QrCode', route: '/apps/qr-generator', tags: ['qr', 'generate', 'download'], status: 'idea', version: '0.1.0' }),
  app({ id: 'color-picker', name: 'Color Picker', description: 'Sample pixels from local images, extract a compact palette, and copy HEX/RGB/HSL values.', category: 'image', icon: 'Palette', route: '/apps/color-picker', tags: ['color', 'picker', 'palette', 'hex', 'rgb'], status: 'beta', version: '0.2.0' }),
  app({ id: 'resume-forge', name: 'Resume Forge', description: 'Live resume builder with visual assets, export, and version tracking.', category: 'svg-icons', icon: 'FileText', route: '/apps/resume-forge', tags: ['resume', 'svg', 'pdf', 'builder'], status: 'building', version: '1.0.0' }),
  app({ id: 'pitch-deck', name: 'Pitch Deck', description: 'Editable investor pitch-deck workspace with live preview and export goals.', category: 'utilities', icon: 'FileText', route: '/apps/pitch-deck', tags: ['pitch', 'deck', 'presentation'], status: 'building', version: '1.0.0' }),
  app({ id: 'invoice-studio', name: 'Invoice Studio', description: 'Freelancer invoice workspace with client, time, and payment-oriented tools.', category: 'utilities', icon: 'FileText', route: '/apps/invoice-studio', tags: ['invoice', 'freelance', 'crm'], status: 'building', version: '1.0.0' }),
  app({ id: 'source-grade', name: 'Source Grade', description: 'Research workspace for evaluating source reliability and independence.', category: 'utilities', icon: 'Star', route: '/apps/source-grade', tags: ['source', 'journalism', 'reliability'], status: 'building', version: '1.0.0' }),
  app({ id: 'link-checker', name: 'Link Checker', description: 'Bulk URL status and redirect checking with report export goals.', category: 'code', icon: 'Code', route: '/apps/link-checker', tags: ['links', 'checker', 'bulk', 'csv'], status: 'building', version: '1.0.0' }),
  app({ id: 'dns-txt-checker', name: 'DNS TXT Checker', description: 'Inspect TXT records for any domain using Cloudflare DNS-over-HTTPS.', category: 'utilities', icon: 'Search', route: '/apps/dns-txt-checker', tags: ['dns', 'txt', 'domain', 'verification', 'spf', 'dkim'], status: 'beta', version: '1.0.0' }),
  app({ id: 'media-vault', name: 'Media Vault', description: 'Shared per-user asset surface for private General uploads, linked Story Studio scenes, and deduplicated Getter Pro source references.', category: 'utilities', icon: 'Lock', route: '/apps/media-vault', tags: ['media', 'storage', 'vault', 'upload', 'quota', 'supabase', 'getter'], status: 'beta', version: '1.2.0', changelog: [{ version: '1.2.0', date: '2026-09-10', changes: ['Added cinematic Showcase view alongside Grid and List', 'Aligned card/drawer language with the Hugging Face × Story Studio gallery', 'Renamed Scrapper Pro references to Getter Pro'] }, { version: '1.1.0', date: '2026-09-09', changes: ['Getter Pro saves use Media Vault directly', 'External reference rows with source deduplication', 'Story Studio scenes remain linked from their authoritative story ledger', 'Source-aware deletion and General-only manual upload UX'] }, { version: '1.0.0', date: '2026-09-09', changes: ['Per-user media vault table with 200 MB default quota', 'Direct-to-Supabase signed uploads via user-media.js API', 'Server-side quota enforcement RPC', 'Image/video preview with signed URLs'] }] }),
  app({ id: 'marketing-studio', name: 'Marketing Studio', description: 'Generate deterministic demo packages and review-first publication records from canonical AppForge app metadata.', category: 'utilities', icon: 'Video', route: '/marketing', tags: ['youtube', 'marketing', 'demo', 'publisher', 'shorts', 'metadata'], status: 'beta', version: '1.0.0', changelog: [{ version: '1.0.0', date: '2026-09-09', changes: ['Registry-driven demo scripts and shot lists', '16:9 and Short publication drafts', 'Channel-neutral publication ledger', 'YouTube upload remains disabled until narrow OAuth scope approval'] }] }),

  app({ id: 'uuid-generator', name: 'UUID Generator', description: 'Generate secure UUID v4 identifiers in bulk.', category: 'crypto', icon: 'Hash', route: '/apps/uuid-generator', tags: ['uuid', 'id', 'generate'], status: 'beta', version: '0.2.0' }),
  app({ id: 'password-generator', name: 'Password Generator', description: 'Generate cryptographically random passwords with configurable length.', category: 'crypto', icon: 'Lock', route: '/apps/password-generator', tags: ['password', 'security', 'generate'], status: 'beta', version: '0.2.0' }),
  app({ id: 'token-generator', name: 'Token Generator', description: 'Generate secure hexadecimal or Base64URL secrets locally.', category: 'crypto', icon: 'Lock', route: '/apps/token-generator', tags: ['token', 'api', 'secret'], status: 'beta', version: '0.2.0' }),
  app({ id: 'base64-tool', name: 'Base64 Tool', description: 'Encode and decode UTF-8 text with Base64 and URL-safe Base64.', category: 'encoding', icon: 'FileCode', route: '/apps/base64-tool', tags: ['base64', 'encode', 'decode'], status: 'beta', version: '0.2.0' }),
  app({ id: 'hash-tool', name: 'Hash Tool', description: 'Calculate SHA-1, SHA-256, SHA-384, and SHA-512 digests locally with Web Crypto.', category: 'crypto', icon: 'Hash', route: '/apps/hash-tool', tags: ['hash', 'sha', 'checksum'], status: 'beta', version: '0.2.0' }),
  app({ id: 'timestamp-converter', name: 'Timestamp Converter', description: 'Convert Unix seconds, Unix milliseconds, ISO dates, and human-readable dates locally.', category: 'dates', icon: 'Calendar', route: '/apps/timestamp-converter', tags: ['timestamp', 'unix', 'date', 'timezone'], status: 'beta', version: '0.2.0' }),
  app({ id: 'regex-tester', name: 'Regex Tester', description: 'Test JavaScript regular expressions, inspect groups, and preview replacements locally.', category: 'regex', icon: 'Regex', route: '/apps/regex-tester', tags: ['regex', 'test', 'match', 'replace'], status: 'beta', version: '0.2.0' }),
  app({ id: 'markdown-previewer', name: 'Markdown Previewer', description: 'Write Markdown with a live rendered preview and export options.', category: 'text', icon: 'FileText', route: '/apps/markdown-previewer', tags: ['markdown', 'preview', 'html'], status: 'idea', version: '0.1.0' }),
  app({ id: 'pdf-tool', name: 'PDF Tool', description: 'Merge, split, rotate, inspect, and extract content from PDFs.', category: 'converters', icon: 'FileText', route: '/apps/pdf-tool', tags: ['pdf', 'merge', 'split', 'rotate'], status: 'idea', version: '0.1.0' }),
  app({ id: 'excel-tool', name: 'Excel Tool', description: 'Convert and clean spreadsheet data and generate summaries.', category: 'json-data', icon: 'Table2', route: '/apps/excel-tool', tags: ['excel', 'csv', 'json', 'sql'], status: 'idea', version: '0.1.0' }),
  app({ id: 'svg-tool', name: 'SVG Tool', description: 'Inspect, optimize, and convert SVG assets.', category: 'svg-icons', icon: 'Palette', route: '/apps/svg-tool', tags: ['svg', 'optimize', 'convert'], status: 'idea', version: '0.1.0' }),
  app({ id: 'audio-converter', name: 'Audio Converter', description: 'Convert audio formats with browser or server-backed processing where supported.', category: 'converters', icon: 'Wrench', route: '/apps/audio-converter', tags: ['audio', 'convert'], status: 'idea', version: '0.1.0' }),
  app({ id: 'any-converter', name: 'Any to Any Converter', description: 'Convert JSON, CSV, YAML, XML, Markdown, HTML, Base64, URL-encoded text, and plain text through a shared converter registry.', category: 'converters', icon: 'ArrowLeftRight', route: '/apps/any-converter', tags: ['converter', 'json', 'csv', 'yaml', 'xml'], status: 'beta', version: '0.2.0' }),
  app({ id: 'data-shortcut', name: 'Data Converter', description: 'Shortcut to the Any to Any Converter for structured-data workflows.', category: 'data', icon: 'ArrowLeftRight', route: '/apps/any-converter', tags: ['data', 'converter', 'json', 'csv'], status: 'beta', version: '0.2.0' }),
  app({ id: 'url-encoder', name: 'URL Encoder / Decoder', description: 'Encode and decode URL components locally.', category: 'encoding', icon: 'Code', route: '/apps/url-encoder', tags: ['url', 'encode', 'decode'], status: 'beta', version: '0.2.0' }),
  app({ id: 'html-encoder', name: 'HTML Encoder / Decoder', description: 'Escape and decode common HTML entities locally.', category: 'encoding', icon: 'Code', route: '/apps/html-encoder', tags: ['html', 'encode', 'decode', 'entities'], status: 'beta', version: '0.2.0' }),
  app({ id: 'jwt-decoder', name: 'JWT Decoder', description: 'Inspect JWT header and payload locally without implying signature verification.', category: 'encoding', icon: 'Lock', route: '/apps/jwt-decoder', tags: ['jwt', 'token', 'decode'], status: 'beta', version: '0.2.0' }),
  app({ id: 'hex-converter', name: 'Hex / Binary Converter', description: 'Convert UTF-8 text to hexadecimal or binary and back.', category: 'encoding', icon: 'Binary', route: '/apps/hex-converter', tags: ['hex', 'binary', 'convert', 'bytes'], status: 'beta', version: '0.2.0' }),
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

export function addApp(app: AppDefinition): void {
  if (APP_MAP.has(app.id)) throw new Error(`App already exists: ${app.id}`)
  APPS.push(app)
  APP_MAP.set(app.id, app)
}

export { APPS, APP_MAP }
export const APPFORGE_VERSION = BUILD_INFO.version
export const APPFORGE_CHANGELOG = [
  { version: '1.25.0', date: '2026-09-10', changes: ['Desktop Buddy becomes the canonical 45th registry app', 'Pariflow Smpl retired from the app registry', 'Dashboard search promoted to an immediate results view', 'Getter Pro identity and individual media downloads aligned'] },
  { version: '1.24.0', date: '2026-09-10', changes: ['Scrapper Pro renamed to Getter Pro with compatibility routes retained', 'Getter Pro media cards simplified around clean image surfaces and explicit action drawers', 'Story Studio / Dragon Arena icon standardized to a joypad', 'Media Vault and Hugging Face showcase views aligned'] },
  { version: '1.23.0', date: '2026-09-10', changes: ['Task List local-first beta candidate with optional Supabase sync', 'Sidebar weather gadget', 'Public Story Studio route becomes AI integrations overview', 'GitHub OAuth frontend activation and docs alignment', 'Planned-app fallback for unimplemented registry routes'] },
  { version: '1.22.0', date: '2026-09-09', changes: ['Canonical Story Studio identity in the registry', 'Favicon Studio, SVG Icons, and Landing Builder public apps', 'Marketing Studio demo/publication workflow', 'Route-level lazy loading for the new public builders'] },
  { version: '1.21.0', date: '2026-09-09', changes: ['Media Vault becomes the shared Getter Pro account ledger', 'Getter Pro direct Media Vault archiving with source deduplication', 'Story Studio registry metadata synced to current Hugging Face architecture'] },
  { version: '1.20.0', date: '2026-09-09', changes: ['Story Studio multiple opening scenarios with per-session restore', 'Story Studio session titles reflect the active scenario'] },
  { version: '1.19.0', date: '2026-09-09', changes: ['Story Studio personal OpenRouter key + HF token support', 'Story Studio asset gallery, points, leaderboard, session switcher', 'Scene generation fallback to HF Inference API with env token rotation', 'DNS TXT checker mini-app'] },
  { version: '1.18.0', date: '2026-09-08', changes: ['Centralized app registry', 'Shared build identity', 'Google auth and Supabase preferences', 'Server-backed media/weather/market tools'] },
]

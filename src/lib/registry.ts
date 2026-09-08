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
  {
    id: 'converters',
    name: 'Converters',
    description: 'Convert data and files between formats.',
    icon: 'ArrowLeftRight',
    apps: []
  },
  {
    id: 'text',
    name: 'Text',
    description: 'Case conversion, counts, sorting, cleanup, diff, Markdown, strings.',
    icon: 'Type',
    apps: []
  },
  {
    id: 'image',
    name: 'Image',
    description: 'Resize, crop, compress, convert, metadata.',
    icon: 'Image',
    apps: []
  },
  {
    id: 'video',
    name: 'Video',
    description: 'Video info, conversion, thumbnails, metadata.',
    icon: 'Video',
    apps: []
  },
  {
    id: 'code',
    name: 'Code',
    description: 'Formatters, validators, minifiers, timestamps, URL tools, JWT.',
    icon: 'Code',
    apps: []
  },
  {
    id: 'regex',
    name: 'Regex',
    description: 'Regex tester, matcher, extractor, replace.',
    icon: 'Regex',
    apps: []
  },
  {
    id: 'json-data',
    name: 'JSON',
    description: 'JSON viewer, formatter, validator, diff.',
    icon: 'Braces',
    apps: []
  },
  {
    id: 'data',
    name: 'Data',
    description: 'Any to Any converter for JSON, CSV, YAML, XML, Markdown, HTML, Base64 and more.',
    icon: 'Table2',
    apps: []
  },
  {
    id: 'svg-icons',
    name: 'SVG & Icons',
    description: 'SVG editor, viewer, optimizer, color tools, icon previewer.',
    icon: 'Palette',
    apps: []
  },
  {
    id: 'crypto',
    name: 'Crypto',
    description: 'UUID, passwords, tokens, hashes, entropy, security generators.',
    icon: 'Lock',
    apps: []
  },
  {
    id: 'encoding',
    name: 'Encoding',
    description: 'Base64, URL, HTML, JWT, hex, binary encoders and decoders.',
    icon: 'FileCode',
    apps: []
  },
  {
    id: 'dates',
    name: 'Dates',
    description: 'Timestamp conversion, date formatting, timezone tools, date calculations.',
    icon: 'Calendar',
    apps: []
  },
  {
    id: 'utilities',
    name: 'Utilities',
    description: 'QR codes, color picker, weather, timestamps, general tools.',
    icon: 'Wrench',
    apps: []
  }
]

const APPS: AppDefinition[] = [
  {
    id: 'scrapper-pro',
    name: 'Scrapper Pro',
    description: 'Search 11+ public sources for names, keywords, or handles. Save and organize results.',
    category: 'utilities',
    icon: 'Search',
    route: '/apps/scrapper-pro',
    tags: ['search', 'media', 'images', 'videos'],
    status: 'building',
    version: '1.0.0',
    changelog: [
      { version: '1.0.0', date: '2026-09-01', changes: ['Initial release with multi-engine search', 'Jina proxy integration', 'Save/load results'] }
    ]
  },
  {
    id: 'image-labeler',
    name: 'Image Labeler',
    description: 'Label images from a local folder. Connected to ComfyUI generation flow.',
    category: 'image',
    icon: 'Image',
    route: '/apps/image-labeler',
    tags: ['labeling', 'comfyui', 'ai', 'local'],
    status: 'building',
    version: '1.0.0',
    changelog: [
      { version: '1.0.0', date: '2026-09-01', changes: ['Folder picker support', 'Label/tag management', 'Export JSON'] }
    ]
  },
  {
    id: 'image-resizer',
    name: 'Image Resizer',
    description: 'Batch resize, crop, compress, and convert images between PNG, JPEG, WebP, and AVIF.',
    category: 'image',
    icon: 'Image',
    route: '/apps/image-resizer',
    tags: ['image', 'resize', 'compress', 'convert', 'crop'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'Format conversion targets defined'] }
    ]
  },
  {
    id: 'image-converter',
    name: 'Image Converter',
    description: 'Convert images between formats: PNG, JPEG, WebP, AVIF, BMP, TIFF, ICO.',
    category: 'image',
    icon: 'Image',
    route: '/apps/image-converter',
    tags: ['image', 'convert', 'format', 'png', 'jpg', 'webp'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'Client-side canvas-based conversion'] }
    ]
  },
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    description: 'Compress images with adjustable quality. Reduce file size while preserving visual quality.',
    category: 'image',
    icon: 'Image',
    route: '/apps/image-compressor',
    tags: ['image', 'compress', 'optimize', 'quality', 'size'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'Quality slider, before/after comparison'] }
    ]
  },
  {
    id: 'image-metadata',
    name: 'Image Metadata',
    description: 'View and edit EXIF metadata, dimensions, color profile, and file info for images.',
    category: 'image',
    icon: 'Info',
    route: '/apps/image-metadata',
    tags: ['image', 'metadata', 'exif', 'info', 'dimensions'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'EXIF extraction and display'] }
    ]
  },
  {
    id: 'creator-svg',
    name: 'Creator SVG',
    description: 'Configure and download SVG resume headers with tech-stack visualizer and theme support.',
    category: 'svg-icons',
    icon: 'Palette',
    route: '/apps/creator-svg',
    tags: ['svg', 'resume', 'export', 'header'],
    status: 'building',
    version: '1.0.0',
    changelog: [
      { version: '1.0.0', date: '2026-09-01', changes: ['Dark/light themes', 'Tech stack pills', 'PNG export'] }
    ]
  },
  {
    id: 'crypto-track',
    name: 'Crypto Track',
    description: 'Live cryptocurrency prices and market data via CoinGecko, CoinMarketCap, or CoinPaprika API.',
    category: 'utilities',
    icon: 'TrendingUp',
    route: '/apps/crypto-track',
    tags: ['crypto', 'prices', 'market', 'api'],
    status: 'building',
    version: '1.0.0',
    changelog: [
      { version: '1.0.0', date: '2026-09-01', changes: ['CoinGecko/CoinPaprika support', 'Demo fallback', 'Grid/list view'] }
    ]
  },
  {
    id: 'weather-now',
    name: 'Weather Now',
    description: 'Current weather by city or ZIP code via WeatherAPI.',
    category: 'utilities',
    icon: 'Cloud',
    route: '/apps/weather-now',
    tags: ['weather', 'forecast', 'city', 'api'],
    status: 'building',
    version: '1.0.0',
    changelog: [
      { version: '1.0.0', date: '2026-09-01', changes: ['Live API + dummy mode', 'Bulk EU cities', 'Sort/filter'] }
    ]
  },
  {
    id: 'pariflow-smpl',
    name: 'Pariflow Smpl',
    description: 'Pariflow docs explorer with MCP CLI connection guide and API integration.',
    category: 'utilities',
    icon: 'FileSearch',
    route: '/apps/pariflow-smpl',
    tags: ['docs', 'mcp', 'cli', 'pariflow', 'connection'],
    status: 'building',
    version: '1.0.0',
    changelog: [
      { version: '1.0.0', date: '2026-09-01', changes: ['MCP CLI setup guide', 'API key integration', 'Doc search'] }
    ]
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format, minify, validate JSON with syntax highlighting and copy-ready output.',
    category: 'json-data',
    icon: 'Braces',
    route: '/apps/json-formatter',
    tags: ['json', 'format', 'validate', 'minify'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'Tree view, minify, validate'] }
    ]
  },
  {
    id: 'csv-converter',
    name: 'CSV Converter',
    description: 'Convert CSV to JSON, Markdown table, or SQL INSERTs in one click.',
    category: 'converters',
    icon: 'Table',
    route: '/apps/csv-converter',
    tags: ['csv', 'json', 'sql', 'markdown'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'CSV parsing and output formats'] }
    ]
  },
  {
    id: 'qr-generator',
    name: 'QR Generator',
    description: 'Generate QR codes for URLs, text, or Wi-Fi with PNG/SVG download.',
    category: 'utilities',
    icon: 'QrCode',
    route: '/apps/qr-generator',
    tags: ['qr', 'barcode', 'generate', 'download'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'QR code generation and download'] }
    ]
  },
  {
    id: 'color-picker',
    name: 'Color Picker',
    description: 'Pick colors from an image, generate palettes, and copy HEX/RGB/HSL values.',
    category: 'image',
    icon: 'Palette',
    route: '/apps/color-picker',
    tags: ['color', 'picker', 'palette', 'hex', 'rgb'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'Image color extraction, palette generation'] }
    ]
  },
  {
    id: 'resume-forge',
    name: 'Resume Forge',
    description: 'Live SVG resume builder with tech-stack visualizer, PDF export, and version tracking.',
    category: 'svg-icons',
    icon: 'FileText',
    route: '/apps/resume-forge',
    tags: ['resume', 'svg', 'pdf', 'builder'],
    status: 'building',
    version: '1.0.0',
    changelog: [
      { version: '1.0.0', date: '2026-09-01', changes: ['SVG header builder', 'Tech stack visualization', 'PDF export'] }
    ]
  },
  {
    id: 'pitch-deck',
    name: 'Pitch Deck',
    description: 'Editable investor pitch deck templates with live preview, export to PDF/PPTX.',
    category: 'utilities',
    icon: 'Presentation',
    route: '/apps/pitch-deck',
    tags: ['pitch', 'deck', 'presentation', 'export'],
    status: 'building',
    version: '1.0.0',
    changelog: [
      { version: '1.0.0', date: '2026-09-01', changes: ['Template editor', 'Live preview', 'PDF export'] }
    ]
  },
  {
    id: 'invoice-studio',
    name: 'Invoice Studio',
    description: 'Freelancer invoice generator with crypto/fiat conversion, time tracking, and client CRM.',
    category: 'utilities',
    icon: 'Receipt',
    route: '/apps/invoice-studio',
    tags: ['invoice', 'freelance', 'crm', 'crypto'],
    status: 'building',
    version: '1.0.0',
    changelog: [
      { version: '1.0.0', date: '2026-09-01', changes: ['Invoice generation', 'Time tracking', 'Client management'] }
    ]
  },
  {
    id: 'source-grade',
    name: 'Source Grade',
    description: 'Browser extension + dashboard for journalists to score source reliability and independence.',
    category: 'utilities',
    icon: 'Star',
    route: '/apps/source-grade',
    tags: ['source', 'journalism', 'reliability', 'extension'],
    status: 'building',
    version: '1.0.0',
    changelog: [
      { version: '1.0.0', date: '2026-09-01', changes: ['Source scoring dashboard', 'Reliability metrics', 'Extension ready'] }
    ]
  },
  {
    id: 'link-checker',
    name: 'Link Checker',
    description: 'Bulk-check URLs for 200/404 status, redirect chains, and generate a CSV report.',
    category: 'code',
    icon: 'Link',
    route: '/apps/link-checker',
    tags: ['links', 'checker', 'bulk', 'csv'],
    status: 'building',
    version: '1.0.0',
    changelog: [
      { version: '1.0.0', date: '2026-09-01', changes: ['Bulk URL checking', 'Status reporting', 'CSV export'] }
    ]
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    description: 'Bulk-generate UUIDs v4/v5, sortable IDs, and NanoIDs with one-click copy.',
    category: 'crypto',
    icon: 'Hash',
    route: '/apps/uuid-generator',
    tags: ['uuid', 'nano', 'id', 'generate', 'token'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'UUID v4/v5, NanoID, sortable IDs'] }
    ]
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    description: 'Generate strong passwords with custom rules and entropy estimate.',
    category: 'crypto',
    icon: 'Lock',
    route: '/apps/password-generator',
    tags: ['password', 'security', 'generate', 'entropy'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'Custom rules, entropy meter'] }
    ]
  },
  {
    id: 'token-generator',
    name: 'Token Generator',
    description: 'Generate API keys, JWT tokens, HMAC secrets, and bearer tokens with configurable algorithms.',
    category: 'crypto',
    icon: 'Key',
    route: '/apps/token-generator',
    tags: ['token', 'api', 'jwt', 'hmac', 'bearer', 'secret'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'JWT, HMAC, bearer token generation'] }
    ]
  },
  {
    id: 'base64-tool',
    name: 'Base64 Tool',
    description: 'Encode/decode Base64, Base32, and URL-safe variants with file support.',
    category: 'encoding',
    icon: 'FileCode',
    route: '/apps/base64-tool',
    tags: ['base64', 'encode', 'decode', 'file'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'Base64/Base32, file support'] }
    ]
  },
  {
    id: 'hash-tool',
    name: 'Hash Tool',
    description: 'Instant MD5, SHA-1, SHA-256, SHA-512 hashes for text or files.',
    category: 'crypto',
    icon: 'Fingerprint',
    route: '/apps/hash-tool',
    tags: ['hash', 'md5', 'sha', 'checksum'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'MD5, SHA-1, SHA-256, SHA-512'] }
    ]
  },
  {
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    description: 'Convert Unix timestamps to human-readable dates and back across timezones.',
    category: 'dates',
    icon: 'Clock',
    route: '/apps/timestamp-converter',
    tags: ['timestamp', 'unix', 'date', 'timezone'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'Unix ↔ human-readable, timezone support'] }
    ]
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test regular expressions with real-time match highlighting and common snippets.',
    category: 'regex',
    icon: 'Regex',
    route: '/apps/regex-tester',
    tags: ['regex', 'test', 'match', 'snippets'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'Real-time matching, snippets'] }
    ]
  },
  {
    id: 'markdown-previewer',
    name: 'Markdown Previewer',
    description: 'Write Markdown on the left, see live rendered preview on the right, export HTML/PDF.',
    category: 'text',
    icon: 'FileText',
    route: '/apps/markdown-previewer',
    tags: ['markdown', 'preview', 'html', 'export'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'Live preview, export'] }
    ]
  },
  {
    id: 'pdf-tool',
    name: 'PDF Tool',
    description: 'Merge, split, rotate, and compress PDFs. Extract text and metadata.',
    category: 'converters',
    icon: 'File',
    route: '/apps/pdf-tool',
    tags: ['pdf', 'merge', 'split', 'compress'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'Merge, split, rotate, compress'] }
    ]
  },
  {
    id: 'excel-tool',
    name: 'Excel Tool',
    description: 'Convert Excel/CSV to JSON/SQL, clean duplicates, and generate pivot summaries.',
    category: 'json-data',
    icon: 'Sheet',
    route: '/apps/excel-tool',
    tags: ['excel', 'csv', 'json', 'sql', 'pivot'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'CSV/Excel conversion, pivot tables'] }
    ]
  },
  {
    id: 'svg-tool',
    name: 'SVG Tool',
    description: 'Optimize SVG files, inline CSS, convert to PNG/PDF, and view stats.',
    category: 'svg-icons',
    icon: 'Palette',
    route: '/apps/svg-tool',
    tags: ['svg', 'optimize', 'convert', 'stats'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'Optimize, convert, stats'] }
    ]
  },
  {
    id: 'audio-converter',
    name: 'Audio Converter',
    description: 'Convert audio files between MP3, WAV, FLAC, and AAC with bitrate control.',
    category: 'converters',
    icon: 'Music',
    route: '/apps/audio-converter',
    tags: ['audio', 'mp3', 'wav', 'convert'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'Format conversion, bitrate control'] }
    ]
  },
  {
    id: 'any-converter',
    name: 'Any to Any Converter',
    description: 'Extensible converter supporting JSON, CSV, YAML, XML, Markdown, HTML, Base64, and more.',
    category: 'converters',
    icon: 'ArrowLeftRight',
    route: '/apps/any-converter',
    tags: ['converter', 'any', 'json', 'csv', 'yaml', 'xml'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'Registry-based conversion'] }
    ]
  },
  {
    id: 'data-shortcut',
    name: 'Data Converter',
    description: 'Open the Any to Any Converter for JSON, CSV, YAML, XML, Markdown, HTML, Base64 and more.',
    category: 'data',
    icon: 'ArrowLeftRight',
    route: '/apps/any-converter',
    tags: ['data', 'converter', 'any', 'json', 'csv', 'yaml', 'xml'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Shortcut to Any to Any Converter'] }
    ]
  },
  {
    id: 'url-encoder',
    name: 'URL Encoder / Decoder',
    description: 'Encode and decode URLs, query parameters, and form data.',
    category: 'encoding',
    icon: 'Globe',
    route: '/apps/url-encoder',
    tags: ['url', 'encode', 'decode', 'query', 'form'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'URL encode/decode, query params'] }
    ]
  },
  {
    id: 'html-encoder',
    name: 'HTML Encoder / Decoder',
    description: 'Encode special characters to HTML entities and decode them back.',
    category: 'encoding',
    icon: 'Code',
    route: '/apps/html-encoder',
    tags: ['html', 'encode', 'decode', 'entities', 'xss'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'HTML entity encode/decode'] }
    ]
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder / Encoder',
    description: 'Decode JWT tokens, inspect payload, and generate signed tokens.',
    category: 'encoding',
    icon: 'Key',
    route: '/apps/jwt-decoder',
    tags: ['jwt', 'token', 'decode', 'encode', 'sign'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'JWT decode, inspect, sign'] }
    ]
  },
  {
    id: 'hex-converter',
    name: 'Hex / Binary Converter',
    description: 'Convert text to hex, binary, and back. Inspect byte representation.',
    category: 'encoding',
    icon: 'Binary',
    route: '/apps/hex-converter',
    tags: ['hex', 'binary', 'convert', 'bytes', 'ascii'],
    status: 'idea',
    version: '0.1.0',
    changelog: [
      { version: '0.1.0', date: '2026-09-10', changes: ['Initial concept', 'Text ↔ hex ↔ binary'] }
    ]
  }
]

const APP_MAP = new Map(APPS.map(a => [a.id, a]))

export function getApp(id: string): AppDefinition | undefined {
  return APP_MAP.get(id)
}

export function getAppsByCategory(categoryId: string): AppDefinition[] {
  return APPS.filter(a => a.category === categoryId)
}

export function searchApps(query: string): AppDefinition[] {
  const q = query.toLowerCase().trim()
  if (!q) return APPS
  return APPS.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q) ||
    a.category.toLowerCase().includes(q) ||
    a.tags.some(t => t.toLowerCase().includes(q))
  )
}

export function getAllApps(): AppDefinition[] {
  return APPS
}

export function getAllCategories(): CategoryDefinition[] {
  return CATEGORIES
}

export { APPS, APP_MAP }

export const APPFORGE_VERSION = '1.18.0'
export const APPFORGE_CHANGELOG = [
  { version: '1.18.0', date: '2026-09-08', changes: ['Centralized app registry', 'Category-based navigation', 'Any to Any Converter', 'AppForge rebrand'] }
]

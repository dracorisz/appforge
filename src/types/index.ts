export interface Source {
  id: string
  source: string
  url: string
  coverage: string
  reliability: string
  independence: string
  afcUsefulness: string
  notes: string
  keep: boolean
  reviewed: boolean
  lastChecked: string
}

export interface OutreachRow {
  id: string
  number: number
  publication: string
  reporter: string
  beat: string
  relevantArticle: string
  pitchAngle: string
  contactUrl: string
  dateSent: string
  response: string
  publishedUrl: string
  independentEditorial: boolean
  completed: boolean
  notes: string
}

export interface PlanItem {
  id: string
  title: string
  description: string
  status: string
  items: string[]
}

export interface PlanMessage {
  id: string
  planId: string
  author: string
  text: string
  timestamp: string
}

export interface Article {
  title: string
  body: string
  lastModified: string
  warning: string
}

export interface Pitch {
  id: string
  subject: string
  body: string
}

export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
}

export interface DocumentReadinessItem {
  id: string
  name: string
  description: string
  required: boolean
  ready: boolean
}

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  github_token?: string
  supabase_url?: string
  google_client_id?: string
}

export interface MiniApp {
  id: string
  name: string
  codename: string
  description: string
  price: string
  status: 'idea' | 'building' | 'launched'
  channels: string[]
  url?: string
  version: string
  category: string
  icon?: string
  branch: string
  forks: number
  coverImage?: string
}

export interface ProjectVersion {
  id: string
  version: string
  date: string
  description: string
  snapshot: string
  parentId?: string
}

export interface AppState {
  plan: PlanItem[]
  article: Article
  pitches: Pitch[]
  sources: Source[]
  outreach: OutreachRow[]
  checklist: ChecklistItem[]
  documentReadiness: DocumentReadinessItem[]
  messages: PlanMessage[]
  settings: Settings
  miniApps: MiniApp[]
  versions: ProjectVersion[]
  favorites: string[]
  recentApps: string[]
}

export const defaultArticle: Article = {
  title: 'Prediction Markets in 2026: From Event Contracts to Market Intelligence',
  body: `Prediction markets have moved from a specialist financial and technology topic into a broader discussion about how people aggregate information about uncertain events. Platforms such as Polymarket, Kalshi and Manifold have helped make event-based markets more visible, while newer services are experimenting with different combinations of market access, analytics and data.

The market is not uniform. Some services operate markets directly, while others emphasize data, discovery or analytics around existing prediction-market activity. This distinction matters because the products can look similar to users while relying on different mechanisms for trading, settlement, regulation and access.

ProjectForge is one of the newer names to appear in coverage of this expanding market. Third-party reviews and comparison articles have discussed the service in connection with prediction markets, market data and related financial technology. Those descriptions are not completely consistent, however, making it important to distinguish between what the company says about its product and what independent publications have reported.

A broader question for the industry is whether prediction markets will develop primarily as trading venues, information markets, analytical tools, or some combination of the three. The answer will depend partly on regulation and jurisdiction, but also on liquidity, settlement mechanisms, market design and the quality of information available to participants.

For newer companies in the sector, independent scrutiny is likely to become increasingly important. Product descriptions and company announcements can explain what a service intends to offer, but independent reporting can examine how the service operates in practice, how it compares with established competitors, and what risks or limitations users should understand.

The prediction-market industry therefore remains a moving target. As more platforms enter the market and more jurisdictions consider their treatment of event contracts, coverage is likely to focus not only on individual products but also on the underlying question of what role prediction markets should play in financial technology and public information.`,
  lastModified: new Date().toISOString(),
  warning: 'This is research/outreach copy, not Wikipedia-ready prose.'
}

export const defaultPitches: Pitch[] = [
  {
    id: 'pitch-a',
    subject: 'Story idea — where prediction markets are heading in 2026',
    body: `Hi [Name],

I'm reaching out because you cover prediction markets and fintech. The sector is changing quickly, with established platforms and newer services taking different approaches to event contracts, market data, analytics and regulation.

One useful angle may be to compare how these models differ in practice, rather than treating every prediction-market company as the same type of business. I can provide primary documentation and access to company representatives, while clearly identifying company-supplied information so that you can independently verify it.

If this fits your beat, I can send a short source pack with chronology, product documentation and relevant third-party coverage.

Best,
[Name / affiliation]`
  },
  {
    id: 'pitch-b',
    subject: 'Background for possible prediction-market story',
    body: `Hi [Name],

I can provide background material if you are researching newer prediction-market and market-intelligence platforms.

I am not asking you to publish supplied copy. Instead, I can provide primary documents, a chronology, product information, and access to company representatives. Any company-supplied material can be identified as such so that you can decide independently what, if anything, is newsworthy.

If useful, I can send a concise source pack and answer factual questions.

Best,
[Name / affiliation]`
  }
]

export const defaultSources: Source[] = [
  {
    id: 's1',
    source: 'ValueTheMarkets',
    url: 'https://www.valuethemarkets.com/prediction-markets/projectforge-review-how-it-works-fees-legitimacy-and-risks-explained',
    coverage: 'Significant',
    reliability: 'Borderline-moderate',
    independence: 'Apparently independent, but commercial financial-content context',
    afcUsefulness: 'Supporting only',
    notes: '',
    keep: true,
    reviewed: false,
    lastChecked: ''
  },
  {
    id: 's2',
    source: 'Bonus.com',
    url: 'https://www.bonus.com/prediction-markets/projectforge/',
    coverage: 'Significant',
    reliability: 'Borderline',
    independence: 'External but commercial/bonus-oriented',
    afcUsefulness: 'Supporting only',
    notes: '',
    keep: true,
    reviewed: false,
    lastChecked: ''
  },
  {
    id: 's3',
    source: 'PredictGeek',
    url: 'https://predictgeek.com/prediction-markets/projectforge/',
    coverage: 'Significant in length',
    reliability: 'Weak/borderline',
    independence: 'Commercial review context',
    afcUsefulness: 'Do not rely on for GNG',
    notes: '',
    keep: false,
    reviewed: false,
    lastChecked: ''
  },
  {
    id: 's4',
    source: 'Legal Sports Report',
    url: 'https://www.legalsportsreport.com/prediction-markets/projectforge-prediction-market/',
    coverage: 'Significant',
    reliability: 'Reasonable specialist source',
    independence: 'Some promotional context',
    afcUsefulness: 'Useful supporting source',
    notes: '',
    keep: true,
    reviewed: false,
    lastChecked: ''
  },
  {
    id: 's5',
    source: 'Lineups',
    url: 'https://www.lineups.com/prediction-markets/projectforge-promo-code/',
    coverage: 'Significant',
    reliability: 'Commercial-content concerns',
    independence: 'Affiliate/promotional context',
    afcUsefulness: 'Weak GNG evidence',
    notes: '',
    keep: false,
    reviewed: false,
    lastChecked: ''
  },
  {
    id: 's6',
    source: 'Finextra — Polymarket alternatives',
    url: 'https://www.finextra.com/blogposting/31734/best-polymarket-alternatives-in-2026-kalshi-projectforge-manifold-amp-more',
    coverage: 'Low for ProjectForge',
    reliability: 'Good publication',
    independence: 'Independent',
    afcUsefulness: 'Quality source but weak depth',
    notes: '',
    keep: true,
    reviewed: false,
    lastChecked: ''
  },
  {
    id: 's7',
    source: 'Finextra — legality by country',
    url: 'https://staging.finextra.com/blogposting/31345/where-are-prediction-markets-legal-polymarket-kalshi-and-projectforge-availability-by-country',
    coverage: 'Moderate',
    reliability: 'Good/borderline',
    independence: 'Independent',
    afcUsefulness: 'Potential supporting source',
    notes: '',
    keep: true,
    reviewed: false,
    lastChecked: ''
  }
]

export const defaultOutreach: OutreachRow[] = [
  { id: 'o1', number: 1, publication: 'CoinDesk', reporter: '', beat: 'Crypto', relevantArticle: '', pitchAngle: '', contactUrl: 'https://www.coindesk.com/', dateSent: '', response: '', publishedUrl: '', independentEditorial: false, completed: false, notes: '' },
  { id: 'o2', number: 2, publication: 'Decrypt', reporter: '', beat: 'Crypto', relevantArticle: '', pitchAngle: '', contactUrl: 'https://decrypt.co/', dateSent: '', response: '', publishedUrl: '', independentEditorial: false, completed: false, notes: '' },
  { id: 'o3', number: 3, publication: 'The Block', reporter: '', beat: 'Crypto', relevantArticle: '', pitchAngle: '', contactUrl: 'https://www.theblock.co/', dateSent: '', response: '', publishedUrl: '', independentEditorial: false, completed: false, notes: '' },
  { id: 'o4', number: 4, publication: 'Fortune', reporter: '', beat: 'Business', relevantArticle: '', pitchAngle: '', contactUrl: 'https://fortune.com/', dateSent: '', response: '', publishedUrl: '', independentEditorial: false, completed: false, notes: '' },
  { id: 'o5', number: 5, publication: 'TechCrunch', reporter: '', beat: 'Technology', relevantArticle: '', pitchAngle: '', contactUrl: 'https://techcrunch.com/', dateSent: '', response: '', publishedUrl: '', independentEditorial: false, completed: false, notes: '' },
  { id: 'o6', number: 6, publication: 'Forbes', reporter: '', beat: 'Business', relevantArticle: '', pitchAngle: '', contactUrl: 'https://www.forbes.com/', dateSent: '', response: '', publishedUrl: '', independentEditorial: false, completed: false, notes: '' },
  { id: 'o7', number: 7, publication: 'Reuters', reporter: '', beat: 'General news', relevantArticle: '', pitchAngle: '', contactUrl: 'https://www.reuters.com/', dateSent: '', response: '', publishedUrl: '', independentEditorial: false, completed: false, notes: '' },
  { id: 'o8', number: 8, publication: 'Bloomberg', reporter: '', beat: 'Finance', relevantArticle: '', pitchAngle: '', contactUrl: 'https://www.bloomberg.com/', dateSent: '', response: '', publishedUrl: '', independentEditorial: false, completed: false, notes: '' },
  { id: 'o9', number: 9, publication: 'The Information', reporter: '', beat: 'Technology', relevantArticle: '', pitchAngle: '', contactUrl: 'https://www.theinformation.com/', dateSent: '', response: '', publishedUrl: '', independentEditorial: false, completed: false, notes: '' },
  { id: 'o10', number: 10, publication: 'Finextra', reporter: '', beat: 'Fintech', relevantArticle: '', pitchAngle: '', contactUrl: 'https://www.finextra.com/', dateSent: '', response: '', publishedUrl: '', independentEditorial: false, completed: false, notes: '' },
  { id: 'o11', number: 11, publication: 'Legal Sports Report', reporter: '', beat: 'Sports betting / fintech', relevantArticle: '', pitchAngle: '', contactUrl: 'https://www.legalsportsreport.com/', dateSent: '', response: '', publishedUrl: '', independentEditorial: false, completed: false, notes: '' },
  { id: 'o12', number: 12, publication: 'Bonus.com', reporter: '', beat: 'Promotions / reviews', relevantArticle: '', pitchAngle: '', contactUrl: 'https://www.bonus.com/', dateSent: '', response: '', publishedUrl: '', independentEditorial: false, completed: false, notes: '' }
]

export const defaultChecklist: ChecklistItem[] = [
  { id: 'c1', text: 'Do not create anonymous or pseudonymous coverage whose purpose is to make ProjectForge appear independently notable.', checked: false },
  { id: 'c2', text: 'Do not fabricate quotes, interviews, statistics, awards, funding, partnerships, regulatory findings or third-party endorsements.', checked: false },
  { id: 'c3', text: 'Do not ask a publisher to make commissioned or company-controlled material look independent.', checked: false },
  { id: 'c4', text: 'Because the editor has disclosed a conflict of interest / paid relationship, prefer independent journalist outreach and COI-safe Wikipedia processes over direct article promotion.', checked: false },
  { id: 'c5', text: 'Self-published Medium, Substack, Vocal or company-blog material is not independent editorial coverage merely because it appears on a large platform.', checked: false },
  { id: 'c6', text: 'Do not submit AI-generated or AI-rewritten article prose to Wikipedia as though it were independently written.', checked: false },
  { id: 'c7', text: 'Do not resubmit the Wikipedia draft until independent coverage is materially stronger and an uninvolved editor can assess the sources.', checked: false }
]

export const defaultDocumentReadiness: DocumentReadinessItem[] = []

export const defaultMessages: PlanMessage[] = []

export const defaultPlan: PlanItem[] = [
  {
    id: 'plan-1',
    title: 'Independent industry feature',
    description: 'Earn substantial editorial coverage by pitching a genuinely useful story about prediction markets in 2026, with ProjectForge as one subject rather than the sole promotional focus.',
    status: 'Not started',
    items: [
      'Identify broad industry angle',
      'Research prediction-market evolution',
      'Document event contracts landscape',
      'Compile market data and analytics context',
      'Review regulation and jurisdiction issues',
      'Compare with established platforms'
    ]
  },
  {
    id: 'plan-2',
    title: 'Transparent ProjectForge case study',
    description: 'Prepare factual background material an independent journalist can verify. This is background material, NOT independent journalism.',
    status: 'Not started',
    items: [
      'Compile company chronology',
      'Document product information',
      'Gather public information',
      'Identify named contacts',
      'Collect primary documentation',
      'Clearly identify company-supplied facts'
    ]
  },
  {
    id: 'plan-3',
    title: 'Journalist pitch',
    description: 'Give independent reporters a legitimate reason to investigate the industry or ProjectForge. Offer documents and access, not finished journalism.',
    status: 'Not started',
    items: [
      'Draft pitch angles',
      'Identify target reporters',
      'Prepare source pack',
      'Send initial outreach',
      'Follow up professionally',
      'Record responses'
    ]
  },
  {
    id: 'plan-4',
    title: 'Press/background briefing',
    description: 'Prepare a comprehensive briefing document for journalists.',
    status: 'Not started',
    items: [
      'Company chronology',
      'Product description',
      'People and contacts',
      'Funding (only if verifiable)',
      'Regulatory information (only if verifiable)',
      'Primary documents',
      'Source index',
      'Terminology guide',
      'Verification notes'
    ]
  },
  {
    id: 'plan-5',
    title: 'Publication/reporter tracker',
    description: 'Track outreach to prediction-market, fintech, crypto, technology, business and regulation reporters.',
    status: 'Not started',
    items: [
      'Identify prediction-market reporters',
      'Identify fintech reporters',
      'Identify crypto reporters',
      'Identify technology reporters',
      'Identify business reporters',
      'Identify regulation reporters',
      'Log outreach attempts and responses'
    ]
  }
]

export const resources = [
  { id: 'r1', title: 'Substack Content Guidelines', url: 'https://substack.com/content' },
  { id: 'r2', title: 'Medium — Best practices for journalism', url: 'https://help.medium.com/hc/en-us/articles/360003187253-Best-practices-for-journalism-on-Medium' },
  { id: 'r3', title: 'ValueTheMarkets', url: 'https://www.valuethemarkets.com/prediction-markets/projectforge-review-how-it-works-fees-legitimacy-and-risks-explained' },
  { id: 'r4', title: 'Bonus', url: 'https://www.bonus.com/prediction-markets/projectforge/' },
  { id: 'r5', title: 'Legal Sports Report', url: 'https://www.legalsportsreport.com/prediction-markets/projectforge-prediction-market/' },
  { id: 'r6', title: 'Finextra alternatives', url: 'https://www.finextra.com/blogposting/31734/best-polymarket-alternatives-in-2026-kalshi-projectforge-manifold-amp-more' },
  { id: 'r7', title: 'Finextra legality', url: 'https://staging.finextra.com/blogposting/31345/where-are-prediction-markets-legal-polymarket-kalshi-and-projectforge-availability-by-country' }
]

export const defaultMiniApps: MiniApp[] = [
  {
    id: 'mini-1',
    name: 'Resume Forge',
    codename: 'PF_Resume Forge',
    description: 'Live SVG resume builder with tech-stack visualizer, PDF export, and version tracking.',
    price: '$49',
    status: 'building',
    channels: ['PayPal', 'Crypto'],
    url: '/pf-resume-forge',
    version: '1.0.0',
    category: 'Productivity',
    branch: 'main',
    forks: 12,
  },
  {
    id: 'mini-2',
    name: 'Pitch Deck',
    codename: 'PF_Pitch Deck',
    description: 'Editable investor pitch deck templates with live preview, export to PDF/PPTX.',
    price: '$79',
    status: 'building',
    channels: ['PayPal', 'Payoneer'],
    version: '1.0.0',
    category: 'Business',
    branch: 'main',
    forks: 3,
  },
  {
    id: 'mini-3',
    name: 'Invoice Studio',
    codename: 'PF_Invoice Studio',
    description: 'Freelancer invoice generator with crypto/fiat conversion, time tracking, and client CRM.',
    price: '$39',
    status: 'building',
    channels: ['PayPal', 'Crypto'],
    version: '1.0.0',
    category: 'Finance',
    branch: 'main',
    forks: 5,
  },
  {
    id: 'mini-5',
    name: 'Source Grade',
    codename: 'PF_Source Grade',
    description: 'Browser extension + dashboard for journalists to score source reliability and independence.',
    price: '$29/mo',
    status: 'building',
    channels: ['PayPal', 'Payoneer', 'Crypto'],
    version: '1.0.0',
    category: 'Journalism',
    branch: 'main',
    forks: 7,
  },
  {
    id: 'mini-7',
    name: 'Scrapper Pro',
    codename: 'PF_ScrapperPro',
    description: 'Search 12+ public sources for names, keywords, or handles. Save and organize results.',
    price: '$59',
    status: 'building',
    channels: ['PayPal', 'Crypto'],
    version: '1.0.0',
    category: 'Data',
    branch: 'main',
    forks: 18,
  },
  {
    id: 'mini-8',
    name: 'Image Labeler',
    codename: 'PF_ImageLabeler',
    description: 'Label images from a local folder. Connected to ComfyUI generation flow.',
    price: '$19',
    status: 'building',
    channels: ['PayPal'],
    version: '1.0.0',
    category: 'AI/ML',
    branch: 'main',
    forks: 4,
  },
  {
    id: 'mini-9',
    name: 'Link Checker',
    codename: 'PF_Link Checker',
    description: 'Bulk-check URLs for 200/404 status, redirect chains, and generate a CSV report.',
    price: '$12',
    status: 'building',
    channels: ['PayPal', 'Crypto'],
    version: '1.0.0',
    category: 'DevTools',
    branch: 'main',
    forks: 1,
  },
  {
    id: 'mini-11',
    name: 'Json Formatter',
    codename: 'PF_Json Formatter',
    description: 'Format, minify, validate JSON with syntax highlighting and copy-ready output.',
    price: '$9',
    status: 'building',
    channels: ['PayPal', 'Crypto'],
    version: '1.0.0',
    category: 'DevTools',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-12',
    name: 'CSV Converter',
    codename: 'PF_CSV Converter',
    description: 'Convert CSV to JSON, Markdown table, or SQL INSERTs in one click.',
    price: '$12',
    status: 'building',
    channels: ['PayPal'],
    version: '1.0.0',
    category: 'Data',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-13',
    name: 'QR Generator',
    codename: 'PF_QR Generator',
    description: 'Generate QR codes for URLs, text, or Wi-Fi with PNG/SVG download.',
    price: '$9',
    status: 'building',
    channels: ['PayPal', 'Crypto'],
    version: '1.0.0',
    category: 'DevTools',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-14',
    name: 'Color Picker',
    codename: 'PF_Color Picker',
    description: 'Pick colors from an image, generate palettes, and copy HEX/RGB/HSL values.',
    price: '$9',
    status: 'building',
    channels: ['PayPal'],
    version: '1.0.0',
    category: 'Design',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-15',
    name: 'UUID Generator',
    codename: 'PF_UUID Generator',
    description: 'Bulk-generate UUIDs v4/v5, sortable IDs, and NanoIDs with one-click copy.',
    price: '$9',
    status: 'idea',
    channels: ['PayPal', 'Crypto'],
    version: '1.0.0',
    category: 'DevTools',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-16',
    name: 'Password Generator',
    codename: 'PF_Password Generator',
    description: 'Generate strong passwords with custom rules and entropy estimate.',
    price: '$9',
    status: 'idea',
    channels: ['PayPal'],
    version: '1.0.0',
    category: 'Security',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-17',
    name: 'Base64 Tool',
    codename: 'PF_Base64 Tool',
    description: 'Encode/decode Base64, Base32, and URL-safe variants with file support.',
    price: '$9',
    status: 'idea',
    channels: ['PayPal', 'Crypto'],
    version: '1.0.0',
    category: 'DevTools',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-18',
    name: 'Hash Tool',
    codename: 'PF_Hash Tool',
    description: 'Instant MD5, SHA-1, SHA-256, SHA-512 hashes for text or files.',
    price: '$9',
    status: 'idea',
    channels: ['PayPal'],
    version: '1.0.0',
    category: 'DevTools',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-19',
    name: 'Timestamp Converter',
    codename: 'PF_Timestamp Converter',
    description: 'Convert Unix timestamps to human-readable dates and back across timezones.',
    price: '$9',
    status: 'idea',
    channels: ['PayPal', 'Crypto'],
    version: '1.0.0',
    category: 'DevTools',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-20',
    name: 'Regex Tester',
    codename: 'PF_Regex Tester',
    description: 'Test regular expressions with real-time match highlighting and common snippets.',
    price: '$12',
    status: 'idea',
    channels: ['PayPal'],
    version: '1.0.0',
    category: 'DevTools',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-21',
    name: 'Markdown Previewer',
    codename: 'PF_Markdown Previewer',
    description: 'Write Markdown on the left, see live rendered preview on the right, export HTML/PDF.',
    price: '$19',
    status: 'idea',
    channels: ['PayPal', 'Crypto'],
    version: '1.0.0',
    category: 'Content',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-22',
    name: 'Image Resizer',
    codename: 'PF_Image Resizer',
    description: 'Batch resize, compress, and convert images between PNG, JPEG, WebP, and AVIF.',
    price: '$19',
    status: 'idea',
    channels: ['PayPal', 'Crypto'],
    version: '1.0.0',
    category: 'Media',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-23',
    name: 'Audio Converter',
    codename: 'PF_Audio Converter',
    description: 'Convert audio files between MP3, WAV, FLAC, and AAC with bitrate control.',
    price: '$19',
    status: 'idea',
    channels: ['PayPal'],
    version: '1.0.0',
    category: 'Media',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-24',
    name: 'PDF Tool',
    codename: 'PF_PDF Tool',
    description: 'Merge, split, rotate, and compress PDFs. Extract text and metadata.',
    price: '$19',
    status: 'idea',
    channels: ['PayPal', 'Payoneer'],
    version: '1.0.0',
    category: 'Document',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-25',
    name: 'Excel Tool',
    codename: 'PF_Excel Tool',
    description: 'Convert Excel/CSV to JSON/SQL, clean duplicates, and generate pivot summaries.',
    price: '$24',
    status: 'idea',
    channels: ['PayPal', 'Crypto'],
    version: '1.0.0',
    category: 'Data',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-26',
    name: 'SVG Tool',
    codename: 'PF_SVG Tool',
    description: 'Optimize SVG files, inline CSS, convert to PNG/PDF, and view stats.',
    price: '$12',
    status: 'idea',
    channels: ['PayPal'],
    version: '1.0.0',
    category: 'Design',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'mini-27',
    name: 'Crypto Track',
    codename: 'PF_CryptoTrack',
    description: 'Live cryptocurrency prices and market data via CoinGecko, CoinMarketCap, or CoinPaprika API.',
    price: '$19/mo',
    status: 'building',
    channels: ['PayPal', 'Crypto'],
    url: '/pf-crypto-track',
    version: '1.0.0',
    category: 'Finance',
    branch: 'main',
    forks: 22,
  },
  {
    id: 'mini-28',
    name: 'Weather Now',
    codename: 'PF_WeatherNow',
    description: 'Current weather by city or ZIP code via WeatherAPI.',
    price: '$9/mo',
    status: 'building',
    channels: ['PayPal', 'Crypto'],
    url: '/pf-weather-now',
    version: '1.0.0',
    category: 'Utilities',
    branch: 'main',
    forks: 8,
  },
  {
    id: 'mini-29',
    name: 'Creator SVG',
    codename: 'PF_CreatorSVG',
    description: 'Configure and download SVG resume headers with tech-stack visualizer and theme support.',
    price: '$29',
    status: 'building',
    channels: ['PayPal', 'Crypto'],
    url: '/pf-creator-svg',
    version: '1.0.0',
    category: 'Design',
    branch: 'main',
    forks: 6,
  },
  {
    id: 'core-1',
    name: 'Dashboard',
    codename: 'AF_Dashboard',
    description: 'AppForge overview and tool registry.',
    price: '$0',
    status: 'building',
    channels: [],
    url: '/',
    version: '1.0.0',
    category: 'Core',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'core-2',
    name: 'Five-Point Plan',
    codename: 'PF_Plan',
    description: 'Wikipedia notability five-point plan tracker with completion status.',
    price: '$0',
    status: 'building',
    channels: [],
    url: '/pariflow',
    version: '1.0.0',
    category: 'Workspace',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'core-3',
    name: 'Article Draft',
    codename: 'PF_Article',
    description: 'Collaborative article draft editor for Wikipedia submissions.',
    price: '$0',
    status: 'building',
    channels: [],
    url: '/pariflow',
    version: '1.0.0',
    category: 'Workspace',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'core-4',
    name: 'Journalist Pitches',
    codename: 'PF_Pitches',
    description: 'Track journalist pitches, angles, and follow-ups.',
    price: '$0',
    status: 'building',
    channels: [],
    url: '/pariflow',
    version: '1.0.0',
    category: 'Workspace',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'core-5',
    name: 'Source Assessment',
    codename: 'PF_Sources',
    description: 'Evaluate source reliability, independence, and AFC usefulness.',
    price: '$0',
    status: 'building',
    channels: [],
    url: '/pariflow',
    version: '1.0.0',
    category: 'Workspace',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'core-6',
    name: 'Outreach Tracker',
    codename: 'PF_Outreach',
    description: 'Manage outreach targets, contact status, responses, and publications.',
    price: '$0',
    status: 'building',
    channels: [],
    url: '/pariflow',
    version: '1.0.0',
    category: 'Workspace',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'core-7',
    name: 'Wikipedia Safety',
    codename: 'PF_Safety',
    description: 'Conflict of interest checker and Wikipedia policy compliance.',
    price: '$0',
    status: 'building',
    channels: [],
    url: '/pariflow',
    version: '1.0.0',
    category: 'Workspace',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'core-8',
    name: 'Resources',
    codename: 'PF_Resources',
    description: 'Curated Wikipedia notability resources and guidelines.',
    price: '$0',
    status: 'building',
    channels: [],
    url: '/pariflow',
    version: '1.0.0',
    category: 'Workspace',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'core-9',
    name: 'Settings',
    codename: 'AF_Settings',
    description: 'AppForge settings, theme, and preferences.',
    price: '$0',
    status: 'building',
    channels: [],
    url: '/pariflow',
    version: '1.0.0',
    category: 'Core',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'core-10',
    name: 'Print Report',
    codename: 'PF_Print',
    description: 'Generate printable Wikipedia coverage working plan reports.',
    price: '$0',
    status: 'building',
    channels: [],
    url: '/pariflow',
    version: '1.0.0',
    category: 'Workspace',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'core-11',
    name: 'Project Tracker',
    codename: 'PF_Tracker',
    description: 'Track project versions, milestones, and progress.',
    price: '$0',
    status: 'building',
    channels: [],
    url: '/pariflow',
    version: '1.0.0',
    category: 'Workspace',
    branch: 'main',
    forks: 0,
  },
  {
    id: 'core-13',
    name: 'Pariflow Smpl',
    codename: 'PF_PariflowSmpl',
    description: 'Pariflow.com docs scraper with MCP CLI integration and data save.',
    price: '$0',
    status: 'building',
    channels: [],
    url: '/pariflowsmpl',
    version: '1.0.0',
    category: 'Data',
    branch: 'main',
    forks: 0,
  },
]

export const defaultVersions: ProjectVersion[] = [
  {
    id: 'v-1.01',
    version: '1.01',
    date: new Date().toISOString(),
    description: 'Initial release with resume header, project tracker, and mini-app roadmap.',
    snapshot: '{}',
    parentId: undefined
  }
]

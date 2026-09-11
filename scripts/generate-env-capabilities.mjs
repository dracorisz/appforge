import fs from 'node:fs/promises'

const SOURCE = '.env.example'
const TARGET = 'docs/ENV_CAPABILITIES.md'

const purposes = {
  VITE_APP_NAME: 'Browser-visible product name.',
  VITE_APP_URL: 'Browser-visible canonical AppForge URL.',
  VERCEL_TOKEN: 'Deployment automation credential.',
  VERCEL_ORG_ID: 'Vercel organization identifier for deployment automation.',
  VERCEL_PROJECT_ID: 'Vercel project identifier for deployment automation.',
  VITE_SUPABASE_URL: 'Browser-safe Supabase project URL.',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'Browser-safe Supabase publishable/anon credential.',
  SUPABASE_SERVICE_ROLE_KEY: 'Privileged server-side Supabase service role.',
  HF_TOKEN_1: 'Server-side Hugging Face Inference Providers token.',
  HF_TOKEN_2: 'Optional second server-side Hugging Face provider token.',
  HF_TOKEN_3: 'Optional third server-side Hugging Face provider token.',
  HF_TEXT_MODEL: 'Preferred Hugging Face text model override.',
  HF_IMAGE_MODEL: 'Preferred Hugging Face image model override.',
  OPENROUTER_API_KEY: 'Server-side OpenRouter compatibility key.',
  OPENROUTER_MODEL: 'Preferred OpenRouter model override.',
  GEMINI_API_KEY: 'Server-side Gemini text fallback key.',
  GEMINI_MODEL: 'Preferred Gemini model override.',
  YOUTUBE_API_KEY: 'Server-side YouTube Data API public-read key.',
  GOOGLE_CLOUD_PROJECT: 'Private Cloud worker Google Cloud project.',
  WORKER_BUCKET: 'Private Cloud worker output bucket.',
  WORKER_ENABLED: 'Explicit private worker enable/disable guard.',
  GCP_PROJECT_NUMBER: 'Server-side Google WIF project number for the Vercel bridge.',
  GCP_SERVICE_ACCOUNT_EMAIL: 'Federated bridge service-account identity.',
  GCP_WORKLOAD_IDENTITY_POOL_ID: 'Google Workload Identity Pool identifier.',
  GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID: 'Google Workload Identity Provider identifier.',
  GCP_CLOUD_WORKER_URL: 'IAM-protected Cloud Run worker URL.',
  GCP_WORKER_BUCKET: 'Private output bucket used by the Vercel → Google bridge.',
  VITE_WEATHERAPI_KEY: 'Browser-side WeatherAPI integration key when intentionally configured as public.',
  VITE_COINMARKETCAP_API_KEY: 'Browser-side CoinMarketCap integration key when intentionally configured as public.',
  VITE_COINPAPRIKA_API_KEY: 'Browser-side CoinPaprika integration key when intentionally configured as public.',
  VITE_GOOGLE_CLIENT_ID: 'Browser-safe Google OAuth client ID.',
  GITHUB_TOKEN: 'Server/automation GitHub token; never browser-exposed.',
}

const featureFor = (name) => {
  if (name.startsWith('VITE_APP_')) return 'App shell'
  if (name.startsWith('VERCEL_')) return 'Vercel deployment'
  if (name.includes('SUPABASE')) return 'Supabase'
  if (name.startsWith('HF_')) return 'Hugging Face'
  if (name.startsWith('OPENROUTER_')) return 'OpenRouter'
  if (name.startsWith('GEMINI_')) return 'Gemini'
  if (name === 'YOUTUBE_API_KEY') return 'YouTube Data API'
  if (name.startsWith('GCP_')) return 'Desktop Buddy Vertex bridge'
  if (name === 'GOOGLE_CLOUD_PROJECT' || name.startsWith('WORKER_')) return 'Private Cloud worker'
  if (name.includes('WEATHER')) return 'Weather Now'
  if (name.includes('COIN')) return 'Crypto Track'
  if (name === 'VITE_GOOGLE_CLIENT_ID') return 'Google OAuth'
  if (name === 'GITHUB_TOKEN') return 'GitHub automation'
  return 'Other'
}

const scopeFor = (name) => name.startsWith('VITE_') ? 'Browser-visible' : 'Server / automation only'

const source = await fs.readFile(SOURCE, 'utf8')
const variables = source
  .split(/\r?\n/)
  .map((line) => line.match(/^([A-Z][A-Z0-9_]*)=/)?.[1])
  .filter(Boolean)

const unique = [...new Set(variables)]
const rows = unique.map((name) => `| \`${name}\` | ${featureFor(name)} | ${scopeFor(name)} | ${purposes[name] || 'Document purpose before production use.'} |`)
const generated = `# Environment and provider capability matrix\n\n> Generated from \`.env.example\` by \`scripts/generate-env-capabilities.mjs\`. Do not edit the variable inventory by hand. Run \`npm run docs:env\` after changing the environment contract.\n\nThis matrix describes **configuration capability**, not production readiness. A variable appearing here does not mean it is configured in Vercel, Supabase, GitHub, Google Cloud, or a local environment. Never put a secret in a \`VITE_*\` variable.\n\n| Variable | Capability | Exposure boundary | Purpose |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n\n## Rules\n\n- \`VITE_*\` values are compiled into browser code and must be safe to expose publicly.\n- All other credentials in this matrix are server/operator values unless their provider explicitly documents them as public identifiers.\n- Production readiness must be verified through the relevant status/smoke workflow; this file intentionally does not claim that a provider is active.\n- Google WIF/Cloud Run values are short-lived federation configuration; AppForge does not require a downloadable service-account JSON key.\n- GitHub OAuth provider secrets are configured in the provider/server boundary and are not represented as browser variables here.\n`

if (process.argv.includes('--check')) {
  const current = await fs.readFile(TARGET, 'utf8').catch(() => '')
  if (current !== generated) {
    console.error(`${TARGET} is out of date. Run: npm run docs:env`)
    process.exit(1)
  }
  console.log(`Environment capability matrix is current (${unique.length} variables).`)
} else {
  await fs.writeFile(TARGET, generated)
  console.log(`Wrote ${TARGET} with ${unique.length} variables.`)
}

# Environment and provider capability matrix

> Generated from `.env.example` by `scripts/generate-env-capabilities.mjs`. Do not edit the variable inventory by hand. Run `npm run docs:env` after changing the environment contract.

This matrix describes **configuration capability**, not production readiness. A variable appearing here does not mean it is configured in Vercel, Supabase, GitHub, Google Cloud, or a local environment. Never put a secret in a `VITE_*` variable.

| Variable | Capability | Exposure boundary | Purpose |
| --- | --- | --- | --- |
| `VITE_APP_NAME` | App shell | Browser-visible | Browser-visible product name. |
| `VITE_APP_URL` | App shell | Browser-visible | Browser-visible canonical AppForge URL. |
| `VERCEL_TOKEN` | Vercel deployment | Server / automation only | Deployment automation credential. |
| `VERCEL_ORG_ID` | Vercel deployment | Server / automation only | Vercel organization identifier for deployment automation. |
| `VERCEL_PROJECT_ID` | Vercel deployment | Server / automation only | Vercel project identifier for deployment automation. |
| `VITE_SUPABASE_URL` | Supabase | Browser-visible | Browser-safe Supabase project URL. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase | Browser-visible | Browser-safe Supabase publishable/anon credential. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Server / automation only | Privileged server-side Supabase service role. |
| `HF_TOKEN_1` | Hugging Face | Server / automation only | Server-side Hugging Face Inference Providers token. |
| `HF_TOKEN_2` | Hugging Face | Server / automation only | Optional second server-side Hugging Face provider token. |
| `HF_TOKEN_3` | Hugging Face | Server / automation only | Optional third server-side Hugging Face provider token. |
| `HF_TEXT_MODEL` | Hugging Face | Server / automation only | Preferred Hugging Face text model override. |
| `HF_IMAGE_MODEL` | Hugging Face | Server / automation only | Preferred Hugging Face image model override. |
| `OPENROUTER_API_KEY` | OpenRouter | Server / automation only | Server-side OpenRouter compatibility key. |
| `OPENROUTER_MODEL` | OpenRouter | Server / automation only | Preferred OpenRouter model override. |
| `GEMINI_API_KEY` | Gemini | Server / automation only | Server-side Gemini text fallback key. |
| `GEMINI_MODEL` | Gemini | Server / automation only | Preferred Gemini model override. |
| `YOUTUBE_API_KEY` | YouTube Data API | Server / automation only | Server-side YouTube Data API public-read key. |
| `GOOGLE_CLOUD_PROJECT` | Private Cloud worker | Server / automation only | Private Cloud worker Google Cloud project. |
| `WORKER_BUCKET` | Private Cloud worker | Server / automation only | Private Cloud worker output bucket. |
| `WORKER_ENABLED` | Private Cloud worker | Server / automation only | Explicit private worker enable/disable guard. |
| `GCP_PROJECT_NUMBER` | Desktop Buddy Vertex bridge | Server / automation only | Server-side Google WIF project number for the Vercel bridge. |
| `GCP_SERVICE_ACCOUNT_EMAIL` | Desktop Buddy Vertex bridge | Server / automation only | Federated bridge service-account identity. |
| `GCP_WORKLOAD_IDENTITY_POOL_ID` | Desktop Buddy Vertex bridge | Server / automation only | Google Workload Identity Pool identifier. |
| `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID` | Desktop Buddy Vertex bridge | Server / automation only | Google Workload Identity Provider identifier. |
| `GCP_CLOUD_WORKER_URL` | Desktop Buddy Vertex bridge | Server / automation only | IAM-protected Cloud Run worker URL. |
| `GCP_WORKER_BUCKET` | Desktop Buddy Vertex bridge | Server / automation only | Private output bucket used by the Vercel → Google bridge. |
| `VITE_WEATHERAPI_KEY` | Weather Now | Browser-visible | Browser-side WeatherAPI integration key when intentionally configured as public. |
| `VITE_COINMARKETCAP_API_KEY` | Crypto Track | Browser-visible | Browser-side CoinMarketCap integration key when intentionally configured as public. |
| `VITE_COINPAPRIKA_API_KEY` | Crypto Track | Browser-visible | Browser-side CoinPaprika integration key when intentionally configured as public. |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth | Browser-visible | Browser-safe Google OAuth client ID. |
| `GITHUB_TOKEN` | GitHub automation | Server / automation only | Server/automation GitHub token; never browser-exposed. |

## Rules

- `VITE_*` values are compiled into browser code and must be safe to expose publicly.
- All other credentials in this matrix are server/operator values unless their provider explicitly documents them as public identifiers.
- Production readiness must be verified through the relevant status/smoke workflow; this file intentionally does not claim that a provider is active.
- Google WIF/Cloud Run values are short-lived federation configuration; AppForge does not require a downloadable service-account JSON key.
- GitHub OAuth provider secrets are configured in the provider/server boundary and are not represented as browser variables here.

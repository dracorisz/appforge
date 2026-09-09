# AppForge deployment

AppForge deploys as a single Vercel project: a static Vite build plus same-project serverless functions in `api/`. Supabase provides auth, PostgreSQL, and storage. There is no other backend.

## Prerequisites

- Node.js 20+
- A Vercel project connected to `dracorisz/appforge` (`main` is production)
- A Supabase project
- DNS control for `sstoken.space`

## 1. Vercel project

```bash
npm i -g vercel
vercel login
vercel link
vercel --prod            # or: npm run deploy
```

Pushing to `main` deploys production automatically; every pull request gets a preview deployment.

Build settings come from `vercel.json`: `npm run build` → `dist/`, serverless functions from `api/**/*.js` with a 30s max duration, SPA rewrites so client routes survive hard reloads, and baseline security headers.

## 2. Supabase project

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Schema, roles, and Row Level Security live in `supabase/migrations/`. See [`DATABASE.md`](./DATABASE.md).

## 3. Environment variables

Set these in Vercel (Project → Settings → Environment Variables) and locally in `.env.local`. Variables prefixed with `VITE_` are compiled into the browser bundle and must never hold server-only credentials.

| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Browser + API | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser + API | Yes | Supabase publishable/anon key |
| `VITE_APP_NAME` | Browser | No | Display name (set in `vercel.json`) |
| `VITE_APP_URL` | Browser | No | Canonical production URL |
| `OPENROUTER_API_KEY` | Server only | For Dragon Arena | OpenRouter key for the AI game master |
| `OPENROUTER_MODEL` | Server only | No | Text model override |
| `OPENROUTER_IMAGE_MODEL` | Server only | No | Image model override |
| `HF_TOKEN_1`, `HF_TOKEN_2`, `HF_TOKEN_3` | Server only | For scene generation | Hugging Face token pool, rotated per request |
| `HF_IMAGE_MODEL` | Server only | No | Defaults to `stabilityai/stable-diffusion-xl-base-1.0` |
| `VITE_WEATHERAPI_KEY` | Browser | No | Optional Weather Now override |
| `VITE_COINMARKETCAP_API_KEY`, `VITE_COINPAPRIKA_API_KEY` | Browser | No | Optional Crypto Track providers |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | CI only | No | Only needed for CLI/CI deploys |

Users may supply their own OpenRouter key in Dragon Arena; it is sent for the active request only and never stored.

## 4. Domain

In the DNS provider for `sstoken.space`:

- `A` record, host `@` → Vercel's apex IP
- `CNAME` record, host `www` → `cname.vercel-dns.com`

Then add `sstoken.space` and `www.sstoken.space` under Vercel → Settings → Domains. Vercel issues TLS automatically.

## 5. Verify a deployment

```bash
npm run typecheck
npm run build
bash scripts/verify-deployment.sh
```

Then check the live surfaces:

- `https://www.sstoken.space/`
- `https://www.sstoken.space/apps/scrapper-pro`
- `https://www.sstoken.space/apps/any-converter`

The Footer shows the build fingerprint (version, git SHA, UTC build time) injected at build time from `VERCEL_GIT_COMMIT_SHA`. Always quote it in bug reports so a deployment can be identified exactly.

## Releases

Ordinary pushes do not need a version bump. For a named release:

```bash
npm run version:set -- 1.19.0
```

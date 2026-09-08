<p align="center">
  <img src="./public/favicon.svg" width="76" height="76" alt="AppForge logo" />
</p>

<h1 align="center">AppForge</h1>

<p align="center">A growing open-source toolbox of focused web utilities, media tools, and an authenticated personal workspace.</p>

<p align="center">
  <a href="https://www.sstoken.space/apps/scrapper-pro">Try the public beta</a> ·
  <a href="https://github.com/dracorisz/appforge/issues/new?template=bug_report.yml">Report a bug</a> ·
  <a href="https://github.com/dracorisz/appforge/issues/new?template=feature_request.yml">Request a tool</a> ·
  <a href="./CONTRIBUTING.md">Contribute</a>
</p>

## What AppForge is

AppForge is a single React/Vite application containing compact mini-apps that share one design system, registry, version/build identity, authentication layer, and narrow Vercel `/api` endpoints where browser-only execution is not reliable or safe.

The project is intentionally practical:

- focused tools instead of a generic admin dashboard,
- subtle frosted-glass UI rather than heavy glassmorphism,
- media-first cards for image/video workflows,
- no fake live data,
- direct routes must survive hard reloads,
- public beta surfaces for testing,
- authenticated personal workspace for synced state,
- open-source contribution workflow.

## Public beta access model

**Public without an account**

- landing / sign-in page,
- Scrapper Pro live route,
- installable PWA shell,
- repository/docs once GitHub visibility is public.

**Authenticated workspace**

- dashboard and app catalog,
- favorites and recent tools,
- profile and image relationships,
- settings/category overrides,
- synced per-user preferences,
- protected mini-apps.

**Admin**

- role-based administration,
- sensitive mutations intended to require a TOTP/AAL2 session.

Public source code does not make private user data public. Supabase Row Level Security remains the data boundary.

## Branding

`public/favicon.svg` is the canonical AppForge brand mark. Reuse it for application chrome, public marketing surfaces, PWA metadata, docs, and future social assets rather than creating per-page logos.

The current mark is deliberately simple so it scales from browser favicon to app icon and developer documentation.

## Featured working apps

### Scrapper Pro

Public media search with real image/video cards, in-page showbox navigation, saved results, same-origin downloads, article-to-PDF export, and partial-source failure handling.

- Live: `https://www.sstoken.space/apps/scrapper-pro`
- Docs: `docs/apps/scrapper-pro/README.md`

### Any → Any Converter

Registry-based conversion with validation, local file loading, safe format-pair selection, copy/download output, and hardened CSV/JSON/YAML/XML handling.

### Image Labeler

Local folder/file image labeling with removable tags, persistence, approval workflow, and JSON import/export.

### Image Workbench

Browser-local resize, format conversion, compression, and metadata inspection across the related image routes.

### Crypto Track

Live server-backed market data with provider failover, watchlist, search/sort, pagination, and no fake fallback prices.

### Weather Now

Live keyless weather lookup through the AppForge same-origin API layer.

### Local developer tools

JSON formatting, Base64, URL encode/decode, HTML entities, UUIDs, passwords, secure tokens, hashing, hex/binary, JWT inspection, CSV conversion, timestamps, regex testing, and color utilities.

## Quick start

```bash
git clone https://github.com/dracorisz/appforge.git
cd appforge
cp .env.example .env.local
npm install
npm run dev
```

Checks:

```bash
npm run typecheck
npm run build
```

## Stack

- React 18 + TypeScript
- Vite 6
- React Router 6
- Tailwind CSS 3.4
- Lucide icons
- PWA via `vite-plugin-pwa`
- Vercel static deployment + same-project serverless `/api` functions
- Supabase Auth, PostgreSQL, Storage and Row Level Security

## Architecture

```text
src/
  App.tsx                         routing + auth/public access boundary
  auth/                           Supabase session and login flow
  components/
    dashboard/                    mini-app implementations
    layout/                       authenticated shell, sidebar, footer
    public/                       public tool shell
    pwa/                          install/update/offline lifecycle UI
    resources/                    Settings, People, account/admin surfaces
    ui/                           shared cards, controls, media showbox, badges
  lib/
    registry.ts                   tool registry + per-app metadata
    buildInfo.ts                  shared deployment/build fingerprint
    account.ts                    profile, image, role and MFA adapters
    preferences.ts                per-user preference sync
api/
  scrape.js                       Scrapper Pro source aggregation
  media.js                        guarded media download proxy
  article.js                      readable article content for PDF export
  crypto.js                       server-backed crypto market data
  weather.js                      keyless weather/geocoding layer
supabase/migrations/               reproducible auth/profile/admin schema
scripts/                           release/version tooling
docs/apps/<app-id>/README.md       app-specific implementation docs
```

## PWA direction

AppForge is designed to install as a standalone web app.

The service worker uses a prompt-based update flow so a reviewer can explicitly move from an old build to the newest deployment. The app shell and local tools can remain useful after they have been cached, while live APIs, OAuth, and server-backed tools still require connectivity.

See `docs/PWA.md` for install, update, offline and cache-debugging guidance.

## Versioning and deployment tracking

The human product version lives in `package.json`.

Normal pushes do **not** require a semantic version bump. Vite injects a deployment fingerprint using the Vercel/Git SHA and UTC build time. Shared components render the same identity in the Footer, Project Pulse and app metadata.

For a named release:

```bash
npm run version:set -- 1.19.0
```

When reporting a bug, include the exact Footer build fingerprint so maintainers can reproduce the deployment you tested.

## Contributing

Outside contributions are welcome once repository visibility is public.

Recommended flow:

```bash
git checkout main
git pull
git checkout -b feat/image-tool-example
# make one focused change
npm run typecheck
npm run build
git push -u origin feat/image-tool-example
```

Then open a pull request against `main`.

Read:

- `CONTRIBUTING.md` — coding and PR expectations
- `docs/BRANCHING.md` — branch naming and access rules
- `SECURITY.md` — secrets and vulnerability handling
- `docs/PWA.md` — install/update/offline behavior

## Deployment

The canonical production deployment is the Vercel `appforge` project connected to `main`.

`main` is production. Contributor changes should arrive through focused pull requests once the public collaboration rules are enabled.

Production review paths:

- `https://www.sstoken.space/`
- `https://www.sstoken.space/apps/scrapper-pro`
- `https://www.sstoken.space/apps/any-converter`

## Environment and secrets

Never commit real `.env` files. Variables prefixed with `VITE_` are browser-visible and must never contain server-only credentials.

Use Vercel and Supabase environment/project settings for deployed secrets.

## License

AppForge is licensed under the MIT License. See `LICENSE`.

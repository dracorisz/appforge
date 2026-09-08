# AppForge

AppForge is a growing toolbox of focused web utilities running in one React/Vite application at **sstoken.space**. The project mixes local-first browser tools with narrow Vercel serverless APIs when a tool needs same-origin network access, protected provider calls, or CORS-safe downloads.

## Current product direction

- Fast, compact mini-apps rather than a generic admin dashboard.
- Shared, subtle frosted-glass UI primitives.
- Media-first cards use richer hover treatment; ordinary utility cards stay restrained.
- Direct app routes must survive hard reloads.
- No fake live data. Demo data must be explicitly labeled.
- Server-side secrets belong in deployment environment settings, never client bundles.
- Every production build shows its exact semantic version, Git SHA, and build timestamp in the Footer and Dashboard Project Pulse.

## Quick start

```bash
git clone <repo-url>
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
- Vercel static deployment + serverless `/api` functions
- Supabase client/infrastructure available for apps that genuinely need persistent shared data

## Architecture

```text
src/
  App.tsx                         router + global local state
  components/
    dashboard/                    mini-app implementations
    layout/                       Sidebar, Footer, Project Pulse
    ui/                           shared cards, controls, MediaShowbox, BuildBadge
  lib/
    registry.ts                   tool registry + per-app metadata
    buildInfo.ts                  shared deployment/build fingerprint
    simplePdf.ts                  dependency-free text PDF export
  types/                          shared TypeScript models and defaults
api/
  scrape.js                       Scrapper Pro source aggregation
  media.js                        guarded image/video download proxy
  article.js                      readable article content for PDF export
  crypto.js                       server-backed crypto market data
  weather.js                      keyless weather/geocoding layer
scripts/
  set-version.mjs                 one-command semantic version updater
docs/apps/<app-id>/README.md       app-specific implementation docs
```

## Featured working apps

### Scrapper Pro

Public-source media search with real images/videos, in-page media showbox, saved results, server-backed downloads, article-to-PDF export, and partial-source failure handling.

Developer documentation: `docs/apps/scrapper-pro/README.md`

### Any → Any Converter

Registry-based data conversion with validation, local file loading, safe format-pair selection, copy/download output, and hardened CSV/JSON/YAML/XML handling.

### Image Labeler

Local folder/file image labeling with removable tags, persistence, approval workflow, and JSON import/export.

### Crypto Track

Live server-backed market data with provider failover, watchlist, search/sort, pagination, and no fake fallback prices.

### Weather Now

Live keyless weather lookup using the AppForge server API rather than exposed client API keys.

## Adding or completing a mini-app

1. Add/update the tool record in `src/lib/registry.ts`.
2. Implement the component in `src/components/dashboard/`.
3. Export it from `src/components/dashboard/index.ts`.
4. Add the route in `src/App.tsx`.
5. Reuse `src/components/ui` primitives.
6. Add a narrow `/api` endpoint only when the browser cannot safely/reliably do the work itself.
7. Add `docs/apps/<app-id>/README.md` for substantial apps.
8. Test both navigation and a direct hard reload of the route after deployment.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Versioning and deployment tracking

The semantic product version lives in `package.json`.

Normal pushes do **not** require a version bump. Vite injects a unique deployment fingerprint using the Vercel/Git Git SHA and build time; the shared `BUILD_INFO` module renders it consistently in the Footer and Project Pulse.

For a named release:

```bash
npm run version:set -- 1.19.0
```

This keeps `package.json`, `package-lock.json`, and the legacy registry version in sync. Add meaningful notes to `APPFORGE_CHANGELOG` for named releases.

## Deployment

The canonical production deployment is the Vercel `appforge` project connected to `main`.

```bash
npm run build
```

Build output: `dist/`.

Vercel also deploys serverless functions from `api/` in the same project, so the UI and backend endpoints version together.

Production review paths:

- `https://www.sstoken.space/`
- `https://www.sstoken.space/apps/scrapper-pro`
- `https://www.sstoken.space/apps/any-converter`

## Environment and secrets

Copy `.env.example` to `.env.local` only when a local integration needs configuration. Never commit real `.env` files.

Use Vercel/Supabase environment settings for deployed secrets. Variables prefixed with `VITE_` are bundled into browser code and must never contain server-only secrets.

See [SECURITY.md](SECURITY.md).

## Contributing

External contributors are welcome once repository access/visibility permits it. Keep changes focused, preserve the shared design language, document substantial apps, and avoid fake data or unsafe network proxies.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and app-extension rules.

## Licensing

A repository license has not been selected yet. Before making the repository fully public/open-source, choose an explicit license (for example MIT or Apache-2.0) so external contributors know the legal terms.

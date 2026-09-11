<p align="center">
  <img src="./public/favicon.svg" width="76" height="76" alt="AppForge logo" />
</p>

<h1 align="center">AppForge</h1>

<p align="center">Useful web apps today. Forkable standalone PWAs tomorrow.</p>

<p align="center">
  <a href="https://www.sstoken.space/">Try the public beta</a> ·
  <a href="https://github.com/dracorisz/appforge/issues/new?template=bug_report.yml">Report a bug</a> ·
  <a href="https://github.com/dracorisz/appforge/issues/new?template=feature_request.yml">Request a tool</a> ·
  <a href="./CONTRIBUTING.md">Contribute</a>
</p>

## What AppForge is

AppForge is an open-source workshop of focused web utilities, media tools, creative AI experiments, and authenticated personal-workspace apps. They share one React/Vite/PWA platform while they are developed, tested, versioned, and gradually prepared to stand on their own.

The long-term goal is that each mini-app can mature into a complete independent product rather than remain permanently coupled to one monolithic toolbox.

The project is intentionally practical:

- focused tools instead of a generic admin dashboard,
- subtle frosted-glass UI rather than heavy glassmorphism,
- media-first cards for image/video workflows,
- no fake live data,
- direct routes must survive hard reloads,
- public beta surfaces for testing,
- authenticated personal workspace for synced state,
- shared PWA/version/build infrastructure,
- open-source contribution workflow,
- a documented path from mini-app to independently forkable PWA.

## App maturity: Idea → Full

AppForge uses a product maturity ladder:

- **Idea** — planned concept or early preview.
- **Building** — active implementation.
- **Beta** — useful end-to-end, but still has verification, polish, portability, or documentation gaps.
- **Launched** — production-ready inside AppForge with stable primary workflows.
- **Full** — production-ready inside AppForge **and** intentionally packaged/documented so developers can fork it into an independent ready-made PWA.
- **Deprecated** — compatibility/history only.

`Full` is deliberately a strong promise, not a cosmetic badge. A Full app must have a stable primary workflow, PWA-ready metadata, documented APIs/environment/migrations, a fork guide, build/type/lint quality gates, production smoke tests, and no known P0/P1 blocker.

See [`docs/FULL_STATUS.md`](./docs/FULL_STATUS.md) for the complete standard.

## Public beta access model

**Public without an account**

- landing / sign-in page,
- searchable Apps directory,
- Blog and Changelog,
- Hugging Face integration + public generated-scene gallery,
- Getter Pro,
- Weather Now,
- Crypto Track,
- Any → Any Converter,
- Favicon Studio, SVG Icons, and Landing Builder,
- installable PWA shell,
- public repository and docs.

**Authenticated workspace**

- dashboard and app catalog,
- favorites and recent tools,
- profile and image relationships,
- settings/category overrides,
- shared Appearance theme,
- synced per-user preferences,
- protected mini-apps,
- Story Studio projects and personal Media Vault.

**Admin**

- role-based administration,
- sensitive mutations intended to require a TOTP/AAL2 session.

Public source code does not make private user data public. Supabase Row Level Security remains the data boundary.

## Branding

`public/favicon.svg` is the canonical AppForge brand mark. Reuse it for application chrome, public marketing surfaces, PWA metadata, docs, and future social assets rather than creating per-page logos.

The current mark is deliberately simple so it scales from browser favicon to app icon and developer documentation.

## Featured working apps

### Story Studio / Dragon Arena evolution

The Dragon Arena story engine is evolving into a broader Story Studio with **Novel** and **Comics** builder modes sharing the same persistent story/session data.

Current beta direction includes short choice-driven story beats, persistent sessions, Hugging Face-backed generation paths, generated-scene assets, compact tap-to-expand artwork, profile Appearance theming, and local continuity when shared AI quota is unavailable.

This is an active beta, not yet a Full Novel/Comics authoring product.

### Scrapper Pro

Public media search with real image/video cards, in-page showbox navigation, saved results, same-origin downloads, article-to-PDF export, partial-source failure handling, and signed-in Media Vault archiving.

- Live: `https://www.sstoken.space/apps/scrapper-pro`
- Docs: `docs/apps/scrapper-pro/README.md`

### Media Vault

Shared signed-in asset surface for General uploads, linked Story/Dragon generated scenes, and deduplicated Scrapper Pro source references.

### Any → Any Converter

Registry-based conversion with validation, local file loading, safe format-pair selection, copy/download output, and hardened CSV/JSON/YAML/XML handling.

This is a strong candidate for one of the first Full-status standalone packages because it is browser-first and has relatively few server dependencies.

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

Markdown Previewer and SVG Tool now have dedicated browser-local implementations routed from their registry entries. They remain marked `Idea` until their product-level verification and maturity metadata are completed; PDF Tool, Excel Tool, and Audio Converter still use the intentional planned-app surface.

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
npm run verify:release
npx vitepress build docs
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
  ai-game.js                      Story/Dragon narrative provider rotation + continuity
  dragon-image.js                generated-scene provider routing + persistence
supabase/migrations/               reproducible auth/profile/admin/app schema
scripts/                           release/version tooling
docs/apps/<app-id>/                app-specific implementation docs
docs/FULL_STATUS.md                fork-readiness quality standard
docs/MARKETING_HANDOFF.md          launch/Patreon/marketing-session starting point
```

## PWA direction

AppForge is designed to install as a standalone web app today, while individual mini-apps are progressively prepared for independent PWA extraction.

The service worker uses a prompt-based update flow so a reviewer can explicitly move from an old build to the newest deployment. The app shell and local tools can remain useful after they have been cached, while live APIs, OAuth, and server-backed tools still require connectivity.

A Full app must additionally document its own standalone manifest-ready identity, offline behavior, dependencies, APIs, migrations, environment variables and extraction steps.

See `docs/PWA.md` for install/update/offline/cache guidance and `docs/FULL_STATUS.md` for standalone readiness.

## Versioning and deployment tracking

The human product version lives in `package.json`.

Normal pushes do **not** require a semantic version bump. Vite injects a deployment fingerprint using the Vercel/Git SHA and UTC build time. Shared components render the same identity in the Footer, Project Pulse and app metadata.

For a named release:

```bash
npm run version:set -- 1.19.0
```

When reporting a bug, include the exact Footer build fingerprint so maintainers can reproduce the deployment you tested.

## Contributing

Outside contributions are welcome.

A useful contribution can be a focused bug fix, a new mini-app, or work that moves one existing app closer to Full status: better failure handling, standalone documentation, dependency isolation, accessibility, tests, PWA packaging, or fork instructions.

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
- `docs/FULL_STATUS.md` — Full/fork-ready app standard
- `docs/BRANCHING.md` — branch naming and access rules
- `SECURITY.md` — secrets and vulnerability handling
- `docs/PWA.md` — install/update/offline behavior

## Deployment

The canonical production deployment is the Vercel `appforge` project connected to `main`.

`main` is the production source branch, but Git-triggered Vercel deployments are disabled in `vercel.json`. A production release is a deliberate `vercel deploy --prod` from a verified `main` commit; pushing or merging does not deploy by itself.

Production review paths:

- `https://www.sstoken.space/`
- `https://www.sstoken.space/huggingface`
- `https://www.sstoken.space/apps/scrapper-pro`
- `https://www.sstoken.space/apps/any-converter`

## Launch and support

AppForge can be promoted today as a **public beta / open-development project**. Marketing should distinguish current working beta functionality from the future Full-status promise.

The prepared marketing handoff includes positioning, safe claims, Patreon framing, screenshot targets and launch-material checklists:

- [`docs/MARKETING_HANDOFF.md`](./docs/MARKETING_HANDOFF.md)

## Environment and secrets

Never commit real `.env` files. Variables prefixed with `VITE_` are browser-visible and must never contain server-only credentials.

Use Vercel and Supabase environment/project settings for deployed secrets.

## License

AppForge is licensed under the MIT License. See `LICENSE`.

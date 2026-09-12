<p align="center">
  <img src="./public/favicon.svg" width="76" height="76" alt="AppForge logo" />
</p>

<h1 align="center">AppForge</h1>

<p align="center">A focused web-tool platform for utility, media, creator, and workspace workflows.</p>

<p align="center">
  <a href="https://github.com/dracorisz/appforge/stargazers"><img src="https://img.shields.io/github/stars/dracorisz/appforge?style=social&label=Star" alt="GitHub Stars"></a>
  <a href="https://github.com/dracorisz/appforge/fork"><img src="https://img.shields.io/github/forks/dracorisz/appforge?style=social&label=Fork" alt="GitHub Forks"></a>
  <img src="https://img.shields.io/github/watching/dracorisz/appforge?style=social&label=Watch" alt="GitHub Watch">
  <a href="https://www.sstoken.space/"><img src="https://img.shields.io/badge/live-sstoken.space-brightgreen" alt="Live site"></a>
  <a href="https://docs.sstoken.space/"><img src="https://img.shields.io/badge/docs-docs.sstoken.space-blue" alt="Docs"></a>
</p>

<p align="center">
  <a href="https://www.sstoken.space/">Try AppForge</a> ·
  <a href="https://github.com/dracorisz/appforge/issues/new?template=bug_report.yml">Report a bug</a> ·
  <a href="https://github.com/dracorisz/appforge/issues/new?template=feature_request.yml">Request a tool</a> ·
  <a href="./CONTRIBUTING.md">Contribute</a>
</p>

## What AppForge is

AppForge is an open-source, integrated web-tool product built around focused utilities, media workflows, creator tools, AI-assisted experiences, and an authenticated personal workspace.

The tools share one React/Vite application, one design system, one registry, one account/data layer, one deployment model, and one installable Progressive Web App shell. AppForge is developed and presented as a coherent product rather than a collection of future standalone apps.

If an app category later becomes an independent product, that work belongs in a separate project with its own architecture, brand, deployment, and product lifecycle.

Core principles:

- focused tools instead of a generic admin dashboard;
- consistent navigation and shared UI primitives;
- truthful live-data and provider states;
- explicit public versus authenticated boundaries;
- responsive desktop/mobile behavior;
- no browser-exposed server secrets;
- direct routes that survive hard reloads;
- shared AppForge PWA install/update/offline behavior;
- deliberate production releases from verified `main` state.

## App maturity

The canonical registry uses five product states:

- **Idea** — planned concept or deliberate preview surface.
- **Building** — active implementation; primary workflows may still change.
- **Beta** — useful end-to-end with remaining product, reliability, or verification work.
- **Launched** — stable production AppForge capability with verified primary workflows.
- **Deprecated** — retained only for compatibility or migration history.

There is no per-app `Full`, fork-ready, extraction-ready, or standalone-PWA maturity level. See [`docs/APP_MODEL.md`](./docs/APP_MODEL.md) and [`docs/PROJECT-PULSE.md`](./docs/PROJECT-PULSE.md).

## Access model

**Public without an account** includes the landing page, searchable Apps directory, Blog, Changelog, and all registry apps not marked account-backed/private.

**Authenticated workspace** includes the dashboard/catalog, favorites and recent tools, profile/preferences, user-owned synced data, and the private app set: **Getter Pro, Media Vault, Desktop Buddy, and Story Studio**. Story Studio's creator-controlled public showcase data may be shared only when a user explicitly opts in; the Story Studio workspace itself remains private.

**Admin** capabilities live in the unified Settings/Admin console and require the admin role plus an AAL2/TOTP session for protected administration. The console covers users, content/docs/media, app presentation, and Marketing Studio.

Supabase Row Level Security remains the data boundary. Public source code does not make private user data public.

## Product areas

AppForge currently includes browser-local developer and conversion tools, image/SVG workflows, Getter Pro media discovery, Media Vault storage/reference workflows, Weather Now, Crypto Track, Task List, Story Studio, Desktop Buddy, Favicon Studio, SVG Icons, Landing Builder, and additional registry-backed utilities.

Use the live **Apps** directory for the current public catalog; `src/lib/registry.ts` is authoritative for app names, routes, categories, versions, maturity, and the explicit private-app boundary.

## Quick start

```bash
git clone https://github.com/dracorisz/appforge.git
cd appforge
cp .env.example .env.local
npm install
npm run dev
```

Release-facing checks:

```bash
npm run verify:release
npx vitepress build docs
```

## Stack

- React 19 + TypeScript
- Vite 6
- React Router 7
- Tailwind CSS 4
- Lucide / react-icons
- AppForge PWA via `vite-plugin-pwa`
- Vercel static deployment + same-project serverless `/api` functions
- Supabase Auth, PostgreSQL, Storage, RPCs, and Row Level Security

## Architecture

```text
src/
  App.tsx                         routing + auth/public access boundary
  auth/                           session and login flow
  components/
    admin/                        unified AAL2/TOTP-protected admin console
    dashboard/                    app implementations and workbenches
    layout/                       authenticated shell and sidebar
    public/                       shared public navigation/pages/tool shell
    pwa/                          AppForge install/update/offline lifecycle
    resources/                    Settings, People and supporting resources
    ui/                           shared controls, cards and media UI
  lib/
    registry.ts                   canonical app catalog + access metadata
    buildInfo.ts                  deployment/build fingerprint
    account.ts                    profile/image/role/MFA adapters
    preferences.ts                per-user preference sync
api/                              narrow Vercel server endpoints
supabase/migrations/              reproducible auth/data/storage schema
scripts/                          validation/release tooling
docs/                             concise product, developer and operations docs
```

## AppForge PWA

AppForge itself is an installable Progressive Web App. `vite.config.ts` defines the manifest and Workbox behavior, while `src/components/pwa/` owns the user-facing install/update/offline lifecycle.

The PWA shell is shared platform infrastructure. Individual internal apps do not receive separate manifests, service workers, or standalone-PWA readiness targets inside this repository.

See [`docs/PWA.md`](./docs/PWA.md) for install, update, caching, offline, and verification guidance.

## Versioning and deployment

The human product version lives in `package.json`. Normal commits do not require a semantic version bump; builds also receive a Git/build-time fingerprint.

For a named release:

```bash
npm run version:set -- 1.27.0
```

The canonical production deployment is the Vercel `appforge` project connected to `main`. Git-triggered Vercel deployments are disabled in `vercel.json`, so pushing to `main` is not itself a production release.

Production is deployed deliberately from a verified `main` state, then checked against the launch/smoke-test guidance.

## Documentation

The public documentation is intentionally compact. Start with:

- [`docs/GETTING_STARTED.md`](./docs/GETTING_STARTED.md)
- [`docs/apps/index.md`](./docs/apps/index.md)
- [`docs/APP_MODEL.md`](./docs/APP_MODEL.md)
- [`docs/PROJECT-PULSE.md`](./docs/PROJECT-PULSE.md)
- [`docs/PWA.md`](./docs/PWA.md)

App-specific implementation detail should generally live close to source, API code, or migrations rather than in a separate page for every tool.

## Contributing

Outside contributions are welcome. Useful work includes focused bug fixes, accessibility and responsive improvements, shared UI cleanup, app functionality, reliability, provider/data hardening, tests, documentation, and platform performance/PWA work.

The maintained project branch is `main`. External contributors should use a fork/PR workflow and target `main`; maintainers keep repository work consolidated on `main`.

Run the release checks before opening a pull request:

```bash
npm run verify:release
```

Read `CONTRIBUTING.md` and `SECURITY.md` before submitting substantial changes.

## Environment and secrets

Never commit real `.env` files. Variables prefixed with `VITE_` are browser-visible and must never contain server-only credentials. Use Vercel, Supabase, and provider-side configuration for deployed secrets.

## License

AppForge is licensed under the MIT License. See `LICENSE`.

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

**Public without an account** includes the landing page, searchable Apps directory, Blog, Changelog, Hugging Face gallery/integration surface, and explicitly public tools such as Getter Pro, Weather Now, Crypto Track, Any Converter, Favicon Studio, SVG Icons, Landing Builder, and the signed-out Story Studio integrations surface.

**Authenticated workspace** includes the dashboard/catalog, favorites and recent tools, profile/preferences, protected tools, Story Studio creation, Media Vault, and user-owned synced data.

**Admin** capabilities are role-based, with sensitive frontend-content mutations intended to require an AAL2/TOTP session.

Supabase Row Level Security remains the data boundary. Public source code does not make private user data public.

## Product areas

AppForge currently includes browser-local developer and conversion tools, image/SVG workflows, Getter Pro media discovery, Media Vault storage/reference workflows, Weather Now, Crypto Track, Task List, Story Studio, Desktop Buddy, Favicon Studio, SVG Icons, Landing Builder, and additional registry-backed utilities and experiments.

Use the live **Apps** directory for the current full catalog; `src/lib/registry.ts` is authoritative for app names, routes, categories, versions, and maturity.

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

- React 18 + TypeScript
- Vite 6
- React Router 6
- Tailwind CSS 3.4
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
    dashboard/                    app implementations and workbenches
    layout/                       authenticated shell and sidebar
    public/                       shared public navigation/pages/tool shell
    pwa/                          AppForge install/update/offline lifecycle
    resources/                    Settings, People, account/admin surfaces
    ui/                           shared controls, cards and media UI
  lib/
    registry.ts                   canonical app catalog + metadata
    buildInfo.ts                  deployment/build fingerprint
    account.ts                    profile/image/role/MFA adapters
    preferences.ts                per-user preference sync
api/                              narrow Vercel server endpoints
supabase/migrations/               reproducible auth/data/storage schema
scripts/                           validation/release tooling
docs/                              concise product, developer and operations docs
```

## AppForge PWA

AppForge itself is an installable Progressive Web App. `vite.config.ts` defines the manifest and Workbox behavior, while `src/components/pwa/` owns the user-facing install/update/offline lifecycle.

The PWA shell is shared platform infrastructure. Individual internal apps do not receive separate manifests, service workers, or standalone-PWA readiness targets inside this repository.

See [`docs/PWA.md`](./docs/PWA.md) for install, update, caching, offline, and verification guidance.

## Versioning and deployment

The human product version lives in `package.json`. Normal commits do not require a semantic version bump; builds also receive a Git/build-time fingerprint.

For a named release:

```bash
npm run version:set -- 1.19.0
```

The canonical production deployment is the Vercel `appforge` project connected to `main`. Git-triggered Vercel deployments are disabled in `vercel.json`, so pushing or merging is not itself a production release.

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

```bash
git checkout main
git pull
git checkout -b feat/example
# make one focused change
npm run verify:release
git push -u origin feat/example
```

Then open a pull request against `main`. Read `CONTRIBUTING.md` and `SECURITY.md` before submitting substantial changes.

## Environment and secrets

Never commit real `.env` files. Variables prefixed with `VITE_` are browser-visible and must never contain server-only credentials. Use Vercel, Supabase, and provider-side configuration for deployed secrets.

## License

AppForge is licensed under the MIT License. See `LICENSE`.

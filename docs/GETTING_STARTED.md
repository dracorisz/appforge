# Getting started

AppForge is an integrated React + TypeScript web-tool platform with public utilities, authenticated workspace features, selected server-backed integrations, and one shared installable PWA shell.

## Choose your path

- **Use AppForge:** open [sstoken.space](https://www.sstoken.space/) and use the live Apps directory to discover tools.
- **Understand the product:** read [Apps](./apps/index.md), [App model](./APP_MODEL.md), and [Project Pulse](./PROJECT-PULSE.md).
- **Contribute code:** follow the local setup below, then read the root `CONTRIBUTING.md`.
- **Maintain the platform:** continue with [Environment](./ENVIRONMENT.md), [Launch checklist](./LAUNCH-CHECKLIST.md), and [Agent handoff](./AGENT_HANDOFF.md).

The documentation site runs separately on GitHub Pages. Production application features and `/api` routes remain on `sstoken.space`.

## Local development

Requirements: a current Node.js LTS/runtime and npm.

```bash
git clone https://github.com/dracorisz/appforge.git
cd appforge
npm ci
cp .env.example .env.local
npm run dev
```

Only configure environment variables for integrations you actually need. Never place private server credentials in a `VITE_*` variable because Vite exposes those values to browser code.

## Know the main source files

Most product work starts in a small set of places:

- `src/lib/registry.ts` — canonical app identity, category, route, version, and maturity;
- `src/App.tsx` — application routes and public/authenticated access boundary;
- `src/components/layout/` — authenticated shell and navigation;
- `src/components/public/` — shared public-facing surfaces;
- `src/components/dashboard/` — app implementations and shared workbenches;
- `api/` — narrow server endpoints;
- `supabase/migrations/` — database, storage, RLS, and RPC history;
- `vite.config.ts` and `src/components/pwa/` — AppForge-wide PWA lifecycle.

AppForge is the installable PWA. Individual internal tools do not have a standalone-PWA maturity or extraction requirement in this repository.

## Validate a change

For release-facing application work, run:

```bash
npm run verify:release
```

When debugging checks independently:

```bash
npm run audit:apps
npm run lint
npm run typecheck
npm test
npm run build
```

For PWA-shell changes, also run the production build locally and verify the manifest, service worker, update flow, direct-route reloads, and offline shell behavior described in [AppForge PWA](./PWA.md).

## Deployment model

Pushing to `main` does not itself constitute a production release. Vercel Git-triggered deployments are intentionally disabled; production is deployed deliberately from a verified `main` state and then smoke-tested.

Documentation under `docs/` is published separately through the GitHub Pages workflow after it reaches `main`.

## Documentation scope

The docs are intentionally compact. App-specific user and developer information is consolidated in **[Apps](./apps/index.md)** rather than maintained as dozens of separate pages. Deep implementation details should live close to source, APIs, migrations, or focused operational docs.

When architecture, routes, app identity, authentication, database schema, providers, PWA behavior, security posture, or release expectations change, update the relevant documentation in the same pass.

## Current account and navigation behavior

- The public landing page stays unobstructed until a user explicitly chooses **Sign in**. The auth dialog supports Google, GitHub, and email/password and is dismissible by its close control or backdrop.
- Authenticated users can set an email/password credential from **Settings → Profile → Security**. AppForge validates at least 8 characters with lowercase, uppercase, a digit, and a symbol before asking Supabase Auth to update the credential.
- Appearance is controlled from the sidebar account menu. Account menus must dismiss after an action and on outside click.
- Public Blog article routes scroll to the document top, render media only when media exists, and show up to three related articles.

## UI contribution baseline

Use existing AppForge primitives before adding one-off wrappers. Keep page sections on the standard 16px rhythm, use `rounded-xl`, avoid translate/offset hover motion, and keep textareas/upload/output surfaces compact unless the content genuinely needs a larger editor.


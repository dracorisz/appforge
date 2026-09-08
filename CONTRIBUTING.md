# Contributing to AppForge

Thanks for helping improve AppForge. The project is a collection of focused mini-apps sharing one React/Vite shell, UI system, registry, Supabase account layer, PWA lifecycle, and Vercel `/api` layer.

## Contribution model

AppForge uses `main` as the production branch.

External contributors should not push directly to `main`. Use a short-lived branch or fork and open a focused pull request.

Recommended branch prefixes:

- `feat/<app-or-area>-<short-description>`
- `fix/<app-or-area>-<short-description>`
- `docs/<short-description>`
- `refactor/<area>-<short-description>`
- `chore/<short-description>`
- `security/<short-description>` for non-sensitive hardening work only

Examples:

```text
feat/scrapper-source-filter
fix/image-labeler-object-url-cleanup
docs/pwa-install-guide
refactor/shared-media-card
```

See `docs/BRANCHING.md` for the complete branch and access policy.

## Before you start

- Keep changes focused: one app or one shared concern per change.
- Reuse `src/components/ui` before creating a one-off visual component.
- Reuse `public/favicon.svg` as the canonical AppForge brand mark.
- Do not introduce fake data as if it were live data.
- Do not commit secrets, `.env`, generated `dist/`, or `node_modules/`.
- Preserve hard-refresh support for client routes.
- Preserve the auth/public boundary: only explicitly designated routes are public.
- Prefer same-origin `/api` functions for browser-CORS-sensitive integrations.
- Do not weaken Supabase Row Level Security to make a feature easier to ship.

## Local setup

```bash
git clone https://github.com/dracorisz/appforge.git
cd appforge
cp .env.example .env.local
npm install
npm run dev
```

Run checks before submitting changes:

```bash
npm run typecheck
npm run build
```

For PWA-specific changes, also test the production build with `npm run preview` and inspect Manifest + Service Worker under browser DevTools → Application.

## Project structure

```text
src/
  App.tsx                       routes and auth/public access boundary
  auth/                         Supabase session/login flow
  components/
    dashboard/                  mini-app implementations
    layout/                     authenticated shell
    public/                     public tool shell
    pwa/                        install/update/offline lifecycle
    resources/                  account/profile/admin surfaces
    ui/                         shared controls, cards, media showbox, badges
  lib/
    registry.ts                 app registry and per-app metadata
    buildInfo.ts                runtime build fingerprint
    account.ts                  profile/image/role/MFA adapter
api/                            Vercel serverless endpoints
supabase/migrations/             reproducible database schema
scripts/                        repository/version tooling
docs/apps/<app>/README.md       individual app documentation
```

## Adding or completing a mini-app

1. Add or update its record in `src/lib/registry.ts`.
2. Create the implementation under `src/components/dashboard/`.
3. Export it from `src/components/dashboard/index.ts`.
4. Add the route in `src/App.tsx`.
5. Reuse shared UI primitives.
6. If it needs server access, add a narrow endpoint under `api/` rather than a general proxy.
7. Create `docs/apps/<app-id>/README.md` when the app becomes substantial.
8. Test direct navigation and a hard reload.
9. If the route is public, test it in a signed-out browser session.
10. If the route is install/PWA-sensitive, test the update prompt and standalone mode.

## Shared UI direction

AppForge is intentionally subtle and technical:

- restrained frosted-glass surfaces,
- readable typography,
- modest rounding,
- low-noise borders and shadows,
- no vertical card jump on hover,
- media cards may reveal concise overlays on hover,
- touch/mobile behavior must not depend on hover,
- respect reduced-motion preferences,
- keep Recent grids at two columns maximum.

Avoid heavy neon gradients, excessive glass layers, oversized marketing cards, or decorative animation that competes with the tool itself.

## Public beta testing

The easiest way to help without writing code is to test the latest production build.

When filing a bug:

1. Copy the Footer build fingerprint.
2. Include the exact route.
3. Include browser/device.
4. Describe expected vs actual behavior.
5. Include screenshots for visual issues when possible.

Scrapper Pro is the designated public live tool and should be tested both signed out and signed in.

## Versioning and build tracking

The human release version is in `package.json`.

For a named release:

```bash
npm run version:set -- 1.19.0
```

Normal commits do not require a semantic version bump. Every Vercel deployment receives a unique fingerprint from the semantic version, Git SHA, and UTC build time.

## Pull request requirements

A pull request should explain:

- the user problem,
- the route/app affected,
- API/database/auth changes,
- how it was tested,
- the production or preview build fingerprint if available,
- known browser/source limitations.

Before requesting review:

- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] no secrets or private URLs are included
- [ ] direct route/hard reload was tested
- [ ] public/auth behavior was tested if relevant
- [ ] substantial apps/docs were updated
- [ ] screenshots are attached for material visual changes

## Security

Do not include API keys, session tokens, private URLs, cookies, OAuth secrets, personal credentials, or sensitive user content in issues, commits, examples, screenshots, or logs.

Report sensitive vulnerabilities privately rather than opening a public issue. See `SECURITY.md`.

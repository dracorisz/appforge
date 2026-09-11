# Contributing to AppForge

Thanks for helping improve AppForge. The project is one integrated product containing focused tools that share the React/Vite shell, design system, registry, Supabase account/data layer, AppForge PWA lifecycle, and Vercel `/api` layer.

## Contribution model

`main` is the production source branch. External contributors should use a short-lived branch or fork and open a focused pull request rather than pushing directly to `main`.

Recommended prefixes:

- `feat/<area>-<short-description>`
- `fix/<area>-<short-description>`
- `docs/<short-description>`
- `refactor/<area>-<short-description>`
- `chore/<short-description>`
- `security/<short-description>` for non-sensitive hardening work only

See `docs/BRANCHING.md` for branch and access guidance.

## Before you start

- Keep changes focused around one user problem or shared concern.
- Reuse `src/components/ui`, shared layout, and public navigation components before creating one-off UI.
- Reuse `public/favicon.svg` as the canonical AppForge brand mark.
- Do not introduce fake live data.
- Do not commit secrets, `.env`, generated `dist/`, or `node_modules/`.
- Preserve hard-refresh support for client routes.
- Preserve explicit public/authenticated access boundaries.
- Prefer narrow same-origin `/api` functions for CORS-sensitive or credentialed integrations.
- Do not weaken Supabase Row Level Security to make a feature easier to ship.
- Keep AppForge's shared PWA lifecycle healthy; do not create per-app service workers or per-app PWA-readiness tracks.

## Local setup

```bash
git clone https://github.com/dracorisz/appforge.git
cd appforge
cp .env.example .env.local
npm install
npm run dev
```

Run release-facing checks before submitting substantial changes:

```bash
npm run verify:release
```

For AppForge PWA changes, also test a production build with `npm run build && npm run preview` and inspect the manifest, service worker, update flow, direct-route reloads, and offline shell behavior.

## Project structure

```text
src/
  App.tsx                       routes and auth/public access boundary
  auth/                         Supabase session/login flow
  components/
    dashboard/                  app implementations/workbenches
    layout/                     authenticated shell
    public/                     public pages, shared header and guest shell
    pwa/                        AppForge install/update/offline lifecycle
    resources/                  account/profile/admin surfaces
    ui/                         shared controls, cards and media UI
  lib/
    registry.ts                 canonical app registry and metadata
    buildInfo.ts                runtime build fingerprint
    account.ts                  profile/image/role/MFA adapters
api/                            Vercel server endpoints
supabase/migrations/             reproducible database schema
scripts/                        validation/version tooling
docs/                            concise product/developer/operations docs
```

## Adding or changing an app

1. Add or update its canonical record in `src/lib/registry.ts`.
2. Implement the work surface under the appropriate shared component area.
3. Add one intentional route in `src/App.tsx`.
4. Reuse shared UI and navigation patterns.
5. If server access is required, prefer a narrow endpoint under `api/` rather than a generic proxy.
6. Keep user/private storage and RLS boundaries explicit.
7. Test direct navigation and hard reload.
8. Test mobile/responsive and keyboard/focus behavior.
9. If the route is public, verify it while signed out.
10. Update `docs/apps/index.md` only when catalog-wide guidance, access, category, or maturity semantics materially change; do not create a separate docs page for routine app implementation detail.

AppForge does not require internal tools to become standalone PWAs. If a product family is ever split into a separate product, that work should happen in a dedicated repository/project rather than through an AppForge app-maturity gate.

## Shared UI direction

AppForge is intentionally restrained and product-focused:

- readable typography and consistent spacing;
- modest rounding, borders, and shadows;
- no vertical card jump on hover;
- media overlays only where they improve the task;
- touch/mobile behavior must not depend on hover;
- respect reduced-motion preferences;
- use shared global navigation instead of page-specific variants;
- keep slogans/subtitles out of global product navigation.

Avoid heavy decorative animation, unnecessary glass layers, duplicated headers, or app-specific chrome that makes the suite feel unrelated.

## Versioning and release tracking

The human release version is in `package.json`. Normal commits do not require a semantic version bump. Named releases can use:

```bash
npm run version:set -- 1.19.0
```

Each deployment also receives a Git/build-time fingerprint so bug reports can identify the exact running build.

## Pull request requirements

A pull request should explain the user problem, affected route/app, API/database/auth impact, and how the change was tested.

Before review:

- [ ] `npm run verify:release` passes
- [ ] no secrets or private URLs are included
- [ ] direct route/hard reload was tested when relevant
- [ ] public/auth behavior was tested when relevant
- [ ] responsive and keyboard/focus behavior was considered
- [ ] docs/registry/changelog were updated when the product contract changed
- [ ] screenshots are attached for material visual changes

## Security

Do not include API keys, session tokens, private URLs, cookies, OAuth secrets, personal credentials, or sensitive user content in issues, commits, examples, screenshots, or logs. Report sensitive vulnerabilities privately. See `SECURITY.md`.

## Community

Useful contributions include focused bug fixes, shared UI cleanup, accessibility, responsive behavior, new or improved tools, provider/data hardening, tests, performance, AppForge-level PWA improvements, and concise documentation.

GitHub Discussions are appropriate for ideas, questions, showcases, and product discussion that are not yet actionable issues or pull requests.

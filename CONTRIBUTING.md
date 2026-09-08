# Contributing to AppForge

Thanks for helping improve AppForge. The project is a collection of focused mini-apps sharing one React/Vite shell, UI system, registry, and Vercel `/api` layer.

## Before you start

- Keep changes focused: one app or one shared concern per change.
- Reuse `src/components/ui` before creating a one-off visual component.
- Do not introduce fake data as if it were live data.
- Do not commit secrets, `.env`, generated `dist/`, or `node_modules/`.
- Preserve hard-refresh support for client routes.
- Prefer same-origin `/api` functions for browser-CORS-sensitive integrations.

## Local setup

```bash
git clone <repo-url>
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

The repository does not yet have a real lint configuration; adding one is welcome as a dedicated tooling change.

## Project structure

```text
src/
  App.tsx                       routes and global app state
  components/
    dashboard/                  mini-app implementations
    layout/                     shell, sidebar, footer, project pulse
    ui/                         shared controls, cards, media showbox, build badge
  lib/
    registry.ts                 app registry and per-app metadata
    buildInfo.ts                runtime build fingerprint
    simplePdf.ts                dependency-free text PDF export
api/                            Vercel serverless endpoints
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
8. Test the direct route with a hard reload after deployment.

## Shared UI direction

AppForge is intentionally subtle and technical:

- restrained frosted-glass surfaces,
- readable typography,
- modest rounding,
- low-noise borders and shadows,
- richer hover treatment for media cards only,
- touch/mobile behavior must not depend on hover,
- respect reduced-motion preferences.

Avoid heavy neon gradients, excessive glass layers, oversized marketing cards, or decorative animation that competes with the tool itself.

## Versioning and build tracking

The human release version is in `package.json`.

For a named release, run:

```bash
npm run version:set -- 1.19.0
```

That updates `package.json`, `package-lock.json`, and the legacy `APPFORGE_VERSION` registry constant together. Add meaningful release notes to `APPFORGE_CHANGELOG` for named releases.

Every Vercel build automatically receives a unique fingerprint from:

- semantic version,
- Git commit SHA,
- UTC build time.

The same build data is rendered by the Footer and Project Pulse. Normal commits do **not** require a semantic version bump.

## Pull request guidance

A good contribution should explain:

- what user problem it fixes,
- which route/app it affects,
- whether it adds or changes an API endpoint,
- how it was tested,
- any known source/browser limitations.

Screenshots are useful for visual changes. For network tools, include at least one successful and one failure/empty-state test.

## Security

Do not include API keys, session tokens, private URLs, cookies, or credentials in issues, commits, examples, screenshots, or logs. See `SECURITY.md`.

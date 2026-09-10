# Project Pulse

Project Pulse is the release-tracking layer for AppForge. Its goal is to move every canonical registry entry toward a polished, installable product without maintaining a second disconnected status system.

## Source of truth

- App inventory, route, version and release state: `src/lib/registry.ts`
- Route implementation and planned-app fallback: `src/App.tsx`
- Shared PWA configuration: `vite.config.ts`
- Launch gates and external dependencies: `docs/LAUNCH-CHECKLIST.md`
- Full/fork-ready standard: `docs/FULL_STATUS.md`
- Cloud experiments and bounded media worker: `docs/CLOUD-EXPERIMENTS.md`
- GitHub Pages documentation build: `.github/workflows/pages.yml`
- Actionable work: GitHub Issues

## Readiness scale

Project Pulse converts the registry status into a portfolio indicator:

| Registry status | Readiness | Meaning |
| --- | ---: | --- |
| `idea` | 20% | Product shape exists; route resolves to an intentional planned surface. |
| `building` | 45% | Main workflow exists but major product/release gates remain. |
| `beta` | 75% | Usable app with stable route; polish, portability or production verification may remain. |
| `launched` | 100% | Production-ready inside AppForge and verified against the release checklist. |
| `deprecated` | 0% | Not part of the active release portfolio. |

The percentage is a release/readiness signal, not test coverage. `Full` is a stronger standalone/fork-ready qualification defined separately in `FULL_STATUS.md`; it is not currently a registry status value.

## Definition of a launched AppForge app

An app can move to `launched` only when its applicable gates are complete:

1. Stable canonical registry identity and route.
2. Intentional route implementation: dedicated component, shared workbench, legacy mini-app shell, or planned-app surface.
3. Correct desktop and mobile layout.
4. Clear empty, loading, success, retry and recoverable error states.
5. Public/private access behavior is intentional and documented.
6. Shared production PWA manifest/icons/service worker behave correctly on `sstoken.space`.
7. Server, storage and AI dependencies have bounded failure behavior and no browser-exposed secrets.
8. Lint, TypeScript, tests and production build pass.
9. Material changes carry registry/changelog notes.
10. Production smoke testing succeeds after the deliberate Vercel deploy.

## Standalone / Full candidates

A `beta` app may already be a strong standalone candidate. Promotion to Full additionally requires the portability and extraction requirements in `FULL_STATUS.md`.

Current priority candidates:

- **Any to Any Converter** — browser-local core and existing extraction documentation.
- **Task List** — local-first core with optional authenticated Supabase sync; target qualification is at least 75% before standalone packaging.
- Selected local image/security/encoding tools after route and extraction validation.

## GitHub Pages role

GitHub Pages at `https://dracorisz.github.io/appforge/` is the **developer and project documentation portal**. It is not an AppForge application fallback and does not build or serve the product PWA.

The production application and its `/api` routes remain on `https://www.sstoken.space/`. Pages publishes documentation from `docs/**` through `.github/workflows/pages.yml` and is intentionally independent from the manual Vercel production release.

## Consistency rule

Every canonical registry item must resolve intentionally. Implemented tools should route to their dedicated component or shared workbench. Planned apps should resolve to the planned-app surface rather than silently redirecting to the dashboard. Alias entries should be documented as aliases and must not create conflicting product identities.

## Working rule

Do not create parallel progress spreadsheets for app status. Update the canonical registry status/version, the relevant GitHub issue/checklist, and app documentation. Project Pulse should derive from those sources.

When architecture or deployment roles change, update this document in the same pass so Pages never describes a historical topology as current.
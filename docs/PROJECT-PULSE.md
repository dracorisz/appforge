# Project Pulse

Project Pulse is the release-tracking layer for AppForge. Its goal is to move every registry entry toward a polished, installable PWA without maintaining a second disconnected task list.

## Source of truth

- App inventory, route, version and release state: `src/lib/registry.ts`
- Shared PWA configuration: `vite.config.ts`
- Launch gates and external dependencies: `docs/LAUNCH-CHECKLIST.md`
- Cloud experiments and bounded media worker: `docs/CLOUD-EXPERIMENTS.md`
- GitHub Pages build: `.github/workflows/pages.yml`

## Readiness scale

Project Pulse converts the registry status into a portfolio indicator:

| Registry status | Readiness | Meaning |
| --- | ---: | --- |
| `idea` | 20% | Product shape exists, implementation is not release-ready. |
| `building` | 45% | Main workflow exists but launch gates remain. |
| `beta` | 75% | Usable app with shared PWA shell; polish, verification or production hardening may remain. |
| `launched` | 100% | Production-ready and verified against the release checklist. |
| `deprecated` | 0% | Not part of the active release portfolio. |

The percentage is intentionally a release signal, not a test-coverage claim.

## Definition of a full-ready AppForge PWA

An app can move to `launched` only when its applicable gates are complete:

1. It has a stable route and registry metadata.
2. It renders correctly on mobile and desktop.
3. Core workflows have clear empty, loading and error states.
4. Public/private access behavior is intentional and documented.
5. The shared installable manifest, icons and service worker work on the production host.
6. Static assets remain available through the offline application shell where appropriate.
7. Any server API, storage or AI dependency has bounded failure behavior and does not expose secrets to the browser.
8. Build, lint, TypeScript and relevant automated tests pass.
9. The app has a release/version note in the registry or changelog when materially changed.
10. Live smoke testing confirms the production route after deployment.

## GitHub Pages

The Pages workflow is a secondary static publication target and structural fallback. It builds with `VITE_BASE_PATH=/appforge/` so Vite assets and the PWA manifest use the project subpath rather than assuming the site is hosted at `/`.

GitHub Pages cannot provide AppForge's serverless `/api` features by itself. Apps that require server APIs should present their existing failure states on Pages; the primary production deployment remains the full-stack host.

## Working rule

Do not create parallel progress spreadsheets for app status. Update the registry status/version and the relevant launch checklist item, and Project Pulse reflects that state in the product UI.

# Project Pulse

Project Pulse is the compact readiness view for AppForge. It summarizes the integrated product without creating a second app-status system beside the canonical registry and GitHub Issues.

## Sources of truth

- App identity, route, version and maturity: `src/lib/registry.ts`
- Routing and access behavior: `src/App.tsx`
- Public catalog: `/explore`
- AppForge PWA configuration: `vite.config.ts` and `src/components/pwa/`
- Database/security state: `supabase/migrations/` and security documentation
- Release checks: `docs/LAUNCH-CHECKLIST.md`
- Actionable backlog: GitHub Issues

## Maturity scale

| Registry status | Readiness signal | Meaning |
| --- | ---: | --- |
| `idea` | 20% | Product shape exists; implementation may be minimal or planned. |
| `building` | 45% | Main workflow is under active implementation. |
| `beta` | 75% | Useful end-to-end with remaining product, reliability, or verification work. |
| `launched` | 100% | Stable production AppForge capability with primary workflows verified. |
| `deprecated` | 0% | Not part of the active product portfolio. |

These percentages are directional product-readiness signals, not test coverage. There is no additional per-app standalone-PWA or fork-readiness qualification.

## Definition of launched

An app can move to `launched` when its applicable gates are complete:

1. Stable registry identity and canonical route.
2. Intentional public/authenticated access behavior.
3. Core workflow works on desktop and mobile.
4. Loading, empty, success, retry, and recoverable failure states are clear.
5. Server, storage, and provider dependencies fail safely and expose no browser-side secrets.
6. Accessibility basics and direct-route reload behavior are verified.
7. AppForge-wide PWA shell behavior remains healthy.
8. `npm run verify:release` passes.
9. Material changes have appropriate registry/changelog notes.
10. Production smoke testing succeeds after the deliberate deploy.

## Platform state

AppForge currently combines a public landing experience and app directory with an authenticated workspace, shared profile/preferences, Media Vault, public tools, AI-assisted creator surfaces, and server-backed integrations. `src/lib/registry.ts` remains the authoritative app inventory rather than this document duplicating every entry.

AppForge itself remains an installable PWA. The service worker, manifest, update flow, and offline shell are platform responsibilities. Internal apps are product modules inside that platform, not separate PWA candidates.

GitHub Pages serves only this documentation at `docs.sstoken.space`; it is not an application fallback. The production product and `/api` routes remain at `sstoken.space`.

## Current priorities

- Keep public and authenticated navigation/design consistent across the platform.
- Verify critical cross-app workflows such as Getter Pro → Media Vault in production.
- Continue Story Studio and Desktop Buddy product polish with secure provider boundaries.
- Keep app registry status aligned with actual behavior and production verification.
- Maintain AppForge PWA install/update behavior as shared infrastructure.
- Reduce duplicated documentation and keep operational/security guidance current.

## Working rule

Do not create parallel maturity systems or per-app PWA-readiness scores. Update the registry, the relevant GitHub issue, release checklist, and concise platform documentation when state changes.

# Apps

AppForge is one integrated product made of focused tools. This page is the single documentation entry point for the app catalog; individual app documentation pages are intentionally not maintained here.

For the live catalog, use **[sstoken.space/explore](https://www.sstoken.space/explore)**. The canonical source of app identity, route, category, version, and maturity is `src/lib/registry.ts`.

## Access model

AppForge exposes two main kinds of app surfaces:

- **Public** — usable without an account when the route is explicitly allowlisted for signed-out access.
- **Workspace** — requires authentication because the workflow depends on private state, storage, profile data, or protected integrations.

Public availability is a routing/security decision, not a maturity level. A Beta app may be public or workspace-only.

## Maturity states

The registry uses a small product-status model:

| Status | Meaning |
| --- | --- |
| `idea` | Planned concept or deliberate preview surface. |
| `building` | Active implementation; primary workflow may still change. |
| `beta` | Useful end-to-end with remaining product, reliability, or verification work. |
| `launched` | Stable production AppForge capability with verified primary workflows. |
| `deprecated` | Retained only for compatibility or migration history. |

AppForge does not use a per-app standalone-PWA, fork-readiness, or extraction maturity level. AppForge itself owns the PWA lifecycle for the whole platform.

## Product families

The catalog spans browser-local utilities, conversion and data tools, image/SVG workflows, media discovery and storage, productivity tools, crypto/weather utilities, and AI-assisted creator experiences.

Representative product surfaces include Getter Pro, Weather Now, Any Converter, Task List, Media Vault, Story Studio, Desktop Buddy, Favicon Studio, SVG Icons, Landing Builder, and the local developer-tool workbenches. Use the live Apps directory for the current full inventory rather than duplicating 40+ entries in documentation.

## Developer contract

When adding or materially changing an app:

1. Keep its canonical identity in `src/lib/registry.ts`.
2. Give it one intentional route in `src/App.tsx`.
3. Reuse shared layout and UI primitives before introducing app-specific chrome.
4. Keep access rules explicit for public versus authenticated use.
5. Document server APIs, Supabase tables/storage, or external providers when they create an operational dependency.
6. Handle loading, empty, success, retry, and recoverable failure states.
7. Verify responsive layout, direct-route reloads, keyboard/focus behavior, and the relevant public/auth flow.
8. Update registry version/changelog metadata when the change is release-significant.
9. Run `npm run audit:apps` and the normal release checks.

Detailed implementation notes should live next to source code, API modules, migrations, or focused operational documents instead of growing a separate documentation tree for every tool.

## Shared platform behavior

All apps live inside the same AppForge design system, authentication boundary, build/version model, and PWA shell. Platform-wide capabilities such as navigation, appearance, update prompts, caching, profile state, favorites, recent apps, and shared storage should remain shared unless a product requirement clearly demands otherwise.

For architecture, continue with **[App model](../APP_MODEL.md)**. For current release readiness, use **[Project Pulse](../PROJECT-PULSE.md)**.

# Apps

AppForge is one integrated product made of focused tools. This page documents the rules for the live catalog; the actual inventory is rendered from `src/lib/registry.ts` and is available at **[sstoken.space/explore](https://www.sstoken.space/explore)**.

## What belongs in the catalog

The user-facing registry should contain product surfaces that can be opened and meaningfully tested. Placeholder concepts are no longer kept in the live registry simply to reserve a name or route.

- **`beta`** — useful end-to-end, with remaining polish, reliability, or verification work.
- **`launched`** — stable production capability with verified primary workflows.
- **`deprecated`** — compatibility-only state when a legacy identity or migration path must temporarily remain addressable.

`idea` and `building` remain valid development vocabulary in code and planning, but unfinished apps should stay in issues, branches, or implementation work until they are ready for the live catalog. This keeps Dashboard, search, sidebar navigation, public Explore, and documentation from advertising empty app shells.

## Access model

Catalog maturity and access are separate decisions:

- **Public** routes can be used without an account when the workflow is safe and useful without private state.
- **Workspace** routes require authentication when they depend on user storage, profiles, private data, protected provider calls, or account-level synchronization.

A beta app can therefore be public or signed-in only.

## Current product families

The current catalog includes browser-local developer utilities, converters, image/SVG tools, live weather and market utilities, productivity tools, media discovery and storage, and AI-assisted creator workflows.

Important integrated surfaces include Getter Pro, Weather Now, Crypto Track, Any to Any Converter, Task List, Media Vault, Story Studio, Desktop Buddy, Favicon Studio, SVG Icons, Landing Builder, and the browser-local utility workbenches. Use the live Apps directory rather than copying a fixed app count into docs.

Media and creator apps share platform services instead of inventing isolated storage models. Media Vault supports user-created folders and sorting; Desktop Buddy automatically archives generated characters under **Desktop Buddies**; Story Studio scenes retain their authoritative story linkage; Getter Pro can save source references to the signed-in vault.

## Developer contract

When adding or materially changing an app:

1. Implement and test the primary workflow before exposing it in the live registry.
2. Keep its canonical identity, route, category, version, and maturity in `src/lib/registry.ts`.
3. Give it one intentional route in `src/App.tsx` and avoid duplicate legacy surfaces.
4. Reuse the shared responsive layout and UI primitives before creating app-specific chrome.
5. Keep public versus authenticated access explicit.
6. Document server APIs, Supabase tables/storage, or external providers when they create an operational dependency.
7. Handle loading, empty, success, retry, and recoverable failure states.
8. Verify direct-route reloads, responsive layout, keyboard/focus behavior, and the relevant public/auth flow.
9. Run `npm run audit:apps` and the normal release checks before production deployment.

## Shared platform behavior

All apps use the same AppForge authentication boundary, navigation, build identity, PWA lifecycle, and design system. Shared capabilities such as appearance, update/install prompts, caching, preferences, favorites, recent apps, storage, and provider access should remain platform services unless a product requirement clearly demands otherwise.

For architecture, continue with **[App model](../APP_MODEL.md)**. For signed-in persistence, read **[Database](../DATABASE.md)**. For release readiness, use **[Project Pulse](../PROJECT-PULSE.md)**.

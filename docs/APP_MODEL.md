# AppForge app model

AppForge is one integrated product containing many focused tools. This document defines the shared contract that keeps those tools consistent across the registry, routing, UI, authentication, data, and releases.

## Canonical identity

Every app should resolve to one stable registry record in `src/lib/registry.ts`:

- `id` — stable internal slug;
- `name` — user-facing product name;
- `description` — concise catalog copy;
- `category` — stable category id;
- `icon` — canonical icon key;
- `route` — canonical AppForge route;
- `tags` — search/discovery terms;
- `version` — app-level version;
- `status` — `idea`, `building`, `beta`, `launched`, or `deprecated`;
- `changelog` — meaningful app-level release notes when applicable.

The registry is authoritative for app identity. Components, docs, headers, search results, and marketing surfaces should not invent alternate names or maturity states.

## Status semantics

- **Idea** — planned concept or deliberate preview surface.
- **Building** — active implementation; primary workflows may still change.
- **Beta** — usable end-to-end with remaining product, reliability, or verification work.
- **Launched** — stable production AppForge capability with verified primary workflows.
- **Deprecated** — retained only for compatibility or migration history.

There is no `Full`, fork-ready, extraction-ready, or standalone-PWA app status in AppForge. The installable PWA is the AppForge platform itself.

## Access and runtime

When useful, app behavior can be described with operational metadata such as:

- access: public, authenticated, or mixed;
- runtime: browser-local, server-backed, or hybrid;
- storage: none, browser, Supabase, Media Vault, or mixed;
- provider dependencies: external APIs or AI providers;
- data sensitivity: public, user-private, or mixed;
- import/export formats where they are genuine product features.

Only surface metadata that is accurate and maintained. Unknown values should not be guessed.

## Routing and access

Each registry entry must resolve intentionally through `src/App.tsx` or the appropriate shared route/workbench. Public signed-out access must be explicit. Authenticated workflows should return users to the intended route after sign-in.

A planned tool may intentionally render a planned-app surface; it should not silently redirect to an unrelated product.

## Shared UI contract

AppForge apps should converge on the same platform conventions:

- shared navigation and shell behavior;
- semantic Appearance tokens rather than app-specific hardcoded themes;
- consistent Card, Button, Input, Select, dialog, and focus behavior;
- compact app/meta information where useful;
- touch-safe controls and responsive layouts;
- explicit loading, empty, success, retry, and recoverable error states;
- no duplicate global support/navigation controls inside individual app work surfaces;
- no decorative vertical card jump on hover;
- product-specific secondary navigation should stay inside the work surface.

## Data and provider boundaries

Browser code must never contain server-only secrets. Prefer narrow same-origin `/api` endpoints for CORS-sensitive or credentialed integrations. Supabase Row Level Security remains the boundary for user-owned data.

Apps that depend on provider quotas, storage, paid calls, or asynchronous jobs should expose bounded failure behavior and avoid ambiguous success states.

## AppForge PWA boundary

`vite.config.ts` and `src/components/pwa/` define the install/update/offline lifecycle for AppForge as one product. Internal app development should not add per-app manifests, per-app service workers, or separate PWA-readiness gates.

## Readiness audit

Before changing an app to `launched`, verify that:

1. registry identity matches implementation;
2. route and access rules are intentional;
3. core desktop and mobile workflows are stable;
4. loading/error/empty states are handled;
5. provider and storage claims match code;
6. accessibility basics are present;
7. direct route and hard reload work;
8. lint, TypeScript, tests, build, and app-registry audit pass;
9. production smoke testing succeeds after the deliberate release.

Use **[Project Pulse](./PROJECT-PULSE.md)** for the project-wide readiness view and **[Apps](./apps/index.md)** for the consolidated catalog guidance.

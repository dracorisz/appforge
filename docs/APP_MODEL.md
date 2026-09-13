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
- a registry-backed `AppHeading` with an icon, title and concise purpose; no decorative status/category pills or duplicated metadata bars;
- shared shape tokens in `tailwind.config.js` driven by `--radius`, with deliberate circles kept for avatars and progress indicators;
- default Card padding when the caller does not specify its own padding;
- the same `max-w-7xl` public header/content/footer alignment, using `PublicFooter` across public pages;
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

## Admin entry points

Settings → Admin links directly to the protected unified console:

- `/settings/admin?section=content` — Content Manager, including the public landing app-count toggle;
- `/settings/admin?section=marketing` — Marketing Studio;
- `/settings/admin?section=apps` — app presentation;
- `/settings/admin?section=users` — accounts.

All sections keep the admin-role and TOTP/AAL2 boundary. The landing app-count preference is stored as `show_active_app_count` in the published walkthrough record’s metadata, defaults to visible, and can be changed by AAL2 admins only.

The published walkthrough may be either a supported YouTube URL or a video uploaded to the admin content bucket. App presentation overrides are public-readable and admin-writable; cover images and the global visibility switch apply consistently to catalogs, search, sidebar navigation, landing counts, and direct app routes.

Workspace backup format v3 contains only account workspace preferences: theme, favorites, recent apps, sidebar/category overrides, and widget switches. It deliberately excludes old registry/project seed rows, profile data, media, generated projects, and provider credentials.

## DNS Checker

`/apps/dns-checker` replaces the TXT-only tool. The old `/apps/dns-txt-checker` route remains compatible and the internal app ID remains stable for existing favorites. Google Public DNS provides keyless DNS-over-HTTPS queries. Common records checks 12 types; the type selector and numeric type input support other resource records. The record map shows one resolver’s answers and their relationships, not geographic propagation. Zone transfers are excluded. SRV/DKIM/DMARC and reverse PTR queries require the appropriate complete DNS owner name.

## Shared surface rules

Current AppForge pages should compose shared `Card`, `Button`, `Input`, `Textarea`, `Tabs`, badges, empty/loading/error states, and the canonical app heading/shell instead of recreating their own control systems. Page-level groups use a compact, predictable spacing rhythm; action buttons belong with the controls they affect rather than floating in headings.

Avoid layout animation that moves cards vertically on hover. Prefer border/background/focus feedback. Empty results should not leave invisible grid wrappers that create extra vertical gaps. Account/popover surfaces must support explicit dismissal and outside-click dismissal.

Settings uses the same component contract as apps: Profile is arranged to use wide-screen space efficiently, Integrations is a compact mosaic rather than equal-height stretched cards, and Admin Console is embedded as a first-class Settings surface.


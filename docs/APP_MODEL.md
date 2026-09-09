# AppForge mini-app model

This document defines the canonical product model that every AppForge mini-app should converge on. The goal is to keep registry data, cards, routes, docs, PWA/fork status, access rules and exports consistent everywhere.

## Canonical identity

Every mini-app must have one stable identity record:

- `id` — stable internal slug, never reused.
- `name` — user-facing product name.
- `description` — concise product description used consistently in cards/docs.
- `category` — stable category id.
- `icon` — canonical icon key.
- `route` — canonical AppForge route.
- `tags` — search/discovery terms.
- `version` — app-level semantic version.
- `status` — Idea / Building / Beta / Launched / Full / Deprecated.
- `changelog` — meaningful app-level release history.

## Capability metadata target

Registry entries should progressively add these fields as they are verified:

- `access`: `public` | `authenticated` | `mixed`
- `runtime`: `local` | `server` | `hybrid`
- `storage`: `none` | `browser` | `supabase` | `media-vault` | `mixed`
- `pwa`: `appforge-shell` | `standalone-candidate` | `standalone-ready`
- `forkReady`: boolean
- `exportFormats`: list of product/export formats
- `importFormats`: list of supported project/input formats
- `providerDependencies`: external provider names when applicable
- `dataSensitivity`: `none` | `user-private` | `public-and-private`
- `docsPath`: canonical app documentation path

These fields should be surfaced only after they are accurate. Unknown values should not be guessed.

## Status semantics

- **Idea** — planned concept.
- **Building** — implementation in progress; not ready for normal users.
- **Beta** — usable, but still expects product or reliability gaps.
- **Launched** — stable AppForge product with normal production support.
- **Full** — Launched plus independently forkable as a complete ready-made PWA under `docs/FULL_STATUS.md`.
- **Deprecated** — retained only for migration/history.

No UI should use a different meaning for these labels.

## Registry as source of truth

The registry is authoritative for product identity and discovery. Individual components should not hardcode alternate names, stale provider copy, versions or fallback icons.

App-specific runtime data can live elsewhere, but these should always resolve back to the registry entry:

- dashboard cards;
- search results;
- app headers/meta bars;
- Recent/Favorites data even when those views are not in the sidebar;
- public marketing copy when an app is featured;
- docs/version references;
- forkability status.

## Settings export/import

Settings → Data export/import is an **AppForge workspace portability feature**, not the same thing as a mini-app product export.

Workspace export should be used for:

- AppForge settings and appearance;
- favorites/recent state;
- compatible workspace/project state;
- profile snapshot metadata included by the exporter.

Workspace import restores compatible AppForge state into another browser/account session. It does not automatically copy server-owned binary assets or external-provider data unless the exporting app explicitly embeds/references them.

Each mini-app may also expose its own product export/import. Examples:

- Novel Builder → Markdown/document project.
- Comics Builder → HTML/comic project package.
- Any Converter → converted file output.
- Landing Builder → static site/project JSON.

Product export belongs to the mini-app; workspace backup belongs to Settings.

## Uniform UI contract

All Beta+ mini-apps should use the same shell principles:

- semantic Appearance tokens rather than hardcoded themes;
- one compact app/meta header treatment;
- primary action in the same visual hierarchy;
- consistent Card/Button/Input/Select components;
- touch-safe controls;
- loading/empty/error states;
- no duplicate support/donation buttons inside individual app headers;
- app-specific secondary navigation inside the work surface rather than global sidebar clutter;
- export/import actions labeled by what they actually export.

## Readiness audit

Before marketing or promoting an app status, verify:

1. registry identity matches implementation and docs;
2. access rule matches routing/auth behavior;
3. runtime/provider claims match actual code;
4. app version/changelog is current;
5. export/import behavior is documented;
6. Appearance behavior is consistent;
7. production route has passed a smoke test;
8. Full status, if claimed, passes `docs/FULL_STATUS.md`.

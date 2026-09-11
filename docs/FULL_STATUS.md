# AppForge Full Status Standard

Last updated: 2026-09-11

`Full` is the terminal readiness status for an AppForge mini-app. It means the mini-app is not only usable inside AppForge, but is complete enough to be forked and developed as an independent ready-made PWA without depending on undocumented AppForge internals.

## Status ladder

- **Idea** — planned concept; may have partial preview code.
- **Building** — active implementation; core workflows may still change.
- **Beta** — useful end-to-end inside AppForge, but still has verification, polish, portability, or documentation gaps.
- **Launched** — production-ready inside AppForge with stable primary workflows and no known P0/P1 blocker.
- **Full** — production-ready inside AppForge **and** extraction/fork ready as an independent PWA.
- **Deprecated** — kept only for compatibility/history and should not receive new feature work.

## Required criteria for Full

A mini-app can be marked `Full` only when all criteria below are true.

### 1. Product completeness

- Primary workflow works end-to-end on desktop and mobile.
- Empty, loading, success, retry, quota/rate-limit and recoverable failure states are handled.
- No placeholder buttons, fake data, dead controls or unfinished core panels.
- Refresh/direct-route behavior is stable.
- The app has a clear purpose, onboarding sentence and usable defaults.

### 2. PWA independence

- Has a documented standalone entry route/component.
- Has an app-specific name, short description, icon, version and manifest-ready metadata.
- Works under an installable HTTPS PWA shell.
- Documents which features work offline and which require network/provider access.
- AppForge-only navigation, favorites, admin, People/Profile and unrelated shared surfaces are optional adapters, not hard dependencies.

### 3. Data and API portability

- All required browser, Supabase, Vercel and third-party dependencies are documented.
- Required environment variables are listed in an app-specific example.
- Database tables, RPCs, RLS/storage policies and migrations required by the app are identified.
- Provider quotas and fallback behavior are documented.
- Personal/user-supplied credentials are clearly separated from server credentials.
- No secret is embedded in client source.

### 4. Fork package

Each Full app must have a fork guide containing:

- source component(s) and helper modules;
- API endpoints used;
- migrations/storage used;
- assets/icons used;
- minimum package dependencies;
- environment variables;
- local run instructions;
- build/deploy instructions;
- known optional integrations that can be removed;
- license/attribution requirements.

A developer should be able to clone AppForge, follow only that mini-app's fork guide, and extract a working standalone project without reverse-engineering unrelated code.

### 5. Quality gate

Before Full:

- `npm run typecheck` passes;
- `npm run build` passes;
- real linting is configured and passes for the app's code path;
- primary public/signed-in flows are smoke-tested on the active production deployment;
- no known P0/P1 issue remains for the app;
- relevant accessibility basics are present: labels, keyboard/touch actions, focus states and meaningful alt text;
- mobile layout is verified at narrow width;
- destructive actions have appropriate confirmation/semantics.

### 6. Documentation and versioning

A Full app has:

- `docs/apps/<app-id>/README.md` (or equivalent current app doc);
- current version and changelog in the registry;
- architecture/data-flow summary;
- user-facing limitations;
- provider/storage/quota notes when applicable;
- fork/extraction section;
- screenshot/marketing checklist;
- production route and standalone target name.

## Full badge meaning

The `Full` badge is a promise to developers:

> This mini-app is complete, production-tested, documented, and intentionally structured so you can fork it into your own independent PWA.

It is stronger than `Launched`. A Launched app may still depend heavily on AppForge identity, shell, storage, or shared APIs; a Full app must document and isolate those dependencies.

## Current launch policy

Do not promote apps to Full based only on feature count. AppForge may advertise Beta and Launched apps today, but Full should remain scarce and credible.

Initial likely Full candidates after verification/packaging are small browser-first utilities such as Any Converter and selected local developer/image tools. Server/provider-heavy apps such as Getter Pro, Media Vault and the Story Studio require more extraction documentation and environment packaging before Full.

## Fork guide template

Every Full candidate should eventually contain this section in its app docs:

```text
Standalone product name:
AppForge route:
Entry component:
Shared UI imports:
Shared helper imports:
Server API routes:
Database migrations:
Storage buckets:
Environment variables:
Required npm dependencies:
Optional AppForge integrations:
Standalone auth requirement:
Offline behavior:
Build command:
Deployment target:
Smoke-test checklist:
```

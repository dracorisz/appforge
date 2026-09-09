# AppForge standalone PWA graduation template

AppForge **Full** means a mini-app can be extracted/forked into a complete standalone PWA without reverse-engineering the AppForge shell.

This document is the repeatable graduation pattern. App-specific guides live at `docs/apps/<app-id>/README.md`.

## 1. Product boundary

Every guide must identify:

- canonical product name and AppForge registry ID;
- AppForge route and entry component;
- core engine/library files;
- server API routes, if any;
- database migrations, storage buckets and auth dependencies, if any;
- environment variables/providers, with secrets explicitly server-only;
- optional AppForge integrations that can be removed.

A standalone core should not import dashboard navigation, favorites, global category state, unrelated providers, or account state unless those are essential product features.

## 2. Minimal standalone structure

Recommended structure:

```text
standalone-app/
  public/
    favicon.svg
    pwa-192x192.png
    pwa-512x512.png
  src/
    App.tsx
    main.tsx
    app/                 # extracted product component(s)
    core/                # product logic with minimal shell coupling
    index.css
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  README.md
```

Use Vite + React + TypeScript unless an app has a documented reason to use another runtime.

## 3. PWA manifest and service worker

Every Full app must define its own:

- `name`, `short_name`, `description`;
- standalone `start_url` and `/` scope;
- 192×192 and 512×512 icons;
- maskable icon where practical;
- theme/background colors;
- installable `display: standalone` manifest;
- service-worker update behavior that does not trap users on a stale build.

For Vite projects, `vite-plugin-pwa` with `registerType: 'prompt'` is the AppForge default. A standalone app may choose another implementation if the update UX is documented.

## 4. Offline expectations

Classify the app explicitly:

- **offline-core:** primary workflow works after first cached load;
- **offline-shell:** app shell loads offline but live/provider work requires a network;
- **online-required:** product fundamentally depends on remote services.

Do not claim offline support for provider-backed features that cannot operate without a network.

## 5. Data and migration

For persistent apps document:

- local schema/version;
- export format;
- import validation;
- migration strategy from AppForge-hosted data;
- deletion/reset controls;
- what stays local versus remote.

A Full app with local projects should have deterministic JSON export/import or an equivalent portable format.

## 6. Security and providers

- Browser code must never contain provider client secrets or service-role credentials.
- Public API keys must be documented as public by design; otherwise use a server function.
- OAuth scopes must be minimum necessary for implemented user-facing features.
- Provider approval gaps must remain disabled rather than simulated.
- External-source apps must preserve provenance and relevant rights/attribution boundaries.

## 7. Accessibility/mobile gate

Before Full:

- all primary actions keyboard reachable;
- visible focus states;
- touch targets approximately 40–44px where practical;
- labels for form controls/icon-only buttons;
- usable narrow mobile layout without horizontal UI clipping;
- loading/error/empty states are understandable;
- color is not the only status signal.

## 8. Verification gate

The repository CI is the minimum code gate:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

For a standalone extraction, run the equivalent commands in the extracted package too.

Production/deployment smoke is separate from code correctness and should verify:

- direct hard reload on the app route;
- install/update behavior;
- representative valid/invalid workflows;
- provider failures where relevant;
- offline classification promises;
- no P0/P1 console errors.

## 9. Extraction procedure

1. Copy the app entry component and its core libraries into the standalone project.
2. Copy only the shared UI primitives actually imported, or replace them with local equivalents.
3. Remove AppForge dashboard/navigation/favorites/category imports.
4. Recreate semantic theme CSS variables used by the copied components.
5. Copy only required npm dependencies.
6. Add app-specific manifest/icons/service worker configuration.
7. Add provider/server configuration only if the app truly needs it.
8. Add portable import/export for persisted data where applicable.
9. Run lint/typecheck/tests/build.
10. Install the PWA and execute the app-specific smoke matrix.

## 10. Full-status checklist

An app may be marked **Full** when:

- [ ] app-specific guide is complete;
- [ ] core dependency boundary is documented;
- [ ] standalone manifest/icons exist or exact generation steps are provided;
- [ ] local/remote data boundary is documented;
- [ ] auth/provider setup is documented if required;
- [ ] extraction steps are copyable and deterministic;
- [ ] accessibility/mobile expectations pass;
- [ ] lint/typecheck/tests/build pass;
- [ ] offline classification is verified;
- [ ] production/standalone smoke passes.

Use this template for every new Full candidate rather than inventing a new extraction process per mini-app.

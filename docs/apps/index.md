# Apps

AppForge is organized around focused tools with a canonical registry identity and an explicit maturity path. This section collects app-specific documentation and standalone-PWA extraction notes.

## Standalone-PWA direction

The target is not to claim every embedded tool is already independent. A **Full** app should have a clear capability boundary, install/build instructions, validation coverage, PWA metadata, offline behavior where appropriate, screenshots, and a repeatable extraction/fork procedure.

Read the shared [Full-status standard](../FULL_STATUS.md), [Project Pulse](../PROJECT-PULSE.md), and [Standalone PWA template](../STANDALONE_PWA_TEMPLATE.md) before promoting an app.

## Current documented candidates

### Any to Any Converter

Browser-local structured-data and text conversion remains the strongest first standalone-PWA candidate because its core workflow does not require authentication, Supabase, Vercel APIs, or third-party provider credentials.

[Read Any Converter documentation](./any-converter/README.md)

### Task List

Task List is the second explicit candidate. Its core create/complete/delete workflow is local-first, while authenticated Supabase synchronization is an optional adapter. The current target is to verify at least 75% readiness before standalone packaging.

[Read Task List documentation](./task-list/README.md)

## Current catalog model

The canonical registry currently contains 45 entries after Task List was added. These include dedicated apps, shared workbench tools, legacy mini-app shells, planned apps, and one intentional route alias (`Data Converter` → `Any to Any Converter`).

Every canonical entry should now resolve intentionally: implemented routes reach their component/workbench, while unimplemented `/apps/*` entries reach the planned-app surface rather than silently returning to the dashboard.

The repeatable integrity check is:

```bash
npm run audit:apps
```

CI runs this before lint/typecheck/tests/build. It checks app IDs, categories, status/version/route shape, intentional route aliases, and router coverage.

## Product families

The registry spans browser-local utilities, image/SVG tools, data/conversion utilities, authenticated media workflows, AI-assisted creator experiences, and productivity tools. Maturity is summarized in [Project Pulse](../PROJECT-PULSE.md); sequencing is in [Development timeline](../DEVELOPMENT_TIMELINE.md).

## Adding an app doc

For a specialized app moving toward Full status, add `docs/apps/<slug>/README.md` covering:

1. purpose and user-facing boundary;
2. primary source files and dependencies;
3. local/server/provider requirements;
4. data and security profile;
5. PWA/offline classification;
6. representative validation matrix;
7. extraction/fork procedure;
8. remaining promotion gates.

Keep app name, route, status and version aligned with `src/lib/registry.ts`. When a new app is implemented, update route + registry + docs + integrity expectations in the same development pass.
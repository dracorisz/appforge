# Apps

AppForge is organized around focused tools with a canonical registry identity and an explicit maturity path. This section collects app-specific documentation and standalone-PWA extraction notes.

## Standalone-PWA direction

The target is not to claim every embedded tool is already independent. A **Full** app should have a clear capability boundary, install/build instructions, validation coverage, PWA metadata, offline behavior where appropriate, screenshots, and a repeatable extraction/fork procedure.

Read the shared [Full-status standard](../FULL_STATUS.md) and [Standalone PWA template](../STANDALONE_PWA_TEMPLATE.md) before promoting an app.

## Current documented candidates

### Any to Any Converter

Browser-local structured-data and text conversion is the strongest first standalone-PWA candidate because its core workflow does not require authentication, Supabase, Vercel APIs, or third-party provider credentials.

[Read Any Converter documentation](./any-converter/README.md)

## Product families

The canonical AppForge registry currently covers browser-local utilities, image/SVG tools, data/conversion utilities, authenticated media workflows, and AI-assisted creator experiences. Project maturity and per-app status are summarized in [Project Pulse](../PROJECT-PULSE.md).

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

Keep the app name, route, status and version aligned with the canonical registry instead of duplicating conflicting product metadata in documentation.

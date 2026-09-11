# Apps

AppForge is organized around focused tools with a canonical registry identity and an explicit maturity path. This section collects app-specific documentation and standalone-PWA extraction notes.

## Current product highlights

### Desktop Buddy

Desktop Buddy is now the canonical dragon companion at `/apps/desktop-buddy`, replacing retired Pariflow Smpl in the 45-entry registry. The current implementation includes KDE Community Konqi starter artwork with source/license metadata, custom image upload, local persistence, framing controls, versioned buddy packs, transparent 512 × 512 PNG export where the source permits it, browser speech controls, and an `appforge:agent-response` reaction bridge.

The current workspace also includes explicit Hugging Face and Vertex generation paths, an owner-scoped Vertex recovery ledger, local transparency repair, a persistent cross-route companion, grouped generation/cleanup controls, browser display capture, and screenshot import fallback. Production provider activation and one cost-observed Vertex smoke call remain separate environment/release gates.

[Read Desktop Buddy documentation](./desktop-buddy.md)

### Getter Pro

Getter Pro is the current product identity at `/apps/getter-pro`; the stable internal `scrapper-pro` ID remains for compatibility. Result cards now expose individual **Save**, **Download**, **Open**, and **Copy URL** actions, while bulk local-save, Media Vault, and provenance export workflows remain available.

Source restrictions can still prevent a browser from fetching some remote media directly. In that case Getter opens the original media so the user can save it from its source rather than silently claiming a download succeeded.

## Standalone-PWA direction

The target is not to claim every embedded tool is already independent. A **Full** app should have a clear capability boundary, install/build instructions, validation coverage, PWA metadata, offline behavior where appropriate, screenshots, and a repeatable extraction/fork procedure.

Read the shared [Full-status standard](../FULL_STATUS.md), [Project Pulse](../PROJECT-PULSE.md), and [Standalone PWA template](../STANDALONE_PWA_TEMPLATE.md) before promoting an app.

### Any to Any Converter

Browser-local structured-data and text conversion remains the strongest first standalone-PWA candidate because its core workflow does not require authentication, Supabase, Vercel APIs, or third-party provider credentials.

[Read Any Converter documentation](./any-converter/README.md)

### Task List

Task List is the second explicit candidate. Its core create/complete/delete workflow is local-first, while authenticated Supabase synchronization is an optional adapter. The current target is to verify at least 75% readiness before standalone packaging.

[Read Task List documentation](./task-list/README.md)

## Media and creator surfaces

### Media Vault

Media Vault is the shared authenticated asset surface for General uploads, Story Studio-linked scenes and Getter Pro source references. It supports Grid, Showcase and List views. Showcase follows the same cinematic card language used by the Hugging Face × Story Studio gallery.

### Story Studio

Story Studio / Dragon Arena uses the joypad/gamepad icon consistently across app surfaces. Signed-out `/apps/ai-dragon-arena` is an AI integrations/promotional page; authenticated users receive the full creator workspace.

## Newly routed browser tools

**Markdown Previewer** and **SVG Tool** now resolve to dedicated browser-local implementations instead of the generic planned-app card. Markdown Previewer persists a draft, safely escapes raw HTML, renders common Markdown, and supports copy/reset/download. SVG Tool validates XML, rejects script elements from preview, performs conservative cleanup, and supports copy/download.

Both entries intentionally remain `Idea` in the canonical registry until focused product verification and maturity review are complete. PDF Tool, Excel Tool, and Audio Converter still resolve to the planned-app surface.

## Retired app

**Pariflow Smpl is no longer a canonical AppForge app.** It was removed from the registry when Desktop Buddy became canonical. The old component is reduced to a redirect and its prior browser-side credential fallback has been removed from the active code path.

## Current catalog model

The canonical registry contains 45 entries. Desktop Buddy now occupies the product slot previously held by Pariflow Smpl. The catalog includes dedicated apps, shared workbench tools, legacy mini-app shells, planned apps, and one intentional route alias (`Data Converter` → `Any to Any Converter`).

Every canonical entry should resolve intentionally: implemented routes reach their component/workbench or a dedicated registry-fallback implementation, while unimplemented `/apps/*` entries reach the planned-app surface rather than silently returning to an unrelated app.

The repeatable integrity check is:

```bash
npm run audit:apps
```

CI runs this before lint/typecheck/tests/build. It checks app IDs, categories, status/version/route shape, intentional route aliases, dedicated fallback implementations, and router coverage.

## Product families

The registry spans browser-local utilities, image/SVG tools, data/conversion utilities, authenticated media workflows, AI-assisted creator experiences, and productivity tools. Maturity is summarized in [Project Pulse](../PROJECT-PULSE.md); sequencing is in [Development timeline](../DEVELOPMENT_TIMELINE.md).

## Adding an app doc

For a specialized app moving toward Full status, add `docs/apps/<slug>/README.md` or a dedicated `docs/apps/<slug>.md` page covering:

1. purpose and user-facing boundary;
2. primary source files and dependencies;
3. local/server/provider requirements;
4. data and security profile;
5. PWA/offline classification;
6. representative validation matrix;
7. extraction/fork procedure;
8. remaining promotion gates.

Keep app name, route, status and version aligned with `src/lib/registry.ts`. When a new app is implemented, update route + registry + docs + integrity expectations in the same development pass.

# Landing Builder — standalone PWA guide

Registry ID: `landing-builder`  
AppForge route: `/apps/landing-builder`

## Product boundary

Entry component: `src/components/public/LandingBuilder.tsx`.

The no-login core is browser-local and requires no server APIs, authentication, database, storage bucket, or provider credentials.

Core capabilities:

- local versioned project schema;
- hero/features/gallery/CTA/FAQ/footer sections;
- keyboard/touch-safe up/down ordering controls;
- inline copy/link editing;
- local image data URLs;
- phone/tablet/desktop preview;
- local named saves;
- project JSON import/export;
- complete standalone HTML export with inline CSS.

## Data format

Project schema: `version: 1`.

A portable project includes:

- name;
- appearance preset;
- accent color;
- ordered section objects;
- local image data URLs where included;
- updated timestamp.

Imports validate the schema/version and require usable sections before replacing the current project.

Browser storage keys:

- current project: `appforge-landing-builder-project-v1`;
- named projects: `appforge-landing-builder-projects-v1`.

## Standalone dependencies

Minimal runtime:

- `react`
- `react-dom`
- `lucide-react`

No AppForge backend dependency is needed. Replace shared semantic theme classes with equivalent local CSS if extracting without the AppForge design system.

## Offline classification

**offline-core** after the PWA shell is cached. Local editing, images, saves, JSON import/export and static HTML export work without network access.

## Export contract

Static HTML output is intentionally self-contained:

- inline CSS;
- semantic section markup;
- embedded local image data URLs;
- no AppForge JavaScript/runtime dependency;
- responsive viewport behavior.

This makes exported pages suitable for ordinary static hosting.

## Deployment guide for exported HTML

The generated `.html` file can be hosted by any static host. Rename it to `index.html` for a root deployment, or keep a custom filename where the host supports direct file routes.

## Verification matrix

- add/remove every section type;
- reorder from keyboard/touch controls;
- edit text/links;
- local image upload;
- all three preview widths;
- browser named-save reload;
- valid project JSON round trip;
- invalid/old project rejection;
- standalone HTML opens without AppForge;
- narrow mobile editor remains usable;
- offline reload after first cached load.

Signed-in cloud sync and Media Vault selection are optional future integrations and must not become requirements for the standalone core.

Follow `docs/STANDALONE_PWA_TEMPLATE.md` for shared Full-status gates.

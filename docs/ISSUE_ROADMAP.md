# AppForge Issue Roadmap

Last updated: 2026-09-10

GitHub Issues are the canonical actionable backlog. This page is a sequencing/index layer, not a second task tracker.

Priority semantics:

- **P0** — release blocker or first-impression regression to resolve before the next deliberate production deploy.
- **P1** — important product/readiness work in the current consolidation.
- **P2** — performance, secondary app work, polish, distribution, and broader catalog hardening.

## P0 — before the next deliberate production deploy

1. **#35 — shell/theme/visual consistency cleanup**
   - verify public-side dark/light intent;
   - check mid-width sidebar fold-out/collapse behavior;
   - sweep supported breakpoints for clipped text, hover-only actions, icon alignment, focus rings, 1px overflow and media drawers;
   - keep screenshots/deterministic fixtures aligned with the resulting UI.
2. **#8 — Story Studio remaining creator-flow polish**
   - core Novel/Comics, turn-linked images, restore and exports exist;
   - remaining focus is creator/project setup, title/cover metadata, semantic-token polish, accessibility/mobile and final smoke verification.
3. **#50 — Getter Pro → Media Vault external image resilience**
   - Bing/external image rows can retain valid provenance while a hotlinked full-image URL expires or rejects rendering;
   - add ordered media/thumbnail/source fallbacks and verify reload behavior.

## P1 — current build-up phase

1. **#32 — GitHub OAuth finishing smoke checks**
   - provider setup and frontend wiring are complete;
   - GitHub login itself is user-confirmed working;
   - remaining checks cover `returnTo`, refresh persistence, logout, provider-linking, mobile, denied OAuth and secret exposure.
2. **#18 — Any Converter first Full standalone-PWA candidate**
   - complete extraction/manifest/offline/install verification.
3. **Task List — second standalone candidate**
   - canonical registry entry, route, local-first UI and Supabase RLS-backed sync exist;
   - target remains at least 75% readiness before independent packaging.
4. **#34 — Marketing publisher**
   - continue metadata/review/publication-record work;
   - delegated YouTube upload remains separate and permission-gated.
5. **#51 — GitHub Marketplace listing submission**
   - detailed description drafted;
   - remaining work is permissions review, screenshots/branding, support/legal links and review follow-through.
6. **#49 — project-derived architecture/developer-experience cleanup**
   - route/registry consistency, provider capability surfaces, service-worker hygiene, version alignment and docs automation.

## P2 — broader hardening / external work

- **#16 — bundle/PWA/performance audit**
- **#29 — YouTube channel Home/manual work** — user-owned manual channel configuration.
- **#48 — funding/community/distribution follow-through** — successor to closed broad launch issue #3.
- planned apps represented by the intentional planned-app surface;
- legacy mini-app cleanup after consumers are confirmed;
- additional browser-local utilities promoted only when they have real workflows rather than metadata-only entries.

## Current implementation state

Recent changes already on `main` include:

- GitHub OAuth provider configured and landing action enabled; login is confirmed working;
- landing `Try a public tool` CTA removed;
- landing footer technology list replaced by Docs link;
- landing Hugging Face wording simplified;
- signed-out `/apps/ai-dragon-arena` is an AI-integrations promotional surface while authenticated Story Studio remains the creator workspace;
- Story Studio / Dragon Arena uses the joypad identity in current app navigation surfaces;
- global inferred image-card drawer behavior removed;
- sidebar weather gadget added;
- Task List route/component, local persistence and optional Supabase sync added;
- Task List RLS migration applied;
- anonymous execution removed from Dragon Arena image quota mutation RPCs;
- Getter Pro is the product-facing name for the stable legacy `scrapper-pro` storage/API identity and has a canonical `/apps/getter-pro` route with compatibility redirect;
- Media Vault has Grid / Showcase / List modes and uses non-overlapping action rails;
- Hugging Face public gallery uses a center-weighted infinite cinematic carousel;
- GitHub Pages is documentation-only, not an application fallback;
- docs branding now derives directly from `favicon.svg`: `#0f172a`, white, and simple black/slate surfaces;
- dark/light derived SVG brand marks are exposed from the docs branding page;
- Buy Me a Coffee funding configuration is present;
- app-integrity audit covers 45 registry entries across 14 categories and currently passes structurally.

## Integrity note

`npm run audit:apps` currently identifies one non-blocking maturity warning: QR Generator is marked `idea` while an explicit route exists. Confirm whether it should remain a preview/idea or be promoted after functional verification.

Use `npm run verify:release` as the combined local/pre-release gate. CI must pass the same structural checks before a release is considered ready.

## Planning horizon

See `docs/DEVELOPMENT_TIMELINE.md`. Current order is more important than exact dates:

1. visual/theme/sidebar + external-media regression cleanup;
2. Story Studio and auth smoke completion;
3. standalone-PWA proof (Any Converter, then Task List);
4. media/publishing/distribution hardening;
5. broader catalog/performance work.

## Documentation hierarchy

- GitHub Issues — canonical actionable state and acceptance checklists.
- `docs/DEVELOPMENT_TIMELINE.md` — sequencing and approximate timeline.
- `docs/ISSUE_ROADMAP.md` — current priority index.
- `docs/PROJECT-PULSE.md` — registry/readiness model.
- `docs/FULL_STATUS.md` — strict fork-ready standard.
- `docs/LAUNCH-CHECKLIST.md` — release gates.
- `docs/ENVIRONMENT.md` — integrated environment and deployment boundaries.
- `docs/AGENT_HANDOFF.md` — agent pickup context.
- `src/lib/registry.ts` — canonical app identity/status metadata.

## Maintenance rule

When substantial work changes state:

1. update the relevant GitHub issue;
2. update registry metadata when app identity/status/version changes;
3. update app-specific documentation for architecture/data changes;
4. update launch/timeline docs if sequencing changes;
5. distinguish code-complete, migration-applied, CI-verified, Pages-published, production-deployed and production-verified states;
6. do not mark an app Full until `FULL_STATUS.md` is actually satisfied.

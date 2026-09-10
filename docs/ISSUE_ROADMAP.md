# AppForge Issue Roadmap

Last updated: 2026-09-10

GitHub Issues are the canonical actionable backlog. This document explains current sequencing and intentionally excludes already-closed umbrella issues from the active priority list.

Priority semantics:

- **P0** — release blocker or first-impression regression that should be resolved before the next deliberate production deploy.
- **P1** — important product/readiness work to complete during the current consolidation or immediately after.
- **P2** — performance, secondary app work, polish, and broader catalog hardening.

## P0 — before the next deliberate production deploy

1. **#32 — GitHub OAuth production smoke**
   - implementation and provider setup are complete;
   - remaining gate is live sign-in, `returnTo`, refresh, logout, cancel/deny and mobile verification after the next intentional deploy.
2. **#8 — Story Studio remaining creator-flow polish**
   - core Novel/Comics, turn-linked images, restore and exports exist;
   - remaining focus is creator/project identity, title/cover metadata, semantic-token polish, accessibility/mobile and final production smoke.
3. **#35 — shell/visual consistency cleanup**
   - commerce metadata cleanup and the image-card action-drawer overlap regression are complete;
   - remaining work is broader shell consistency and real screenshots.

Closed umbrella issues such as #1, #3 and #7 are historical context, not active launch blockers. #9 was already closed.

## P1 — current build-up phase

1. **#18 — Any Converter first Full standalone-PWA candidate**
   - complete extraction/manifest/offline/install verification.
2. **Task List — second standalone candidate**
   - route and local-first UI exist;
   - Supabase table/RLS migration is applied;
   - target at least 75% readiness before standalone packaging;
   - add canonical registry metadata, integrity coverage and mobile/offline verification.
3. **#34 — Marketing publisher**
   - continue metadata/review/publication-record work;
   - delegated YouTube upload remains separate and permission-gated.
4. **#29 — YouTube channel Home/manual work**
   - remains user-owned manual channel configuration.
5. **#48 — funding/community/distribution backlog**
   - successor to closed broad launch issue #3.
6. **#49 — project-derived architecture/developer-experience cleanup**
   - route/registry consistency, provider capability surfaces, release validation, service-worker hygiene and docs automation.

## P2 — broader hardening

- **#16 — bundle/PWA/performance audit**
- planned apps currently represented by the intentional planned-app surface;
- legacy mini-app cleanup after consumers are confirmed;
- additional browser-local utilities promoted only when they have real workflows rather than metadata-only entries.

## Current implementation state

Recent changes already present on `main` include:

- GitHub OAuth provider configured and landing action enabled;
- extra landing `Try a public tool` CTA removed;
- landing footer technology list replaced by Docs link;
- landing Hugging Face label simplified;
- signed-out `/apps/ai-dragon-arena` changed from a playable guest experience to an AI integrations/promotional surface while authenticated Story Studio remains the creator workspace;
- global inferred image-card drawer behavior removed so Story Studio actions do not overlap generated content;
- sidebar weather gadget added;
- Task List route/component plus local-first persistence and optional Supabase sync added;
- Task List RLS migration applied to the connected Supabase project;
- anonymous execution removed from Dragon Arena image quota mutation RPCs;
- GitHub Pages is documentation-only, not an application fallback;
- funding configuration now includes Buy Me a Coffee `appforge`.

## Planning horizon

See `docs/DEVELOPMENT_TIMELINE.md` for the approximate sequence:

- Sep 10–12: consolidation before deploy;
- Sep 12–16: standalone-PWA proof;
- Sep 16–23: Story Studio flagship hardening;
- Sep 23–30: media/publishing;
- Oct 2026: broader catalog hardening.

These windows are planning ranges, not release promises.

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
5. distinguish code-complete, migration-applied, CI-verified and production-verified states;
6. do not mark an app Full until `FULL_STATUS.md` is actually satisfied.
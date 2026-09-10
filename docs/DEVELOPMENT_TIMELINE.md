# AppForge development timeline

Last updated: 2026-09-10

This is a planning horizon, not a promise of exact delivery dates. It exists to keep development sequencing coherent before the next deliberate production deploy.

## Current phase — consolidation before deploy

Target window: **Sep 10–12, 2026**

Focus:

- keep `main` as the canonical integration branch;
- finish GitHub OAuth frontend + docs alignment;
- keep Story Studio private for authenticated creation while using its public route as an AI integrations/architecture promo surface;
- stabilize the new sidebar weather gadget;
- finish Task List as a local-first 75% readiness candidate with optional Supabase sync;
- apply the Task List migration and verify RLS;
- complete the full registry/route integrity audit;
- remove stale docs assumptions and closed-issue references;
- resolve security-advisor findings that indicate unintended exposure;
- keep Vercel production undeployed while this consolidation is still moving.

Exit gate: CI green, docs coherent, migrations reviewed/applied, no known P0 regression, and a written smoke checklist for the next production release.

## Phase 2 — standalone-PWA proof

Target window: **Sep 12–16, 2026**

Primary goals:

1. **Any to Any Converter** — complete the first Full/fork-ready package.
2. **Task List** — qualify as a second standalone candidate if it maintains a local-first core and reaches the 75%+ acceptance target.
3. Add app-specific manifest/fork metadata for selected browser-local utilities.
4. Add route/registry consistency checks to CI.
5. Add a single release-validation command covering lint, typecheck, tests and build.

Exit gate: at least one independently extractable PWA is documented and reproducible from a clean checkout.

## Phase 3 — flagship creator workflow

Target window: **Sep 16–23, 2026**

Focus on Story Studio rather than broad new app count:

- finish creator/project identity setup;
- title/cover metadata and export polish;
- desktop/mobile/accessibility pass;
- provider failure and quota behavior;
- keep public route promotional, with creation behind authentication;
- verify Gemini, Hugging Face, OpenRouter and other documented integration roles remain accurate.

Exit gate: Story Studio has a stable creator flow with no known P0/P1 product-flow issue.

## Phase 4 — media + publishing

Target window: **Sep 23–30, 2026**

- Media Vault + Scrapper Pro integrity and provenance pass;
- Marketing Studio metadata/review workflow;
- YouTube publishing only after the approved delegated OAuth path is genuinely ready;
- complete channel/manual work tracked separately from code.

## Phase 5 — broader catalog hardening

Target window: **Oct 2026**

- graduate selected `building` apps to Beta only when core workflows are real;
- keep `idea` apps on the planned-app surface until implementation exists;
- improve performance, lazy loading and service-worker hygiene;
- reduce duplicated legacy mini-app surfaces;
- add per-app docs for candidates worth independent reuse;
- revisit model/provider lifecycle deadlines before they become urgent.

## Rules for timeline changes

- GitHub Issues are the actionable backlog; this page explains sequencing.
- A date shift is not itself a failure: update the phase when dependencies change.
- Do not mark work complete because it is documented; code, migration, CI and production verification are separate states.
- Production deploy remains a deliberate final gate, not part of normal merge flow.

# AppForge Issue Roadmap

Last updated: 2026-09-09

GitHub Issues are now the canonical actionable backlog. This document provides the publish-soon priority order and keeps the issue tracker aligned with AppForge's product/docs model.

Priority semantics:

- **P0** — launch/publish blocker or first-impression issue. Address before wider promotion.
- **P1** — important next-step product/readiness work. Start immediately after P0 is stable.
- **P2** — worthwhile follow-up, performance, secondary app work, or polish that should not delay publishing.

Issue category labels currently used: `feature`, `bug`, `update`, `upgrade`, `cleanup`, `performance`, `minor-ui`.

## P0 — publish soon

1. **#1 — Public beta testing** (`update`)
   - umbrella production regression/smoke pass before wider promotion.
2. **#3 — Launch: Patreon, funding, OAuth branding, docs and distribution** (`update`)
   - marketing/funding/account surfaces and launch materials.
3. **#7 — Story Studio production smoke test and Hugging Face generation reliability** (`bug`)
   - must prove current text/art generation + persistence against production.
4. **#8 — Story Studio Novel + Comics product flow and export** (`feature`)
   - flagship creative product direction.
5. **#9 — Public landing polish and signed-in Landing route** (`minor-ui`)
   - first impression and advertising conversion.
6. **#11 — Canonical app registry metadata and uniform mini-app shell** (`update`)
   - prevents conflicting names/versions/status/provider claims across the product.

## P1 — immediate post-launch / readiness

1. **#10 — Landing Builder public drag-and-drop mini-app** (`feature`)
   - intended fourth featured no-login app after current front is stable.
2. **#12 — Make each mini-app independently forkable as a ready-made PWA** (`upgrade`)
   - central AppForge product promise and Full-status program.
3. **#13 — Settings Data export/import portability** (`update`)
   - harden workspace backup semantics and migration behavior.
4. **#14 — Media Vault + Scrapper Pro shared workflow** (`feature`)
   - production validation and source-aware UX.
5. **#15 — Remove stale dependencies/scripts and establish lint/build hygiene** (`cleanup`)
   - contributor credibility and Full-status prerequisite.
6. **#17 — Hugging Face provider/key rotation and showcase controls** (`upgrade`)
   - maintain provider reliability and creator privacy controls.
7. **#18 — Any Converter first Full standalone PWA candidate** (`upgrade`)
   - first proof of the forkable-PWA model.
8. **#6 — SVG Icons searchable react-icons browser** (`feature`)
   - strong browser-local public app and future Full candidate.

## P2 — secondary work

1. **#16 — Bundle/PWA caching/heavy-route performance audit** (`performance`)
2. **#4 — Favicon Studio** (`feature`)

## Active implementation state from the current pass

Already implemented in `main`, but still requiring production verification where relevant:

- public landing hierarchy cleaned up;
- GitHub CTA moved to header and separated visually;
- Hugging Face separated from the three public mini-app cards;
- signed-in `/landing` route exists;
- sidebar reduced to Landing / Dashboard / People / Settings plus app search;
- All Apps / Recent / Favorites / Categories removed from sidebar while routes/state remain compatible;
- Story Studio Novel/Comics toolbar and smaller turn-linked image design implemented;
- Story Studio supports creator-controlled per-scene Public/Private toggles;
- new Story Studio scenes are private by default at the database policy level;
- public Hugging Face page now describes creator-selected sharing rather than automatic first-three publishing;
- Novel Markdown and Comics standalone-HTML export paths implemented as first product exports;
- Story Studio UI accepts up to three personal HF tokens and no longer exposes OpenRouter controls;
- text generation accepts personal HF token rotation and has separate Novel/Comics prompt contracts;
- `docs/LANDING_BUILDER_PLAN.md` and `docs/APP_MODEL.md` define the next architecture.

## Documentation hierarchy

- `docs/ISSUE_ROADMAP.md` — prioritized actionable work/index.
- GitHub Issues — canonical task state and acceptance checklists.
- `docs/STABILIZATION_TRACKER.md` — implementation/verification status history.
- `docs/FULL_STATUS.md` — strict definition of a forkable Full mini-app.
- `docs/APP_MODEL.md` — canonical app identity/capability/UI/export model.
- `docs/LANDING_BUILDER_PLAN.md` — planned public landing-page builder.
- `docs/MARKETING_HANDOFF.md` — marketing/Patreon session preparation.

## Maintenance rule

When a substantial new task is discussed:

1. decide whether it belongs to an existing issue;
2. otherwise create a focused GitHub issue with P0/P1/P2 in the title and one category label;
3. keep acceptance criteria concrete;
4. update the relevant app docs or architectural plan;
5. do not mark an app Full until `docs/FULL_STATUS.md` is actually satisfied.

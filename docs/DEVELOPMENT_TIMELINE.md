# AppForge development timeline

Last updated: 2026-09-10

This is a planning horizon, not a promise of exact delivery dates. It exists to keep development sequencing coherent before the next deliberate production deploy and formal release.

## Current phase — consolidation before deploy

Target window: **Sep 10–12, 2026**

Already completed in this phase:

- GitHub OAuth provider + frontend activation; core GitHub login is confirmed working;
- signed-out Story Studio route converted to AI integrations/promotional content;
- Story Studio joypad/gamepad identity standardized on current navigation surfaces;
- sidebar weather gadget added;
- Task List implemented, registered and backed by applied Supabase RLS migration;
- app/route integrity audit added to CI and currently passes across 45 registry entries / 14 categories;
- `npm run verify:release` added as the combined release-validation command;
- Getter Pro product rename + canonical route added while preserving Scrapper compatibility IDs/routes;
- Media Vault Showcase and Getter Pro media-card action rails moved below images instead of overlaying them;
- Hugging Face public gallery upgraded to a center-weighted infinite carousel;
- Bing/external-image Media Vault rendering hardened with fallback URLs from stored metadata;
- public app shell made intentionally dark;
- tablet/mobile sidebar overlay improved with Escape close, body scroll lock and focus return;
- docs branding reduced to favicon-derived slate/white with dark/light SVG marks;
- roadmap, agent handoff, security and environment documentation refreshed.

Still required before this phase exits:

- CI green on the complete current `main`, not an earlier commit;
- runtime smoke for Bing → Getter Pro → Media Vault fallback (#50);
- finish #35 tiny-UI/public-theme/mid-width sidebar verification at supported breakpoints;
- finish the highest-value Story Studio setup/mobile/accessibility gaps under #8;
- complete remaining GitHub OAuth session/returnTo/logout/mobile/failure checks under #32;
- verify YouTube Getter Pro search after the next deliberate production deploy if `YOUTUBE_API_KEY` was added after the current release;
- review remaining Supabase `SECURITY DEFINER` advisories function by function;
- keep docs and GitHub Issues synchronized while the branch is still changing.

Exit gate: current-head CI green, Pages green, docs coherent, migrations already applied/reviewed, no known P0 UI/data regression, and a clear post-deploy smoke checklist.

## Phase 2 — standalone-PWA proof

Target window: **Sep 12–16, 2026**

Primary goals:

1. **Any to Any Converter** — complete the first reproducibly extractable Full/fork-ready package (#18).
2. **Task List** — qualify as a second standalone candidate if the local-first core stays clean and the documented 75%+ target is met.
3. Add app-specific manifest/fork metadata for selected browser-local utilities.
4. Add a browser-local dependency-boundary check so auth/server imports cannot silently creep into Full candidates.
5. Resolve the QR Generator maturity mismatch after functional verification (`idea` status with an explicit route).

Exit gate: at least one independently extractable PWA is reproducible from a clean checkout with install/build/offline documentation and no hidden AppForge-server dependency.

## Phase 3 — flagship creator workflow

Target window: **Sep 16–23, 2026**

Focus on Story Studio rather than increasing raw app count:

- creator/project setup and opening/scenario picker;
- title/cover metadata before export;
- desktop/mobile/keyboard/touch accessibility pass;
- provider failure/quota messaging;
- public route remains promotional, with creation behind authentication;
- Hugging Face carousel remains a public creator-selected showcase rather than a second editor;
- verify Gemini, Hugging Face, OpenRouter and other documented integration roles remain accurate.

Exit gate: Story Studio has a stable creator flow with no known P0/P1 product-flow issue.

## Phase 4 — media, provider reliability and publishing

Target window: **Sep 23–30, 2026**

- complete Getter Pro provider-health/fallback work (#53);
- runtime-verify Media Vault external-reference resilience (#50);
- continue Marketing Studio metadata/review/publication model (#34);
- YouTube publishing only after the approved delegated OAuth path is genuinely ready;
- complete user-owned YouTube Home/channel setup (#29);
- prepare current screenshots/branding for GitHub Marketplace submission (#51).

## Phase 5 — broader catalog hardening

Target window: **Oct 2026**

- graduate selected `building` or `idea` apps only when their real workflows justify the status change;
- keep unimplemented apps on the planned-app surface;
- improve performance, lazy loading and service-worker hygiene;
- reduce duplicated legacy mini-app surfaces;
- add per-app docs for candidates worth independent reuse;
- add release fingerprint/version alignment tooling;
- finish GitHub Marketplace review follow-through and broader distribution work;
- revisit model/provider lifecycle deadlines before they become urgent.

## Release checkpoint

A GitHub release should be prepared only after the current `main` satisfies the release gate. Vercel production remains a separate deliberate operation and should not be inferred from a GitHub release or docs publication.

The automated release-readiness watch checks for current-head CI, Pages publication, docs consistency and known blockers. It may recommend release metadata, but production deployment remains intentionally explicit.

## Rules for timeline changes

- GitHub Issues are the actionable backlog; this page explains sequencing.
- A date shift is not itself a failure: update the phase when dependencies change.
- Do not mark work complete because it is documented; code, migration, CI, Pages and production verification are separate states.
- Production deploy remains a deliberate final gate, not part of normal merge flow.

# AppForge unified launch checklist

Last updated: 2026-09-10

This is the cross-project execution order before the next deliberate production release. GitHub Issues remain the authoritative acceptance lists for tracked features.

## Prepared / complete in code or environment

- [x] Gemini personal key in Settings → Integrations and bounded fallback architecture.
- [x] Logged-out landing uses a scoped black theme without overwriting authenticated workspace appearance.
- [x] GitHub OAuth App configured through Supabase and landing GitHub sign-in action enabled.
- [x] Core GitHub login user-confirmed working; remaining session/return/mobile checks stay in #32.
- [x] Landing auth area simplified; extra `Try a public tool` CTA removed.
- [x] Landing footer technology string removed and replaced with Docs link.
- [x] Hugging Face landing label simplified.
- [x] Landing public-tools list uses canonical Getter Pro naming and `/apps/getter-pro` route.
- [x] Signed-out `/apps/ai-dragon-arena` is promotional/integration content; authenticated Story Studio remains the creator workspace.
- [x] Story Studio / Dragon Arena current product surfaces use the joypad/gamepad icon.
- [x] Global inferred image-card drawer regression removed so Story Studio actions no longer infer an absolute overlay from image content.
- [x] Getter Pro and Media Vault media actions use explicit below-image action rails/drawers.
- [x] Hugging Face public gallery uses a center-weighted infinite cinematic carousel.
- [x] Sidebar weather gadget added.
- [x] Public tool shell intentionally uses dark AppForge theming.
- [x] Tablet/mobile sidebar overlay supports Escape close, body scroll lock, focus return and avoids a nested collapsed state.
- [x] Task List component/route/registry implemented with local-first persistence and optional authenticated Supabase sync.
- [x] Task List database/RLS migration applied to Supabase.
- [x] Dragon Arena image quota mutation RPCs explicitly hardened against anonymous execution.
- [x] Media Vault external image rendering can fall back through stored media/thumbnail metadata without a destructive migration.
- [x] `npm run audit:apps` validates registry/router integrity; current structural result covers 45 entries / 14 categories and passes.
- [x] `npm run verify:release` combines app audit, lint, typecheck, tests and build.
- [x] Private Cloud Run experiment worker and bounded reservation model documented/prepared.
- [x] Vercel Git deployments disabled; production remains manual-only via `vercel deploy --prod`.
- [x] GitHub Pages converted to documentation-only VitePress portal.
- [x] Docs use `favicon.svg` as favicon/logo and favicon-derived slate + white branding assets.
- [x] Funding config includes GitHub Sponsors, PayPal and Buy Me a Coffee `appforge`.

## Build-up before deploy

| Priority | Action | Gate / related work |
|---|---|---|
| P0 | Current-head CI must pass after all carousel/sidebar/media/docs changes | `npm run verify:release` equivalent in CI |
| P0 | Runtime-smoke Bing image save → reload → Media Vault fallback | #50 |
| P0 | Finish public theme + mid-width sidebar + tiny-UI breakpoint sweep | #35 |
| P0 | Finish highest-value Story Studio creator/title/cover/mobile/accessibility gaps | #8 |
| P1 | Complete remaining GitHub OAuth returnTo/refresh/logout/mobile/denied/security checks | #32 |
| P1 | Reassess remaining Supabase `SECURITY DEFINER` warnings function by function | `SECURITY_ADVISORS.md` |
| P1 | Verify Getter Pro YouTube search after next deliberate deploy if the env key was added after current production | #53 |
| P1 | Complete Any Converter Full/fork-ready package | #18 |
| P1 | Keep Task List at verified 75%+ and begin standalone packaging | `docs/apps/task-list/README.md` |
| P1 | Prepare GitHub Marketplace listing assets/permissions/legal/support links | #51 |
| P1 | Continue marketing metadata/review workflow without delegated-upload scope creep | #34 |
| P2 | Disable GitHub repository-level default/dynamic CodeQL setup | #52 |
| P2 | Bundle/service-worker/mobile performance audit | #16 |

## Integrity / consistency gate

Run:

```bash
npm run audit:apps
npm run verify:release
```

Current app audit expectation:

- 45 registry entries;
- 14 categories;
- stable intentional alias: `Data Converter` → Any Converter;
- canonical Getter Pro route with legacy Scrapper redirects;
- planned app routes resolve intentionally;
- no duplicate IDs or unexpected duplicate routes.

Current non-blocking audit warning: QR Generator remains `idea` despite an explicit route. Verify its actual maturity before changing status; do not promote it solely to silence the warning.

## Documentation / branding gate

Before release, verify:

- Docs Pages build succeeds for the same `main` head being considered for release.
- `docs/ISSUE_ROADMAP.md`, `DEVELOPMENT_TIMELINE.md`, `AGENT_HANDOFF.md`, `PROJECT-PULSE.md` and this checklist describe the same route/auth/release state.
- `docs/BRANDING.md` displays the canonical favicon-derived dark/light marks.
- Docs use `#0f172a`, white and deep slate/black rather than a separate violet/bright-blue brand identity.
- Getter Pro, Story Studio, Media Vault and Task List names match the registry.
- Historical compatibility IDs are explained as implementation details, not shown as the main product identity.

## Supabase warning status

Current security-advisor categories include:

- `SECURITY DEFINER` functions callable by intended roles;
- intentionally anonymous public-gallery RPC;
- leaked-password protection disabled.

A linter warning is not automatically a vulnerability. Each `SECURITY DEFINER` function must have an intentional role grant and internal authorization/bounded query behavior. Image quota mutation RPC anonymous access has already been revoked explicitly.

Leaked-password protection is desirable if password/email authentication is offered. Current primary identity flows are OAuth (Google/GitHub), so this warning is not a production blocker today, but it should be enabled before introducing password login.

## Deliberate production release gate

Do **not** deploy production while current-head CI is red or while known P0 visual/data regressions are unresolved.

When ready:

```bash
vercel deploy --prod
```

Then smoke test in this order:

1. landing + Google/GitHub OAuth;
2. GitHub `returnTo`, refresh, logout and cancel/deny behavior (#32);
3. public tools render intentionally dark and remain usable at mobile/tablet/mid-width desktop;
4. Story Studio desktop/mobile, generated images, actions/composer layout and exports (#8/#35);
5. Hugging Face carousel: center weighting, infinite previous/next, autoplay pause, mobile sizing;
6. Getter Pro search + image/card drawers, including YouTube env availability (#53);
7. Getter Pro Bing save → Media Vault reload/fallback (#50);
8. Media Vault Grid/Showcase/List + external/source actions;
9. Task List create/toggle/delete/refresh + authenticated sync;
10. Weather sidebar gadget and Weather Now route;
11. Any Converter and primary browser-local tools;
12. PWA install/service-worker behavior on `sstoken.space`.

## Current limits / boundaries

- Vercel production freshness changes only after an explicit manual deploy.
- GitHub Pages serves docs only and does not provide AppForge `/api` routes.
- Google Cloud billing guardrails are treated as user-configured; application experiments retain their separate bounded reservation ceiling.
- Cloud worker setup code is not equivalent to live Cloud integration verification.
- GitHub default/dynamic CodeQL is still a repository-setting task (#52) even though the checked-in CodeQL workflow file was removed.
- Do not add broad YouTube OAuth scopes until delegated publishing genuinely needs them.
- Do not expose provider secrets through `VITE_*`, browser source, docs, logs or issues.

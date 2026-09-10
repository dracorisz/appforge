# AppForge unified launch checklist

Last updated: 2026-09-10

This is the cross-project execution order before the next deliberate production release. GitHub Issues remain the authoritative acceptance lists for tracked features.

## Prepared / complete in code or environment

- [x] Gemini personal key in Settings → Integrations and bounded fallback architecture.
- [x] Logged-out landing uses a scoped black theme without overwriting workspace appearance.
- [x] GitHub OAuth App configured through Supabase and landing GitHub sign-in action enabled.
- [x] Landing auth area simplified; extra `Try a public tool` CTA removed.
- [x] Landing footer technology string removed and replaced with Docs link.
- [x] Hugging Face landing label simplified.
- [x] Signed-out `/apps/ai-dragon-arena` is promotional/integration content; authenticated Story Studio remains the creator workspace.
- [x] Global image-card drawer regression removed so Story Studio actions no longer infer an absolute overlay from image content.
- [x] Sidebar weather gadget added.
- [x] Task List component/route implemented with local-first persistence and optional authenticated Supabase sync.
- [x] Task List database/RLS migration applied to Supabase.
- [x] Dragon Arena image quota mutation RPCs explicitly hardened against anonymous execution.
- [x] Private Cloud Run experiment worker and bounded reservation model documented/prepared.
- [x] Vercel Git deployments disabled; production remains manual-only via `vercel deploy --prod`.
- [x] GitHub Pages converted to documentation-only VitePress portal.
- [x] Project Pulse/docs updated to describe the current Pages role rather than the retired static app fallback.
- [x] Funding config includes GitHub Sponsors, PayPal and Buy Me a Coffee `appforge`.

## Build-up before deploy

| Priority | Action | Gate / related work |
|---|---|---|
| P0 | Finish Task List canonical registry entry + route/integrity audit | New app should participate in Project Pulse and app search rather than remain route-only |
| P0 | Run full registry/route/implementation integrity audit across the current catalog | No silent dashboard fallthrough; aliases documented; planned apps intentional |
| P0 | Reassess remaining Supabase SECURITY DEFINER warnings | Anonymous public gallery is intentional; signed-in RPCs must be individually justified |
| P0 | Run CI after the consolidation pass | lint + typecheck + tests + production build |
| P0 | Finish #8 creator identity/title/cover/mobile/accessibility gaps worth doing before release | Flagship quality |
| P0 | Finish #35 screenshots/shell consistency pass | First-impression integrity |
| P1 | Complete Any Converter Full/fork-ready package | #18 |
| P1 | Raise Task List to a verified 75%+ standalone candidate | `docs/apps/task-list/README.md` |
| P1 | Add repeatable route/registry integrity validation to CI | #49 |
| P1 | Add `verify:release` command | #49 |
| P1 | Continue marketing metadata/review workflow without delegated upload scope creep | #34 |
| P2 | Bundle/service-worker/mobile performance audit | #16 |

## Approximate timeline

See `DEVELOPMENT_TIMELINE.md` for the planning horizon. Current intended sequence:

- **Sep 10–12:** consolidation and integrity work;
- **Sep 12–16:** standalone-PWA proof (Any Converter + Task List candidate);
- **Sep 16–23:** Story Studio flagship hardening;
- **Sep 23–30:** media/publishing workflow;
- **Oct 2026:** broader catalog cleanup and performance.

These are planning windows, not guaranteed release dates.

## Supabase warning status

Current security advisor categories include:

- `SECURITY DEFINER` functions callable by intended roles;
- intentionally anonymous public-gallery RPC;
- leaked-password protection disabled.

Important distinction: a linter warning is not automatically a vulnerability. Each SECURITY DEFINER function must have an intentional role grant and internal authorization/bounded query behavior. Image quota mutation RPC anonymous access has now been revoked explicitly.

Leaked-password protection is desirable if password/email authentication is offered. Current primary identity flows are OAuth (Google/GitHub), so this warning is not treated as a production blocker today, but it should be enabled before introducing password login.

## Deliberate production release gate

Do **not** deploy production while the current consolidation pass is still changing app identity/routes/migrations.

When ready:

```bash
vercel deploy --prod
```

Then smoke test in this order:

1. landing + Google/GitHub OAuth;
2. GitHub `returnTo`, refresh, logout and cancel/deny behavior (#32);
3. Story Studio desktop/mobile, generated images, actions/composer layout and exports (#8/#35);
4. Task List create/toggle/delete/refresh + authenticated sync;
5. Weather sidebar gadget and Weather Now route;
6. Any Converter and primary public tools;
7. Media Vault/Scrapper Pro authenticated paths;
8. PWA install/service-worker behavior on `sstoken.space`.

## Current limits / boundaries

- Vercel production freshness changes only after an explicit manual deploy.
- GitHub Pages serves docs only and does not provide AppForge `/api` routes.
- Google Cloud billing guardrails are treated as user-configured; application experiments retain their separate bounded reservation ceiling.
- Cloud worker setup code is not equivalent to live Cloud integration verification.
- Production OAuth smoke remains pending until the next deliberate deployment.
- Do not add broad YouTube OAuth scopes until delegated publishing genuinely needs them.
- Do not expose provider secrets through `VITE_*`, browser source, docs, logs or issues.

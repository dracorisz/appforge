# AppForge unified launch checklist

This is the cross-project execution order; linked issues remain the authoritative
acceptance lists for their features. Do not close them based on preparation alone.

## Prepared and verified locally

- [x] Gemini personal key in Settings → Integrations, story fallback, bounded provider retries (PR #46; GitHub CI passed).
- [x] Logged-out landing/login uses a scoped black theme without overwriting workspace appearance.
- [x] CodeQL weekly/manual workflow prepared; external default setup still needs switching.
- [x] Private Cloud Run experiment worker: story, Google image generation and WebP thumbnail jobs.
- [x] Durable $4/day reservation ceiling and per-kind counts; duplicate IDs cannot regenerate.
- [x] Cloud setup script defaults to a reviewable plan, deploys with generation disabled, private IAM and no idle instances.
- [x] Cloud budget/model/setup guide at `CLOUD-EXPERIMENTS.md`.
- [x] Story Studio links directly to Settings → Integrations; provider token fields are masked.
- [x] Inert Dragon Arena theme card removed from global Appearance; functioning Story appearance palette inside the app (Ember/Frost/Forest/Workspace).

## Next actions, in order

| Priority | Action | Gate / related work |
|---|---|---|
| P0 | Verify exact Cloud project, welcome-credit expiry and reported $5/day setting | Account access; native budget caps are not universally daily or account-wide |
| P0 | Deploy worker privately; verify IAM, then enable and run one job of each kind | `CLOUD-EXPERIMENTS.md`; no live generation yet |
| P0 | Verify duplicate ID, quota exhaustion, anonymous rejection and persisted output in real Cloud | Local unit tests are not cloud integration evidence |
| P0 | Connect Vercel to private worker using workload identity federation | No long-lived downloaded service-account keys; per-user authorization before production traffic |
| P0 | Verify live Story Studio Novel/Comics → scene → refresh → gallery | [#7](https://github.com/dracorisz/appforge/issues/7), [#8](https://github.com/dracorisz/appforge/issues/8) |
| P0 | Verify production build freshness, OAuth return path and public beta smoke pass | [#1](https://github.com/dracorisz/appforge/issues/1); check deployment capacity before retrying |
| P0 | Finish registry/header identity and actual desktop/mobile screenshots | [#35](https://github.com/dracorisz/appforge/issues/35) |
| P1 | Disable Supabase automatic preview branching; switch CodeQL default setup to periodic workflow | External dashboard settings; not changed by repository files |
| P1 | Finish reviewed marketing metadata/export; delegated uploads only after approved OAuth | [#34](https://github.com/dracorisz/appforge/issues/34), [#29](https://github.com/dracorisz/appforge/issues/29) |
| P1 | Complete Any Converter standalone acceptance | [#18](https://github.com/dracorisz/appforge/issues/18) |
| P2 | Measure bundle/PWA/mobile behavior and configure old build artifact cleanup | [#16](https://github.com/dracorisz/appforge/issues/16) |
| Before Oct 20, 2026 | Evaluate replacement for Gemini 2.5 Flash-Lite and recheck prices | Current model lifecycle; pinned policy must be updated deliberately |

## Current blockers / limits

- Available cloud browser starts with a blank tab; the user's existing tab group is not present.
- Google Cloud navigation and tab refresh timed out. Billing cap and account setup remain unverified.
- No authenticated Google Cloud CLI is present in the workspace. Setup scripts were syntax/plan checked, not executed against Cloud.
- Browser visual/authenticated smoke tests are pending; no production success is inferred from a local build.
- No YouTube publishing, public asset sharing, billing upgrade or production database migration is performed by this work.
- Story appearance is browser-local and changes UI accents/canvas, not the text or art-generation prompt.

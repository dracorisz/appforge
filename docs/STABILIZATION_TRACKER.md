# AppForge Stabilization Tracker

Last updated: 2026-09-11

GitHub Issues are now the canonical actionable backlog. See `docs/ISSUE_ROADMAP.md` for publish-soon ordering. This file records implementation/verification state.

Status meanings:

- **DONE** — implemented in `main`; no known code gap remains for the scoped item.
- **VERIFY** — implemented in `main`, but production behavior still needs live confirmation on the matching deployment.
- **OPEN** — product/code work remains.
- **MANUAL** — requires external account/provider administration.

## Product maturity rule

AppForge mini-apps target:

**Idea → Building → Beta → Launched → Full → Deprecated**

`Full` means production-ready inside AppForge **and** documented/isolated enough to be forked into an independent ready-made PWA. See `docs/FULL_STATUS.md`.

## P0 — publish-soon state

| Item | Status | Issue | Notes |
|---|---|---:|---|
| Public beta regression pass | OPEN | #1 | Final smoke pass before wider promotion. |
| Funding/marketing materials | OPEN/MANUAL | #3 | Repo prep exists; external account/publication work remains. |
| Story Studio HF text/image reliability | VERIFY | #7 | Provider-aware generation exists; current production success/failure path must be tested. |
| Story Studio Novel + Comics product flow | VERIFY | #8 | Modes, turn-linked imagery and first exports are implemented; deeper project model remains. |
| Public landing polish | VERIFY | #9 | New hierarchy implemented; capture final screenshot after deployment verification. |
| Canonical app registry/uniform shell audit | OPEN | #11 | Registry exists but lower-priority metadata still needs systematic normalization. |

## Story Studio / former Dragon Arena

| Item | Status | Notes |
|---|---|---|
| Novel / Comics mode switch | DONE | One shared persistent Story Studio with mode-specific prompting. |
| Generate / Assets / Sessions / Leaderboard top toolbar | DONE | App-local controls remain above the story work surface. |
| Old decorative Dragon hero/support chrome | DONE | Removed from the active Story Studio route. |
| Shorter narrative pacing | DONE | Novel and Comics now have distinct compact prompt contracts. |
| Continue after shared text quota | DONE | Local continuity fallback prevents hard-stop play. |
| Scene model/provider routing | DONE | Hugging Face provider mapping + bounded failover in `/api/dragon-image`. |
| Scene request telemetry | DONE | Request ID, duration and sanitized provider/model attempts. |
| Server-authoritative scene persistence | DONE | Storage + asset ledger complete before success. |
| Turn-linked inline artwork | VERIFY | Scene `turn_number` metadata is used to attach small thumbnails beside the corresponding GM narrative. |
| Lightbox for scene art | DONE | Inline thumbnails expand on click/touch. |
| Assets view | DONE | Remains the richer gallery/management surface. |
| Public sharing is creator controlled | DONE | Automatic first-three trigger removed; new scenes are private by default and Assets provides Public/Private toggle. |
| Public Hugging Face gallery | DONE | RPC returns only `is_public=true` creator-selected scenes. |
| Novel export | VERIFY | Markdown export implemented; deeper title/chapter/cover model still open. |
| Comics export | VERIFY | Standalone HTML panel/story export implemented; page composition/PDF/CBZ remain future work. |
| Settings Appearance usage | VERIFY | Studio uses semantic theme tokens; visual sweep still useful. |
| Up to 3 personal HF keys in Story Studio | VERIFY | UI stores local token slots and text API rotates them. Image API multi-token handling still needs verification/work under #17. |
| OpenRouter removed from game controls | DONE | Account/Profile integration may remain in Settings; Story Studio UI no longer exposes it. |
| Shared character/world/lore memory | OPEN | Needed for stronger long-form continuity. |
| Chapter/page/project metadata | OPEN | Needed before Launched/Full. |
| Standalone Story Studio fork package | OPEN | Supabase/provider/env/PWA extraction guide required. |

## Public landing / shell

| Item | Status | Notes |
|---|---|---|
| GitHub CTA in header | DONE | Red external CTA; old blurred follow-development button removed. |
| Hugging Face separated from public mini-app cards | DONE | Official HF mark + dedicated section. |
| Three public mini-app cards balanced | VERIFY | Weather / Any Converter / Getter Pro use unified card structure. |
| Google sign-in CTA present | DONE | Auth flow already functional; authenticated button opens workspace. |
| Signed-in `/landing` route | DONE | Allows returning to public landing after login. |
| Sidebar simplification | DONE | Removed All Apps / Recent / Favorites / Categories from sidebar; kept Landing / Dashboard / People / Settings + app search. |
| Favorites/Recent/category routes/state | DONE | Kept for compatibility/discovery even though no longer sidebar top-level items. |
| Landing Builder plan | DONE | `docs/LANDING_BUILDER_PLAN.md`; tracked in #10. |
| Landing Builder implementation | OPEN | Future fourth featured no-login mini-app. |

## Media Vault + Getter Pro

| Item | Status | Notes |
|---|---|---|
| Restore Media Vault production schema/RPCs/bucket | DONE | Previous production drift repaired. |
| Scrapper account saves use Media Vault directly | DONE | No new Dragon/Story asset rows for Scrapper references. |
| Scrapper URL dedupe | DONE | Stable source reference prevents duplicate account saves. |
| Story scenes linked into Media Vault | VERIFY | Same authoritative scene rows should surface without copying bytes. |
| Source-aware deletion | DONE | Scrapper removes reference; Story scene deletion affects source asset/file. |
| Production end-to-end validation | OPEN | Track under #14. |
| Standalone fork packages | OPEN | Auth/storage/server dependencies need extraction guides. |

## Settings / profile / portability

| Item | Status | Notes |
|---|---|---|
| Profile field visibility controls | DONE | Skills/website/GitHub/public-email visibility supported. |
| People honors visibility | DONE | Public cards respect saved flags. |
| Appearance dark/system accent correctness | DONE | Semantic primary/ring tokens update with active appearance. |
| Workspace export/import exists | DONE | JSON workspace backup is implemented in Settings. |
| Workspace import hardening/version validation | OPEN | Track under #13. |
| Workspace-vs-product-export semantics | DONE (docs) | Explained in `docs/APP_MODEL.md`; UI copy still tracked under #13. |
| OpenRouter account key retained | DONE | Remains an integration/profile-level setting; not a Story Studio control. |

## Full-status / forkability program

| Item | Status | Notes |
|---|---|---|
| Full-status definition | DONE | `docs/FULL_STATUS.md`. |
| Canonical app model | DONE (docs) | `docs/APP_MODEL.md`. |
| Prioritized issue roadmap | DONE | `docs/ISSUE_ROADMAP.md`. |
| Any Converter first Full candidate | OPEN | #18. |
| Shared extraction/PWA starter | OPEN | #12. |
| SVG Icons future Full candidate | OPEN | #6. |
| Landing Builder future Full candidate | OPEN | #10. |

## Repository / engineering health

| Item | Status | Notes |
|---|---|---|
| Retired legacy `/workspace` renderer | DONE | Duplicate dashboard removed. |
| Ignore generated TS build cache | DONE | `*.tsbuildinfo` ignored. |
| Real linting | OPEN | #15. |
| Remove stale MySQL setup/dependency | OPEN | #15. |
| Dependency modernization | OPEN | Do after launch-critical cleanup; avoid broad upgrades mixed into P0 fixes. |
| Bundle/PWA-cache performance audit | OPEN | #16. |

## Current publish-soon order

1. #1 production regression pass.
2. #7 Story Studio generation/persistence smoke test.
3. #9 final landing screenshot/visual check.
4. #11 registry accuracy sweep for anything visible in marketing.
5. #3 Patreon/marketing asset session and external account setup.
6. Fix only P0 regressions found above.
7. After publication, start #18 Any Converter Full extraction and #12 shared standalone-PWA pattern.

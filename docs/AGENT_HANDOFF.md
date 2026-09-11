# AppForge — Agent Handoff

Last updated: 2026-09-11

## Quick start

- **Repo:** `dracorisz/appforge`
- **Primary branch:** `main`
- **Production:** `https://www.sstoken.space/`
- **Docs:** `https://docs.sstoken.space/`
- **Integrated environment:** `docs/ENVIRONMENT.md`
- **Generated capability matrix:** `docs/ENV_CAPABILITIES.md`
- **Timeline:** `docs/DEVELOPMENT_TIMELINE.md`
- **Actionable backlog:** GitHub Issues + `docs/ISSUE_ROADMAP.md`
- **App inventory:** `src/lib/registry.ts`

Preferred validation:

```bash
npm run verify:release
```

`verify:release` runs registry integrity, standalone dependency-boundary auditing, environment-doc drift validation, lint, typecheck, tests, and the production build. Main CI additionally builds VitePress docs. Do not infer production readiness from a single green sub-check.

## Product/access model

### Landing and authentication

- Public landing is intentionally minimal and links to Docs, GitHub, Support and YouTube.
- Google and GitHub sign-in both use Supabase Auth.
- GitHub OAuth provider configuration and frontend wiring are complete; GitHub login itself is user-confirmed working.
- Keep #32 open only for remaining returnTo/session/logout/mobile/denied-flow/security smoke checks.
- Production deployment remains deliberate. `main` may be ahead of production until an explicit production release action.

### Public app shell

- Signed-out public tools intentionally render through a dark AppForge shell, independent of the authenticated workspace appearance preference.
- Do not reintroduce accidental white/light public app surfaces unless a route explicitly opts into a light presentation.
- Tablet/mobile navigation uses a full-screen overlay below `lg`; it locks body scroll, closes on Escape or its explicit close control, restores focus to the menu trigger, and avoids a nested collapsed-sidebar state.
- Continue UI verification under #35 at mobile, tablet, middle-desktop and wide-desktop widths.

### Story Studio / AI Dragon Arena route

- `/apps/ai-dragon-arena` is promotional for signed-out users: it explains AppForge AI integrations such as Gemini, Hugging Face, OpenRouter and related provider architecture.
- The authenticated route mounts the full Story Studio creator experience.
- Novel/Comics creation, sessions, scene assets, exports and provider fallbacks live behind authentication.
- Scene sharing is creator opt-in. Do not reintroduce automatic first-three-public behavior.
- Historical `dragon_arena_*` database/storage identifiers and the stable route remain compatibility IDs; creator-facing naming should prefer Story Studio.
- The old inferred global image-card action drawer and the remaining broad `.surface-card:has(img)` layout inference were removed. Special media-card behavior is opt-in through `.preview-card`.
- Future PDF/EPUB/CBZ export direction is documented in `docs/apps/story-studio-export-roadmap.md`.

### Hugging Face public gallery

- `/huggingface` is the public Story Studio × Hugging Face showcase.
- Its gallery presentation is a center-weighted infinite cinematic carousel: active scene larger, left/right neighbors smaller, autoplay with hover/focus pause, and manual previous/next controls.
- Keep this carousel specific to the Hugging Face page; Media Vault retains explicit Grid / Showcase / List choices instead.

### Media Vault / Getter Pro

- Media Vault is the signed-in asset ledger for General uploads plus linked/source-backed product assets.
- Story Studio scene rows remain authoritative rather than being duplicated into another asset table.
- Getter Pro is the public multi-source media/research tool formerly named Scrapper Pro.
- Canonical route: `/apps/getter-pro`.
- Legacy `/apps/scrapper-pro`, `/pf-scrapper-pro`, storage folder metadata and `source_app = scrapper-pro` remain for compatibility.
- Getter Pro can archive deduplicated external references into Media Vault while guest/local saves remain browser-local.
- Protected provider pages are reference-only; the media endpoint rejects protected social/video hosts while direct unprotected image/video assets remain eligible for download.
- Media Vault exposes Grid, Showcase and List views. Showcase uses cinematic cards with an action drawer below the media rather than overlaying the asset.
- Getter Pro uses the same drawer principle: clean image-first card, restrained metadata, actions below the image, hover/focus reveal on desktop and visible controls on touch/mobile.
- External saved-image rows can fall back from a failing primary media URL to stored `media_url` / `thumbnail` metadata. #50 remains open until runtime smoke verification.

### Desktop Buddy

- `/apps/desktop-buddy` includes local character configuration, KDE starter assets, provider-backed generation, local asset optimization, screen capture/import fallback and transparency repair.
- Hugging Face and Vertex generation remain explicit user actions.
- Vertex jobs use an idempotent recovery ledger so a browser/network retry does not silently create a second paid image request.
- The transparency-repair tool can replace painted checkerboard/background pixels with real PNG alpha locally before applying the character.
- Brave/PWA screen capture uses `getDisplayMedia` when available and provides screenshot import as a fallback when the installed browser/PWA blocks capture.

### Task List

- `/apps/task-list` is a local-first productivity app and Beta standalone-PWA candidate.
- Guest/local core state persists in `localStorage`.
- Signed-in users can sync to `public.appforge_tasks` through Supabase.
- Canonical migration `20260910013205_create_appforge_tasks.sql` is part of the aligned Supabase migration history with user-scoped RLS.
- App-specific docs: `docs/apps/task-list/README.md`.

### Weather gadget

- The authenticated sidebar includes a compact Weather Now gadget linking into the full Weather Now app.
- Keep it lightweight and verify it does not force sidebar overflow at intermediate widths.

## Database/security state

- Supabase PostgreSQL/Auth/Storage backs authenticated persistence.
- Repository migration filenames are aligned with production `supabase_migrations.schema_migrations`; do not reintroduce rounded/duplicate migration timestamps.
- Dragon Arena image quota mutation RPC grants were hardened so `anon` cannot execute consume/refund while authenticated users still can.
- `dragon_arena_public_gallery(integer)` remains intentionally anonymous because it is a bounded public-read surface.
- `frontend_content` powers Blog/video-teaser/gallery CMS content with published-only public reads and AAL2/admin-only mutations.
- Remaining authenticated `SECURITY DEFINER` advisor warnings require function-by-function authorization review; do not blanket-revoke or blanket-convert them.
- See `docs/SECURITY_ADVISORS.md`.

## Registry and app integrity

The canonical registry parses as **45 entries across 14 categories**. Route/registry integrity is enforced by `npm run audit:apps` and main CI.

Run:

```bash
npm run audit:apps
```

for IDs, categories, statuses, versions, routes, intentional aliases and router coverage. Planned apps should resolve to the deliberate planned-app surface rather than silently falling back to the dashboard.

Any Converter is the first explicit browser-local standalone boundary candidate. `npm run audit:standalone` prevents Supabase/auth/server API coupling from creeping into its core files.

## Documentation / branding state

- Docs are a VitePress developer/agent portal at `docs.sstoken.space`, not an application fallback.
- Main CI installs/builds VitePress so broken docs/configuration fail the release validation path.
- `docs/ENV_CAPABILITIES.md` is generated from `.env.example`; run `npm run docs:env` after changing the env contract, and `docs:env-check` prevents drift.
- Canonical logo/favicons derive from `public/favicon.svg` / `public/appforge-mark.svg`.
- Docs branding is intentionally simple: `#0f172a`, white, and deep black/slate surfaces rather than a second unrelated identity.
- `docs/BRANDING.md` is the branding reference for docs/Marketplace/presentation use.
- Keep `docs/DOC_MAINTENANCE.md` synchronized whenever app identity, routes, auth, migrations, provider state, release workflow or branding changes.

## Distribution / Marketplace

- #51 tracks the GitHub Marketplace listing.
- Repository-side listing copy, canonical links, permission rules, callback/revocation guidance and current eligibility requirements are in `docs/GITHUB_MARKETPLACE.md`.
- The current GitHub integration is OAuth sign-in; that alone is not Marketplace-submission-ready. Ship a real GitHub-platform workflow beyond authentication before requesting repository permissions.
- Marketplace pricing-plan/lifecycle-webhook/form submission and review remain external actions.
- Never request repository or account permissions merely to make the Marketplace listing appear more capable; permissions must correspond to implemented features.

## Build/release identity

- Root package version: **1.27.0** release-candidate line.
- `src/lib/buildInfo.ts` exposes the current build version/SHA/time in product UI.
- Every production Vite build emits `build-info.json` containing version, Git SHA, build time and base path from the same build inputs.
- Root `CHANGELOG.md` is canonical for user-visible release notes and powers `/changelog`.

Resolve package/registry/changelog release-boundary drift before a formal GitHub release; individual apps may have their own product versions inside the registry.

## Files to inspect first

1. `docs/ENVIRONMENT.md`
2. `docs/ENV_CAPABILITIES.md`
3. `docs/DEVELOPMENT_TIMELINE.md`
4. `docs/ISSUE_ROADMAP.md`
5. `docs/LAUNCH-CHECKLIST.md`
6. `docs/DOC_MAINTENANCE.md`
7. `docs/SECURITY_ADVISORS.md`
8. `docs/BRANDING.md`
9. `src/lib/registry.ts`
10. `src/App.tsx`
11. the app-specific component/API/migration files and matching GitHub issue

## Operating rules for agents

- Verify current code before trusting historical notes.
- Keep registry, routes, migrations, issues and docs synchronized in the same pass when they describe one feature.
- Never put server secrets in browser variables or documentation.
- Distinguish implemented, CI-verified, migration-applied, Pages-published, production-deployed and production-verified states.
- Do not run a Vercel production deploy unless explicitly requested.
- Do not close an issue merely because code exists; satisfy its actual acceptance criteria.
- Prefer current app-specific docs over stale broad umbrella notes.
- Keep compatibility IDs when renaming product-facing apps unless a data migration is intentionally planned.

## Near-term direction before next production deploy

1. keep main CI green with registry, standalone, env-doc, VitePress, lint/typecheck/test/build and cloud-worker validation;
2. runtime-smoke Bing → Getter Pro → Media Vault and close #50 only if reload/fallback works;
3. finish #35 specialized-header/weather/tiny-UI sweep across supported breakpoints;
4. continue Story Studio project setup/title-cover/mobile/accessibility work under #8;
5. complete remaining GitHub OAuth smoke items under #32;
6. continue Any Converter standalone packaging after its dependency boundary is kept clean;
7. review remaining Supabase `SECURITY DEFINER` warnings function by function;
8. prepare Marketplace/release assets only from current verified UI and a real GitHub integration beyond sign-in;
9. deploy production only at a deliberate checkpoint.

# AppForge — Agent Handoff

Last updated: 2026-09-10

## Quick start

- **Repo:** `dracorisz/appforge`
- **Primary branch:** `main`
- **Production:** `https://www.sstoken.space/`
- **Docs:** `https://dracorisz.github.io/appforge/`
- **Integrated environment:** `docs/ENVIRONMENT.md`
- **Timeline:** `docs/DEVELOPMENT_TIMELINE.md`
- **Actionable backlog:** GitHub Issues + `docs/ISSUE_ROADMAP.md`
- **App inventory:** `src/lib/registry.ts`

Preferred validation:

```bash
npm run audit:apps
npm run verify:release
```

`verify:release` runs the registry audit, lint, typecheck, tests, and production build. Do not infer production readiness from a single green sub-check.

## Product/access model

### Landing and authentication

- Public landing is intentionally minimal and links to Docs, GitHub, Support and YouTube.
- Google and GitHub sign-in both use Supabase Auth.
- GitHub OAuth provider configuration and frontend wiring are complete; GitHub login itself is user-confirmed working.
- Keep #32 open only for remaining returnTo/session/logout/mobile/denied-flow/security smoke checks.
- Vercel Git deployments are disabled. `main` may be ahead of production until an explicit `vercel deploy --prod`.

### Public app shell

- Signed-out public tools intentionally render through a dark AppForge shell, independent of the authenticated workspace appearance preference.
- Do not reintroduce accidental white/light public app surfaces unless a route explicitly opts into a light presentation.
- Tablet/mid-width navigation uses an overlay drawer below `lg`; it now locks body scroll, closes on Escape, restores focus to the menu trigger, and avoids the confusing collapsed-sidebar state inside the overlay.
- Continue UI verification under #35 at mobile, tablet, middle-desktop and wide-desktop widths.

### Story Studio / AI Dragon Arena route

- `/apps/ai-dragon-arena` is promotional for signed-out users: it explains AppForge AI integrations such as Gemini, Hugging Face, OpenRouter and related provider architecture.
- The authenticated route mounts the full Story Studio creator experience.
- Novel/Comics creation, sessions, scene assets, exports and provider fallbacks live behind authentication.
- Scene sharing is creator opt-in. Do not reintroduce automatic first-three-public behavior.
- Dragon Arena / Story Studio uses a joypad/gamepad icon across current product navigation surfaces; historical database/route IDs remain stable.
- The old inferred global image-card action drawer was removed because it could overlay Story Studio content.

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
- Media Vault exposes Grid, Showcase and List views. Showcase uses cinematic cards with an action drawer below the media rather than overlaying the asset.
- Getter Pro uses the same drawer principle: clean image-first card, restrained metadata, actions below the image, hover/focus reveal on desktop and visible controls on touch/mobile.
- External saved-image rows can now fall back from a failing primary media URL to stored `media_url` / `thumbnail` metadata. This is especially relevant to Bing/hotlinked sources; #50 remains open until runtime smoke verification.

### Task List

- `/apps/task-list` is a local-first productivity app and explicit 75%/Beta standalone-PWA candidate.
- Guest/local core state persists in `localStorage`.
- Signed-in users can sync to `public.appforge_tasks` through Supabase.
- Migration `20260910011500_create_appforge_tasks.sql` has been applied with user-scoped RLS.
- App-specific docs: `docs/apps/task-list/README.md`.

### Weather gadget

- The authenticated sidebar includes a compact Weather Now gadget linking into the full Weather Now app.
- Keep it lightweight and verify it does not force sidebar overflow at intermediate widths.

## Database/security state

- Supabase PostgreSQL/Auth/Storage backs authenticated persistence.
- Task List table/RLS migration is applied.
- Dragon Arena image quota mutation RPC grants were hardened so `anon` cannot execute consume/refund while authenticated users still can.
- `dragon_arena_public_gallery(integer)` remains intentionally anonymous because it is a bounded public-read surface.
- Remaining authenticated `SECURITY DEFINER` advisor warnings require function-by-function authorization review; do not blanket-revoke or blanket-convert them.
- See `docs/SECURITY_ADVISORS.md`.

## Registry and app integrity

The canonical registry currently parses as **45 entries across 14 categories**, with one intentional route alias (`Data Converter` → Any Converter). The structural audit currently passes.

Current non-blocking audit warning:

- `qr-generator` is still `idea` while an explicit route exists; verify maturity and either keep that intentional or promote it after functional testing.

Run:

```bash
npm run audit:apps
```

for IDs, categories, statuses, versions, routes, intentional aliases and router coverage. Planned apps should resolve to the deliberate planned-app surface rather than silently falling back to the dashboard.

## Documentation / branding state

- Docs are a VitePress developer/agent portal, not an application fallback.
- Canonical logo/favicons derive from `public/favicon.svg`.
- Docs branding is intentionally simple: `#0f172a`, white, and deep black/slate surfaces rather than violet or a second bright-blue gradient identity.
- `docs/BRANDING.md` displays dark/light SVG marks derived from the favicon geometry for docs/Marketplace/presentation use.
- Keep `docs/DOC_MAINTENANCE.md` synchronized whenever app identity, routes, auth, migrations, provider state, release workflow or branding changes.

## Distribution / Marketplace

- #51 tracks the GitHub Marketplace App listing.
- Detailed listing description is drafted; remaining work includes least-privilege permission review, current screenshots/brand assets, legal/support/docs links and Marketplace review follow-through.
- Never request repository or account permissions merely to make the Marketplace listing appear more capable; permissions must correspond to implemented features.

## Version state

Important current registry examples:

- Story Studio: **1.6.2**
- Getter Pro: **1.4.0**
- Media Vault: **1.2.0**
- Task List: **0.1.0** Beta candidate

The root package version may intentionally lag product-registry release notes during stabilization. Resolve that release-boundary decision before publishing a formal GitHub release.

## Files to inspect first

1. `docs/ENVIRONMENT.md`
2. `docs/DEVELOPMENT_TIMELINE.md`
3. `docs/ISSUE_ROADMAP.md`
4. `docs/LAUNCH-CHECKLIST.md`
5. `docs/DOC_MAINTENANCE.md`
6. `docs/SECURITY_ADVISORS.md`
7. `docs/BRANDING.md`
8. `src/lib/registry.ts`
9. `src/App.tsx`
10. the app-specific component/API/migration files and matching GitHub issue

## Operating rules for agents

- Verify current code before trusting historical notes.
- Keep registry, routes, migrations, issues and docs synchronized in the same pass when they describe one feature.
- Never put server secrets in browser variables or documentation.
- Distinguish implemented, CI-verified, migration-applied, Pages-published, production-deployed and production-verified states.
- Do not run `vercel deploy --prod` unless explicitly requested.
- Do not close an issue merely because code exists; satisfy its actual acceptance criteria.
- Prefer current app-specific docs over stale broad umbrella notes.
- Keep compatibility IDs when renaming product-facing apps unless a data migration is intentionally planned.

## Near-term direction before next production deploy

1. let CI validate the current carousel, responsive-shell, docs-branding, audit-script and Media Vault fallback changes;
2. runtime-smoke Bing → Getter Pro → Media Vault and close #50 only if reload/fallback works;
3. finish #35 public theme/sidebar/tiny-UI sweep across supported breakpoints;
4. continue Story Studio creator/mobile/accessibility polish under #8;
5. complete remaining GitHub OAuth smoke items under #32;
6. qualify Any Converter as the first reproducibly extractable Full PWA candidate, then continue Task List standalone packaging;
7. review remaining Supabase `SECURITY DEFINER` warnings function by function;
8. prepare Marketplace/release assets only from current verified UI;
9. deploy production only at a deliberate checkpoint.

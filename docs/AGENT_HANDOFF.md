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

Validation commands:

```bash
npm run audit:apps
npm run lint
npm run typecheck
npm test
npm run build
```

Use `npm run verify:release` for the combined pre-release validation path when available in the current package scripts.

## Product/access model

### Landing and authentication

- Public landing is intentionally minimal and links to Docs, GitHub, Support and YouTube.
- Google and GitHub sign-in both use Supabase Auth.
- GitHub OAuth provider configuration is complete; frontend wiring is active on `main`.
- Vercel Git deployments are disabled. `main` may be ahead of production until an explicit `vercel deploy --prod`.

### Story Studio / AI Dragon Arena route

- `/apps/ai-dragon-arena` is promotional for signed-out users: it explains AppForge AI integrations such as Gemini, Hugging Face, OpenRouter and related provider architecture.
- The authenticated route mounts the full Story Studio creator experience.
- Novel/Comics creation, sessions, scene assets, exports and provider fallbacks live behind authentication.
- Scene sharing is creator opt-in. Do not reintroduce automatic first-three-public behavior.
- Dragon Arena / Story Studio uses a joypad/gamepad icon consistently across registry, sidebar, public promo and related product surfaces.
- The old global image-card hover drawer behavior was removed because it could overlay Story Studio content.

### AI providers

- Story Studio uses bounded provider/fallback behavior; server credentials stay outside `VITE_*` variables.
- Hugging Face and OpenRouter paths remain documented integration options; Gemini/private Cloud Run experiments are separate from normal production behavior.
- Check `docs/AI-PROVIDERS.md` and `docs/CLOUD-EXPERIMENTS.md` before changing provider order, models, quotas or secrets.

### Media Vault / Getter Pro

- Media Vault is the signed-in asset ledger for General uploads plus linked/source-backed product assets.
- Story Studio scene rows remain authoritative rather than being duplicated into another asset table.
- Getter Pro is the public multi-source media/research tool formerly named Scrapper Pro.
- Canonical route: `/apps/getter-pro`.
- Legacy `/apps/scrapper-pro` and `/pf-scrapper-pro` routes redirect for compatibility; legacy storage/source IDs remain accepted so user data does not break.
- Getter Pro can archive deduplicated external references into Media Vault while guest/local saves remain browser-local.
- Media Vault exposes Grid, Showcase and List views. Showcase uses cinematic cards with an action drawer below the media rather than overlaying the asset.
- Getter Pro uses the same drawer principle: image-first card, restrained metadata, actions below the image, hover/focus reveal on desktop and visible controls on touch/mobile.

### Task List

- `/apps/task-list` is a local-first productivity app and explicit 75%/Beta standalone-PWA candidate.
- Guest/local core state persists in `localStorage`.
- Signed-in users can sync to `public.appforge_tasks` through Supabase.
- Migration `20260910011500_create_appforge_tasks.sql` has been applied to the connected project with user-scoped RLS.
- App-specific docs: `docs/apps/task-list/README.md`.

### Weather gadget

- The authenticated sidebar includes a compact Weather Now gadget linking into the full Weather Now app.
- Keep it lightweight; the full weather experience belongs on `/apps/weather-now`.

## Database/security state

- Supabase PostgreSQL/Auth/Storage backs authenticated persistence.
- Task List table/RLS migration is applied.
- Dragon Arena image quota mutation RPC grants were hardened so `anon` cannot execute consume/refund while authenticated users still can.
- `dragon_arena_public_gallery(integer)` remains intentionally anonymous because it is a bounded public-read surface.
- Remaining authenticated `SECURITY DEFINER` advisor warnings require function-by-function authorization review; do not blanket-revoke or blanket-convert them.
- See `docs/SECURITY_ADVISORS.md`.

## Registry and app integrity

The canonical registry currently includes 45 entries, including Task List and one intentional route alias (`Data Converter` → Any Converter). Treat that number as a dated snapshot; `src/lib/registry.ts` is authoritative.

Run:

```bash
npm run audit:apps
```

to verify IDs, categories, statuses, versions, routes, intentional aliases and router coverage.

Planned apps should resolve to the deliberate planned-app surface rather than silently falling back to the dashboard.

## Version state

Important current registry examples:

- Story Studio: **1.6.2**
- Getter Pro: **1.4.0**
- Media Vault: **1.2.0**
- Task List: **0.1.0** Beta candidate

The root package version may intentionally lag product-registry release notes during stabilization. Do not silently align versions without deciding the release boundary.

## Files to inspect first

1. `docs/ENVIRONMENT.md`
2. `docs/DEVELOPMENT_TIMELINE.md`
3. `docs/ISSUE_ROADMAP.md`
4. `docs/LAUNCH-CHECKLIST.md`
5. `docs/DOC_MAINTENANCE.md`
6. `docs/SECURITY_ADVISORS.md`
7. `src/lib/registry.ts`
8. `src/App.tsx`
9. the app-specific component/API/migration files for the task
10. the matching open GitHub issue

## Operating rules for agents

- Verify current code before trusting historical notes.
- Keep registry, routes, migrations, issues and docs synchronized in the same pass when they describe one feature.
- Never put server secrets in browser variables or documentation.
- Distinguish implemented, CI-verified, migration-applied, Pages-published, production-deployed and production-verified states.
- Do not run `vercel deploy --prod` unless explicitly requested.
- Do not close an issue merely because code exists; satisfy its actual acceptance criteria.
- Prefer current app-specific docs over stale broad umbrella notes.

## Near-term direction before next production deploy

1. let CI validate the Getter Pro rename, cinematic media drawers and Story Studio joypad identity;
2. keep docs/registry/routes aligned with canonical `/apps/getter-pro` while preserving legacy redirects;
3. continue Story Studio creator/mobile/accessibility polish;
4. qualify Any Converter as the first reproducibly extractable Full PWA candidate;
5. harden Task List toward independent packaging;
6. review remaining Supabase `SECURITY DEFINER` warnings function by function;
7. deploy production only at a deliberate checkpoint, then smoke-test GitHub OAuth and the changed app routes.

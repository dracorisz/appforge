# AppForge — Agent handoff

## Quick start

- Repository: `dracorisz/appforge`
- Production source branch: `main`
- Production app: `https://www.sstoken.space/`
- Docs: `https://docs.sstoken.space/`
- App inventory: `src/lib/registry.ts`
- Preferred validation: `npm run verify:release`

Production deployment is deliberate. A green `main` commit may be ahead of production until an explicit Vercel production release is requested and completed.

## Product model

AppForge is one integrated product containing public utilities, authenticated workspace tools, creator/media workflows, and shared platform services.

AppForge itself is an installable PWA. Preserve `vite-plugin-pwa`, the manifest/service worker, `src/components/pwa/`, and the update/offline lifecycle unless the task explicitly changes them. Internal apps do not have a standalone-PWA, extraction, or fork-readiness track in this repository.

## Inspect first

For most tasks, read:

1. `docs/GETTING_STARTED.md`
2. `docs/APP_MODEL.md`
3. `docs/PROJECT-PULSE.md`
4. `docs/ENVIRONMENT.md`
5. `docs/LAUNCH-CHECKLIST.md` when release-facing
6. `docs/SECURITY_ADVISORS.md` when auth/data/provider/security-facing
7. `src/lib/registry.ts`
8. `src/App.tsx`
9. relevant component, API, migration, and active GitHub issue

## Core platform rules

- Work from current `main`; verify code before trusting historical notes.
- Keep registry identity, routes, public/auth access, and user-facing names synchronized.
- Reuse shared navigation/layout/UI before introducing app-specific chrome.
- Global navigation should use the AppForge brand without per-page slogans.
- Preserve direct-route reload behavior.
- Keep server credentials out of browser code and `VITE_*` variables.
- Keep Supabase RLS as the user-data boundary.
- Treat paid/provider actions as explicit and idempotent where retries could duplicate cost.
- Distinguish implemented, CI-verified, migration-applied, Pages-published, production-deployed, and production-verified states.
- Do not run a Vercel production deployment unless explicitly requested.
- Do not close an issue simply because code exists; satisfy its real acceptance criteria.

## Public and authenticated surfaces

Signed-out routes should use the shared public AppForge navigation and a consistent dark public shell unless a route has a deliberate product requirement otherwise. `/explore` is the canonical public Apps directory.

Authenticated routes use the AppForge workspace shell/sidebar. Tablet/mobile navigation uses the app-style full-screen drawer below the desktop breakpoint.

## Important product flows

- **Getter Pro → Media Vault:** Getter Pro can save deduplicated external references for signed-in users; protected provider pages are references rather than fake direct downloads.
- **Story Studio:** signed-out `/apps/ai-dragon-arena` is a public integrations/promotional surface; authenticated users get the creator workflow. Public scene sharing is opt-in.
- **Desktop Buddy:** local character configuration, starter assets, voice/reaction behavior, provider-backed generation, transparency repair, and screen-capture/import fallback. Provider calls should remain explicit and recoverable.
- **Weather Now:** includes the authenticated sidebar weather preference/surface; keep overlapping requests and location fallback behavior safe.
- **Task List:** local-first state with optional authenticated Supabase sync inside the shared AppForge platform.

## Database and security

Supabase provides Auth, PostgreSQL, Storage, RLS, and RPCs. Do not weaken RLS or expose service credentials to resolve a frontend problem.

Review `docs/SECURITY_ADVISORS.md` before changing `SECURITY DEFINER` functions, public RPCs, grants, storage policies, or admin/AAL2 behavior.

## Registry and release integrity

`src/lib/registry.ts` is authoritative for app identity and maturity. Registry states are `idea`, `building`, `beta`, `launched`, and `deprecated`.

Run:

```bash
npm run verify:release
```

This covers app-registry integrity, environment-doc drift, lint, TypeScript, tests, and production build. Main CI also builds the VitePress documentation.

When a change affects AppForge's PWA infrastructure, additionally test a production build with the manifest/service worker/update path described in `docs/PWA.md`.

## Documentation rule

Keep public docs concise. Use `docs/apps/index.md` as the consolidated catalog/documentation entry point rather than adding individual app pages. Put deep implementation detail next to source, API code, migrations, or a focused operational document.

GitHub Issues are the actionable backlog; old planning documents should not be treated as a parallel source of truth.

# Documentation maintenance

Last updated: 2026-09-11

This page defines how AppForge documentation stays aligned with `main`. The goal is to prevent architecture, release, security, and app-status drift as the project changes quickly.

## Source-of-truth order

When documentation conflicts, resolve it in this order:

1. current code and migrations on `main`;
2. `src/lib/registry.ts` for app identity, route, version, category and maturity;
3. GitHub Issues for actionable acceptance state;
4. environment/deployment config (`.env.example`, `vercel.json`, workflows);
5. current database state for applied schema/grants;
6. docs and historical handoff notes.

Never preserve a stale doc statement merely because it appeared in an older release note or chat.

## Update matrix

| Change | Docs that should be reviewed in the same pass |
| --- | --- |
| Add/rename/remove app | `apps/index.md`, app-specific README, `PROJECT-PULSE.md`, `ISSUE_ROADMAP.md` if tracked |
| Route/access change | `APP_MODEL.md`, app README, `AGENT_HANDOFF.md`, `LAUNCH-CHECKLIST.md` if release-facing |
| Auth/provider change | `GITHUB_AUTH.md` or OAuth docs, `ENVIRONMENT.md`, `AGENT_HANDOFF.md` |
| Database/migration/RLS change | `DATABASE.md`, app README, `SECURITY_ADVISORS.md` when security-facing |
| Deployment/workflow change | `GETTING_STARTED.md`, `ENVIRONMENT.md`, `LAUNCH-CHECKLIST.md` |
| PWA/readiness change | `PROJECT-PULSE.md`, `FULL_STATUS.md`, app README |
| AI/provider behavior | `AI-PROVIDERS.md`, `CLOUD-EXPERIMENTS.md`, `AGENT_HANDOFF.md` |
| Branding/manifest change | `BRANDING.md`, VitePress config and public assets |

## App inventory rule

Do not hard-code a catalog count in multiple places unless it is explicitly marked as a snapshot date. The canonical inventory is `src/lib/registry.ts`. Run:

```bash
npm run audit:apps
```

before publishing a claim about route/inventory integrity.

## Release-state language

Use these terms precisely:

- **implemented** — code exists on `main`;
- **CI-verified** — automated checks passed for the commit;
- **migration applied** — schema change is present in the connected Supabase environment;
- **Pages-published** — docs build/deploy completed;
- **production-deployed** — an intentional Vercel production release ran;
- **production-verified** — live smoke checks passed after that deploy.

Do not collapse these into a single “done” state.

## Docs build behavior

Changes under `docs/**` trigger the GitHub Pages workflow. The public portal lives at `https://docs.sstoken.space/` and is independent from the production app deployment. GitHub Pages is its publishing platform, not the user-facing canonical URL.

The docs site uses the canonical AppForge `favicon.svg` as both browser favicon and header logo.

## Agent pickup rule

An agent starting work should read:

1. `docs/ENVIRONMENT.md`
2. `docs/DEVELOPMENT_TIMELINE.md`
3. `docs/ISSUE_ROADMAP.md`
4. `docs/AGENT_HANDOFF.md`
5. the relevant app README and issue
6. the current implementation files

Then verify assumptions against `main` before editing.

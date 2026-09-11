# Documentation maintenance

AppForge documentation should stay concise and aligned with `main`. Prefer a small set of durable product/platform documents over a page for every app or temporary implementation milestone.

## Source-of-truth order

When documentation conflicts, resolve it in this order:

1. current code and migrations on `main`;
2. `src/lib/registry.ts` for app identity, route, version, category and maturity;
3. GitHub Issues for actionable work and acceptance state;
4. environment/deployment configuration;
5. current database/security state;
6. documentation and historical notes.

## What to update

| Change | Review in the same pass |
| --- | --- |
| Add/rename/remove app | `apps/index.md`, `APP_MODEL.md` if semantics changed, registry/changelog |
| Route/access change | `APP_MODEL.md`, `GETTING_STARTED.md` or launch docs when user-facing |
| Auth/provider change | provider/auth docs, `ENVIRONMENT.md`, `AGENT_HANDOFF.md` |
| Database/RLS/storage change | `DATABASE.md`, `SECURITY_ADVISORS.md` when security-facing |
| Deployment/workflow change | `GETTING_STARTED.md`, `ENVIRONMENT.md`, `LAUNCH-CHECKLIST.md` |
| AppForge PWA behavior | `PWA.md`, launch checks, relevant source comments/tests |
| Branding/global navigation | `BRANDING.md`, shared public/layout components, docs theme if needed |

## App documentation rule

Do not create a separate docs page for every internal tool by default. The public/developer catalog belongs in `docs/apps/index.md`; implementation details should live close to source, APIs, migrations, or a focused platform document when they create an operational contract.

AppForge does not maintain per-app standalone-PWA, extraction, or fork-readiness documentation. The PWA guide describes AppForge as one installable product.

## Release-state language

Use these terms precisely:

- **implemented** — code exists on `main`;
- **CI-verified** — automated checks passed for the commit;
- **migration applied** — schema change is present in the connected Supabase environment;
- **Pages-published** — docs build/deploy completed;
- **production-deployed** — an intentional Vercel production release ran;
- **production-verified** — live smoke checks passed after that deploy.

Do not collapse these into one “done” state.

## Docs build

Changes under `docs/**` are published through the GitHub Pages workflow to `docs.sstoken.space`. The docs deployment is separate from the Vercel production application.

Before a substantial docs change is considered complete, build VitePress and confirm navigation, internal links, responsive home layout, and the consolidated Apps page.

## Agent pickup

A new maintainer or coding agent should normally start with:

1. `docs/GETTING_STARTED.md`
2. `docs/APP_MODEL.md`
3. `docs/PROJECT-PULSE.md`
4. `docs/ENVIRONMENT.md`
5. `docs/AGENT_HANDOFF.md`
6. `src/lib/registry.ts`, `src/App.tsx`, and the source/API/migration files relevant to the task.

Historical planning notes should never override current code, registry state, or active GitHub issues.

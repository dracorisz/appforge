# Environment and agent pickup

This page is the shortest reliable path for a new developer or coding agent to understand the integrated AppForge environment without depending on prior chat history.

## Repository and runtime

- **Repository:** `dracorisz/appforge`
- **Primary branch:** `main`
- **Frontend:** Vite + React + TypeScript
- **Production app:** https://www.sstoken.space/
- **Docs:** https://dracorisz.github.io/appforge/
- **Package manager:** npm
- **Recommended Node runtime:** Node 22

Start from a clean checkout:

```bash
git clone https://github.com/dracorisz/appforge.git
cd appforge
npm ci
cp .env.example .env
npm run dev
```

Use `npm run dev:vite` when you only need the Vite frontend and not the local API wrapper.

## Environment-variable model

The canonical variable inventory is `.env.example`. Only populate integrations you are actively testing.

### Browser-safe variables

Only values intentionally exposed to the browser may use the `VITE_` prefix. Current examples include:

- `VITE_APP_NAME`
- `VITE_APP_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- optional client API keys such as weather or public data providers
- `VITE_GOOGLE_CLIENT_ID`

A `VITE_` variable is compiled into client code. Never put private provider tokens or service-role credentials behind that prefix.

### Server-only variables

Keep these server-side and out of client bundles:

- `SUPABASE_SERVICE_ROLE_KEY`
- `HF_TOKEN_1`, `HF_TOKEN_2`, `HF_TOKEN_3`
- `HF_TEXT_MODEL`, `HF_IMAGE_MODEL`
- `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`
- `GEMINI_API_KEY`, `GEMINI_MODEL`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `GITHUB_TOKEN`

Do not commit real secrets. Do not paste them into issues, docs, screenshots, logs, or agent handoffs.

## Integrated services

### Supabase

Supabase backs authenticated persistence and selected product data. The browser uses the publishable key; privileged operations must remain server-side. See [Database](./DATABASE.md).

### Vercel

Vercel hosts the production application. Automatic Git deployments are disabled. A merge to `main` does **not** publish production.

Production is released deliberately with:

```bash
vercel deploy --prod
```

Do not run that command unless an intentional production release has been requested.

### GitHub Pages

GitHub Pages hosts this documentation portal. Changes under `docs/**` publish through `.github/workflows/pages.yml` after reaching `main`.

Pages is documentation-only and must not be treated as a server/API replacement for `sstoken.space`.

### Hugging Face / AI providers

Dragon Arena and related generation paths use server-side provider tokens and bounded fallback behavior. Start with [AI providers](./AI-PROVIDERS.md) and [Agent handoff](./AGENT_HANDOFF.md) before modifying model routing.

### Google / Gemini / Cloud experiments

Gemini fallback and private Cloud Run experiments are documented in [Cloud experiments](./CLOUD-EXPERIMENTS.md). Keep experiments isolated from normal production behavior and preserve spending safeguards.

## Project source-of-truth files

A new developer or agent should inspect these before making architectural changes:

1. `README.md` — public project overview
2. `docs/GETTING_STARTED.md` — contributor entry point
3. `docs/ENVIRONMENT.md` — integrated environment and release boundaries
4. `docs/AGENT_HANDOFF.md` — current operational/feature context
5. `docs/PROJECT-PULSE.md` — readiness model
6. `docs/FULL_STATUS.md` — Full app/PWA acceptance standard
7. `docs/ISSUE_ROADMAP.md` — remaining roadmap
8. `docs/LAUNCH-CHECKLIST.md` — release gates
9. `src/lib/registry.ts` — canonical app registry and status metadata
10. `.env.example` — environment inventory
11. `vite.config.ts` — app build, manifest, PWA and chunk configuration
12. `vercel.json` — production hosting policy and headers
13. `.github/workflows/` — CI, Pages and automation behavior

Prefer current code and these docs over stale session notes.

## Validation contract

For normal application changes, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

For docs-only changes, the GitHub Pages workflow is the deployment validation. For Cloud worker changes, follow the checks in [Cloud experiments](./CLOUD-EXPERIMENTS.md).

Do not mark a feature production-verified just because code or CI passes. Production can intentionally lag `main` because Vercel deployment is manual.

## Agent operating rules

When an agent picks up the repository:

- read the source-of-truth files above before relying on prior-chat summaries;
- inspect the current issue or target files before editing;
- preserve secrets and browser/server boundaries;
- treat `src/lib/registry.ts` as canonical for app identity/status where applicable;
- keep docs synchronized when architecture, environment, deployment, or readiness rules change;
- do not trigger a Vercel production deployment unless explicitly requested;
- distinguish code-complete, CI-verified, Pages-published, and production-verified states;
- prefer small, reversible changes with a clear validation path;
- update the relevant issue/checklist when a tracked item is actually completed.

## Handoff template

A useful handoff should state:

```text
Goal:
Current branch / latest relevant commit:
Files changed:
What is complete:
What remains:
Validation performed:
Production deployed? yes/no
External setup still required:
Known risks or stale assumptions:
Next files/issues to inspect:
```

Never include real tokens or credentials in the handoff.

# Getting started

AppForge is a Vite + React + TypeScript toolbox that combines focused browser utilities, authenticated product surfaces, and selected server-backed integrations.

## Choose the right path

- **Use AppForge:** go to [sstoken.space](https://www.sstoken.space/) and browse the [app documentation](./apps/index.md) when you need details about a specific tool.
- **Contribute code:** use the local-development steps below, then read [App model](./APP_MODEL.md) and [Project Pulse](./PROJECT-PULSE.md).
- **Maintain or hand off the project:** continue with [Environment & agent pickup](./ENVIRONMENT.md) and [Agent handoff](./AGENT_HANDOFF.md).

The documentation site is intentionally hosted separately on GitHub Pages. It is not the production host for API-backed AppForge features.

New to GitHub repository participation? Read the [GitHub starter guide](./GITHUB_STARTER.md) for star, watch, fork, discussion, and contribution orientation.

## Local development

Requirements:

- Node.js 22 or a compatible current LTS/runtime
- npm
- environment variables only for integrations you intend to exercise

Typical setup:

```bash
git clone https://github.com/dracorisz/appforge.git
cd appforge
npm ci
cp .env.example .env
npm run dev
```

For the Vite frontend without the local API wrapper:

```bash
npm run dev:vite
```

The `.env.example` file is the canonical environment-variable inventory. Never place private server credentials in a `VITE_*` variable because Vite exposes those values to browser code.

## Understand the project

Most contributors only need four primary references:

1. **[App model](./APP_MODEL.md)** — how AppForge apps are registered, routed, and structured.
2. **[Project Pulse](./PROJECT-PULSE.md)** — the current readiness and project-status surface.
3. **[Apps](./apps/index.md)** — per-app behavior, maturity, and standalone-PWA guidance.
4. **[Launch checklist](./LAUNCH-CHECKLIST.md)** — what must be checked before and after an intentional release.

Advanced operational, historical, branching, performance, and handoff material remains available under **Maintainers & agents** in the sidebar. This keeps first-time onboarding short without removing deeper source-of-truth documentation.

When changing an app, also inspect `src/lib/registry.ts`, the implementation files for that app, and its matching open GitHub issue. The registry is authoritative for current app identity and maturity metadata.

## Validate a change

For normal release-facing application work, prefer the combined validation path:

```bash
npm run verify:release
```

The underlying checks include app-registry integrity plus lint, TypeScript, tests, and production build. When debugging, run them separately:

```bash
npm run audit:apps
npm run lint
npm run typecheck
npm test
npm run build
```

Cloud-worker validation is documented separately in [Cloud experiments](./CLOUD-EXPERIMENTS.md). For documentation-only changes, GitHub Pages CI is the deployment validation.

## Deployment model

### Production application

Vercel Git-triggered deployments are disabled. Pushing or merging code is not a production release.

Deploy production deliberately from an authenticated local or controlled environment:

```bash
vercel deploy --prod
```

Do not run a production deployment merely to verify that code merged. Run it only for an intentional release, then complete the smoke checks in [Launch checklist](./LAUNCH-CHECKLIST.md).

### Documentation

Changes under `docs/` are published automatically by the GitHub Pages workflow after changes reach `main`. The docs build is independent of the Vercel production release path.

The docs portal reuses AppForge's `favicon.svg` as the browser favicon, visible header logo, and home-page hero mark so project branding stays aligned with the application.

### Cloud experiments

Gemini/image/thumbnail worker experiments remain isolated in the private Cloud Run workflow with bounded application allowance. See [Cloud experiments](./CLOUD-EXPERIMENTS.md).

## Read status correctly

Use [Project Pulse](./PROJECT-PULSE.md) as the normal entry point for current readiness. The deeper [Full-status standard](./FULL_STATUS.md), [Development timeline](./DEVELOPMENT_TIMELINE.md), and [Issue roadmap](./ISSUE_ROADMAP.md) remain maintainer references rather than required first-time reading.

Keep state language precise: **implemented**, **CI-verified**, **migration-applied**, **Pages-published**, **production-deployed**, and **production-verified** are different states.

## Keeping docs current

When changing architecture, deployment, environment variables, provider behavior, app identity, authentication, database schema, security posture, or readiness expectations, update the matching docs in the same pass. Use [Documentation maintenance](./DOC_MAINTENANCE.md) as the cross-reference matrix.

## Contributing

Use the repository issue and pull-request templates, keep product identity aligned with the canonical registry, and avoid coupling a browser-local tool to server/auth dependencies without a real product requirement.

The root `CONTRIBUTING.md` and `SECURITY.md` remain authoritative for repository-level contribution and security policy.

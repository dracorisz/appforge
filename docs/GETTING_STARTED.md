# Getting started

AppForge is a Vite + React + TypeScript toolbox that combines focused browser utilities, authenticated product surfaces, and selected server-backed integrations.

## Choose the right surface

- **Use the product:** [sstoken.space](https://www.sstoken.space/)
- **Read project/developer docs:** [docs.sstoken.space](https://docs.sstoken.space/)
- **Source, issues, pull requests and releases:** [github.com/dracorisz/appforge](https://github.com/dracorisz/appforge)

GitHub Pages is intentionally the documentation portal. It is not the production host for API-backed AppForge features.

## Before you code

New developers and agents should read [Environment & agent pickup](./ENVIRONMENT.md) before changing integrated features. It explains the browser/server secret boundary, Supabase, Vercel, GitHub Pages, AI providers, Cloud experiments, validation expectations, and the source-of-truth files to inspect first.

New to GitHub repository participation? Read the [GitHub starter guide](./GITHUB_STARTER.md) for star, watch, fork, discussion, and contribution orientation.

Then read the [Development timeline](./DEVELOPMENT_TIMELINE.md), [Issue roadmap](./ISSUE_ROADMAP.md), and [Agent handoff](./AGENT_HANDOFF.md) to understand what is current, what remains, and what should not be inferred from older sessions.

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

Recommended reading order:

1. [Environment & agent pickup](./ENVIRONMENT.md)
2. [Development timeline](./DEVELOPMENT_TIMELINE.md)
3. [Issue roadmap](./ISSUE_ROADMAP.md)
4. [App model](./APP_MODEL.md)
5. [Database](./DATABASE.md)
6. [Security advisor triage](./SECURITY_ADVISORS.md)
7. [AI providers](./AI-PROVIDERS.md)
8. [Project Pulse](./PROJECT-PULSE.md)
9. [Full-status standard](./FULL_STATUS.md)
10. [Launch checklist](./LAUNCH-CHECKLIST.md)
11. [Branding](./BRANDING.md)
12. [Documentation maintenance](./DOC_MAINTENANCE.md)

Then inspect `src/lib/registry.ts`, the files for the feature you are changing, and the matching open issue.

## Validate a change

For normal release-facing application work, prefer the combined validation path:

```bash
npm run verify:release
```

The underlying checks include app-registry integrity plus lint, TypeScript, tests and production build. When debugging, run them separately:

```bash
npm run audit:apps
npm run lint
npm run typecheck
npm test
npm run build
```

Cloud-worker validation is documented separately in [Cloud experiments](./CLOUD-EXPERIMENTS.md).

For documentation-only changes, GitHub Pages CI is the deployment validation.

## Deployment model

### Production application

Vercel Git-triggered deployments are disabled. Pushing or merging code is not a production release.

Deploy production deliberately from an authenticated local/controlled environment:

```bash
vercel deploy --prod
```

Do not run a production deployment merely to verify that code merged. Run it only for an intentional release, then complete the smoke checks in [Launch checklist](./LAUNCH-CHECKLIST.md).

### Documentation

Changes under `docs/` are published automatically by the GitHub Pages workflow after changes reach `main`. The docs build is independent of the Vercel production release path.

The docs portal reuses AppForge's `favicon.svg` as both browser favicon and visible header logo so project branding stays aligned with the application.

### Cloud experiments

Gemini/image/thumbnail worker experiments remain isolated in the private Cloud Run workflow with bounded application allowance. See [Cloud experiments](./CLOUD-EXPERIMENTS.md).

## App maturity

AppForge treats each focused tool as a candidate for an independently understandable and, where practical, extractable app. Read:

- [Project Pulse](./PROJECT-PULSE.md) for the current readiness surface;
- [Full-status standard](./FULL_STATUS.md) for maturity expectations;
- [Apps](./apps/index.md) for per-app documentation;
- [Issue roadmap](./ISSUE_ROADMAP.md) for remaining work.

Task List is now an explicit local-first Beta/75% standalone-PWA candidate alongside Any Converter. The canonical registry currently contains 45 entries as a dated snapshot; always treat `src/lib/registry.ts` as authoritative if the count changes.

## Keeping docs current

When changing architecture, deployment, environment variables, provider behavior, app identity, auth, database schema, security posture, or readiness expectations, update the matching docs in the same pass. Use [Documentation maintenance](./DOC_MAINTENANCE.md) as the cross-reference matrix.

Use precise state language: implemented, CI-verified, migration-applied, Pages-published, production-deployed, and production-verified are different states.

## Contributing

Use the repository issue and pull-request templates, keep product identity aligned with the canonical registry, and avoid coupling a browser-local tool to server/auth dependencies without a real product requirement.

The root `CONTRIBUTING.md` and `SECURITY.md` remain authoritative for repository-level contribution and security policy.

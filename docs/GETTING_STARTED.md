# Getting started

AppForge is a Vite + React + TypeScript toolbox that combines focused browser utilities, authenticated product surfaces, and selected server-backed integrations.

## Choose the right surface

- **Use the product:** [sstoken.space](https://www.sstoken.space/)
- **Read project/developer docs:** [dracorisz.github.io/appforge](https://dracorisz.github.io/appforge/)
- **Source, issues, pull requests and releases:** [github.com/dracorisz/appforge](https://github.com/dracorisz/appforge)

GitHub Pages is intentionally the documentation portal. It is not the production host for API-backed AppForge features.

## Before you code

New developers and agents should read [Environment & agent pickup](./ENVIRONMENT.md) before changing integrated features. It explains the browser/server secret boundary, Supabase, Vercel, GitHub Pages, AI providers, Cloud experiments, validation expectations, and the source-of-truth files to inspect first.

For current operational context and feature-specific handoff notes, continue with [Agent handoff](./AGENT_HANDOFF.md).

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

A useful reading order is:

1. [Environment & agent pickup](./ENVIRONMENT.md)
2. [App model](./APP_MODEL.md)
3. [Database](./DATABASE.md)
4. [AI providers](./AI-PROVIDERS.md)
5. [Project Pulse](./PROJECT-PULSE.md)
6. [Full-status standard](./FULL_STATUS.md)
7. [Issue roadmap](./ISSUE_ROADMAP.md)
8. [Launch checklist](./LAUNCH-CHECKLIST.md)
9. [Branding](./BRANDING.md)

Then inspect `src/lib/registry.ts`, the files for the feature you are changing, and the matching open issue.

## Validate a change

Before merging release-facing application work, run:

```bash
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

### Cloud experiments

Gemini/image/thumbnail worker experiments remain isolated in the private Cloud Run workflow with bounded application allowance. See [Cloud experiments](./CLOUD-EXPERIMENTS.md).

## App maturity

AppForge treats each focused tool as a candidate for an independently understandable and, where practical, extractable app. Read:

- [Project Pulse](./PROJECT-PULSE.md) for the current readiness surface;
- [Full-status standard](./FULL_STATUS.md) for maturity expectations;
- [Apps](./apps/index.md) for per-app documentation;
- [Issue roadmap](./ISSUE_ROADMAP.md) for remaining work.

## Contributing

Use the repository issue and pull-request templates, keep product identity aligned with the canonical registry, and avoid coupling a browser-local tool to server/auth dependencies without a real product requirement.

When changing architecture, deployment, environment variables, provider behavior, app identity, or readiness expectations, update the matching docs in the same change.

The root `CONTRIBUTING.md` and `SECURITY.md` remain authoritative for repository-level contribution and security policy.

# Getting started

AppForge is a Vite + React + TypeScript toolbox that combines focused browser utilities, authenticated product surfaces, and selected server-backed integrations.

## Choose the right surface

- **Use the product:** [sstoken.space](https://www.sstoken.space/)
- **Read project/developer docs:** [dracorisz.github.io/appforge](https://dracorisz.github.io/appforge/)
- **Source, issues, pull requests and releases:** [github.com/dracorisz/appforge](https://github.com/dracorisz/appforge)

GitHub Pages is intentionally the documentation portal. It is not the production host for API-backed AppForge features.

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
npm run dev
```

For the Vite frontend without the local API wrapper:

```bash
npm run dev:vite
```

## Validate a change

Before merging release-facing work, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Cloud-worker validation is documented separately in [Cloud experiments](./CLOUD-EXPERIMENTS.md).

## Deployment model

### Production application

Vercel Git-triggered deployments are disabled. Pushing or merging code is not a production release.

Deploy production deliberately from an authenticated local/controlled environment:

```bash
vercel deploy --prod
```

Then run the smoke checks in [Launch checklist](./LAUNCH-CHECKLIST.md) and the production-validation issue.

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

The root `CONTRIBUTING.md` and `SECURITY.md` remain authoritative for repository-level contribution and security policy.

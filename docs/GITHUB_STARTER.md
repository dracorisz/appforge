# GitHub starter guide

This page helps first-time visitors understand the AppForge GitHub repository and how to participate.

## What you will find

| Area | What it contains |
|---|---|
| `src/` | React application source — components, auth, registry, routing |
| `api/` | Vercel serverless functions for server-backed product features |
| `supabase/` | Database migrations, RLS, storage and RPC history |
| `docs/` | Concise product, developer and operations documentation |
| `tests/` | Unit tests run via `npm test` |
| `services/` | Cloud worker and experiment services |
| `public/` | Static assets including the canonical brand mark and AppForge PWA icons |
| `.github/` | CI/CD workflows, issue templates and PR template |
| `scripts/` | Validation, release and tooling scripts |

## How to participate

### Star the project

Starring the repository helps AppForge gain visibility and makes it easier to return to the project.

### Watch for updates

Use GitHub's **Watch** control to receive the notifications you want for repository activity.

### Fork and experiment

Forking the repository gives you your own copy for development or experimentation. Contributions back to AppForge should use focused pull requests against `main`.

### Report a bug

Use the **Bug report** template. Include the exact Footer build fingerprint from the live site, the route, browser/device, and steps to reproduce.

### Request a tool

Use the **Feature or mini-app request** template and describe the user problem and smallest useful workflow.

### Start a discussion

Use **GitHub Discussions** for ideas, questions, showcases, or longer product/community discussion that is not yet actionable work.

## Quick links

- **Live app:** https://www.sstoken.space/
- **Documentation:** https://docs.sstoken.space/
- **Issue tracker:** https://github.com/dracorisz/appforge/issues
- **Pull requests:** https://github.com/dracorisz/appforge/pulls
- **Discussions:** https://github.com/dracorisz/appforge/discussions
- **Security reports:** https://github.com/dracorisz/appforge/security

## Before you start

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md) for coding and PR expectations.
2. Read [Getting started](./GETTING_STARTED.md) for the shortest product/developer orientation.
3. Read [App model](./APP_MODEL.md) for registry, routing, access and shared UI conventions.
4. Read [Environment](./ENVIRONMENT.md) before changing credentials, providers or deployment-sensitive behavior.
5. Check existing issues before opening a new one.

AppForge itself is the installable Progressive Web App. Internal tools are developed as parts of this integrated product; separate product spin-offs, if created later, belong in separate projects.

## Community

This project is open source and welcomes constructive participation. See [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) for community expectations.

## License

AppForge is licensed under the MIT License. See [LICENSE](../LICENSE).

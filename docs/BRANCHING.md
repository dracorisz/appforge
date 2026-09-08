# AppForge branching and repository access

`main` is the production branch. It should always represent code that is intended to deploy to the canonical Vercel `appforge` project.

## Branch policy

Contributors should create short-lived branches from the latest `main`:

```bash
git checkout main
git pull
git checkout -b feat/scrapper-filter-controls
```

Supported prefixes:

- `feat/` — new user-facing capability
- `fix/` — bug or regression fix
- `docs/` — documentation only
- `refactor/` — behavior-preserving structure cleanup
- `chore/` — tooling, maintenance, dependency work
- `security/` — non-sensitive hardening changes

Keep branch names lowercase, hyphenated, and scoped to one area.

## Pull requests

Open pull requests against `main`.

A PR should be small enough to review as one coherent change. Avoid mixing a design rewrite, database migration, dependency overhaul, and unrelated mini-app work in one PR.

Required checks before merge:

```bash
npm run typecheck
npm run build
```

For UI changes, attach screenshots. For PWA changes, test the production build in browser DevTools → Application. For auth/database changes, describe the RLS/security impact.

## Recommended GitHub ruleset for `main`

When repository visibility is public, configure a branch ruleset for `main` with:

- require a pull request before merging,
- require at least 1 approving review,
- dismiss stale approvals when new commits are pushed,
- require conversation resolution,
- require status checks when CI is added,
- block force pushes,
- block deletion,
- allow repository administrators to bypass only for production incidents.

`CODEOWNERS` assigns the maintainer as the default review owner. GitHub rules should enforce the review requirement; documentation alone is not a security control.

## Direct pushes

Project maintainers may use direct pushes to `main` during active internal development, but public contributors should use PRs. Once the public ruleset is enabled, normal feature work should use PRs for maintainability and auditability.

Emergency production fixes should still be documented in a follow-up issue or PR.

## Forks

Outside contributors without branch write access can fork the repository, create the same branch naming pattern in their fork, and open a pull request to `dracorisz/appforge:main`.

## Release/version rules

Do not bump the semantic version for every branch or PR. The build fingerprint already identifies every deployment.

Only named releases should change the semantic version:

```bash
npm run version:set -- 1.19.0
```

## Security-sensitive changes

Never place credentials, OAuth secrets, production cookies, service-role keys, private user data, or vulnerability exploit details in a public branch.

Use the private security reporting path described in `SECURITY.md`.

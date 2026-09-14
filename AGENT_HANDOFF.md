# AppForge — Agent Handoff

AppForge documentation is managed in Supabase and published at **https://docs.sstoken.space/**. Repository Markdown under `docs/` is no longer a source of truth.

## Before editing

1. Read the current managed documentation at `https://docs.sstoken.space/`, especially Getting Started, App Model, Project Pulse, Environment, Launch Checklist, and Security Advisors when relevant.
2. Use `src/lib/registry.ts` as the canonical app inventory.
3. Use GitHub Issues for actionable work rather than keeping a parallel backlog document in the repository.
4. Keep stable legacy route/database/storage IDs when current product naming has changed.
5. Never expose server credentials through `VITE_*`, browser storage, generated packs, or client-visible responses.
6. Keep documentation changes in `Admin → Content → Docs`; the GitHub Pages workflow deploys the custom Vite docs surface to `docs.sstoken.space`.

## Validation

Run:

```bash
npm run verify:release
```

The release gate includes app-registry integrity, the shared UI style contract, lint, TypeScript, tests, and the production build. Main CI runs the same application build; the separate GitHub Pages workflow builds and deploys the documentation surface.

## Release rule

`main` may be ahead of production. A green commit is **not** permission to deploy. Production Vercel deployment remains an explicit deliberate release action.

Production app: `https://www.sstoken.space/`  
Documentation: `https://docs.sstoken.space/`

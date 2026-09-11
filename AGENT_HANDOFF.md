# AppForge — Agent Handoff

The canonical agent/developer handoff is **[`docs/AGENT_HANDOFF.md`](docs/AGENT_HANDOFF.md)**.

Do not maintain a second project-status snapshot in this root file. Historical duplicated handoff details became stale and were removed intentionally.

## Before editing

1. Read `docs/AGENT_HANDOFF.md`.
2. Read `docs/ENVIRONMENT.md` and the generated `docs/ENV_CAPABILITIES.md` for provider/configuration boundaries.
3. Use `src/lib/registry.ts` as the canonical app inventory.
4. Use GitHub Issues plus `docs/ISSUE_ROADMAP.md` for actionable work.
5. Keep stable legacy route/database/storage IDs when current product naming has changed.
6. Never expose server credentials through `VITE_*`, browser storage, generated packs, or client-visible responses.

## Validation

Run:

```bash
npm run verify:release
```

The release gate includes app-registry integrity, standalone dependency boundaries, environment-doc drift validation, lint, TypeScript, tests, and production build. Main CI additionally builds the VitePress docs.

## Release rule

`main` may be ahead of production. A green commit is **not** permission to deploy. Production Vercel deployment remains an explicit deliberate release action.

Production app: `https://www.sstoken.space/`  
Documentation: `https://docs.sstoken.space/`

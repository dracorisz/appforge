# AppForge documentation

Start with the root [`README.md`](../README.md) for what AppForge is and how to run it.

## Project docs

| Doc | Use it for |
|---|---|
| [`STATUS.md`](./STATUS.md) | Current roadmap, known issues, and pickup notes for the next contributor or agent |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Vercel project, domains, environment variables, release verification |
| [`DATABASE.md`](./DATABASE.md) | Supabase schema, migrations, storage buckets, Row Level Security |
| [`BRANCHING.md`](./BRANCHING.md) | Branch naming, review, and repository access policy |
| [`PWA.md`](./PWA.md) | Install, update prompt, offline behavior, cache debugging |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Coding conventions and pull request expectations |
| [`../SECURITY.md`](../SECURITY.md) | Secret handling and vulnerability reporting |

## App docs

Each mini-app that needs implementation notes gets `docs/apps/<app-id>/README.md`, where `<app-id>` matches its id in `src/lib/registry.ts`.

- [`apps/scrapper-pro/README.md`](./apps/scrapper-pro/README.md)
- [`apps/image-tools/README.md`](./apps/image-tools/README.md)

## Documentation conventions

- Root keeps only `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, and `LICENSE`; everything else lives here.
- One topic per file, and no duplicated environment-variable tables — `DEPLOYMENT.md` is the single source of truth for those.
- `STATUS.md` is the only doc that is expected to go stale between sessions; update it in the same pull request as the work it describes.
- Never paste real keys, tokens, or passwords into docs or `.env.example`.

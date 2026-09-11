# AppForge Documentation

This directory holds the long-form documentation for AppForge. It is the canonical source for how the product is built, deployed, and operated.

## Layout

| Path | Purpose |
|---|---|
| `README.md` | This index |
| `CLOUD-EXPERIMENTS.md` | Private Vertex AI / Cloud Run setup under the $5/day operating target |
| `LAUNCH-CHECKLIST.md` | Consolidated launch tasks and current evidence |
| `DATABASE.md` | Database schema, migrations, and Supabase setup |
| `BRANCHING.md` | Branch policy and contribution workflow |
| `PWA.md` | Progressive Web App behavior and manifest |
| `SESSION_SUMMARY.md` | Per-session change log for agents |
| `AGENT_HANDOFF.md` | Canonical handoff notes; the root handoff links here instead of duplicating status |
| `apps/` | Per-app deep dives for current AppForge tools and product surfaces |

## Apps documented

- **Story Studio** (`apps/dragon-arena/`) — AI-assisted story creation, scene generation, asset continuity, points, and creator workflows
- **Desktop Buddy** (`apps/desktop-buddy.md`) — local-first character companion, portable buddy packs, HF/Vertex generation paths, transparency repair, capture fallback, and browser voice
- **Media Vault** (`apps/media-vault.md`) — private per-user storage with quota, linked Story Studio assets, and Getter Pro references
- **Getter Pro** (`apps/scrapper-pro/`) — public-source search with media preview, downloads, and Media Vault archiving
- **Image Tools** (`apps/image-tools/`) — resize, compress, convert, label, and color picking
- **Markdown Previewer / SVG Tool** — routed browser-local implementations tracked in the canonical registry; maturity promotion remains pending verification

## Quick links

- **Dev**: `npm run dev` starts Vite on `5173` and the API server on `5174`
- **Typecheck**: `npm run typecheck`
- **Release verification**: `npm run verify:release`
- **Build**: `npm run build`
- **Production**: `sstoken.space`

Production deployment remains intentional and manual; Git-triggered Vercel deploys are disabled, so merging to `main` is not itself a production release.

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
| `AGENT_HANDOFF.md` | Handoff notes for the next agent (kept in repo root too) |
| `apps/` | Per-app deep dives (Dragon Arena, Scrapper Pro, Media Vault, image tools) |

## Apps documented

- **Dragon Arena** (`apps/dragon-arena/`) — AI game master, scene generation, asset gallery, points, leaderboard
- **Media Vault** (`apps/media-vault/`) — private per-user storage with quota and direct-to-Supabase uploads
- **Scrapper Pro** (`apps/scrapper-pro/`) — public source search with media preview and downloads
- **Image Tools** (`apps/image-tools/`) — resize, compress, convert, label, and color picking

## Quick links

- **Dev**: `npm run dev` starts Vite on `5173` and the API server on `5174`
- **Typecheck**: `npm run typecheck`
- **Build**: `npm run build`
- **Production**: `sstoken.space`
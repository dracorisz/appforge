# Changelog

## 2.0.0 — 2026-10-20 — Lamat Autonomous Operator Baseline

- Transformed AppForge into **Lamat**, a persistent, goal-oriented autonomous AI operator.
- **Persistent Operational Core (`supabase/migrations/20261020182117_lamat_operational_core.sql`):**
  - Preserved all owner data in `maya_*`, `fin_*`, `profiles`, and `frontend_content`.
  - Added `lamat_tasks`, `lamat_runs`, `lamat_questions`, `lamat_budget_config`, and `lamat_schedules` with Row Level Security (`is_maya_owner()` / `is_lamat_owner()`) and explicit least-privilege grants.
  - Added atomic task lease & stale-run recovery RPCs (`lamat_claim_task`, `lamat_recover_stale_tasks`), budget enforcement RPC (`lamat_budget_status`), and continuity export RPC (`lamat_export_continuity`).
- **Vertex AI Multi-Agent Intelligence (`api/_lamat-agents.js`):**
  - Implemented specialized logical roles (`strategist`, `planner`, `researcher`, `executor`, `evaluator`, `memory_processor`, `supervisor`) with `gemini-3.8-flash` (routine) and `gemini-4-argon` (reasoning/coding), multimodal validation, structured JSON validation, and measured vs. estimated token/cost accounting.
- **Autonomous Execution Engine (`api/_lamat-engine.js`, `api/lamat.js`, `api/companion.js`):**
  - Implemented the 11-step persistent operating cycle with priority scoring, dependency resolution, checkpoint resumption, self-directed idle work discovery, clarifying questions, and parameter-bound HMAC/SHA-256 approvals.
- **Minimal Conversational PWA (`src/auth/LoginPage.tsx`, `src/components/dashboard/Companion.tsx`):**
  - Streamlined interface to `Auth -> Lamat` (Google, GitHub, Email/Password) with a ChatGPT/Claude/Gemini-style conversational workspace, image upload, voice recognition & speech synthesis, and slide-over Operator Panel (`Tasks`, `Inbox`, `Budget`, `Finance`, `Runs`).
  - Removed obsolete AppForge mini-apps, routes, serverless functions, and unused static assets.

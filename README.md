# Lamat — Autonomous AI Operator

**Lamat** is a persistent, goal-oriented autonomous AI operator with a focused conversational PWA interface and a durable server-side execution engine.

Canonical engineering and agent-operating rules live in [`WORK_RULES.md`](./WORK_RULES.md).

---

## 1. Architecture Overview

Lamat is built on four layers:

1. **Supabase PostgreSQL — Persistent Source of Truth (`supabase/migrations/`)**
   - Stores owner identity, active Lamat identity (`maya_identity`), self-model (`maya_self_model`), autonomy policy (`maya_autonomy_policy`), memories (`maya_memories`), goals (`maya_goals`), projects (`maya_projects`), resources (`maya_resources`), financial records (`fin_*`), conversations (`maya_conversations`, `maya_messages`), and actions (`maya_actions`).
   - Stores autonomous operational records in `lamat_tasks` (plans, dependencies, atomic leases, checkpoints, verification evidence), `lamat_runs` (agent role, model, tokens, measured vs. estimated cost, tool invocations, evaluations), `lamat_questions` (clarifying questions linked to paused tasks), `lamat_budget_config` (daily/task/cycle/total caps), and `lamat_schedules`.
   - Enforces Row Level Security (`is_maya_owner()` / `is_lamat_owner()`) and explicit least-privilege grants across all tables.

2. **Google Vertex AI — Multi-Role Intelligence (`api/_lamat-agents.js`)**
   - Uses Workload Identity Federation (`api/_gcp-cloud-run.js`) to authenticate server-side against Google Cloud Vertex AI without static service-account keys.
   - Routes routine operations to `gemini-3.8-flash` and complex planning/reasoning/coding to `gemini-4-argon`.
   - Implements specialized logical roles (`strategist`, `planner`, `researcher`, `executor`, `evaluator`, `memory_processor`, `supervisor`) with role-scoped tool allowlists, structured JSON validation, multimodal support (text, image, voice), and token/cost accounting.

3. **Persistent Execution Engine (`api/_lamat-engine.js`, `api/lamat.js`, `api/companion.js`)**
   - Runs a durable 11-step operating cycle:
     1. Recover expired task leases (`lamat_recover_stale_tasks()`) and verify budget capacity (`lamat_budget_status()`).
     2. Load active goals, tasks, questions, approvals, memories, resources, and financial summary.
     3. Score and select the highest-priority actionable task (`scoreTaskPriority` / `selectNextActionableTask`), or discover justified work (`discoverNextValuableWork`) when the queue is empty.
     4. Claim the task atomically with a lease (`lamat_claim_task`).
     5. Persist the ordered execution plan (`plan_steps`, `expected_outcome`, `verification_method`).
     6. Execute from the last verified checkpoint (`current_step_index`, `checkpoint_state`) without repeating completed steps.
     7. Verify outcomes (`verifyTaskOutcome`) and record evidence.
     8. Record token usage, duration, and measured/estimated USD cost in `lamat_runs`.
     9. Update task, goal, and memory records.
     10. Pause only blocked tasks when asking a focused question (`lamat_questions`) or requesting parameter-bound approval (`maya_actions`), continuing unrelated work in the meantime.
     11. Identify the next actionable task.

4. **Minimal Conversational PWA (`src/auth/LoginPage.tsx`, `src/components/dashboard/Companion.tsx`)**
   - Clean `Auth -> Lamat` flow supporting Google, GitHub, and Email/Password authentication.
   - ChatGPT / Claude / Gemini-style conversational layout with collapsible session sidebar, live autonomous status pill, inline Question & Approval cards, multimodal composer (text, image upload, voice recognition, and speech synthesis), and a slide-over Operator Panel (`Tasks`, `Inbox`, `Budget`, `Finance`, `Runs`).

---

## 2. Development & Verification

```bash
npm install
npm run dev              # Starts Vite frontend + local API server
npm run verify:release   # Runs audit:apps, check:ui-style, lint, typecheck, unit/integration tests, and production build
```

---

## 3. Environment Variables

Client-visible (public):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Server-only (Vercel environment):
- `GCP_PROJECT_NUMBER`
- `GCP_SERVICE_ACCOUNT_EMAIL`
- `GCP_WORKLOAD_IDENTITY_POOL_ID`
- `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID`
- `GCP_CLOUD_WORKER_URL`
- `GCP_WORKER_BUCKET`
- `COMPANION_ACTION_SECRET` (32+ chars for HMAC parameter-bound approval tokens)
- `LAMAT_CRON_SECRET` / `CRON_SECRET`
- `GITHUB_TOKEN`, `VERCEL_API_TOKEN`, `SUPABASE_ACCESS_TOKEN`

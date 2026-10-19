# Companion implementation notes

Companion is a private AppForge app intended to become the project's AI chat and coding agent. Its target is full, authenticated read/write integration with GitHub, Vercel and Supabase—not a read-only dashboard.

## Access boundary

- Companion is owner-only. The client route checks the configured owner identity and every API endpoint must enforce the same restriction server-side; hiding the UI is not an authorization boundary.
- The current endpoint authenticates the Supabase access token and restricts use to `COMPANION_OWNER_EMAIL` (default: `dracorisz@gmail.com`).
- Any new tool endpoint must reuse centralized authentication/authorization and reject requests from every other account.
- Never expose provider tokens, Google Cloud credentials, Supabase service-role keys, or management API tokens to browser code or model context.

## Current slice

- Private route and registry entry.
- Chat UI with authenticated requests.
- Server-side Vertex AI text generation using AppForge's existing Google Workload Identity Federation bridge.
- GitHub, Vercel and Supabase are not yet connected to the Companion runtime. The UI labels are placeholders and must not imply that tools are available.

## Connection status and required credentials

The owner-authenticated `GET /api/companion-integrations` endpoint checks provider credentials server-side and returns only a safe status; it never returns token values. The shared `api/_companion-auth.js` helper verifies the Supabase session and owner email for both chat and integration-status requests.

Configure these Vercel environment variables as encrypted server-side secrets for the environment where Companion is being tested:

- `GITHUB_TOKEN`: a fine-grained GitHub token or GitHub App installation token restricted to the AppForge repository. Grant only the repository and permissions required for enabled tools.
- `VERCEL_API_TOKEN`: a Vercel token restricted to the relevant team/project where possible.
- `SUPABASE_ACCESS_TOKEN`: a Supabase personal access token with only the project-management scopes required for enabled tools.

Do not put these values in chat, source files, client-visible `VITE_*` variables, or the database. After setting each secret, verify the connection in Companion. A successful identity check proves only that the credential is accepted; it does not prove every advertised operation works. Keep an integration marked as unavailable until operation-level tests pass.

Current state: the status endpoint and UI are implemented, but the three provider tokens are not configured in the AppForge Vercel project. Therefore, Companion still cannot perform GitHub, Vercel or Supabase actions. No production deployment has been made for these changes.

## Integration target

Build full management capabilities across the three systems, including read and write operations where the provider API supports them:

- **GitHub:** inspect repositories and issues; create and edit branches/files; prepare commits and pull requests; manage issues and pull requests; inspect workflow runs and logs; merge or close pull requests when authorized.
- **Vercel:** inspect projects, domains, environment-variable metadata and deployment status; manage supported project settings and environment variables; create preview and production deployments; inspect build/runtime logs.
- **Supabase:** inspect project configuration, database schemas, tables, policies and logs; run authorized SQL; create and apply migrations; manage supported project settings and Edge Functions.

Implement these through explicit, typed server-side tools with provider-specific scopes and validation. Do not give the model raw, unrestricted access to provider tokens or an unfiltered generic HTTP/SQL tool. Prefer narrow operations with validated arguments and structured results.

## Approval and autonomy policy

- Companion should be capable of performing write operations; this is not a read-only product.
- Low-risk changes within the user's own project can be executed autonomously when they are reversible and covered by tests.
- Require a clear confirmation before irreversible or high-impact actions, including production deployments, destructive database operations, deleting resources, rotating credentials, changing access controls, and merging to the production branch.
- For code changes, preserve diffs and execution results so the user can inspect what changed. Prefer small commits and automated checks.
- For database changes, create migration files, check RLS and security implications, and verify results. Never silently weaken RLS or expose a table.
- Record tool name, authenticated owner, arguments summary, outcome, request ID and timestamp in an audit trail. Redact secrets and sensitive values.
- Add per-tool rate limits, model-token budgets, operation timeouts and configurable spend limits before enabling write actions.

## Google Cloud / billing

- Model defaults to `gemini-2.5-flash`, overridable with `COMPANION_VERTEX_MODEL`; region defaults to `us-central1`, overridable with `COMPANION_VERTEX_LOCATION`.
- The API uses the existing Google Cloud Workload Identity Federation service account and requires Vertex AI permissions for that identity, plus Vertex AI API enablement in the configured Google Cloud project.
- Keep Google Cloud credentials server-side. Verify model availability, IAM permissions and credit eligibility before relying on a live call.

## Implementation sequence

1. Keep and verify the owner-only boundary across UI and every API endpoint.
2. Implement secure connection/configuration for GitHub, Vercel and Supabase, with tokens stored only as server-side secrets and scopes limited to the AppForge resources needed.
3. Add the complete typed read/write tool set, beginning with low-risk operations and tests for each tool.
4. Add action previews, explicit approvals for high-impact actions, audit records, quotas and spend/operation budgets.
5. Run `npm run verify:release`, validate integration calls against non-destructive resources, and only then consider deployment.

Do not claim an integration or action is available until its credentials, authorization checks, API calls and tests have been verified end to end.

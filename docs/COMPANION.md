# Companion implementation notes

Companion is a private AppForge app intended to become the project's AI chat and coding agent.

## Current slice
- Private route and registry entry.
- Chat UI with authenticated requests.
- Server-side Vertex AI text generation using AppForge's existing Google Workload Identity Federation bridge.
- GitHub, Vercel and Supabase integrations are deliberately shown as not connected until their separate authorization and permission scopes are implemented.

## Security and billing
- The endpoint requires an authenticated Supabase user and validates message count and size.
- Google credentials remain server-side; no cloud credential is sent to the browser.
- This initial slice does not execute tools, change code, run SQL, modify settings, or deploy.
- Model defaults to `gemini-2.5-flash`, overridable with `COMPANION_VERTEX_MODEL`; region defaults to `us-central1`, overridable with `COMPANION_VERTEX_LOCATION`.
- The API uses the existing Google Cloud Workload Identity Federation service account and therefore requires Vertex AI permissions for that identity, plus Vertex AI API enablement in the configured Google Cloud project.

## Next stages
1. Verify the live Vertex model and billing/credit eligibility in Google Cloud.
2. Add read-only GitHub, Vercel and Supabase tools with least-privilege credentials.
3. Add proposed diffs and SQL migrations for review; require explicit approval before writes.
4. Add audit logs, per-user quotas, spend caps, and tool execution budgets before enabling write actions.

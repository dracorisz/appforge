# Security Policy

## Reporting a Vulnerability
Report security issues privately to the repository owner (`dracorisz@gmail.com`) rather than opening a public issue containing exploit details or credentials.

## Secrets & Credentials
- Never commit `.env*` files, API keys, service-role keys, OAuth secrets, or private keys.
- Keep all Google Cloud (Workload Identity Federation), GitHub, Vercel, and Supabase management credentials strictly server-side.
- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` may be exposed to the browser bundle.

## Authority Boundaries & Access Control
- Every table in `public` enforces Supabase Row Level Security (`is_maya_owner()` / `is_lamat_owner()`) and explicit least-privilege grants.
- Execution-layer tool authorization (`enforceToolAuthorization` in `api/_companion-tools.js`) enforces role permissions and blocks `forbidden` categories (`iam_billing_secrets`, `self_governance`) regardless of model instructions.
- Consequential operations require explicit owner approval bound to a SHA-256/HMAC parameter hash (`computeActionParameterHash` / `verifyApproval`). Modifying any material parameter invalidates the approval.

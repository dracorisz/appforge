# Gemini text fallback

Settings → Integrations → AI provider keys accepts a personal Gemini API key.
Keys stay in browser localStorage, are excluded from workspace exports, and are
sent to the same-origin API and Google only when needed. Browser storage is not
an encrypted vault; remove the key on shared devices.

Story Studio (Dragon Arena), including Novel and Comics modes, tries the existing
providers first, then Gemini, then local continuity. Gemini is text-only here;
image generation continues through Hugging Face. The Gemini adapter makes one
bounded request and falls back on rate limits, blocked/empty/incomplete replies,
network errors or invalid credentials. It never switches to Vertex AI or enables
billing. Personal Gemini keys work even when the shared quota is exhausted.
Shared GEMINI_API_KEY usage requires a signed-in user and a successful daily
quota check, including when another personal provider fails. Guests cannot use
this new shared Gemini credential.

Create a key at https://aistudio.google.com/apikey and verify the project's Free
tier. Default: gemini-2.5-flash-lite. Server operators can set GEMINI_MODEL.
API keys do not encode billing tier: a paid project's key can incur charges.
Free-tier inputs/outputs may be used by Google to improve its products.
The standard $300 Cloud welcome credit excludes Gemini API in AI Studio costs;
other promotional credit programs can have different eligibility.
Sources: https://ai.google.dev/gemini-api/docs/billing and
https://docs.cloud.google.com/free/docs/free-cloud-features .

For new text apps, reuse src/lib/aiProviders.ts to attach the saved key and
api/_gemini.js on the server. Each endpoint must authenticate and enforce its own
shared quota before calling the adapter; never ship server keys in VITE_ variables.

# GitHub maintenance

CodeQL is defined in .github/workflows/codeql.yml for Mondays at 04:23 UTC and
manual runs only. Existing lint/tests/typecheck/build CI remains per push/PR.
The repository previously had no CodeQL workflow, so a GitHub default setup may
also be active. In repository Settings → Advanced Security → Code Security → CodeQL analysis,
disable default setup before using the advanced workflow. Verify the next PR
has no automatic CodeQL run. A workflow file cannot disable GitHub default setup.

Supabase Preview is managed outside repository workflow YAML. In the Supabase
project's GitHub integration settings, disable automatic preview branching for
this repository (or disconnect its GitHub integration if no integration is
needed). Do not pause/delete the production project. Verify with a new PR that
no Supabase Preview check or branch is created. These external settings must be
changed with authenticated admin access; adding files cannot disable them.

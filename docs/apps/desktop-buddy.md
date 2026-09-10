# Desktop Buddy

Desktop Buddy is AppForge's local-first dragon character companion at `/apps/desktop-buddy`.

## Current beta

The current beta covers the main local character loop plus an explicit Hugging Face generation path.

- Start from KDE Community Konqi/Katie artwork or upload PNG, JPEG, WebP, or SVG artwork.
- Browse an expanded KDE Community library of source-linked mascot poses with author/license metadata.
- Keep the active character configuration in browser storage.
- Adjust character scale and horizontal/vertical framing.
- Export/import versioned `.buddy.json` packs with provenance.
- Export a transparent 512 × 512 PNG when the source permits browser canvas access.
- Create local 128, 256 and 512 px transparent PNG variants plus WebP alternatives.
- Promote the locally optimized 512 px asset directly into the active character.
- Explicitly generate an original character through the authenticated server-side Hugging Face provider path.
- Reuse the existing AppForge shared image-turn allowance or locally configured personal Hugging Face tokens.
- Preview, download, or apply the generated character to the floating Buddy.
- Select browser voices, Speak/Stop, and optionally auto-speak AppForge response events.
- Keep the configured buddy visible as an optional movable companion across authenticated AppForge routes.
- Use floating actions for Speak, Jump and user-authorized Screenshot capture to Media Vault → Screenshots.

## KDE starter artwork

Desktop Buddy uses KDE dragon artwork as the default starting point. It does not substitute an unrelated generated mascot for the KDE direction.

The app now exposes a broader KDE Community library, including classic Konqi, KDE development, Developer Katie, graphics, hardware, internet, presentation, science, system, utilities, Frameworks, Qt, Akademy, carrying/box poses, Pixel Konqi and group artwork. These entries use KDE Community file redirects rather than silently copying the upstream originals into the AppForge repository.

Every library entry keeps a source page, author/project label and license label. Known Tyson Tan mascot files are identified as CC BY-SA KDE Community artwork. Newer carrying/box artwork records the derivative author where the KDE file page provides it. For recent community uploads without a specific embedded artist statement, the app records KDE Community provenance and links directly to the source page rather than inventing attribution.

The local optimizer is the preferred normalization path: users can create AppForge-sized derivatives in their browser while retaining the original source/provenance reference.

## Local asset optimizer

The optimizer runs entirely in the browser and consumes no Hugging Face or Google Cloud credits. A source image can be fitted into transparent square canvases at 128, 256 and 512 pixels. Each PNG is downloadable; WebP alternatives are offered where supported. The 512 px PNG can become the active buddy immediately.

The optimizer rejects oversized source bytes/dimensions that could exhaust browser memory. This is local preparation/export, not an automatic cloud upload.

## Hugging Face generation

`/api/desktop-buddy-image` is an authenticated, explicit-action endpoint. It uses the shared AppForge Hugging Face provider adapter in `api/_hf-image-provider.js`, including:

- server-side `HF_TOKEN_1..3` rotation;
- optional personal `hf_` token headers already supported by Story Studio;
- live Hugging Face inference-provider mapping;
- model fallback beginning with the configured `HF_IMAGE_MODEL`;
- bounded provider timeouts;
- fal-ai, Replicate, Together/Nscale and hf-inference response handling;
- validated image MIME/size boundaries;
- sanitized provider-attempt diagnostics without token disclosure.

Shared-token generation uses the existing AppForge daily image-turn allowance and refunds that allowance when provider generation fails. Personal-token generation does not consume the shared allowance. Nothing runs automatically or in the background.

Generated image responses are intentionally bounded before being returned to the browser. A generated character can remain local, be downloaded, or become the current floating Buddy; it is not automatically published or minted.

## Vertex AI boundary

Vertex remains intentionally gated. The private `services/cloud-worker` implementation already supports a server-controlled image job with Firestore reservation accounting, private Cloud Storage outputs and the project cost policy. It must remain IAM protected.

Desktop Buddy must not call that private Cloud Run service directly from the browser. The remaining production bridge requires Vercel → Google workload identity, authenticated per-user authorization/job ownership, and a reviewed private-result transfer path. Until those controls exist, the Desktop Buddy UI identifies Vertex as prepared but unavailable rather than presenting a fake working button.

## Data boundary

User-uploaded artwork and local optimizer output remain browser-local unless the user explicitly invokes a separate upload action. KDE choices store remote source/provenance metadata. Buddy pack export copies the current configuration and provenance into the downloaded JSON.

Hugging Face generation is an explicit authenticated server call. Personal provider tokens are sent only with that explicit request and are never embedded into buddy packs or generated-image provenance.

## Agent response bridge

Desktop Buddy listens for:

```js
window.dispatchEvent(new CustomEvent('appforge:agent-response', {
  detail: { text: 'Response text for the buddy' },
}))
```

The editor and floating overlay react to the same event. If auto-speech is enabled, the configured browser voice reads the response. AppForge agent-producing surfaces should emit this shared event after successful assistant/model responses so the companion behaves consistently across apps.

## Persistent companion

The authenticated AppForge layout mounts the floating Desktop Buddy outside the full editor. The widget:

- loads the active browser-local character;
- has its own page-level on/off switch;
- can be dragged around the viewport and remembers position;
- displays the latest agent response;
- speaks the last response;
- performs a jump animation;
- opens the browser-required tab/screen picker for Screenshot;
- uploads a permitted screenshot to the authenticated Media Vault under `Screenshots`;
- refreshes after character/library/optimizer changes.

Browsers do not permit silent screenshots. The capture action therefore always depends on explicit browser permission.

## Remaining milestones

- Refactor Story Studio fully onto the new shared `api/_hf-image-provider.js` helper so both product surfaces have one implementation of provider mechanics.
- Add the Vercel → Google workload-identity/per-user bridge before enabling Vertex generation from Desktop Buddy.
- Emit `appforge:agent-response` consistently from all AppForge AI/agent surfaces.
- Add deterministic browser/E2E coverage for dragging, widget switches, generation error states and screenshot permission/cancellation.
- Add post-deploy screenshots and production smoke evidence.
- Continue adding KDE poses only when file-level provenance is traceable.

## Release policy

Only deploy a `main` commit after registry audit, lint, TypeScript, unit tests, production build and Cloud Run worker validation pass. Post-deploy smoke should cover KDE starter loading, custom upload, framing, packs, local optimization, Hugging Face status/generation, applying/downloading generated output, floating widget state/drag/actions, screenshot → Media Vault, and provider failure behavior.

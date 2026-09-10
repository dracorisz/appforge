# Desktop Buddy

Desktop Buddy is AppForge's local-first dragon character companion at `/apps/desktop-buddy`.

## Current beta

The current beta is a usable character-pack, local asset-preparation, and response-reaction workspace rather than only a placeholder surface.

- Start from curated KDE Community Konqi dragon artwork or upload PNG, JPEG, WebP, or SVG artwork.
- Keep the active character configuration in browser storage.
- Adjust character scale and horizontal/vertical framing.
- Export the complete configuration as a versioned `.buddy.json` pack, including starter-asset provenance and license metadata.
- Import version 1 or version 2 buddy packs.
- Export a transparent 512 × 512 PNG when the source image permits browser canvas access.
- Create local 128, 256 and 512 px transparent PNG variants plus WebP variants when browser support is available.
- Promote the locally optimized 512 px asset directly into the active Desktop Buddy configuration.
- Select Hugging Face, Vertex AI, or local/browser as the provider path.
- Preview speech using browser Speech Synthesis, select a local voice, and stop speech immediately.
- React to the shared `appforge:agent-response` browser event and optionally auto-speak the event text.
- Test the response bridge directly from the app before provider integration is complete.
- Keep the configured buddy visible as an optional persistent companion across authenticated AppForge routes.

## KDE starter artwork

Desktop Buddy uses KDE dragon artwork as the default starting point, following the requested KDE Community direction instead of substituting an unrelated generated mascot.

The starter gallery currently links to KDE Community Wiki assets rather than copying ambiguous media into the repository:

- **Konqi** — default KDE dragon mascot; source: KDE Community `Promo/Material/Mascots`.
- **Utilities Konqi** — Tyson Tan KDE utilities mascot from the KDE Community file page.
- **Konqi + Katie** — KDE dragon pair with smartphones from the KDE mascot material page.

The app records the source URL and license description in the active buddy configuration and exported pack. When a remote asset blocks canvas export because of cross-origin policy, the UI asks the user to download it from the KDE source or upload a local copy before exporting PNG.

## Local asset optimizer

The optimizer runs entirely in the browser and does not consume Hugging Face or Google Cloud credits. A user-supplied image can be fitted into transparent square canvases at 128, 256 and 512 pixels. Each PNG is downloadable; WebP alternatives are offered when the browser can encode them. The 512 px PNG can also be applied directly to the active buddy.

The optimizer rejects sources larger than the current local safety limit and refuses extremely large dimensions that could exhaust browser memory. This is a preparation/export path, not a cloud upload pipeline.

## Data boundary

User-uploaded artwork is converted to a data URL and stored with the Desktop Buddy configuration in browser storage. Uploaded artwork is not sent to AppForge servers merely by selecting or optimizing it.

KDE starter choices store their remote source URL and attribution/license metadata. Exporting a buddy pack copies the current configuration and provenance into the downloaded JSON file.

Future Hugging Face or Vertex AI generation remains an explicit action and must use server-side credentials. Provider keys must never be embedded in browser code or buddy packs.

## Provider direction

The provider selector establishes the intended execution path without pretending that all adapters are complete:

- **Hugging Face** — selected for server-side character generation/optimization work. AppForge already has provider discovery/rotation, token fallback, timeouts, quota/refund handling and asset provenance in the existing server-side image stack; Desktop Buddy should reuse that architecture instead of adding a client-side secret-bearing implementation.
- **Vertex AI** — intended for explicit experiments behind server-side credentials and the project's cost-control policy.
- **Local/browser** — character, pack, PNG/WebP optimization, framing, event reaction, persistent overlay, and speech features that do not require a provider credential.

Real Desktop Buddy Hugging Face and Vertex image-generation adapters remain roadmap work.

## Agent response bridge

Desktop Buddy listens for:

```js
window.dispatchEvent(new CustomEvent('appforge:agent-response', {
  detail: { text: 'Response text for the buddy' },
}))
```

When such an event arrives, Desktop Buddy updates its visible response and reaction state. If auto-speech is enabled, it reads the response through the selected browser voice. The persistent overlay uses the same event. AppForge agent-producing surfaces still need to emit this event consistently for complete cross-app integration.

## Persistent companion

The authenticated AppForge layout mounts Desktop Buddy on app routes except the full Desktop Buddy editor itself. The overlay:

- loads the active browser-local character configuration;
- remembers hide/show state;
- expands to show the latest agent response;
- reflects whether voice is enabled;
- uses the configured browser voice when auto-speech is enabled;
- synchronizes after local optimizer updates.

## Remaining milestones

- Wire real server-side Hugging Face generation/optimization using the existing provider architecture.
- Wire explicit Vertex AI image experiments without exposing credentials and within project spend controls.
- Emit `appforge:agent-response` consistently from AppForge agent surfaces.
- Add deterministic browser tests and post-deploy screenshots.
- Continue starter-asset/license review before adding any copied/modified KDE media to the repository.

## Release policy

Only deploy a `main` commit after registry audit, lint, TypeScript, unit tests, production build and Cloud Run worker validation pass. After deployment, smoke-test `/apps/desktop-buddy` for KDE starter loading, upload, framing, reset, pack export/import, local 128/256/512 optimization, PNG/WebP downloads, applying the optimized 512 px buddy, provider selection, persistent overlay, response reaction, and browser speech controls.

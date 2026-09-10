# Desktop Buddy

Desktop Buddy is a local-first AppForge character companion workspace at `/apps/desktop-buddy`.

## Current beta

The first beta focuses on a safe, portable character workflow before any provider-backed generation is enabled.

- Upload PNG, JPEG, WebP, or SVG character artwork.
- Keep the active character configuration in browser storage.
- Adjust character scale and horizontal/vertical framing.
- Export the complete configuration as a `.buddy.json` pack.
- Import a previously exported buddy pack.
- Select a future provider path: Hugging Face, Vertex AI, or local/browser.
- Preview spoken responses using browser speech synthesis and a locally available voice.
- Use the built-in dragon placeholder before adding custom artwork.

## Data boundary

The current beta does not upload character artwork to AppForge servers. Uploaded artwork is converted to a data URL and persisted with the Desktop Buddy configuration in browser storage. Exporting a buddy pack copies that data into the user-downloaded JSON file.

Future Hugging Face or Vertex AI generation must remain an explicit user action and must use server-side credentials. Provider keys must never be embedded in browser code or buddy packs.

## Provider direction

Desktop Buddy exposes provider selection now so the portable pack format does not need to change later. The first beta does not claim that provider-backed character generation is active.

Planned provider work should reuse the existing AppForge server-side provider policy, Hugging Face token handling, and Google Cloud / Cloud Run cost-control boundary.

## Voice

Voice preview uses the browser Web Speech API when available. The chosen voice name is stored in the buddy configuration. Auto-speaking real agent responses is intentionally deferred until an explicit response-event bridge exists.

## Starter artwork

Do not copy mascot or dragon artwork into the repository unless its license and attribution requirements are verified. Curated KDE/open-source starter assets should include source, author/project, license, and modification notes alongside the asset.

## Release policy

Merging Desktop Buddy does not imply deployment. AppForge production remains manually deployed. After an intentional production deploy, smoke-test `/apps/desktop-buddy` for upload, framing, reset, export/import, provider selection, and voice preview.

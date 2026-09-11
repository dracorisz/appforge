# Story Studio export roadmap

Story Studio's current MVP exports are deliberately portable and browser-friendly:

- **Novel mode:** Markdown with the active opening and ordered narrative turns.
- **Comics mode:** standalone HTML with ordered panels and associated text.

These formats remain the canonical MVP exports because they are inspectable, editable, and do not require a server-side publishing pipeline.

## Future formats

### PDF

PDF should be treated as a presentation/export layer over the canonical project data, not as the project source of truth. A future PDF path should support title/cover metadata, consistent page margins and typography, image downscaling, page-break controls, and predictable offline output. Novel PDF can render prose chapters; Comics PDF can render panel grids or one-panel-per-page layouts.

### EPUB

EPUB is the preferred future long-form ebook format for Novel projects. The exporter should package semantic XHTML chapters, project metadata, a cover asset, generated scene images, a table of contents, and accessible image alternative text. The project should keep Markdown/session data canonical and generate EPUB on demand rather than storing EPUB as editable state.

### CBZ

CBZ is the preferred future portable comic-reader format. The exporter should create an ordered ZIP archive of numbered panel/page images plus optional `ComicInfo.xml` metadata. Story text that matters to the comic must already be rendered into the exported page/panel design or represented in a documented companion metadata strategy.

## Shared requirements before adding PDF/EPUB/CBZ

1. Project title and optional cover metadata are persisted with the Story Studio session.
2. Export ordering comes from canonical turn/panel order, never DOM order.
3. Private Media Vault assets are resolved only during an explicit user export action.
4. Exported artifacts contain no auth tokens, provider keys, private infrastructure IDs, or hidden prompts unless the user explicitly asks to include prompt metadata.
5. Image dimensions and compression are bounded so large generated sessions cannot exhaust browser memory.
6. Exports remain deterministic for the same saved project wherever practical.
7. The current Markdown and standalone-HTML exports remain available even after richer formats ship.

## Implementation direction

Prefer a shared intermediate `StoryExportProject` model containing project metadata, ordered narrative turns, ordered scene/panel assets, captions/alt text, and export preferences. Markdown, HTML, PDF, EPUB, and CBZ adapters should consume that normalized model. This keeps provider/session/storage details outside the format-specific exporters and makes standalone Story Studio extraction easier later.

PDF/EPUB/CBZ are roadmap items, not part of the current MVP release gate. They should only move into implementation after project title/cover metadata and explicit project setup controls are complete.

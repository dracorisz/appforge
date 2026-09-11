# Landing Builder plan

Status: planned public mini-app

## Goal

Turn the AppForge public landing surface into a useful mini-app in its own right: a no-login, browser-local drag-and-drop landing-page builder that also acts as the fourth featured public AppForge tool.

The public marketing homepage and the builder should share one visual language, but editing controls must stay optional so the default visitor still sees a clean product landing page.

## Public behavior

- Works without login.
- Uses browser-local state first.
- Starts from a small set of polished landing templates.
- Drag/reorder sections: hero, feature grid, proof, gallery, CTA, FAQ, footer.
- Inline editing for text, links, button labels, spacing and alignment.
- Appearance presets reuse AppForge semantic theme tokens.
- Image slots accept local uploads and Media Vault assets after sign-in.
- Live responsive preview for phone / tablet / desktop widths.
- Export a complete static landing-page package.
- Import a previous Landing Builder export and continue editing.
- No account is required for core create/edit/export workflow.

## AppForge integration

The public front page currently features Hugging Face separately plus Weather Now, Any Converter and Getter Pro. Landing Builder is the intended fourth public mini-app once it reaches Beta quality.

Signed-in users can additionally:

- save named landing projects;
- use Media Vault assets;
- sync projects across devices;
- inherit Settings → Appearance defaults;
- fork/export the builder as a standalone PWA when it reaches Full status.

## Full-status target

Landing Builder reaches **Full** only when it satisfies `docs/FULL_STATUS.md`, including:

- independent PWA extraction guide;
- local-first core editing;
- deterministic import/export format;
- responsive touch-friendly drag/reorder plus non-drag alternatives;
- no broken exported assets;
- documented deployment path for static hosting;
- build/type/lint checks and production smoke test.

## Near-term implementation order

1. Define project JSON schema.
2. Build section registry and reusable renderer.
3. Add keyboard/touch-safe reorder controls.
4. Add inline field editor.
5. Add responsive preview modes.
6. Add export/import.
7. Add optional signed-in project persistence and Media Vault selection.
8. Feature it publicly as the fourth AppForge no-login mini-app.

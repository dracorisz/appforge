# SVG Icons — standalone PWA guide

Registry ID: `svg-icons-browser`  
AppForge route: `/apps/svg-icons`

## Product boundary

Entry component: `src/components/public/SvgIconsBrowser.tsx`.

Core behavior is browser-local. No auth/database/server API is required. Icon packs are imported dynamically from `react-icons/<pack>` only after the user selects a pack, which avoids loading the full catalog into the initial route bundle.

Runtime dependencies:

- `react`
- `react-dom`
- `react-icons`
- `lucide-react`

`react-dom/server` is dynamically imported only when producing rendered SVG markup for copy/download.

## Local state

Favorites and recent icon IDs are stored in localStorage:

- `appforge-svg-icons-favorites-v1`
- `appforge-svg-icons-recents-v1`

No provider/account data is involved.

## Licensing boundary

`react-icons` aggregates multiple upstream icon projects. A standalone fork must keep the source-pack identification visible and direct developers to the relevant upstream/react-icons license information. AppForge does not claim ownership of any upstream icon set. Brand icons can also have trademark restrictions independent of code licenses.

Raw/rendered SVG export should therefore remain accompanied by a license/attribution reminder rather than implying every SVG is unrestricted.

## Performance

Keep the per-pack dynamic-import strategy. Do not replace it with a root `react-icons` import or eagerly import all packs; that defeats the AppForge bundle-size work.

The current UI pages results 120 at a time to keep DOM work bounded even for very large packs.

## Offline classification

**offline-core** once the selected pack chunks have been cached. A pack that has never been fetched before cannot become available while fully offline.

## Verification matrix

- load several small and large packs;
- component-name search;
- load-more behavior;
- preview-size control;
- copy React import/JSX;
- copy/download SVG;
- favorites/recents persistence;
- keyboard/touch navigation;
- no large initial-route regression;
- license/attribution copy remains visible.

Follow `docs/STANDALONE_PWA_TEMPLATE.md` for extraction and build gates.

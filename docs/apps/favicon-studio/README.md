# Favicon Studio — standalone PWA guide

Registry ID: `favicon-studio`  
AppForge route: `/apps/favicon-studio`  
Status target: Full-ready browser-local PWA

## Product boundary

Entry component: `src/components/public/FaviconStudio.tsx`.

Primary workflow is entirely browser-local. No auth, database, server API, storage bucket, or environment variable is required.

Browser APIs used:

- `FileReader` for local image input;
- `Canvas` + `Image` for PNG rendering;
- `Blob`, object URLs and downloads;
- `navigator.clipboard` for copy actions.

## Standalone dependencies

Minimal runtime:

- `react`
- `react-dom`
- `lucide-react`

AppForge Tailwind/shared semantic variables may be copied or replaced with local CSS.

## Export behavior

The app generates:

- `favicon.svg`;
- PNG outputs at 16, 32, 180, 192 and 512 px;
- `favicon.ico` containing a standards-compatible 32px PNG image entry;
- `site.webmanifest`;
- copy/download-ready favicon `<link>` tags.

Uploaded images are read into memory/data URLs and are not sent to AppForge servers.

## Offline classification

**offline-core** after the PWA shell is cached.

## Suggested standalone manifest

- name: `Favicon Studio`
- short name: `Favicon`
- start URL: `/`
- display: `standalone`
- categories: `design`, `developer`, `utilities`

The product can generate its own final icons after launch; bootstrap the standalone package with AppForge's neutral favicon assets until then.

## Verification matrix

- text and emoji source;
- local raster/SVG image input where the browser can decode it;
- transparent/solid-color rendering;
- all PNG sizes download;
- ICO opens in a current browser/OS favicon consumer;
- manifest and link-tag output;
- clipboard denied path;
- narrow mobile controls and range inputs;
- offline reload after first cached load.

Follow `docs/STANDALONE_PWA_TEMPLATE.md` for the shared extraction/build/accessibility gate.

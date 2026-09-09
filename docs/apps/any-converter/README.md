# Any to Any Converter

Current AppForge status: **Beta**  
Full-status target: **first standalone PWA candidate**

Route: `/apps/any-converter`

## Purpose

Any to Any Converter is a browser-first conversion tool for text and structured data. It currently supports implemented conversion pairs across JSON, CSV, YAML, XML, Markdown, HTML, Base64, URL-encoded text and plain text.

The converter is intentionally local: the primary conversion workflow does not require Supabase, Vercel APIs, authentication or third-party provider credentials.

## Current capabilities

- choose input/output formats from the implemented converter registry;
- validation where a converter provides it;
- local text-file loading;
- copy converted output;
- download converted output using a format-appropriate extension;
- swap input/output when a reverse conversion is implemented;
- explicit errors for unsupported or invalid conversions;
- local browser processing only for the primary workflow.

Primary source files:

- `src/components/dashboard/AnyToAnyConverter.tsx`
- `src/lib/converters.ts`

Shared AppForge presentation dependencies:

- `src/components/ui/Card.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Select.tsx`
- AppForge Tailwind theme tokens from `src/index.css`

## Standalone dependency profile

The conversion engine itself has no server-side dependency.

Browser APIs currently used include:

- `File.text()` for local file loading;
- `Blob` + object URLs for downloads;
- `navigator.clipboard` for copy, with an explicit browser-blocked error path;
- `TextEncoder` / `TextDecoder`;
- `btoa` / `atob`;
- `DOMParser` for XML;
- ordinary string/JSON processing.

A standalone React implementation needs only the UI/runtime packages relevant to its presentation. The current AppForge component uses React and Lucide icons. Supabase, React Router, React Icons and AppForge server APIs are not required by the converter itself.

## Full-status extraction plan

### Standalone product name

`Any Converter` or `Any to Any Converter`

### AppForge route

`/apps/any-converter`

### Entry component

`src/components/dashboard/AnyToAnyConverter.tsx`

### Core engine

`src/lib/converters.ts`

### Server API routes

None required for the primary workflow.

### Database migrations

None.

### Storage buckets

None.

### Environment variables

None required for conversion.

### Required npm dependencies for a minimal extracted React version

- `react`
- `react-dom`
- `lucide-react`

If the AppForge visual design is retained, also include Tailwind/PostCSS/Vite dependencies or replace the shared AppForge UI components with local equivalents.

### Optional AppForge integrations

These can be removed without changing conversion behavior:

- authenticated AppForge shell;
- favorites/recent tools;
- profile/settings;
- Supabase;
- Media Vault;
- app registry;
- shared footer/build metadata.

### Standalone auth requirement

None.

### Offline behavior

After the standalone PWA shell and code are cached, the primary conversion workflow can operate offline because conversion, validation, file reading and output generation are browser-local.

### Suggested standalone build

- Vite + React + TypeScript;
- one route/page;
- manifest with converter-specific name/icon/description;
- `vite-plugin-pwa` or equivalent service-worker packaging;
- no serverless functions required.

## Gaps before Full

The app should **not** be marked Full yet. Remaining work:

- add real linting to the repository or extracted package;
- add deterministic converter tests for important edge cases;
- verify mobile layout and file/copy/download behavior on current production;
- audit the lightweight YAML and Markdown/XML conversion limitations and document them clearly in UI;
- provide app-specific standalone icon/manifest metadata;
- produce the actual extraction/starter package or repeatable extraction script;
- run standalone `typecheck`, `build`, lint and PWA-install smoke tests;
- document any format-specific limitations that remain after testing.

## Recommended test matrix

At minimum verify:

- JSON → CSV with commas, quotes, newlines and missing fields;
- CSV → JSON with escaped quotes and multiline cells;
- invalid JSON/CSV errors;
- JSON ↔ YAML supported subset and unsupported YAML arrays behavior;
- XML → JSON valid/invalid XML;
- Markdown ↔ HTML supported subset;
- UTF-8 Base64 encode/decode;
- invalid Base64;
- URL encode/decode including malformed percent sequences;
- copy success/failure path;
- text-file load;
- output download filename/extension;
- reverse/swap availability;
- narrow mobile layout;
- offline reload after PWA install/cache.

## Full promotion gate

Promote Any Converter to `Full` only after all requirements in `docs/FULL_STATUS.md` are satisfied and a developer can extract it using this document without reverse-engineering unrelated AppForge code.

This app is currently the best candidate for establishing the reusable standalone-PWA extraction pattern that later mini-apps can follow.

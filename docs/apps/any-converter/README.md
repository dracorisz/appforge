# Any to Any Converter

Current AppForge status: **Beta / Full-ready candidate**  
Full-status target: **first standalone PWA proof**

Route: `/apps/any-converter`

## Purpose

Any to Any Converter is a browser-first conversion tool for text and structured data. It supports implemented conversion pairs across JSON, CSV, YAML, XML, Markdown, HTML, Base64, URL-encoded text and plain text.

The primary conversion workflow is local: it does not require Supabase, Vercel APIs, authentication, provider credentials, or a server function.

## Current capabilities

- choose input/output formats from the implemented converter registry;
- validation where a converter provides it;
- local text-file loading;
- copy converted output;
- download output using a format-appropriate extension;
- swap input/output when a reverse conversion exists;
- explicit errors for unsupported/invalid conversions;
- browser-local processing for the primary workflow.

Primary source files:

- `src/components/dashboard/AnyToAnyConverter.tsx`
- `src/lib/converters.ts`

Shared presentation dependencies:

- `src/components/ui/Card.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Select.tsx`
- semantic AppForge Tailwind variables from `src/index.css`

## Exact converter boundary

The registry currently implements these families:

- JSON → CSV;
- CSV → JSON;
- JSON → YAML;
- YAML → JSON (documented lightweight subset below);
- XML → JSON;
- Markdown → HTML;
- HTML → Markdown;
- UTF-8 text → Base64;
- Base64 → UTF-8 text;
- text → URL-component encoding;
- URL-component decoding → text;
- uppercase/lowercase/title-case text transforms.

The UI only advertises conversion pairs returned by the converter registry; it does not imply an arbitrary cross-product of every format.

## Format limitations

### YAML → JSON

The current lightweight parser intentionally supports a deterministic mapping/scalar subset rather than the full YAML specification:

- two-space indentation;
- nested mappings;
- strings, numbers, booleans and null;
- quoted mapping keys/values;
- comment-only/blank lines.

It intentionally rejects:

- YAML arrays/sequences (`- item`);
- odd/non-two-space indentation;
- anchors/aliases;
- block/folded scalar syntax;
- tags/custom types;
- multi-document YAML;
- advanced YAML 1.1/1.2 implicit typing.

For array-heavy data, use JSON as the source and JSON → YAML for output. The UI should continue surfacing parser errors instead of silently guessing.

### JSON → YAML

JSON → YAML supports JSON arrays/objects/scalars and emits a conservative YAML representation. It does not attempt advanced YAML features because JSON cannot express them.

### XML → JSON

XML parsing uses the browser's `DOMParser`. The standalone app therefore requires a browser runtime for this converter unless a DOM-compatible parser is deliberately added for server/CLI use.

Attributes are represented under `@attributes`, mixed direct text under `#text`, and repeated child element names become arrays.

### Markdown / HTML

These are lightweight document transformations, not a complete CommonMark/HTML round-trip engine. Preserve the implemented subset in the UI description and do not promise lossless conversion for arbitrary documents.

## Standalone dependency profile

Browser APIs currently used include:

- `File.text()`;
- `Blob` + object URLs;
- `navigator.clipboard`;
- `TextEncoder` / `TextDecoder`;
- `btoa` / `atob`;
- `DOMParser` for XML;
- ordinary string/JSON processing.

Minimal extracted React runtime:

- `react`
- `react-dom`
- `lucide-react`

Supabase, React Router, React Icons and AppForge server APIs are not required by the converter core.

## Full-status extraction procedure

1. Create a Vite + React + TypeScript project.
2. Copy `src/components/dashboard/AnyToAnyConverter.tsx`.
3. Copy `src/lib/converters.ts`.
4. Copy only the four shared UI primitives listed above, or replace them with local equivalents.
5. Recreate the semantic CSS variables/classes used by the component.
6. Install React, React DOM and Lucide.
7. Add a one-page app entry that renders `AnyToAnyConverter`.
8. Add converter-specific manifest/icons and a prompt-style PWA service worker.
9. Do **not** copy Supabase/auth/provider/server code; none is required.
10. Run the validation commands below and the representative conversion matrix.

Shared extraction expectations are defined in `docs/STANDALONE_PWA_TEMPLATE.md`.

## Standalone PWA metadata

Recommended manifest values:

- name: `Any to Any Converter`
- short name: `Any Converter`
- description: `Browser-local text and structured-data conversion.`
- start URL: `/`
- display: `standalone`
- categories: `utilities`, `productivity`, `developer`

Use app-specific 192×192, 512×512 and maskable icons before declaring the extracted package production-ready.

## Offline classification

**offline-core** after the standalone code/PWA shell is cached. Conversion, validation, local file loading and output generation require no remote service.

Clipboard behavior still depends on browser permissions/security context.

## Verification gate

The AppForge repository now provides a GitHub Actions CI gate that runs:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

The extracted standalone package must run the equivalent lint/typecheck/test/build steps as well.

Representative behavior matrix:

- JSON → CSV with commas, quotes, newlines and missing fields;
- CSV → JSON with escaped quotes and multiline cells;
- invalid JSON/CSV errors;
- JSON → YAML arrays/nested objects;
- YAML → JSON supported mapping/scalar subset;
- explicit YAML sequence rejection;
- XML → JSON valid/invalid XML in a browser;
- Markdown ↔ HTML supported subset;
- UTF-8 Base64 encode/decode;
- invalid Base64;
- URL encode/decode and malformed-percent failure;
- text transformations;
- copy success/failure path;
- local file load;
- output extension/filename;
- reverse/swap availability;
- narrow mobile layout;
- offline reload after first PWA cache/install.

## Data/security profile

- no account required;
- no remote persistence;
- no user content transmitted by the converter core;
- no environment variables;
- no server secrets;
- no database migrations/storage buckets.

## Full promotion gate

The AppForge-integrated app remains Beta until the umbrella production smoke pass can run on a current deployment. Its **code/dependency/extraction boundary is Full-ready**: a developer can now extract it using this guide without reverse-engineering unrelated AppForge infrastructure.

Production-only validation is intentionally tracked under the public-beta smoke issue rather than duplicating it here.

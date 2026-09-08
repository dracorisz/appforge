# AppForge — Kilo Code Refactor & Polish Prompt

## Goal

Transform the existing **ProjectForge** application into a polished, consistent, modular utility platform named **AppForge**.

**AppForge** should feel like a fast, clean developer toolbox: many focused mini-apps, organized into logical categories, with one consistent design system and architecture.

**Do not rewrite the project blindly.** Inspect the existing codebase first, preserve working functionality, then refactor incrementally.

---

## 1. Audit First

Before changing code:

- Inspect the complete repository and determine the framework, routing, state management, styling, component structure, persistence, and current app registry.
- Find all existing mini-apps and understand what each actually does.
- Identify duplicated UI, hardcoded app/category lists, inconsistent styling, dead code, and unnecessary complexity.
- Identify every user-facing occurrence of `ProjectForge`, `projectforge`, `PROJECTFORGE`, `PF_`, and related branding.
- Run the existing build/typecheck/tests before major changes if available.

**Do not ask me to explain files you can inspect yourself.**

---

## 2. Global Rebrand

Rename the product everywhere user-facing:

**ProjectForge → AppForge**

Update:

- app/browser title
- sidebar/header/footer
- routes and navigation labels where appropriate
- metadata/manifest/PWA branding
- empty states, dialogs, tooltips and documentation
- README/project branding where appropriate

Do not break internal IDs or compatibility unnecessarily; migrate them cleanly where practical.

Product identity:

> **AppForge — Simple, powerful tools for everyday work.**

Keep the branding minimal and professional.

---

## 3. Simplify the Product Structure

The current dashboard mixes a toolbox with project/workflow tracking. Separate those concerns.

Main AppForge navigation should be:

```text
Dashboard
All Apps
Favorites
Recent

Categories
  Converters
  Text
  Image
  Video
  Code
  Regex
  Strings
  Markdown
  JSON / Data
  SVG & Icons
  Crypto / Encoding
  Utilities

Settings
```

Existing project-specific functionality such as workflow/research/readiness/outreach features must **not be deleted**. If it does not belong in the general toolbox, move it into an appropriate project/workspace/admin area.

The main AppForge experience should focus on discovering and using tools.

---

## 4. Central App Registry

Create one typed, centralized registry for apps.

Conceptually:

```ts
type AppDefinition = {
  id: string
  name: string
  description: string
  category: string
  subcategory?: string
  icon: string
  route: string
  tags: string[]
  status?: "idea" | "building" | "beta" | "launched" | "deprecated"
  featured?: boolean
}
```

Adapt this to the existing architecture rather than copying it literally.

The registry must drive:

- All Apps
- category pages
- sidebar/category navigation
- search
- counts
- favorites
- recent apps
- dashboard sections
- routing metadata

Adding a new app should require as little code as possible.

**Do not hardcode the same app metadata in multiple places.**

Create a centralized category registry as well.

---

## 5. Categories

Organize existing and future apps into these logical groups:

### Converters
JSON ↔ CSV, JSON ↔ YAML, XML ↔ JSON, Markdown ↔ HTML, image formats, Base64, units, dates, numbers, colors, encodings, etc.

### Text
Case conversion, word/character/line counts, sorting, duplicate-line removal, whitespace cleanup, find/replace, text diff, Lorem Ipsum, statistics.

### Image
Resize, crop, compress, format conversion, metadata, Base64, color tools, SVG rasterization.

### Video
Video information, conversion, compression, GIF conversion, frame extraction, thumbnails, metadata, FPS tools.

### Code
JSON/XML/HTML/CSS/JS/SQL formatters, validators, minifiers, beautifiers, UUID, timestamps, URL tools, JWT decoder, hashes.

### Regex
Regex tester, matcher, extractor, replace tool, builder/explainer where feasible.

### Strings
Escape/unescape, reverse, normalize, slugify, compare, length, frequency, Unicode inspector, ASCII/Unicode conversion.

### Markdown
Editor, preview, formatter, Markdown ↔ HTML, table generator, TOC generator, link tools.

### JSON / Data
JSON tree/viewer, formatter, validator, diff, JSONPath, CSV/TSV viewer, data cleaner, table tools, SQL generators.

### SVG & Icons
SVG editor, viewer, formatter, optimizer/minifier, path inspector, color editor, SVG ↔ PNG/WebP/Base64, icon previewer/sprite tools.

Migrate the existing **Creator SVG**, **Base64 Tool**, **CSV Converter**, **Color Picker**, **JSON Formatter**, etc. into the appropriate categories based on their actual functionality.

Do not force project-specific apps into these categories if they don't belong.

---

## 6. Flagship: Any → Any Converter

Create an extensible **Any → Any Converter** mini-app.

UX:

```text
[ Input format ▼ ]     [ Output format ▼ ]

┌─────────────────────────────────────────┐
│ Paste text / drop file / upload        │
└─────────────────────────────────────────┘

                 [ Convert ]

┌─────────────────────────────────────────┐
│ Output                                  │
└─────────────────────────────────────────┘

[Copy] [Download] [Swap] [Clear]
```

Examples:

```text
JSON → CSV
CSV → JSON
JSON → YAML
YAML → JSON
XML → JSON
Markdown → HTML
HTML → Markdown
SVG → PNG
Image → Base64
Base64 → Image
```

Build a **converter registry**, not a giant conditional component.

Each converter should expose a small consistent interface for:

- input formats
- output formats
- text/file support
- conversion
- validation/errors

Only advertise conversions that actually work. Never fake functionality.

---

## 7. Consistent Mini-App Shell

Every tool should look like it belongs to AppForge.

Create reusable primitives where useful:

```text
AppShell
AppHeader
AppToolbar
AppCard
CategoryHeader
InputPanel
OutputPanel
SplitPane
FileDropzone
CodeEditor
CopyButton
DownloadButton
ClearButton
ResetButton
StatusBadge
```

Typical structure:

```text
← Back to Apps

Tool name                         ☆
Short description

[ Tool interface ]

[ Copy ] [ Download ] [ Clear ]
```

Use the appropriate layout for each tool rather than forcing every app into an identical UI.

---

## 8. shadcn/ui + Design System

Use **shadcn/ui** as the primary UI foundation and follow the current official installation/configuration guidance:

https://ui.shadcn.com/docs/installation

For an existing project, inspect the current stack first and integrate shadcn/ui using the framework-specific existing-project path. Do **not** recreate shadcn components manually if an appropriate shadcn component exists.

Prefer shadcn/ui + Tailwind + Lucide where compatible with the existing project.

Use official shadcn components/primitives for things such as:

- Button
- Card
- Input
- Textarea
- Select
- Combobox
- Tabs
- Dialog
- Dropdown
- Tooltip
- Badge
- Sidebar
- Command/search
- Table
- Sheet
- Separator
- Skeleton
- Empty states

Use the current shadcn approach appropriate to the project's framework/version; do not blindly downgrade or upgrade the entire stack just to match an example.

If shadcn is already installed, consolidate around the existing setup.

Create a small, coherent design system instead of accumulating one-off CSS.

---

## 9. Visual Direction

Polish the existing dark UI rather than replacing its identity.

Target:

- minimal
- modern
- technical
- calm
- compact
- highly readable
- consistent
- professional

Avoid:

- excessive gradients
- oversized cards
- excessive rounded corners
- unnecessary decoration
- excessive animations
- inconsistent shadows
- random colors

Use a restrained token system for:

```text
background
surface
surface-hover
border
foreground
muted
primary
success
warning
destructive
```

Standardize typography, spacing, control heights, radii and borders.

Use one icon system consistently, preferably Lucide if compatible.

---

## 10. Dashboard

Redesign the main dashboard around tool discovery.

Prefer:

```text
AppForge

Search apps, tools, formats...

Recently Used
[ tool ] [ tool ] [ tool ]

Categories
[Converters] [Text] [Image] [Code] ...
[Regex] [Markdown] [SVG] [Data] ...

Featured / Popular
...

All Apps
...
```

Do not make the dashboard feel like an admin/project-management dashboard.

Counts should be calculated from the registry, not hardcoded.

---

## 11. Navigation

Sidebar should be simple and scannable:

```text
APPFORGE

CORE
Dashboard
All Apps
Favorites
Recent

CATEGORIES
Converters
Text
Image
Video
Code
Regex
Strings
Markdown
JSON / Data
SVG & Icons
Crypto / Encoding
Utilities

SYSTEM
Settings
```

Use icons consistently.

Support a collapsible sidebar if compatible with the current layout.

---

## 12. Search

Implement one centralized app search.

Search should match:

- name
- description
- category
- tags
- supported formats
- aliases

Examples:

`csv` → CSV/JSON converters, CSV tools, Any → Any  
`base64` → Base64 encoder/decoder/converter  
`image` → image tools  
`regex` → regex tools

Use a command-palette style experience if appropriate.

Add a keyboard shortcut such as `Ctrl/Cmd + K` if it does not conflict with the existing editor/browser behavior.

---

## 13. Favorites + Recent

Implement persistent favorites and recent apps using the project's existing persistence architecture.

If no persistence abstraction exists, create one clean local-storage abstraction.

Favorites:

```text
☆ → ★
```

Recent should show the most recently opened tools and avoid unbounded growth.

---

## 14. App Cards + Category Pages

Create one reusable AppCard with:

- icon
- name
- description
- category
- tags/status when useful
- favorite action
- open action

Category pages should be generated from the registry.

Example:

```text
Converters
Convert data and files between formats.

[Search converters]

Popular
JSON → CSV
CSV → JSON
Markdown → HTML
...

All converters
...
```

No manually maintained duplicated app lists.

---

## 15. UX Standards

Where relevant, tools should support:

- paste
- upload
- drag & drop
- copy
- download
- clear
- reset
- swap
- preview
- validation
- useful error messages

Errors must be specific and actionable.

Example:

```text
Invalid JSON
Unexpected token at line 12, column 8.
```

Never silently fail.

Never expose a button that does nothing.

---

## 16. Performance + Architecture

Keep the application fast.

- Lazy-load large/heavy tools.
- Do not initialize every mini-app on dashboard load.
- Avoid unnecessary dependencies.
- Keep components focused.
- Extract shared logic.
- Prefer typed data models.
- Avoid `any` where proper types are practical.
- Avoid giant components and giant switch/if trees.
- Keep converter implementations modular.
- Keep UI components reusable but don't over-abstract.

---

## 17. Responsive + Accessibility

Ensure:

- desktop/tablet/mobile support
- keyboard navigation
- visible focus states
- semantic HTML
- accessible labels
- sufficient contrast
- Escape closes dialogs
- drag/drop also has a normal upload option
- responsive app grids

Use sensible responsive grids:

```text
desktop: 3–4 columns
tablet: 2 columns
mobile: 1 column
```

---

## 18. Migration Rules

**Preserve existing functionality.**

For every existing app:

1. Inspect what it actually does.
2. Keep working behavior.
3. Assign it to the correct category.
4. Move it into the common app registry.
5. Apply the common shell/design system where appropriate.
6. Test it.

Do not delete an existing app merely because it isn't mentioned in this prompt.

---

## 19. Refactoring Strategy

Execute in this order:

### Phase 1
Audit + baseline build/typecheck/tests.

### Phase 2
Centralize app/category metadata.

### Phase 3
Integrate/consolidate shadcn/ui and design tokens.

### Phase 4
Rename ProjectForge → AppForge.

### Phase 5
Refactor sidebar, dashboard, AppCard and category pages.

### Phase 6
Implement search, favorites and recent.

### Phase 7
Create Any → Any converter architecture.

### Phase 8
Migrate all existing mini-apps.

### Phase 9
Responsive/accessibility/performance polish.

### Phase 10
Final cleanup and verification.

After every major phase, run the project's appropriate build/typecheck/lint/tests and fix regressions before continuing.

---

## 20. Final Quality Check

Before finishing:

- Search the repository for old ProjectForge branding.
- Find duplicated app metadata.
- Find hardcoded categories.
- Find dead routes/imports.
- Find unused components.
- Verify every sidebar item.
- Verify every registered app opens.
- Verify category filtering.
- Verify search.
- Verify favorites.
- Verify recent apps.
- Verify Any → Any conversions that are advertised.
- Verify responsive layouts.
- Verify build/typecheck/lint/tests.

Do not leave broken imports, dead routes, fake functionality, or obvious duplication.

---

## Definition of Done

The result should feel like a cohesive product:

> **AppForge — a simple, fast, polished toolbox of focused mini-apps.**

The important architectural principle is:

```text
Central App Registry
        ↓
Categories
        ↓
Search / Navigation / Dashboard
        ↓
Reusable Mini-App Shell
        ↓
Individual Tools
```

Adding a new tool should be straightforward and should automatically appear in the correct category, search results, dashboard/all-apps views, favorites and recent systems without manually editing multiple unrelated files.

**Build the application, don't merely describe the implementation.**

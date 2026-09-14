# AppForge design system

AppForge uses a deliberately narrow visual vocabulary. New UI should compose the shared primitives in `src/components/ui` and semantic Tailwind tokens instead of inventing page-local styling.

## Typography

Use three default sizes:

- `text-5xl` — rare hero or marketing display titles only.
- `text-lg` — page, section, dialog, card, and empty-state titles.
- `text-sm` — body copy, menus, controls, labels, helper text, metadata, tabs, pills, badges, and navigation.

`text-xs` is an exceptional escape hatch only. Any source use must carry a same-line `design-xs-ok` comment so the exception is explicit and reviewable. Do not introduce `text-base`, `text-xl`, `text-2xl`, arbitrary font sizes, or other intermediate scales.

Default weights are `font-normal`, `font-medium`, and `font-semibold`. Do not use page-local Tailwind `leading-*` utilities; body and control line-height is established centrally. Use `Heading`, `Text`, `BodyText`, `LabelText`, or `HelperText` when a semantic text primitive fits.

## Spacing and geometry

Tailwind spacing utilities are limited to `2`, `4`, and `8` for margins, padding, gaps, and `space-*` values. Choose `2` for tightly related items, `4` for normal component separation, and `8` for major section separation.

`rounded-xl` is the only radius utility and maps directly to `--radius` (`0.75rem`). `shadow-xl` is the only shadow utility. Focus rings use `ring-1` only.

Buttons use shared geometry from `buttonStyles.ts`: compact actions are 32px high, standard actions are 40px high, and direct SVG children are 16px (`h-4 w-4`). Prefer `Button` and `IconButton` instead of hand-built buttons.

## Color

Use semantic tokens rather than palette names. The supported roles are `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `border`, `input`, `ring`, `destructive`, `success`, `warning`, `info`, `overlay`, and `inverse`, with foreground companions where defined.

Do not add page-local `red-*`, `green-*`, `blue-*`, `gray-*`, `black`, `white`, or other Tailwind palette colors. Brand-specific colors that cannot be represented semantically should be rare and documented at the use site.

## Surfaces and layout

Prefer `Surface` for visual containers. Its variants are `card`, `panel`, `muted`, and `popover`. `Card` is the compatibility wrapper and is itself backed by `Surface`. Prefer `Stack` for vertical rhythm so spacing stays on the 2/4/8 scale.

Use `PageContainer` and `PageSection` for application page structure. They establish the shared max width and standard vertical section rhythm. App-level headings should use `Heading` or `AppHeading` rather than page-local title patterns.

Native text inputs, selects, and textareas receive a central fallback baseline from `src/index.css`; new forms should still use `Input`, `Select`, and `Textarea` whenever their API is sufficient. Specialized controls may remain native when behavior or semantics require it.

## Accessibility and interaction

Interactive controls must keep visible `focus-visible` treatment, disabled states, cursor semantics, and accessible names. Icon-only controls must use `IconButton` or otherwise provide an explicit accessible label. Do not remove focus indicators to achieve a visual match.

Respect `prefers-reduced-motion`; shared surfaces and previews already reduce transitions. Avoid layout-shifting hover states and avoid using color alone to communicate status.

## Enforcement

`npm run check:ui-style` is the design contract. It hard-fails on noncanonical typography, spacing, radius, shadow, ring widths, font weights, local line-height overrides, and hard-coded Tailwind palette utilities. It also inventories raw native controls and hand-built surfaces with non-increasing migration budgets so legacy markup cannot drift upward.

`npm run verify:release` includes the style contract along with app integrity, environment documentation, lint, type checking, tests, and production build. If a genuine edge case requires an exception, document the reason in source instead of weakening the global rule.


## Central theme controls

Core geometry is centralized in `src/index.css` and mapped through `tailwind.config.js`. `--radius` controls `rounded-xl`; `--control-height` controls the shared `h-9` scale; `--border-opacity` and `--surface-border-opacity` control structural border prominence; `--shadow-xl` controls the sole project shadow. Shared Button, Input, Select, Textarea and Badge primitives consume these values. New page-level native button/input/select/textarea elements are not permitted.

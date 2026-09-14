# AppForge design system

AppForge uses a deliberately small visual vocabulary. The goal is not to make every screen identical; it is to make every screen feel like the same product, with differences driven by content and workflow rather than one-off styling.

## Typography

Use only four text-size utilities in application source:

- `text-5xl` — public hero statements and similarly exceptional display titles.
- `text-lg` — page titles, modal titles, section titles and empty-state titles.
- `text-sm` — default application text: body copy, navigation, buttons, inputs, labels, helper text, badges, pills, table content and ordinary metadata.
- `text-xs` — exceptional dense metadata where `text-sm` would materially harm the layout. Do not use it merely to make a panel feel compact.

Prefer the shared `Heading` component for page and section headings. Use its `hero`, `title` and `compact` scales instead of assembling title typography repeatedly.

Typography hierarchy should come primarily from weight, color and grouping—not from inventing more font sizes. Default body text is 14px with a 24px line height at the document level. Long-form prose may set an appropriate line height while retaining the approved size scale.

## Spacing

Tailwind margin, padding, gap and space utilities use only `2`, `4` and `8`.

- `2` — tightly related controls, icon/label pairs, compact internal separation.
- `4` — normal card padding, form grouping, toolbar separation and standard component rhythm.
- `8` — page-level or major section separation.

Do not introduce intermediate spacing values to tune a single screen. If a repeated layout needs a new rhythm, adjust or create a shared component instead.

## Radius, borders, rings and shadows

- Radius: `rounded-xl` only.
- Shadow utility: `shadow-xl` only, and only where elevation is useful (for example modals and floating notifications). Most cards should rely on border/surface contrast rather than shadows.
- Focus ring width: `ring-1` only.
- Standard surface border: `border-border/70` unless a semantic state requires a destructive/success treatment.
- Standard input border: `border-input/80`.

The `Card` component owns the default AppForge surface treatment. Avoid recreating card backgrounds, borders and padding in feature code when `Card` fits the need.

## Color

Use semantic theme tokens (`background`, `foreground`, `card`, `muted`, `accent`, `primary`, `secondary`, `destructive`, `border`, `input`, `ring`) for product UI. This preserves dark-mode parity and prevents feature-specific gray palettes.

Hard-coded colors are reserved for genuine external brand identity or data visualization where semantic product colors would change meaning. They are not appropriate for ordinary text, borders, backgrounds or hover states.

## Controls

Shared form controls are based on `controlStyles.ts`:

- Standard field height: 40px (`h-10`).
- Standard control text: `text-sm`.
- Standard horizontal padding: `px-4`.
- Standard focus treatment: semantic ring color with `ring-1`.

Use `Input`, `SearchInput`, `Textarea`, `Select`, `Checkbox` and `Switch` before building native controls directly.

Buttons use `Button`:

- Visible button text is `text-sm`.
- Direct SVG children normalize to `h-4 w-4`.
- Compact actions use 32px height; standard actions use 40px.
- Primary, secondary, ghost and destructive variants carry semantic color/border behavior.

Badges use `Badge`; standard badges are 32px high, `text-sm`, bordered and token-colored. `BuildBadge` follows the same visible size, with monospace reserved for build metadata.

## Headings and page structure

Use `Heading` for reusable page/section identity. `AppHeading` composes it for registered tools so public and authenticated tool surfaces inherit one title/description rhythm.

A typical product page should follow:

1. Page/app heading.
2. Primary navigation or tabs where needed.
3. Major sections separated by the `8` rhythm.
4. Cards or control groups using the `4` rhythm internally.
5. Closely related inline controls using the `2` rhythm.

Do not create extra wrapper cards solely to add visual noise. Use whitespace and hierarchy first.

## Tables, tabs, modals and notifications

- `DataTable` owns standard table typography, row padding, header treatment and hover behavior.
- `Tabs` owns tab-list surface, active state, typography and focus behavior.
- `Modal` owns overlay, elevation, title scale, close action and body padding.
- Toast/notification UI uses semantic card colors, a border and `shadow-xl`; avoid unrelated alert palettes unless the message is genuinely destructive.

## Icons

Action/button icons are 16px (`h-4 w-4`) by default. Larger icons are appropriate only when the icon is content/illustration rather than an action glyph. Decorative icons should use `aria-hidden` or an empty alt where applicable; icon-only actions require an accessible label.

## Responsive behavior

Responsive variants may change layout, columns, visibility and width, but should not create a second typography or spacing system. A title remains in the approved scale at every breakpoint. Prefer reflow/wrapping over shrinking ordinary UI below `text-sm`.

## Enforcement

`npm run check:ui-style` is a hard CI gate. It scans application source and rejects:

- font sizes outside `text-5xl`, `text-lg`, `text-sm`, `text-xs`;
- margin/padding/gap/space utilities outside `2`, `4`, `8`;
- rounded utilities other than `rounded-xl`;
- shadow utilities other than `shadow-xl`;
- ring widths other than `ring-1`.

Shared-primitives tests additionally verify the canonical heading, button, form-control and badge conventions. When an edge case genuinely needs different behavior, prefer representing the exception through a documented shared-component variant rather than bypassing the design system at a feature call site.

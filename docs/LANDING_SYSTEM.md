# AppForge public landing system

## Purpose

The public landing surface is implemented by `src/auth/LoginPage.tsx`. It serves anonymous visitors at `/` and the signed-in-safe public landing route at `/landing` while preserving direct public tool routes, Google authentication, legal routes, and the authenticated dashboard flow.

## Brand asset

`public/favicon.svg` is the canonical 512×512 AppForge triangle mark for the landing hero and small identity treatments. It is original project artwork, uses vector geometry, and adapts its foreground to the browser light/dark color scheme.

Use the SVG source for UI rendering and derive raster/social variants from this source when needed. Do not replace the existing PWA/favicon set without a separate compatibility pass.

## Landing hierarchy

1. Compact AppForge identity and project actions in the header.
2. One primary product statement and short positioning paragraph.
3. Primary Google/workspace CTA plus a secondary public-tool CTA.
4. Small product-status metrics.
5. A focused public-tools panel with Weather Now, Any Converter, Getter Pro, and the Hugging Face showcase.
6. Concise footer with privacy, terms, support, and platform context.

The support destination is `https://paypal.me/dracorisz`. Until a confirmed reusable Pica/mascot asset is committed, the support action uses an accessible generic support glyph and explicit labels rather than inventing or misidentifying mascot artwork.

## Responsive rules

- The outer surface uses `min-h-dvh` so the initial experience fills modern mobile and desktop viewports.
- Mobile remains naturally scrollable; no content is clipped to force a fixed-height composition.
- At large breakpoints the hero becomes a two-column layout, with the product statement taking slightly more width than the public-tools panel.
- Header labels reduce on narrow screens while icon buttons retain accessible names.
- Primary actions stack on narrow screens and sit inline once space permits.

## Accessibility

- Structural `header`, `main`, `section`, and `footer` landmarks remain semantic.
- Decorative background effects are `aria-hidden` and pointer-inert.
- External support and GitHub actions include safe `noopener noreferrer` behavior.
- Icon-only support action has an `aria-label` and title.
- Interactive elements expose visible keyboard focus rings.
- The hero does not depend on animation; hover transitions are cosmetic and content remains complete without motion.
- The AppForge mark has meaningful alt text when it identifies the product and empty alt text when decorative.

## Verification checklist

Before merging landing changes:

- Run `npm test`.
- Run `npm run lint`.
- Run `npm run typecheck`.
- Run `npm run build`.
- Check `/`, `/landing`, `/privacy`, `/terms`, `/huggingface`, and each public tool route.
- Verify anonymous Google sign-in starts correctly and authenticated users can open the workspace.
- Verify keyboard focus through header actions, CTAs, public tools, and footer links.
- Check common phone, tablet, and desktop widths for horizontal overflow and clipped content.
- Check light and dark color schemes.
- Capture a current desktop and mobile screenshot for marketing/review when browser tooling is available.

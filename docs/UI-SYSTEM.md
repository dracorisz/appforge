# AppForge UI System

AppForge 1.27.1 establishes one visual contract for apps and app-like pages. The shell owns page identity and page geometry; individual tools own only their tool content.

## Canonical app shell

Authenticated `/apps/*` routes are wrapped by `src/components/layout/Layout.tsx`. Public tool routes are wrapped by `src/components/public/PublicToolShell.tsx`. Both render the same registry-driven `AppHeading` in a shared `app-page-header` surface and both use the same `max-w-7xl` content contract.

A tool component must not create a competing top-level page header, custom page max-width, or page-level outer padding. Register app identity in the app registry and let `AppHeading` resolve name, description, icon and metadata from the route. Existing nested `.app-heading` markup is suppressed by the shell for compatibility while legacy components are incrementally simplified.

## Surfaces and hover feedback

Use shared `Card`/`surface-card` surfaces rather than hand-authored card shadows. Hover feedback is deliberately stationary: subtle border, background and shadow changes are allowed; translating or scaling the card or its media is not. `src/unified.css` is the compatibility layer for older surfaces and prevents Blog preview media and canonical app cards from moving on hover.

When adding a new interactive bordered surface, keep transitions limited to `border-color`, `background-color`, `color` and `box-shadow`. Do not add `translate`, `scale`, hover offsets, or custom shadow families unless a product interaction specifically requires motion.

## Transient feedback

Use `toast` from `src/lib/toast.ts` for short-lived success, error and informational results. The global `ToastViewport` renders themed notifications in the top-right corner. Keep persistent validation or state that a user must act on next to the relevant field/content; use toasts for action outcomes instead of printing transient responses in unrelated page locations.

Example:

```ts
import { toast } from '@/lib/toast'

toast.success('Saved.')
toast.error('Could not save changes.')
toast.info('Refresh complete.')
```

## Admin Content Manager images

`AdminImageManager` reuses the existing Supabase `frontend_content` model with `content_type = 'gallery_image'`. Admins can upload or reference an image, preview it, define route/placement metadata, order it, publish/unpublish it and delete its content record. No parallel image-content table is required.

## New-app checklist

1. Add the app to the registry with its canonical route and metadata.
2. Route the tool through the standard authenticated or public shell.
3. Do not add another `AppHeading`, page max-width wrapper, or top-level page padding inside the tool.
4. Use shared `Card`, `Button`, `Input` and related UI components where available.
5. Keep hover feedback stationary and subtle.
6. Send transient action results through the shared toast service.
7. Run the app-integrity and release validation gates before promotion.

## Seek & Destroy rule

Cleanup is evidence-based. A wrapper or compatibility file is removed only when routes, barrel exports, imports and build references prove it is unused. Thin files are not automatically obsolete; for example, route adapters that remain exported by `src/components/dashboard/index.ts` are still part of the runtime graph.

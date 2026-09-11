# AppForge workspace backup

Settings → Data exports an **AppForge workspace backup**. It is not a replacement for product-specific exports such as a Novel Markdown file, Comics export, Any Converter output, or Landing Builder project package.

## Current format

- Format identifier: `appforge-workspace`
- Current schema version: `2`
- Export metadata: UTC export time and current build fingerprint
- Workspace payload: AppForge `AppState`
- Category overrides: personalized category labels/visibility metadata stored outside `AppState`
- Public profile snapshot may be included as informational metadata, but importing a backup does **not** overwrite the authenticated account profile.

## Included workspace state

The backup includes compatible AppForge workspace fields such as:

- Appearance theme
- Favorites and recent apps
- Canonical/current mini-app workspace registry state
- Workspace plan/article/pitches/sources/outreach/checklists/messages/version records
- Personalized category overrides

Missing fields are merged with the current AppForge defaults/state rather than being blindly trusted as complete.

## Explicitly not included/imported

A workspace backup does not contain or restore:

- Supabase Auth identity or sessions
- TOTP factors or account roles
- Owner-only private profile information
- Provider/API secrets
- Uploaded media bytes or server-owned storage objects
- Story Studio generated scene files
- Media Vault binary uploads
- External provider-side state
- Browser-local data owned independently by a mini-app unless that data is part of AppState

## Import safety

Import is a two-step operation:

1. Select a JSON file.
2. AppForge parses, validates and migrates compatible legacy fields, then displays a summary.
3. Nothing is replaced until the user chooses **Apply backup**.

Backups declaring a schema version newer than the current AppForge build are rejected. Legacy unversioned workspace JSON can still be imported through the migration path.

## Migration policy

Increment `WORKSPACE_BACKUP_VERSION` in `src/lib/workspaceBackup.ts` when a breaking backup format change is introduced. Keep migrations additive where possible and preserve current defaults when older backups omit fields.

Do not silently import account credentials, secrets, private profile records or server-owned binary data in a future version; those require separate security and portability designs.

# Media Vault

Private per-user media storage for images, videos, documents, and audio, plus linked source folders for Dragon Arena and Scrapper Pro.

## Storage model

Media Vault now presents three sources through one UI:

1. **General / manual uploads** — stored in the private `user-media-vault` bucket and described by `user_media_vault` rows.
2. **Dragon Arena** — linked from the signed-in user's `dragon_arena_assets` rows with `asset_type = 'scene'`; bytes remain in the `dragon-arena-assets` bucket.
3. **Scrapper Pro** — linked from `dragon_arena_assets` rows with `asset_type = 'scrapper-result'`; these can be external-only saved results without duplicating bytes.

This avoids copying the same Dragon Arena image into two buckets just to make it visible in Media Vault.

## Manual-upload architecture

```text
Browser                          Server (Vercel)              Supabase
  |                                  |                            |
  |-- POST /api/user-media ---------->|                            |
  |   {kind, fileName, mimeType,     |                            |
  |    sizeBytes}                    |-- RPC create_user_media_upload_url
  |<-- {path, uploadUrl, remaining}  |                            |
  |-- direct storage upload ------------------------------------->| user-media-vault
  |-- confirmVaultUpload ---------------------------------------->| user_media_vault insert
```

## Source folders

| Folder | Source | Preview URL behavior | Quota |
|---|---|---|---|
| General | `user_media_vault` + `user-media-vault` bucket | signed URL | counts toward private upload quota |
| Dragon Arena | `dragon_arena_assets` + `dragon-arena-assets` bucket | public Dragon Arena object URL | not double-counted |
| Scrapper Pro | `dragon_arena_assets` external/storage asset | source external URL or Dragon bucket URL | not double-counted |

`src/lib/mediaVault.ts` normalizes all three sources into the `VaultMedia` shape and records `source_bucket` plus source metadata so preview, download and deletion target the correct origin.

## `user_media_vault` schema

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK auth.users, owner |
| `kind` | text | `image` / `video` / `document` / `audio` / `other` |
| `storage_path` | text | private bucket object path |
| `file_name` | text | |
| `mime_type` | text | |
| `size_bytes` | bigint | |
| `width` / `height` / `duration_seconds` | int | optional |
| `title` / `description` | text | |
| `is_public` | boolean | default false |
| `metadata` | jsonb | includes folder/source metadata |
| `created_at` / `updated_at` | timestamptz | |

RLS: owner-only (`user_id = auth.uid()`).

## Quota

`user_media_quotas` controls direct private uploads only.

- Default: **200 MB** per user.
- Max single manually uploaded file: **100 MB**.
- Linked Dragon Arena and Scrapper Pro assets are not copied into `user-media-vault`, so they are not counted twice.

## Client helpers

`src/lib/mediaVault.ts` exposes:

- `listVaultMedia(kind?, folder?)` — combines private uploads with linked source-ledger assets.
- `getVaultQuota()`
- `requestUploadUrl(params)`
- `confirmVaultUpload(params)`
- `uploadVaultMedia(file, opts)`
- `uploadVaultMediaWithProgress(file, opts)`
- `deleteVaultMedia(itemOrId)` — deletes from the correct source ledger/bucket.
- `vaultSignedUrl(path, expires, bucket)`
- `vaultItemUrl(item)` — resolves private signed, Dragon Arena public, or external URLs.

The UI is `src/components/dashboard/PF_UserMediaVault.tsx`, routed at `/apps/media-vault`.

## Dragon Arena integrity relation

Dragon Arena generation now persists its asset row server-side in `/api/dragon-image` immediately after Storage upload. Media Vault therefore reads the same authoritative ledger that the Dragon Arena story/gallery reads. If asset-row persistence fails, the new object is removed instead of leaving another orphaned Storage file.

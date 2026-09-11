# Media Vault

Private per-user media storage plus a shared AppForge asset surface for Dragon Arena and Scrapper Pro.

## Current storage model

Media Vault presents three sources through one UI, but each source keeps the storage model that fits it best:

1. **General / manual uploads** — bytes live in the private `user-media-vault` bucket and metadata lives in `user_media_vault`.
2. **Dragon Arena** — scenes remain authoritative in `dragon_arena_assets`; Media Vault links the signed-in user's `asset_type = 'scene'` rows without copying the image.
3. **Scrapper Pro** — signed-in saves now live directly in `user_media_vault` as zero-byte external references with `source_app = 'scrapper-pro'`. The original page/media URL is retained instead of copying third-party bytes.

This removes the old coupling where Scrapper Pro had to create `scrapper-result` rows in the Dragon Arena table simply to appear in Media Vault.

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

Manual uploads always go to **General**. Dragon Arena and Scrapper Pro are source-backed views, not alternate upload buckets.

## Source folders

| Folder | Source | Preview/open behavior | General quota |
|---|---|---|---|
| General | `user_media_vault` + `user-media-vault` bucket | private signed URL | counted |
| Dragon Arena | `dragon_arena_assets` + `dragon-arena-assets` bucket | Dragon public object URL | not double-counted |
| Scrapper Pro | `user_media_vault` external reference | direct saved media/source URL | zero-byte reference |

`src/lib/mediaVault.ts` normalizes stored files, Dragon Arena scenes, and external Scrapper references into `VaultMedia`.

## `user_media_vault` schema

Core columns:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | owner, FK `auth.users` |
| `kind` | text | `image` / `video` / `document` / `audio` / `other` |
| `storage_path` | text nullable | private bucket object; null for external references |
| `external_url` | text nullable | source/media URL for reference-backed assets |
| `source_app` | text | `manual` by default; `scrapper-pro` for Scrapper saves |
| `source_ref` | text nullable | stable source identity used for deduplication |
| `file_name` | text | stored-file name when applicable |
| `mime_type` | text | optional |
| `size_bytes` | bigint | external references use `0` |
| `title` / `description` | text | |
| `is_public` | boolean | default false |
| `metadata` | jsonb | folder, source and source-specific metadata |
| `created_at` / `updated_at` | timestamptz | |

The row must have either `storage_path` or `external_url`.

A partial unique index on `(user_id, source_app, source_ref)` prevents duplicate Scrapper saves for the same user/source URL.

RLS remains owner-only (`user_id = auth.uid()`).

## Scrapper Pro save flow

`saveScrapperVaultResult()`:

1. Requires a signed-in Supabase user.
2. Uses the result's original URL as `source_ref`.
3. Returns an existing row when the same source was already saved.
4. Stores the best preview target in `external_url` (`mediaUrl`, then thumbnail, then original URL).
5. Stores title, snippet, source, result type, original URL, thumbnail/media URL and source date in metadata.
6. Uses `size_bytes = 0`; the referenced third-party object is not copied into AppForge storage.

Guest/local Scrapper saves remain browser-local and do not require an account.

### Legacy backfill

Migration `20260909174500_decouple_scrapper_pro_into_media_vault.sql`:

- makes `storage_path` nullable for reference rows;
- adds `external_url`, `source_app`, and `source_ref`;
- adds the source/reference integrity and dedupe constraints;
- backfills existing `dragon_arena_assets.asset_type = 'scrapper-result'` rows into Media Vault;
- leaves the legacy Dragon rows intact for compatibility/history, while new saves no longer create them.

## Dragon Arena relation

Dragon Arena scenes are intentionally **not** copied into `user_media_vault`. `/api/dragon-image` persists the scene's Storage object and authoritative `dragon_arena_assets` row. Media Vault then links that same row.

Deleting a linked Dragon Arena scene from Media Vault is destructive to the source asset and therefore uses a source-specific confirmation message. Deleting a Scrapper Pro reference only removes the AppForge reference; it does not affect the original website/media.

## Quota

`user_media_quotas` controls private General uploads only.

- Default: **200 MB** per user.
- Max single manual upload: **100 MB**.
- Dragon Arena scenes are stored in their game bucket and are not counted again.
- Scrapper Pro references have zero stored bytes and do not consume General quota.

## Client helpers

`src/lib/mediaVault.ts` exposes:

- `listVaultMedia(kind?, folder?)`
- `getVaultQuota()`
- `requestUploadUrl(params)`
- `confirmVaultUpload(params)`
- `uploadVaultMedia(file, opts)`
- `uploadVaultMediaWithProgress(file, opts)`
- `saveScrapperVaultResult(result)`
- `updateVaultMedia(id, patch)`
- `deleteVaultMedia(itemOrId)`
- `vaultSignedUrl(path, expires, bucket)`
- `vaultItemUrl(item)`

UI: `src/components/dashboard/PF_UserMediaVault.tsx`

Route: `/apps/media-vault`

## Version

**Media Vault 1.1.0** — shared asset surface, direct Scrapper Pro reference ledger, legacy Scrapper backfill, source-aware deletion, and General-only manual uploads.

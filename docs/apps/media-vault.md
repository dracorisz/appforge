# Media Vault

Private per-user media storage for images, videos, documents, and audio. Files upload **directly to Supabase storage**, bypassing the Vercel 4.5 MB request payload limit.

## Architecture

```
Browser                          Server (Vercel)              Supabase
  |                                  |                            |
  |-- POST /api/user-media ---------->|                            |
  |   {kind, fileName, mimeType,     |                            |
  |    sizeBytes}                    |-- RPC create_user_media_upload_url -> returns path + remaining
  |<-- {path, uploadUrl, remaining}  |                            |
  |-- PUT uploadUrl (direct) -------->|                            |-- storage.objects insert
  |                                  |-- POST confirmVaultUpload ----> user_media_vault insert
```

## Schema

### `user_media_vault`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK auth.users, owner |
| `kind` | text | `image` / `video` / `document` / `audio` / `other` |
| `storage_path` | text | `user-media-vault/{userId}/{kind}/{uuid}-{name}` |
| `file_name` | text | |
| `mime_type` | text | |
| `size_bytes` | bigint | |
| `width` / `height` / `duration_seconds` | int | optional |
| `title` / `description` | text | |
| `is_public` | boolean | default false |
| `metadata` | jsonb | |
| `created_at` / `updated_at` | timestamptz | |

RLS: owner-only (`user_id = auth.uid()`).

### `user_media_quotas`

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | PK |
| `quota_bytes` | bigint | default `209715200` (200 MB) |
| `created_at` / `updated_at` | timestamptz | |

Admins can override `quota_bytes` per user.

## RPCs

| Function | Purpose |
|---|---|
| `get_or_create_user_quota()` | Returns the user's quota, creating a 200 MB default row if missing |
| `user_media_usage_bytes()` | Sums `size_bytes` for the caller |
| `create_user_media_upload_url(kind, file_name, mime_type, size_bytes)` | Validates kind/size, checks quota, returns a storage path + remaining bytes |

## API

`POST /api/user-media`

Authenticates the caller, validates the request body, and calls the quota RPC. Returns:

```json
{ "bucket": "user-media-vault", "path": "...", "uploadUrl": "...", "remaining": 12345, "token": "..." }
```

The client then uploads directly to `uploadUrl` with the returned `token` and `apikey` header, then calls `confirmVaultUpload` to insert the `user_media_vault` row.

## Limits

- Max single file: **100 MB** (`MAX_FILE_BYTES`)
- Default quota: **200 MB** per user
- Admin override via `user_media_quotas.quota_bytes`
- Allowed kinds: `image`, `video`, `document`, `audio`, `other`

## Storage bucket

`user-media-vault` — private bucket. Files are stored under `{userId}/{kind}/{uuid}-{name}`. Signed URLs (default 1 hour expiry) are used for preview and download; public URLs are never issued.

## Client

`src/lib/mediaVault.ts` exposes:

- `listVaultMedia(kind?)`
- `getVaultQuota()`
- `requestUploadUrl(params)`
- `confirmVaultUpload(params)`
- `uploadVaultMedia(file, opts)` — convenience wrapper
- `updateVaultMedia`, `deleteVaultMedia`
- `vaultSignedUrl(path, expires)`

The UI is `src/components/dashboard/PF_UserMediaVault.tsx`, routed at `/apps/media-vault`.
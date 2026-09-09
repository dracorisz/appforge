# Scrapper Pro

Scrapper Pro is AppForge's server-backed public-media search tool. It searches supported public sources, normalizes results into one result model, keeps optional guest/local saves in the browser, previews media inside AppForge, exports supported content, and lets signed-in users archive source references into Media Vault.

## User-facing features

- Media-first search across supported public sources.
- Image and video result cards with subtle frosted-glass treatment.
- In-page showbox/lightbox for large image previews.
- In-page video playback for direct video URLs.
- Privacy-enhanced YouTube embeds using `youtube-nocookie.com`.
- Local save/unsave for guest/offline-friendly browser persistence.
- Signed-in **Save to Media Vault** action with deduplication by original source URL.
- Copy original result URL.
- JSON export for complete result sets.
- Image downloads through AppForge's same-origin media endpoint.
- Direct-video downloads when the source provides an actual video file URL.
- YouTube thumbnail download. AppForge intentionally does not implement a YouTube ripping/downloading path.
- Article export to a generated PDF using readable article text.
- Post export to `.txt`.
- Grid/list result layouts and Media / Images / Videos / Articles / Posts / All / Saved filters.
- Search cancellation, elapsed time, partial-source failure reporting, and source presets.

## Save semantics

Scrapper Pro now has two intentionally different save paths:

### Local save

The normal Save/check action stores the normalized result in browser `localStorage` under `appforge-scrapper-saved`.

- available to guest users;
- persists on that browser/device;
- capped by the UI to the most recent 250 saved results;
- does not create a Supabase record.

### Media Vault save

The archive action stores a signed-in user's result in `user_media_vault` through `saveScrapperVaultResult()`.

- folder: `scrapper-pro`;
- source app: `scrapper-pro`;
- source reference: original result URL;
- duplicate saves return the existing row instead of creating another record;
- the third-party object is not copied into AppForge storage;
- `external_url` points to the best available direct media/thumbnail/source URL;
- source, result type, original URL, thumbnail, direct media URL, snippet and source date are retained as metadata.

Earlier builds wrote `scrapper-result` rows into `dragon_arena_assets`. Migration `20260909174500_decouple_scrapper_pro_into_media_vault.sql` backfills those legacy rows into Media Vault. New Scrapper saves no longer depend on Dragon Arena.

## Supported sources

The source list is defined server-side in `api/scrape.js` and mirrored in the UI:

- DuckDuckGo Images
- Bing Images
- Wikimedia Commons
- Reddit
- YouTube Data API v3 (official API; requires server-side configuration)
- DuckDuckGo Web
- Medium
- TikTok — visible as a disabled placeholder pending approval for a suitable official API product and scopes

Public search endpoints can rate-limit, change markup, or temporarily fail. Scrapper Pro reports individual source failures while keeping successful results.

## YouTube Data API setup

YouTube uses the official Data API v3, not YouTube page markup. Enable **YouTube Data API v3** in a Google Cloud project, create an API key, restrict it to that API, and set it only in the server/deployment environment:

```bash
YOUTUBE_API_KEY=your-restricted-server-key
```

Do not prefix the variable with `VITE_`; Vite-prefixed values are included in the browser bundle. A missing key disables only the YouTube source and is reported as a partial-source failure.

The integration supports text discovery, video URLs/IDs, channel URLs/IDs, and `@handle` input. It uses `channels.list` for channel details, `playlistItems.list` for upload traversal, and `videos.list` for video details. Requests are deduplicated in-process for five minutes. Channel banners are feature-detected because YouTube does not return them for every channel.

Media Vault saves retain the original URL plus YouTube video/channel IDs, channel identity, thumbnail variants and selected resolution, duration, public statistics, asset role, uploads-playlist ID, and fetch timestamp under `metadata.provenance`. The API key is never included.

Fetched channel art remains third-party content. Public availability does not grant permission to republish, tokenize, or mint it; verify the creator's rights and permission before collectible export.

## TikTok placeholder

TikTok is intentionally visible but disabled. AppForgePf has a developer application, but TikTok's client-credentials token is currently documented for the Research API and Commercial Content API; it is not a general public creator/video search grant. Before enabling the source, confirm the approved product and scopes in the TikTok developer portal.

Future credentials must use server-only variables named `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET`. The server will exchange them for a short-lived client access token and cache that token; neither credential nor bearer token may be returned to the browser. Implementation is tracked in GitHub issue #21.

## Architecture

```text
src/components/dashboard/PF_ScrapperPro.tsx
        |
        | POST /api/scrape
        v
api/scrape.js
        |
        +-- DuckDuckGo / Bing / Wikimedia / Reddit / web readers
        +-- YouTube Data API v3 (server-only key)

Local save:
PF_ScrapperPro -> localStorage(appforge-scrapper-saved)

Signed-in archive:
PF_ScrapperPro -> saveScrapperVaultResult()
               -> user_media_vault
               -> Media Vault / Scrapper Pro folder

Media preview:
src/components/ui/MediaShowbox.tsx

Media download:
PF_ScrapperPro -> GET /api/media?url=...
               -> guarded server fetch
               -> image/video attachment

Article PDF:
PF_ScrapperPro -> GET /api/article?url=...
               -> readable article text
               -> src/lib/simplePdf.ts
               -> browser PDF download
```

## Result model

```ts
interface ScrapperProResult {
  id: string
  source: string
  type: 'post' | 'video' | 'image' | 'article'
  title: string
  url: string
  snippet: string
  date?: string
  thumbnail?: string
  mediaUrl?: string
  provenance?: Record<string, unknown>
}
```

`url` is the original/source page. `mediaUrl` is a direct image/video URL when the source exposes one. `thumbnail` is the display preview.

## Download behavior

### Images

Images are fetched through `/api/media` so browser CORS rules do not break the download button. The endpoint validates the destination, blocks obvious private-network targets, follows only a small number of redirects, accepts image/video MIME types, times out remote requests, and caps files at 35 MB.

### Videos

If `mediaUrl` is a direct media file, AppForge downloads that file through `/api/media`.

YouTube search results expose a page/embed URL rather than a direct downloadable video file. They play inside the showbox and the download action saves the result thumbnail. Do not relabel this as a video-file download unless a legitimate direct-media integration is added.

### Articles

`/api/article` retrieves a readable text representation through Jina Reader. `src/lib/simplePdf.ts` creates a dependency-free PDF from that text in the browser. The current PDF exporter prioritizes portability and plain text rather than preserving the source site's exact visual layout.

### Posts

Post results export as a small `.txt` file containing title, snippet, and source URL.

## Security notes

`/api/media` is intentionally not a general-purpose proxy. Keep the private-network checks, redirect limit, content-type checks, timeout, and size limit when modifying it.

Media Vault references remain owner-scoped through `user_media_vault` RLS. Saving a reference never modifies or republishes the third-party source.

Never add API secrets to browser source or commit `.env` files. Use Vercel/Supabase environment configuration for server-side secrets.

## Production smoke test

1. Search with the **Media** preset.
2. Open an image in the showbox and download it.
3. Search YouTube by text, a video URL, and an `@handle`; confirm channel art and upload videos render.
4. Save one result locally, refresh, and confirm it remains in **Saved**.
5. While signed in, archive a result to Media Vault.
6. Archive the same result again and confirm no duplicate Media Vault row appears.
7. Open Media Vault → **Scrapper Pro** and confirm title/type/source preview metadata is present.
8. Delete the Media Vault reference and confirm the original source remains unaffected.
9. Enable web/article sources and export an article as PDF.

## Version

**Scrapper Pro 1.3.0** — official server-side YouTube Data API ingestion, channel/video URL resolution, uploads-playlist traversal, enriched provenance, request caching, and clear configuration/quota failures.

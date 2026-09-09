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
- YouTube
- DuckDuckGo Web
- Medium

Public search endpoints can rate-limit, change markup, or temporarily fail. Scrapper Pro reports individual source failures while keeping successful results.

## Architecture

```text
src/components/dashboard/PF_ScrapperPro.tsx
        |
        | POST /api/scrape
        v
api/scrape.js
        |
        +-- DuckDuckGo / Bing / Wikimedia / Reddit / YouTube / web readers

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
3. Open a YouTube result and confirm in-page playback.
4. Save one result locally, refresh, and confirm it remains in **Saved**.
5. While signed in, archive a result to Media Vault.
6. Archive the same result again and confirm no duplicate Media Vault row appears.
7. Open Media Vault → **Scrapper Pro** and confirm title/type/source preview metadata is present.
8. Delete the Media Vault reference and confirm the original source remains unaffected.
9. Enable web/article sources and export an article as PDF.

## Version

**Scrapper Pro 1.2.0** — direct Media Vault archive integration, deduplicated source references, clearer local-vs-account save semantics, and removal of the Dragon Arena storage dependency.

# Scrapper Pro

Scrapper Pro is AppForge's server-backed public-media search tool. It searches supported public sources, normalizes results into one result model, keeps useful results locally, previews media inside AppForge, and exports supported content.

## User-facing features

- Media-first search across supported public sources.
- Image and video result cards with subtle frosted-glass treatment.
- In-page showbox/lightbox for large image previews.
- In-page video playback for direct video URLs.
- Privacy-enhanced YouTube embeds using `youtube-nocookie.com`.
- Save/unsave results in local storage.
- Copy original result URL.
- JSON export for complete result sets.
- Image downloads through AppForge's same-origin media endpoint.
- Direct-video downloads when the source provides an actual video file URL (for example some Reddit-hosted video results).
- YouTube thumbnail download. AppForge intentionally does not implement a YouTube ripping/downloading path.
- Article export to a generated PDF using readable article text.
- Post export to `.txt`.
- Grid/list result layouts and Media / Images / Videos / Articles / Posts / All / Saved filters.
- Search cancellation, elapsed time, partial-source failure reporting, and source presets.

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

Never add API secrets to browser source or commit `.env` files. Use Vercel/Supabase environment configuration for server-side secrets.

## Local development

```bash
npm install
npm run dev
```

Vite handles the UI locally. Vercel serverless endpoints under `/api` require a Vercel-compatible local runtime for full end-to-end testing, or test against a preview deployment.

## Production test path

- `https://www.sstoken.space/apps/scrapper-pro`
- API health: `https://www.sstoken.space/api/scrape`

Recommended smoke test:

1. Search a person, place, or product with the **Media** preset.
2. Open an image in the showbox and download it.
3. Open a YouTube result and confirm in-page playback.
4. Download the YouTube thumbnail and verify the label says thumbnail.
5. Find a Reddit direct-video result and test the direct video download when available.
6. Enable web/article sources, download an article as PDF, and open the generated PDF.
7. Save several results, switch to **Saved**, refresh the page, and confirm persistence.

## Extension rules

When adding a new source:

1. Add the source and scraper to `api/scrape.js`.
2. Normalize results to `ScrapperProResult`.
3. Add the source to the UI selector in `PF_ScrapperPro.tsx`.
4. Do not return fake placeholder media.
5. Prefer real `mediaUrl` + `thumbnail` pairs for media sources.
6. Preserve partial-failure behavior; one source failure must not fail the whole search.
7. Update this README.

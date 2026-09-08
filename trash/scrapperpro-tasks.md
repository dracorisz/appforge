# ScrapperPro — Next Session Tasks

## Current State
- ScrapperPro searches 11+ engines via Jina reader proxy (`r.jina.ai`)
- Jina returns HTTP 200 but image parsing yields 0 results
- iframes blocked by X-Frame-Options on Google/YouTube
- LEAVE FOR LATER cryptologos.cc blocked by OpaqueResponseBlocking (fixed CryptoTrack with jsDelivr CDN)
- See previous chat:
The user wants me to complete the ScrapperPro file and then create a markdown prompt/summary for a new session. Let me first fix the ScrapperPro component to properly handle image parsing and downloads, then create a markdown summary.

Let me first fix the parsing to handle different response formats, then fix the engine URL construction, then add image download functionality.





"move all curent tasks to a new MD
Let me do one quick fix on ScrapperPro before ending the session — the URL construction for DuckDuckGo is mangling the ia=images parameter:

Now I need to update the getEngineSearchUrlFromEncoded references in the code. Actually, looking at the code, getEngineSearchUrlFromEncoded is used in the runScrape function. But I also created a new getSearchUrl function. Let me check which one is used in the runScrape function.

Wait, I need to also update the getEngineSearchUrl function - actually looking at my code, I have two functions now: getEngineSearchUrl (which I didn't change) and getSearchUrl (which I added). The runScrape function uses getEngineSearchUrlFromEncoded. Let me check the runScrape function.

Actually, looking at the current code, the runScrape function uses getEngineSearchUrlFromEncoded. Let me check:

OK, so getEngineSearchUrlFromEncoded is used in runScrape. Let me also remove the unused getEngineSearchUrl and getSearchUrl functions since the code uses getEngineSearchUrlFromEncoded. Actually, I should update getEngineSearchUrlFromEncoded to use the fixed URL construction approach from getSearchUrl. Let me simplify by replacing getEngineSearchUrl and getSearchUrl with a single getEngineSearchUrlFromEncoded that handles the URL construction properly.

Wait, actually, let me just clean this up. I have three functions now that do similar things. Let me replace all three with a single clean function."

## Tasks
0. **Split file if easier**:
   - Split by search to potentially reduce duplicted code
1. **Fix Jina response parsing** — Improve `parseJinaResponse` to handle multiple formats:
   - JSON response with `content` field
   - Raw text/markdown response
   - HTML `<img src="...">` tags
   - Data URIs
   - Filter out favicons and known non-content URLs

2. **Fix DuckDuckGo URL construction** — Current `getEngineSearchUrlFromEncoded` uses `URL` class which mangles `?ia=images` into `&ia=images`

3. **Add image-focused engines** — Already added: Yandex, Pinterest, Flickr, Pixabay, Pexels, DeviantArt, Imgur (total 18 engines)

4. **Add image download/save** — Add "Download image" button that uses `a[download]` to save to local

5. **Fix video display** — Videos should use external links, not iframes (blocked by X-Frame-Options)

6. **Build verification** — Run `npm run build` after changes

## Files
- `/home/dragoljub/Projects/projectpf/src/components/dashboard/PF_ScrapperPro.tsx`

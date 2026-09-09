# Landing media source

Current public landing walkthrough:

- YouTube: https://www.youtube.com/watch?v=tWnZNkPxlOo
- Privacy-enhanced embed host: `https://www.youtube-nocookie.com`
- Source recording supplied on 2026-09-09: `202609092134.mp4`
- Source characteristics: 1280×720, H.264/AAC, ~59 seconds

The production landing should use the published YouTube asset while repository binary delivery remains intentionally separate from application source. This keeps the application bundle/repository lean and lets the published video be updated independently.

If AppForge later hosts the MP4 directly, place the optimized web copy behind a CDN/static media origin and keep `preload="metadata"` so the landing does not eagerly download the full video.

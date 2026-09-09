# AppForge performance baseline

Measured from the successful Vercel build of commit `327579785f27604b081f43b3893d67d7500d19f0` on 2026-09-09.

## Build baseline

- Vite: 6.4.3
- Modules transformed: 1,698
- Build time: 5.34 s
- Main CSS: 57.42 kB / 10.65 kB gzip
- Main JS before vendor splitting: 734.29 kB / 208.30 kB gzip
- Settings route chunk: 41.33 kB / 10.02 kB gzip
- Hugging Face gallery route chunk: 11.70 kB / 3.81 kB gzip
- Legal pages route chunk: 11.77 kB / 3.99 kB gzip
- People route chunk: 5.82 kB / 2.04 kB gzip
- PWA precache: 447 entries / 6,343.59 KiB

The Vite build warned that the main JavaScript chunk exceeded 500 kB after minification. This is the current performance target rather than a theoretical concern.

## Current mitigation

Route-only Settings, People, legal and Hugging Face pages are lazy-loaded. The current performance pass also splits stable third-party dependencies into explicit React, Supabase, icon and general vendor chunks so browser caching can work independently of AppForge application code and the main app chunk no longer absorbs the complete dependency graph.

## Follow-up measurements

For each meaningful release, record:

1. main app JS raw/gzip size;
2. vendor chunk raw/gzip sizes;
3. CSS raw/gzip size;
4. PWA precache entry count and total KiB;
5. public landing and Weather Now load behavior on a mid-range mobile profile;
6. service-worker upgrade behavior after a production deployment.

Do not mark issue #16 complete until the mobile/Core Web Vitals and PWA-update checks are also verified.

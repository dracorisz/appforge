# AppForge Marketing Handoff

Prepared: 2026-09-09

This document is the starting point for a dedicated marketing-materials session. It separates what can be advertised today from future positioning so launch copy does not overpromise unfinished functionality.

## Core product positioning

**AppForge is an open-source workspace of focused web apps that can grow from shared utilities into independently forkable PWAs.**

The long-term differentiator is not only having many mini-apps. Each app moves through a maturity path toward **Full**, where it is complete, documented and intentionally extractable into its own ready-made PWA.

Suggested short positioning:

> Useful web apps today. Forkable standalone PWAs tomorrow.

Alternative:

> One workspace for practical tools — each built to become a product of its own.

## What is safe to advertise today

### AppForge platform

- Public/open-source AppForge repository.
- Installable PWA shell.
- Google + Supabase authenticated workspace.
- Favorites, recent apps, profile/settings and shared appearance theme.
- Per-app semantic versions and changelogs.
- Central app registry and route structure.
- Public Hugging Face integration/gallery surface.

### Strong demo candidates

**Story Studio / Dragon Arena evolution**

- Persistent choice-driven AI story sessions.
- Novel and Comics modes are being established as the forward product direction.
- Hugging Face-powered story/image provider path with local continuity fallback.
- Generated scene persistence and assets/gallery architecture.
- Profile Appearance theme carries into the story workspace.

Marketing language should call this an **active beta / evolving Story Studio**, not a finished Novel/Comics creation platform yet.

**Scrapper Pro**

- Public media/article search experience.
- Local saved results.
- Signed-in Media Vault archiving.
- Preview/download/article export workflows.

**Media Vault**

- Signed-in shared personal asset surface.
- General uploads.
- Linked Story/Dragon generated scenes.
- Scrapper Pro archived source references.

**Any to Any Converter**

- Browser-first structured/text conversion utility.
- Good candidate for first standalone Full-status packaging because it has relatively few server dependencies.

**Weather Now**

- Public keyless weather lookup through AppForge server API.

## Do not claim yet

Avoid these claims until explicitly verified/completed:

- "Every mini-app is production-ready."
- "Every app can already be forked as a standalone PWA."
- "Story Studio is a complete Novel Builder/Comics Builder."
- "Unlimited Hugging Face generation."
- "All apps work offline."
- "All apps are Full."
- "No provider limits."

Instead say the project is **building toward Full-status forkable PWAs** and show the standard publicly.

## Full status story

The marketing-friendly explanation:

> AppForge uses a maturity ladder: Idea → Building → Beta → Launched → Full. Full means the mini-app is complete inside AppForge and packaged/documented so a developer can fork it into an independent PWA.

Reference: `docs/FULL_STATUS.md`.

This can become a major open-source/dev-community hook because contributors can take ownership of moving individual apps toward Full rather than working on one monolithic product.

## Story Studio direction

Dragon Arena should increasingly be described internally as the prototype/story engine for a broader **Story Studio**.

Target shape:

- **Novel Builder** — prose-first interactive story creation, persistent characters/world/story memory, chapters/scenes, editing and export.
- **Comics Builder** — visual story flow using the same project/story state, generated panels/scenes, captions/dialogue and eventual page/panel composition.

Both should share:

- project/session memory;
- profile Appearance/theme settings;
- character/world lore;
- generated assets;
- model/provider settings;
- export/version history.

Reference experiences such as AI storyplay products can inform interaction density and pacing, but AppForge marketing should emphasize its own identity: open-source, creator-owned projects and an eventual forkable PWA architecture.

## Patreon preparation

A Patreon launch can be framed around supporting open development rather than selling features that do not yet exist.

Suggested page headline:

> Help build AppForge — an open-source workshop of useful, forkable web apps.

Suggested description:

> AppForge is a growing collection of focused web tools, AI creative experiments and personal-workspace features. The goal is to take each mini-app from working beta to Full: polished, documented and ready for developers to fork into independent PWAs. Support helps cover hosting, AI/provider usage, testing and the time needed to package each app properly.

Possible simple tiers for discussion in the marketing session:

- **Supporter** — development updates, roadmap notes, supporter credit where appropriate.
- **Builder** — deeper build logs, early feature previews, voting/feedback on which mini-app should reach Full next.
- **Sponsor** — prominent supporter credit and periodic project-direction feedback, without promising private ownership of open-source features.

Final Patreon pricing/benefits should be decided deliberately in the marketing session rather than committed in code/docs now.

## Screenshot list for the marketing session

Capture current production after the latest stable deployment:

1. Public landing page with Hugging Face foregrounded.
2. Authenticated AppForge dashboard / All Apps.
3. Story Studio Novel mode with short narrative + choices.
4. Story Studio Comics mode with small scene thumbnail and lightbox.
5. Generated Assets toolbar/panel.
6. Media Vault showing General / Story or Dragon / Scrapper sources.
7. Scrapper Pro search + preview.
8. Any Converter working example.
9. Settings → Appearance/Profile privacy.
10. `/huggingface` gallery with model/provider metadata.
11. GitHub README/repository for the open-source angle.
12. Full-status standard page/document excerpt for developer marketing.

## Marketing asset checklist

Next dedicated session should produce:

- one-line tagline;
- 50-word description;
- 150-word description;
- Patreon About copy + tier names/pricing;
- GitHub social preview copy;
- X/Twitter launch post + thread;
- Reddit/Hacker News/Product Hunt-style posts where appropriate;
- LinkedIn post;
- 5–10 screenshot captions;
- 30–45 second demo-video shot list;
- launch-day CTA hierarchy;
- contributor CTA explaining Full status;
- FAQ covering open source, privacy, AI providers, quotas and forkability.

## Today's launch gate

Before actively buying traffic or making strong public claims, verify:

- latest Vercel production deployment is READY;
- landing page has no visible broken assets;
- public Hugging Face page loads;
- Scrapper Pro public route works;
- Any Converter public route works;
- Weather public route works;
- signed-in Story Studio can play a turn;
- generated-art failure is graceful even if providers are unavailable;
- Media Vault does not show schema/RPC 404s;
- footer/build fingerprint is visible for bug reports.

If these pass, AppForge is reasonable to advertise as a **public beta/open-development project today**, while Full remains the quality/fork-readiness target.

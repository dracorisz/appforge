# AppForge marketing handoff

AppForge should be presented as a coherent web-tool product rather than as a collection of future standalone apps.

## Core positioning

**AppForge is an integrated workspace for practical utilities, media workflows, creator tools, AI-assisted experiences, and personal productivity.**

Suggested short positioning:

> Practical web tools, one focused workspace.

Alternative:

> One platform for useful tools and creator workflows.

The commercial/product story is the quality and breadth of the integrated AppForge experience: consistent design, shared account/data services, public tools, protected workspace features, and a common operational platform.

AppForge itself is installable as a Progressive Web App. Do not market individual internal tools as future standalone PWAs. If a category later becomes its own product, it should be developed and positioned separately.

## Safe current claims

- Open-source AppForge repository and public documentation.
- Installable AppForge PWA shell.
- Public Apps directory and selected signed-out tools.
- Google/GitHub authentication through Supabase.
- Authenticated workspace, profile/preferences, favorites/recent state, and private storage workflows.
- Getter Pro media discovery and Media Vault handoff.
- Story Studio creator workflows and Hugging Face integration/gallery surfaces.
- Desktop Buddy character/voice/provider experiments.
- Weather, crypto, conversion, SVG/icon, landing, productivity, and developer utilities.
- Central registry, consistent routing, shared design system, and deliberate release process.

Use the live product and `src/lib/registry.ts` for the current catalog rather than hard-coding app counts into marketing copy.

## Do not overclaim

Avoid claims such as:

- every app is production-ready;
- every tool works offline;
- provider generation is unlimited;
- Story Studio is a finished long-form publishing suite;
- all planned registry entries are implemented;
- a green repository commit has already been deployed to production.

Prefer precise maturity language from the registry: Idea, Building, Beta, Launched, Deprecated.

## Corporate/product framing

For acquisition, sponsorship, client, or portfolio conversations, emphasize:

- one recognizable AppForge brand and navigation system;
- one product shell across many useful workflows;
- reusable platform infrastructure for auth, storage, providers, routing, PWA lifecycle, and releases;
- a growing app catalog without forcing users into unrelated websites;
- clear public-versus-private data boundaries;
- a codebase that can support future spin-off products without presenting those hypothetical products as current AppForge promises.

## Strong demo surfaces

Good current demonstrations include the landing page, public Apps directory, Getter Pro, Media Vault, Story Studio, Hugging Face gallery, Desktop Buddy, Weather Now, Any Converter, Task List, and the authenticated workspace shell.

Choose screenshots from a verified production build and prefer a small number of polished cross-product views over documenting every internal tool separately.

## Marketing asset checklist

A dedicated marketing pass should produce a one-line tagline, short/long product descriptions, a concise demo video, representative screenshots, privacy/provider FAQ, open-source/contributor CTA, and clear support/contact paths.

All external claims should be checked against the live production build and current registry before publication.

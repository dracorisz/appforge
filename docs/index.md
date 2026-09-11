---
layout: home

title: AppForge Docs
titleTemplate: Developer Portal

hero:
  name: AppForge Docs
  text: Build, understand, and ship focused web tools.
  tagline: "Developer documentation for the current AppForge product: apps, architecture, releases, AI providers, cloud experiments, and standalone PWA work."
  image:
    src: https://www.sstoken.space/new-header.svg
    alt: Dragoljub full-stack developer technology profile banner
  actions:
    - theme: brand
      text: Getting Started
      link: /GETTING_STARTED
    - theme: alt
      text: Browse Apps
      link: /apps/
    - theme: alt
      text: Project Pulse
      link: /PROJECT-PULSE
    - theme: alt
      text: Open App ↗
      link: https://www.sstoken.space/

features:
  - title: Current app documentation
    details: Browse the canonical AppForge app model, Desktop Buddy, Getter Pro, Story Studio, Task List, Any Converter, and standalone-PWA guidance.
    link: /apps/
    linkText: Browse apps
  - title: Desktop Buddy
    details: KDE Konqi starter artwork, local character packs, transparent PNG export, agent-response reactions, browser voice, and provider roadmap.
    link: /apps/desktop-buddy
    linkText: Open Desktop Buddy docs
  - title: Architecture
    details: Understand the canonical app model, database boundaries, authentication, AI providers, and deployment architecture.
    link: /APP_MODEL
    linkText: Read architecture docs
  - title: Release readiness
    details: Project Pulse, timeline, Full-status criteria, roadmap, and launch checks separate code completion from production verification.
    link: /PROJECT-PULSE
    linkText: Review readiness
  - title: Security & operations
    details: Review Supabase advisor triage, provider credentials, environment boundaries, and pre-release validation rules.
    link: /SECURITY_ADVISORS
    linkText: Review security state
  - title: Agent pickup
    details: Give a coding agent the source-of-truth files, release rules, integrated services, and handoff contract it needs before editing.
    link: /AGENT_HANDOFF
    linkText: Open agent handoff
---

## What belongs here

This site is the public technical and project portal for AppForge. It documents the product as it exists now, how a developer or agent can pick up the integrated environment, how individual apps mature toward standalone PWAs, how releases are prepared, and how external services are integrated safely.

For normal use, go to **[sstoken.space](https://www.sstoken.space/)**. For source code, issues, pull requests, releases, and the actionable backlog, use the **[GitHub repository](https://github.com/dracorisz/appforge)**.

## First-time project pickup

Read **[Getting started](./GETTING_STARTED.md)** and **[Environment & agent pickup](./ENVIRONMENT.md)** first. Then use **[Project Pulse](./PROJECT-PULSE.md)**, **[Development timeline](./DEVELOPMENT_TIMELINE.md)**, **[Issue roadmap](./ISSUE_ROADMAP.md)** and **[Agent handoff](./AGENT_HANDOFF.md)** to understand the current development sequence before changing code.

New to the GitHub repository? Read **[GitHub starter guide](./GITHUB_STARTER.md)** for star, watch, fork, discussion, and contribution orientation.

## Current state snapshot

As of 2026-09-11:

- Google and GitHub authentication are implemented through Supabase Auth;
- public Blog and Changelog routes are live in the frontend, with admin+AAL2/TOTP-protected frontend content CRUD at `/admin/content`;
- the canonical changelog remains `CHANGELOG.md`, with validation/release-note automation in `.github/workflows/changelog.yml` and `scripts/changelog.mjs`;
- signed-out `/apps/ai-dragon-arena` is an AI integrations/promotional surface, while Story Studio creation remains authenticated;
- **Desktop Buddy** is the canonical AI companion beta at `/apps/desktop-buddy`, with KDE Konqi starter artwork, portable local packs, framing, generated-character archiving, browser voice, and an AppForge response-event bridge;
- **Getter Pro** is the current name at `/apps/getter-pro`, with per-result local save/download actions and authenticated Media Vault reference storage;
- Weather Now supports grouped EU/US city presets, device coordinates, and an explicit sidebar-weather location preference;
- Task List is aligned with the shared app shell and supports local-first tracking, authenticated sync, filters, progress, complete-all, clear-completed, and inline task editing;
- the canonical registry contains 45 entries across 14 categories: 35 Beta, 5 Building, and 5 Idea;
- Markdown Previewer and SVG Tool now have dedicated browser-local implementations behind their canonical routes, while their registry maturity remains Idea pending product verification; PDF Tool, Excel Tool, and Audio Converter remain deliberate planned surfaces;
- shared mini-app headers, utility controls, and app metadata were tightened for clearer actions, keyboard focus, app/version/status visibility, and latest-change context;
- mobile/tablet navigation now uses a full-screen app-style drawer with an explicit close control;
- AppForge defaults to dark appearance for new visitors while preserving saved Light/Dark/System preferences;
- Supabase Preview, CI validation and cloud-worker checks are green after migration-history cleanup;
- GitHub Pages remains documentation-only at `docs.sstoken.space`, aligned to the same 1152px content width used by the main AppForge shell;
- production deployment remains an intentional release step after CI rather than an assumption based on repository state.

## Current priorities

1. Run production smoke checks for authentication, public routes, responsive shell behavior, and PWA update behavior after each deliberate release.
2. Runtime-verify Getter Pro → Media Vault external-reference save/reload behavior and protected-video reference handling.
3. Finish the highest-value Story Studio creator setup, title/cover, mobile, and accessibility work.
4. Complete Any Converter and Task List standalone-PWA hardening.
5. Verify Markdown Previewer and SVG Tool product behavior before promoting their registry maturity; keep PDF, Excel, and Audio entries on the planned surface until implemented.
6. Review remaining Supabase `SECURITY DEFINER` functions according to their actual authorization requirements.
7. Keep Project Pulse, timeline, issue roadmap, launch checklist, environment, database/security docs, app docs, changelog, and canonical registry aligned.

## Documentation rule

Use **[Documentation maintenance](./DOC_MAINTENANCE.md)** whenever a feature changes architecture, routes, app metadata, migrations, authentication, providers, release behavior, or readiness. Current code and migrations outrank stale historical documentation.

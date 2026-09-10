---
layout: home

title: AppForge Docs
titleTemplate: Developer Portal

hero:
  name: AppForge Docs
  text: Build, understand, and ship focused web tools.
  tagline: Developer documentation for the current AppForge product: apps, architecture, releases, AI providers, cloud experiments, and standalone PWA work.
  image:
    src: /favicon.svg
    alt: AppForge triangle mark
  actions:
    - theme: brand
      text: Getting Started
      link: /GETTING_STARTED
    - theme: alt
      text: Browse Apps
      link: /apps/
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
    link: /DEVELOPMENT_TIMELINE
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

Read **[Getting started](./GETTING_STARTED.md)** and **[Environment & agent pickup](./ENVIRONMENT.md)** first. Then use **[Development timeline](./DEVELOPMENT_TIMELINE.md)**, **[Issue roadmap](./ISSUE_ROADMAP.md)** and **[Agent handoff](./AGENT_HANDOFF.md)** to understand the current development sequence before changing code.

## Current state snapshot

As of 2026-09-10:

- Google and GitHub authentication are implemented through Supabase Auth;
- signed-out `/apps/ai-dragon-arena` is an AI integrations/promotional surface, while Story Studio creation remains authenticated;
- **Desktop Buddy** is the canonical AI companion beta at `/apps/desktop-buddy`, with KDE Konqi starter artwork, portable local packs, framing, transparent PNG export where the source permits it, browser voice, and an AppForge response-event bridge;
- **Getter Pro** is the current name at `/apps/getter-pro`, with per-result local save/download actions plus bulk Media Vault workflows;
- **Pariflow Smpl is retired** from the canonical app registry and its old route redirects back to the app catalogue;
- Dashboard search switches immediately into a focused results view instead of leaving Recent/Categories above the matches;
- Task List remains a local-first standalone-PWA candidate with optional authenticated sync;
- the canonical registry remains at 45 entries by replacing retired Pariflow with Desktop Buddy;
- GitHub Pages is documentation-only and uses the canonical AppForge `favicon.svg` as its large homepage mark as well as its navigation identity;
- production deployment remains an intentional release step after CI rather than an assumption based on local working state.

## Current priorities

1. Complete provider-backed Desktop Buddy generation for Hugging Face and Vertex AI without exposing credentials.
2. Finish Desktop Buddy cross-route pinning and ensure AppForge agent surfaces emit the shared response event consistently.
3. Continue Getter Pro provider reliability and Media Vault workflows, including source-specific download fallbacks.
4. Complete Any Converter and Task List standalone-PWA hardening.
5. Review remaining Supabase `SECURITY DEFINER` functions according to their actual authorization requirements.
6. Keep Project Pulse, timeline, issue roadmap, launch checklist, environment, database/security docs, app docs, and canonical registry aligned.

## Documentation rule

Use **[Documentation maintenance](./DOC_MAINTENANCE.md)** whenever a feature changes architecture, routes, app metadata, migrations, authentication, providers, release behavior, or readiness. Current code and migrations outrank stale historical documentation.

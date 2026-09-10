---
layout: home

title: AppForge Docs
titleTemplate: Developer Portal

hero:
  name: AppForge
  text: Build, understand, and ship focused web tools.
  tagline: Developer documentation, integrated-environment guidance, architecture, release readiness, AI/cloud experiments, and standalone-PWA guidance for AppForge.
  actions:
    - theme: brand
      text: Getting Started
      link: /GETTING_STARTED
    - theme: alt
      text: Environment & Agent Pickup
      link: /ENVIRONMENT
    - theme: alt
      text: Open App ↗
      link: https://www.sstoken.space/

features:
  - title: Developer onboarding
    details: Clone, configure, validate, and understand the project with clear local-development and environment boundaries.
    link: /GETTING_STARTED
    linkText: Start developing
  - title: Agent pickup
    details: Give a coding agent the source-of-truth files, environment model, release rules, integrated services, and handoff contract it needs before editing.
    link: /AGENT_HANDOFF
    linkText: Open agent handoff
  - title: App documentation
    details: Browse per-app notes and extraction guidance for focused standalone-PWA candidates including Any Converter and Task List.
    link: /apps/
    linkText: Browse apps
  - title: Architecture
    details: Understand the canonical app model, database boundaries, authentication, AI providers, and deployment architecture.
    link: /APP_MODEL
    linkText: Read architecture docs
  - title: Security & operations
    details: Review Supabase advisor triage, database grant decisions, environment boundaries, and pre-release validation rules.
    link: /SECURITY_ADVISORS
    linkText: Review security state
  - title: Release readiness
    details: Project Pulse, timeline, Full-status criteria, roadmap, and launch checks separate code completion from production verification.
    link: /DEVELOPMENT_TIMELINE
    linkText: Review readiness
---

## What belongs here

This site is the public technical and project portal for AppForge. It documents how the product is structured, how a developer or agent can pick up the integrated environment, how individual apps mature toward standalone PWAs, how releases are prepared, and how external services are integrated safely.

For normal use, go to **[sstoken.space](https://www.sstoken.space/)**. For source code, issues, pull requests, releases, and the actionable backlog, use the **[GitHub repository](https://github.com/dracorisz/appforge)**.

## First-time project pickup

Read **[Getting started](./GETTING_STARTED.md)** and **[Environment & agent pickup](./ENVIRONMENT.md)** first. Then use **[Development timeline](./DEVELOPMENT_TIMELINE.md)**, **[Issue roadmap](./ISSUE_ROADMAP.md)** and **[Agent handoff](./AGENT_HANDOFF.md)** to understand the current development sequence before changing code.

## Current state snapshot

As of 2026-09-10:

- Google and GitHub authentication are implemented through Supabase Auth on `main`;
- signed-out `/apps/ai-dragon-arena` is an AI integrations/promotional surface, while Story Studio creation remains authenticated;
- Task List is a Beta/75% local-first standalone-PWA candidate with its Supabase table/RLS migration applied;
- the canonical registry contains 45 entries as a dated snapshot and is checked with `npm run audit:apps`;
- GitHub Pages is documentation-only and uses AppForge's canonical `favicon.svg` as browser favicon and header logo;
- Vercel Git deployments remain disabled; production is released only with an intentional `vercel deploy --prod`;
- Supabase image-quota mutation grants were hardened against anonymous execution; remaining `SECURITY DEFINER` advisories are being reviewed function by function.

## Current priorities

1. Let CI continuously validate registry/route integrity plus lint, TypeScript, tests and production build.
2. Continue Story Studio creator setup, title/cover metadata, accessibility/mobile polish and provider-failure behavior.
3. Complete Any Converter as the first reproducibly extractable Full standalone PWA.
4. Harden Task List as a second standalone candidate without losing its local-first core.
5. Review remaining Supabase `SECURITY DEFINER` functions according to their actual authorization requirements.
6. Keep Project Pulse, timeline, issue roadmap, launch checklist, environment, database/security docs and canonical registry aligned.
7. Hold the next Vercel production deploy until the current build-up pass reaches a deliberate release checkpoint.

## Documentation rule

Use **[Documentation maintenance](./DOC_MAINTENANCE.md)** whenever a feature changes architecture, routes, app metadata, migrations, authentication, providers, release behavior, or readiness. Current code and migrations outrank stale historical documentation.

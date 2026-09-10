---
layout: home

title: AppForge Docs
titleTemplate: Developer Portal

hero:
  name: AppForge
  text: Build, understand, and ship focused web tools.
  tagline: Developer documentation, architecture, release readiness, AI/cloud experiments, and standalone-PWA guidance for the AppForge toolbox.
  actions:
    - theme: brand
      text: Getting Started
      link: /GETTING_STARTED
    - theme: alt
      text: Project Pulse
      link: /PROJECT-PULSE
    - theme: alt
      text: Open App ↗
      link: https://www.sstoken.space/

features:
  - title: Use AppForge
    details: The production application lives at sstoken.space. GitHub Pages is the developer and project documentation surface.
    link: https://www.sstoken.space/
    linkText: Open production app
  - title: Project Pulse
    details: Follow app maturity, release gates, PWA readiness, and the path from beta to Full status.
    link: /PROJECT-PULSE
    linkText: View project status
  - title: App documentation
    details: Browse per-app notes and extraction guidance for focused standalone-PWA candidates.
    link: /apps/
    linkText: Browse apps
  - title: Architecture
    details: Understand the canonical app model, database boundaries, authentication, AI providers, and deployment architecture.
    link: /APP_MODEL
    linkText: Read architecture docs
  - title: Deployment
    details: Vercel production releases are manual-only. GitHub Pages publishes docs automatically and Cloud Run remains isolated for bounded AI experiments.
    link: /LAUNCH-CHECKLIST
    linkText: Review release gates
  - title: Contribute
    details: Work from the public repository, issues, and documentation. Docs remain Markdown-first so they can later sync to GitBook without migration lock-in.
    link: https://github.com/dracorisz/appforge
    linkText: Open GitHub repository
---

## What belongs here

This site is the public technical and project portal for AppForge. It documents how the product is structured, how individual apps mature toward standalone PWAs, how releases are prepared, and how external services are integrated safely.

For normal use, go to **[sstoken.space](https://www.sstoken.space/)**. For source code, issues, pull requests, and releases, use the **[GitHub repository](https://github.com/dracorisz/appforge)**.

## Current priorities

1. Finish production-readiness and smoke-test gates deliberately rather than deploying on every push.
2. Complete Story Studio and its creator-facing Novel/Comics flow.
3. Move focused browser-local apps toward documented **Full** standalone-PWA status.
4. Keep Project Pulse, the issue roadmap, and launch checklist aligned with the canonical app registry.
5. Use GitHub Pages as documentation infrastructure while keeping the production application independent.

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
    link: /ENVIRONMENT
    linkText: Open environment guide
  - title: App documentation
    details: Browse per-app notes and extraction guidance for focused standalone-PWA candidates.
    link: /apps/
    linkText: Browse apps
  - title: Architecture
    details: Understand the canonical app model, database boundaries, authentication, AI providers, and deployment architecture.
    link: /APP_MODEL
    linkText: Read architecture docs
  - title: Branding
    details: Use the canonical AppForge name, manifest metadata, dark-slate surfaces, blue accent system, favicon, and public-surface roles consistently.
    link: /BRANDING
    linkText: View branding system
  - title: Release readiness
    details: Project Pulse, Full-status criteria, roadmap, and launch checks separate code completion from production verification.
    link: /PROJECT-PULSE
    linkText: Review readiness
---

## What belongs here

This site is the public technical and project portal for AppForge. It documents how the product is structured, how a developer or agent can pick up the integrated environment, how individual apps mature toward standalone PWAs, how releases are prepared, and how external services are integrated safely.

For normal use, go to **[sstoken.space](https://www.sstoken.space/)**. For source code, issues, pull requests, and releases, use the **[GitHub repository](https://github.com/dracorisz/appforge)**.

## First-time project pickup

If you are new to the repository, read **[Getting started](./GETTING_STARTED.md)** and **[Environment & agent pickup](./ENVIRONMENT.md)** first. Agents should then read **[Agent handoff](./AGENT_HANDOFF.md)** and inspect the current issue plus the source-of-truth files named there before making changes.

## Current priorities

1. Finish production-readiness and smoke-test gates deliberately rather than deploying on every push.
2. Complete Story Studio and its creator-facing Novel/Comics flow.
3. Move focused browser-local apps toward documented **Full** standalone-PWA status.
4. Keep Project Pulse, the issue roadmap, launch checklist, environment guide, and canonical registry aligned.
5. Keep GitHub Pages focused on documentation while `sstoken.space` remains the production application.

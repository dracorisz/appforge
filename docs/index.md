---
layout: home

title: AppForge Docs
titleTemplate: Product & Developer Guide

hero:
  name: AppForge Docs
  text: Use, understand, and ship AppForge.
  tagline: "Concise product and developer documentation for the integrated AppForge platform."
  image:
    src: /favicon.svg
    alt: AppForge logo
  actions:
    - theme: brand
      text: Getting Started
      link: /GETTING_STARTED
    - theme: alt
      text: Open App ↗
      link: https://www.sstoken.space/

features:
  - title: Start quickly
    details: The shortest path for users, contributors, and maintainers.
    link: /GETTING_STARTED
    linkText: Get started
  - title: Apps
    details: One consolidated view of the AppForge catalog, access model, categories, and maturity states.
    link: /apps/
    linkText: Browse the catalog
  - title: Architecture
    details: Understand registry identity, routing, data boundaries, providers, and shared UI contracts.
    link: /APP_MODEL
    linkText: Read architecture
  - title: AppForge PWA
    details: AppForge itself is an installable PWA with managed updates, offline shell behavior, and a shared service worker.
    link: /PWA
    linkText: Read PWA guide
  - title: Security & operations
    details: Environment, database, provider, release, and security guidance for operating the platform safely.
    link: /SECURITY_ADVISORS
    linkText: Review operations
  - title: Current readiness
    details: Project Pulse summarizes product maturity and release state without duplicating the registry or issue tracker.
    link: /PROJECT-PULSE
    linkText: Open Project Pulse
---

## One product, many focused tools

AppForge is an integrated web-tool platform combining public utilities, creator workflows, media tools, and an authenticated personal workspace. The application is maintained, released, and presented as one coherent product.

AppForge itself remains a fully functional installable Progressive Web App. Individual tools inside AppForge do **not** have a standalone-PWA or fork-readiness track in this repository. If a tool family later becomes a separate product, that work belongs in its own project with its own product architecture and release lifecycle.

For normal use, open **[sstoken.space](https://www.sstoken.space/)**. For source code, issues, pull requests, and releases, use the **[GitHub repository](https://github.com/dracorisz/appforge)**.

## Recommended reading

Start with **[Getting started](./GETTING_STARTED.md)**. Then use **[Apps](./apps/index.md)** for the catalog, **[App model](./APP_MODEL.md)** for architecture, and **[Project Pulse](./PROJECT-PULSE.md)** for current readiness.

Developers working on installation, service-worker behavior, caching, or update prompts should read **[AppForge PWA](./PWA.md)**. Maintainers can continue to Environment, Launch checklist, Database, Security advisories, and Agent handoff as needed.

## Product principles

- Keep AppForge visually and behaviorally consistent across public and authenticated surfaces.
- Treat `src/lib/registry.ts` as the canonical app identity and maturity source.
- Prefer shared components and platform services over app-specific duplicates.
- Keep public/private access boundaries explicit.
- Keep live-data and provider claims truthful and observable.
- Preserve AppForge's installable PWA experience without turning each internal app into a separate PWA project.
- Keep documentation concise; implementation detail belongs close to code unless it is needed to operate or contribute to the platform.

## Release model

`main` is the production source branch, but pushing code does not itself constitute a production release. CI verifies the repository, GitHub Pages publishes these docs, and a Vercel production deployment remains a deliberate release action followed by smoke testing.

---
layout: home

title: AppForge Docs
titleTemplate: Product & Developer Guide

hero:
  name: AppForge Docs
  text: Build, use, and operate AppForge.
  tagline: "Practical documentation for AppForge tools, creator workflows, private storage, AI integrations, and the signed-in workspace."
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
  - title: Use AppForge
    details: Understand public tools, the signed-in workspace, installation, and the shortest path to the feature you need.
    link: /GETTING_STARTED
    linkText: Get started
  - title: Active apps
    details: Browse the product surfaces that are actually present in the live registry; unfinished placeholders stay out of the catalog.
    link: /apps/
    linkText: Browse apps
  - title: Media & creators
    details: Follow the shared storage and creator model used by Media Vault, Getter Pro, Story Studio, and Desktop Buddy.
    link: /DATABASE
    linkText: Understand storage
  - title: Architecture
    details: Understand registry identity, routing, authentication boundaries, shared UI contracts, and provider integrations.
    link: /APP_MODEL
    linkText: Read architecture
  - title: AppForge PWA
    details: AppForge is one installable PWA with managed updates, installation prompts, and an offline application shell.
    link: /PWA
    linkText: Read PWA guide
  - title: Ship safely
    details: Use the release, environment, database, cloud, and security guides before a production deployment.
    link: /PROJECT-PULSE
    linkText: Check readiness
---

## A toolbox with one product shell

AppForge combines useful browser tools, live-data utilities, creator workflows, private media storage, and AI-assisted experiences in a single application. Public routes are available when a tool can safely stand on its own; account-backed workflows live inside the authenticated workspace.

The live registry is intentionally practical: an app belongs in the catalog when there is a useful product surface to open and test. Concepts that are still only ideas or placeholder implementations belong in issues and development work, not in the user-facing app directory.

For normal use, open **[sstoken.space](https://www.sstoken.space/)**. Source code, issues, pull requests, and releases live in the **[GitHub repository](https://github.com/dracorisz/appforge)**.

## Shared platform capabilities

AppForge owns the platform behavior around its tools. Authentication, responsive navigation, version identity, PWA installation and updates, user preferences, and shared storage should remain consistent instead of being reimplemented by each app.

**Media Vault** is the account-level asset workspace. Signed-in users can create personal folders, choose how files are sorted, and move eligible files between folders. App-generated collections remain recognizable: Desktop Buddy generations are stored under **Desktop Buddies**, Story Studio scenes remain linked to their story asset records, and Getter Pro can archive source references without pretending those references are uploaded file bytes.

AI features use explicit provider paths and should expose failure and recovery states instead of hiding paid or network-backed work. Google Cloud / Vertex integrations, Hugging Face integrations, and server-backed APIs are documented separately where they create an operational dependency.

## Where to read next

Start with **[Getting Started](./GETTING_STARTED.md)**. Use **[Apps](./apps/index.md)** for the current product catalog rules, **[App Model](./APP_MODEL.md)** for architecture, **[Database](./DATABASE.md)** for signed-in persistence, **[AppForge PWA](./PWA.md)** for installation and service-worker behavior, and **[Project Pulse](./PROJECT-PULSE.md)** before a release.

Maintainer-oriented operational and historical material remains available in the navigation, but it is secondary to the current product, architecture, and release path.

## Product principles

- Ship real, testable product surfaces instead of exposing unfinished placeholders.
- Keep AppForge visually and behaviorally consistent across public and authenticated routes.
- Treat `src/lib/registry.ts` as the canonical identity and maturity source for live apps.
- Prefer shared platform services for authentication, storage, provider access, layout, and PWA behavior.
- Keep public/private boundaries and user-owned data explicit.
- Keep live-data and provider claims truthful and observable.
- Keep documentation concise and current; implementation-only detail belongs close to the code.

## Release model

`main` is the production source branch, but a push is not itself a production release. CI validates the repository, GitHub Pages publishes these docs, and Vercel production deployment remains a deliberate release action followed by smoke testing of public routes, authentication, storage-backed flows, and PWA update behavior.

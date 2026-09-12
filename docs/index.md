---
layout: home

title: AppForge Docs
titleTemplate: Product & Developer Guide

hero:
  name: AppForge Docs
  text: Use and build AppForge.
  tagline: "Product, development, and operations guidance for the AppForge platform."
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
  - title: Guide
    details: Start using or developing AppForge without reading the whole repository.
    link: /GETTING_STARTED
    linkText: Get started
  - title: Apps
    details: Understand the active catalog and public/private access model.
    link: /apps/
    linkText: View apps
  - title: Architecture
    details: Registry, routing, authentication, storage, providers, and shared UI.
    link: /APP_MODEL
    linkText: App model
  - title: Operations
    details: Environment, database, security, and release guidance.
    link: /PROJECT-PULSE
    linkText: Release state
---

## AppForge in brief

AppForge is one web platform containing focused utilities, creator workflows, AI features, and a signed-in workspace.

Most active tools are public. **Getter Pro, Media Vault, Desktop Buddy, and Story Studio require sign-in** because they depend on private user data, storage, or account-backed workflows.

The live app registry contains usable product surfaces only. Planned or abandoned placeholders should stay out of the catalog.

## For developers

`src/lib/registry.ts` is the canonical app catalog. Shared navigation, authentication, storage, layout, PWA behavior, and provider integrations belong at platform level rather than being duplicated per app.

Administrative tools are protected by the admin role plus TOTP/AAL2. The Admin area contains **Users, Content, Apps, and Marketing**. Content supports Blog, homepage media, gallery items, and Docs drafts, including media uploads and Vertex-assisted drafting.

Start with **[Getting Started](./GETTING_STARTED.md)**, then use **[Apps](./apps/index.md)** and **[App Model](./APP_MODEL.md)** as needed. Before production changes, check **[Project Pulse](./PROJECT-PULSE.md)** and the release/security guidance.

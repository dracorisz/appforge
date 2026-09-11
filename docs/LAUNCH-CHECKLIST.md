# AppForge launch checklist

This is the compact cross-product gate for a deliberate production release. GitHub Issues remain the authoritative acceptance lists for tracked features.

## Before deploy

- [ ] Current `main` passes `npm run verify:release`.
- [ ] VitePress docs build succeeds for the same `main` head.
- [ ] No unresolved P0 data, auth, security, or major responsive-navigation regression remains.
- [ ] Registry identity/routes match the product UI and public Apps directory.
- [ ] Provider credentials remain server-side and no secret is exposed through `VITE_*`, browser source, docs, logs, or issues.
- [ ] Relevant Supabase migrations/RLS changes are applied and verified.
- [ ] Paid/provider operations have bounded and recoverable failure behavior.
- [ ] AppForge PWA manifest/service-worker/update behavior still passes a production-build check when PWA infrastructure changed.

## High-value runtime checks

Before or immediately after the deliberate production deploy, prioritize:

1. landing page and shared public navigation;
2. Google/GitHub authentication, return path, refresh, logout, and denied/cancelled flow;
3. public Apps directory plus public guest tools on mobile/tablet/desktop;
4. authenticated sidebar/drawer behavior at narrow, intermediate, and wide widths;
5. Story Studio primary creation flow and generated-scene handling;
6. Getter Pro search/download/reference behavior and Getter Pro → Media Vault save/reload;
7. Media Vault Grid/Showcase/List and source actions;
8. Desktop Buddy local character workflow, generation/recovery states, transparency repair, and capture/import fallback;
9. Task List local create/edit/complete/delete and authenticated sync;
10. Weather Now plus sidebar location preference;
11. representative browser-local tools such as Any Converter;
12. AppForge PWA install/update/direct-route/offline-shell behavior.

## Consistency gate

Confirm that:

- global public pages use the shared AppForge navigation;
- global navigation contains the AppForge brand without page-specific slogans;
- app cards do not use distracting vertical hover jumps;
- shared controls, borders, focus states, spacing, and responsive widths remain consistent;
- public versus authenticated access labels match actual routing;
- app maturity uses only Idea / Building / Beta / Launched / Deprecated;
- there is no per-app standalone-PWA or fork-readiness promise in product copy or release gates.

## Documentation gate

The normal public/developer path should remain short:

- `GETTING_STARTED.md`
- `apps/index.md`
- `APP_MODEL.md`
- `PROJECT-PULSE.md`
- `PWA.md` for AppForge-wide install/update behavior

Operational documents can remain deeper in the sidebar. Do not recreate a separate documentation page for every app unless a future platform-wide requirement genuinely needs one.

## Deliberate production release

Vercel Git-triggered deployments are disabled. A push to `main` is not a production release.

When the verified commit is intentionally approved for production:

```bash
vercel deploy --prod
```

After deployment, confirm the Footer/build fingerprint matches the intended commit and repeat the affected smoke paths against `https://www.sstoken.space/`.

## Current boundaries

- GitHub Pages serves documentation only; it does not provide AppForge `/api` routes.
- AppForge remains one installable PWA; internal apps share that lifecycle.
- Google Cloud and AI-provider infrastructure must be treated as unverified until its real production identity/configuration and a deliberate smoke action have been checked.
- Repository implementation, CI success, production deployment, and production verification are separate states.

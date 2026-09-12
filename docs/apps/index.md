# Apps

The live catalog comes from `src/lib/registry.ts` and is available at **[sstoken.space/explore](https://www.sstoken.space/explore)**.

## Access

All active apps are public except these account-backed tools:

- **Getter Pro** — signed-in media discovery and vault archiving.
- **Media Vault** — private user storage.
- **Desktop Buddy** — personal character assets and account-backed generation.
- **Story Studio** — private story sessions, assets, and generation state.

Access and maturity are separate: a beta app can still be public.

## Catalog rules

Only usable product surfaces belong in the registry. Placeholder `idea` or `building` entries should remain in development work until they are ready to open and test.

**Data Converter** is the single general data-conversion app. The former Any to Any identity is retained only as a compatibility redirect and should not appear as a separate catalog item.

## Developer contract

When changing an app:

1. Keep its canonical identity and route in `src/lib/registry.ts`.
2. Reuse shared layout, navigation, authentication, and storage services.
3. Keep public/private access explicit.
4. Document new server, database, storage, or provider dependencies.
5. Verify responsive layout, direct routes, keyboard behavior, and failure states.
6. Run the normal registry and release checks before production deployment.

For architecture, continue with **[App Model](../APP_MODEL.md)**. For persistence, see **[Database](../DATABASE.md)**.

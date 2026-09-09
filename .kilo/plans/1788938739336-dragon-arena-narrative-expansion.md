# Dragon Arena: Narrative & Branch Expansion

## Goal
Expand Dragon Arena beyond the single hardcoded "Ember Vault" opening by adding multiple distinct opening scenarios with their own choices, so each new run begins with a fresh narrative. Persist the chosen opening so session restore and the session switcher reconstruct the correct starting turn.

## Context (from current state)
- `PF_AIDragonArena.tsx` hardcodes `OPENING` + `OPENING_CHOICES` as module constants (lines 44–45).
- Restore path (`restoreLatestSession` L97–147, `switchSession` L381–421) and `reset` (L183–196) all rebuild `history[0]` from the same constant — so supporting multiple openings requires persisting the opening on the session.
- `persistMeaningfulSession` (L264–319) creates the session inline with `metadata: { source: 'dragon-arena', model: MODEL }` and never records which opening was used.
- `createSession` in `src/lib/dragonArena.ts` (L74–87) is exported but **not used** by the component (the component inlines the insert).
- Sessions table has a `metadata jsonb` column (no migration needed).

## Scope
**In**
- Add `OpeningScenario` data to `src/lib/dragonArena.ts` and export it.
- Replace hardcoded opening in `PF_AIDragonArena.tsx` with a stateful, persisted opening.
- Pick a random opening on each new run; restore the correct opening per session.
- Backward-compatible fallback to the Ember Vault opening for pre-existing sessions.
- Registry + changelog bump for Dragon Arena.
- Update `docs/apps/dragon-arena.md` opening section and `AGENT_HANDOFF.md` checklist.

**Out of scope**
- Deeper GM branching / LLM prompt rewrites (OpenRouter prompt in `api/ai-game.js` stays as-is).
- Any RLS / security / quota changes.
- Local-dev runtime verification of `/api/ai-game` / `/api/dragon-image` (requires server credentials).

## Resolved design decisions
1. **Openings live in code, not DB.** `DRAGON_ARENA_OPENINGS: OpeningScenario[]` in `src/lib/dragonArena.ts`. No schema/migration needed; keeps iteration fast. (Alternative rejected: DB-backed scenarios — heavier, no current need.)
2. **Opening is persisted in session `metadata.opening`** as the full `{ id, narrative, choices }` object, plus `metadata.opening_id` for readability/filtering. Restore reads `metadata.opening` directly.
3. **Backward compatible.** Sessions without `metadata.opening` (all current prod sessions) fall back to the legacy Ember Vault opening on restore.
4. **Random selection on new run.** `Math.random()` pick. (Alternative considered: rotate deterministically per day — rejected as needless complexity.)
5. **Changelog/version.** Bump `PF_AIDragonArena` registry entry to `1.4.0` with a changelog entry; bump top-level `APPFORGE_CHANGELOG` to `1.20.0`. `scripts/set-version.mjs` is the version tool.

## Data flow
```
new run (reset)            -> setOpening(random from DRAGON_ARENA_OPENINGS)
                            -> history[0] = opening.narrative
first completed turn        -> persistMeaningfulSession creates session with
                               metadata.opening = { id, narrative, choices }
restore / switchSession     -> read session.metadata.opening (fallback to DEFAULT_OPENING)
                             -> setOpening(restored)
generateScene               -> latestNarrative falls back to opening.narrative
```

## Opening scenarios to add (wording is a suggestion; implementer may refine)
```
1. Ember Vault (DEFAULT, existing):
   "You enter the Ember Vault beneath WildDragons Keep. Three rune-lit passages
   split ahead while something enormous breathes in the dark."
   choices: Follow the blue runes | Call out to the creature | Search the vault entrance

2. Sunken Library:
   "The obsidian library floats on black water; a single lantern drifts toward you,
   its flame spelling a warning in a language your blood remembers."
   choices: Row toward the lantern | Study the floating shelves | Sink beneath the surface

3. Scale Bridge:
   "Rope bridges sway between the ribs of a petrified dragon; each step groans
   like the beast remembering waking."
   choices: Cross the central span | Test the nearest cable | Climb up to the skull

4. Forgotten Bazaar:
   "The market is frozen in ash; vendors of bone and bronze wait for a buyer,
   their wares whispering in the cinders."
   choices: Haggle with the coin-purse crow | Examine the glass vials | Walk past without looking
```

## Affected files
| File | Change |
|---|---|
| `src/lib/dragonArena.ts` | Add `OpeningScenario` type, `DRAGON_ARENA_OPENINGS` (4 entries), `DEFAULT_OPENING`, `DEFAULT_OPENING_CHOICES` exports. |
| `src/components/dashboard/PF_AIDragonArena.tsx` | Replace `OPENING`/`OPENING_CHOICES` constants with `opening` state (random init). Update `reset`, `restoreLatestSession`, `switchSession` to read/restore `opening`; pass opening into session metadata on create. |

## Ordered task list
1. `dragonArena.ts`: add `OpeningScenario` type + `DRAGON_ARENA_OPENINGS` + `DEFAULT_OPENING`/`DEFAULT_OPENING_CHOICES`.
2. `PF_AIDragonArena.tsx`: import openings; add `opening` state + `randomOpening()` helper; replace all `OPENING`/`OPENING_CHOICES` references with `opening.*`.
3. `PF_AIDragonArena.tsx` `reset()`: assign a new random opening.
4. `PF_AIDragonArena.tsx` `persistMeaningfulSession`: include `opening`/`opening_id` in session `metadata` on create.
5. `PF_AIDragonArena.tsx` `restoreLatestSession` + `switchSession`: read `session.metadata.opening`, fallback to `DEFAULT_OPENING`; call `setOpening`.
6. `PF_AIDragonArena.tsx` `generateScene`: use `opening.narrative` fallback.
7. `registry.ts`: bump Dragon Arena to `1.4.0`; add changelog entry; bump `APPFORGE_CHANGELOG` to `1.20.0`.
8. `docs/apps/dragon-arena.md`: note multiple openings + restore behavior.
9. `AGENT_HANDOFF.md`: flip "Consider adding more opening narratives/branches" to done.
10. Validate: `npm run typecheck` && `npm run build`.
11. Manual E2E checklist (owner, needs credentials): new run → opening varies → play a turn → reload → opening restored → session switch → opening preserved → scene gen uses restored opening.

## Validation plan
- `npm run typecheck` must pass (no new type errors from the `OpeningScenario` typing).
- `npm run build` must pass with no new chunk-size warnings (this change is tiny; it will not affect bundle size).
- Manual: open Dragon Arena, start a new run 3× — confirm 3 different openings. Reload mid-run — confirm the same opening persists. Switch between two sessions — confirm each keeps its opening.

## Risks & mitigations
| Risk | Mitigation |
|---|---|
| Old sessions lose their opening on restore | Fallback to `DEFAULT_OPENING` (Ember Vault) — backward compatible. |
| `metadata` payload grows | Opening object is ~500 bytes; negligible. |
| Random opening changes documented "Ember Vault" first experience | Acceptable product behavior; keep Ember Vault as index 0 / DEFAULT. |

## Notes for owner (out of this plan's scope)
- The local-dev `/api/ai-game` + `/api/dragon-image` runtime verification is blocked without `OPENROUTER_API_KEY` + `SUPABASE_*` + `HF_TOKEN_*` in `.env.local`; it remains on the pending list.
- Route-level code splitting (chunk warning) is a separate build-hygiene item if desired next.

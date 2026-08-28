# Darrell — Engine, tests & demo scenarios

Your lane is **correctness and demo reliability**. You own the state engine everyone else imports from, the test suite that proves the matching/escalation logic, and the one-click scenario loader that means we never hand-assemble the demo live in front of judges.

**Read first:** `CLAUDE.md`, then all of `src/engine.ts` and `src/data.ts`. Branch: `lane/darrell/<topic>`.

## You own
- `src/engine.ts` — you are the **sole editor** of this file; others request changes through you
- `src/engine.test.ts` (new)
- `src/components/DemoControls.tsx` (new)

## Do not touch
All other `src/components/*` files (Chris, Greg, Jacob), `data.ts` values (Jacob — though your tests may import them), `index.css` (Steve). `App.tsx`: one-line mounts only, announced first.

## P0 — must be in the demo

1. **Unblock Jacob first (15 min).** Add `profileOverrides: Record<string, Partial<Org>>` to `AppState` (default `{}`), an `effectiveOrg(id, state)` helper that merges overrides over the seed org, and route `computeMatches` + `lastConfirmedInfo` through it. Small PR, merge immediately, tell Jacob.
2. **Test suite.** Add vitest (`yarn add -D vitest`, script `"test": "vitest run"`). Cover: every exclusion reason in `computeMatches` (distance, storage, hours-overlap incl. edge-touching windows, category); simultaneity (result includes ALL compatible orgs — this test is our "no rationing" proof, name it accordingly); `tick` hold-expiry reopening a claim; `tick` escalation at pickup-window end; the post → claim → confirm → picked-up transition chain; invalid transitions are no-ops (e.g. confirming an unclaimed signal).
3. **Scenario loader.** `DemoControls.tsx`: two buttons — "Scenario A: happy path" (seeds state mid-story: signal posted, matches computed, ready to claim) and "Scenario B: no takers" (signal posted with a window about to lapse, one `+15m` from escalating). Implement as pure `loadScenario(name): AppState` functions in the engine so they're testable. Mount via a one-line addition to `App.tsx` (announce first) — visually small, near the demo clock.

## P1

4. **Clock edge cases.** `tick` assumes same-day pickup windows; make multi-day clock advances behave sanely (a signal posted Monday escalates once, log doesn't duplicate entries on repeated ticks).
5. **Interface requests queue.** As Greg/Chris/Josh need engine hooks (e.g. a notification-event list for Josh's SMS demo), you implement them — keep each a small, tested PR.

## Stretch

6. Persisted-state versioning: bump the localStorage key or add a version field so stale saved states from earlier builds can't wedge the demo (a `try/catch` + reset fallback is enough).

## Lane-specific guardrails
- `computeMatches` must never gain ranking, scoring, or wave logic — if a request smells like that, refuse it and cite `CLAUDE.md`.
- All transitions stay pure functions; no `Date.now()` anywhere.

## Done means
`yarn test`, `yarn typecheck`, `yarn build` all clean; both scenario buttons produce a working board in one click; Jacob confirms overrides work end-to-end.

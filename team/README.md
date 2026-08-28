# Team lanes — Ham Radio

Six of us (five + Josh) are polishing this into a judge-ready deliverable **today**. Each person has a lane defined by **file ownership** so our Claude Code sessions don't collide. Find your name, open your file, and tell Claude Code: *"Read `team/<YOURNAME>.md` and `CLAUDE.md`, then start on my P0 tasks."*

| Person  | Lane | Owns |
|---------|------|------|
| Chris   | Signal lifecycle & board UX | `src/components/SignalTicket.tsx`, `src/components/StatusRail.tsx` |
| Greg    | Send & claim flows | `src/components/SignalForm.tsx`, `src/components/ClaimDialog.tsx` |
| Jacob   | Network & org profiles | `src/components/NetworkTab.tsx`, `src/components/ProfileEditor.tsx` (new), `src/data.ts` |
| Darrell | Engine, tests, demo scenarios | `src/engine.ts`, `src/engine.test.ts` (new), `src/components/DemoControls.tsx` (new) |
| Steve   | Judge experience, docs, responsive/dark QA | `README.md`, `docs/*`, `src/index.css`, `index.html` |
| Josh    | CI/CD & comms demo | `.github/*`, `src/comms/*` (future), repo settings, Pages |

## Rules of the road

1. **Stay in your owned files.** If your task needs a change in someone else's file, ask them (or leave a `TODO(name):` comment and flag it in the group thread) — don't edit it.
2. **`src/App.tsx` is shared turf.** The only allowed edit is a one-line mount of your own component (plus its import). Announce before you do it, pull `main` first, and keep that commit to just those lines.
3. **`src/engine.ts` belongs to Darrell.** Everyone may *import* from it. If you need a new field or function (Jacob will, for profile overrides), request it from Darrell — he ships interface changes as small early PRs so you're never blocked long.
4. **Branch + PR flow:** branch `lane/<yourname>/<topic>` → small PR to `main` → self-merge when `yarn typecheck && yarn build` pass (and CI once Josh lands it). Pull `main` before starting each new task. Many small merges beat one big one.
5. **Definition of done, every PR:** `yarn typecheck` clean, `yarn build` produces `dist/index.html`, and you clicked through the happy path (post → claim → confirm → picked up) plus the escalation path in `yarn dev` without console errors. Both themes, if you touched styling.
6. **Guardrails are non-negotiable** — see `CLAUDE.md`. No client data, no need-scoring, DEMO banner stays, fictional org names stay fictional, single-file build stays single-file.

## Timeboxes

Josh is gone after **2 PM**. Priorities in each lane file are marked **P0** (must be in the judge demo), **P1** (do if P0 lands by ~1:00), **Stretch** (only if everything else is merged). Land P0s by **1:30** so the last 30 minutes are integration, a full click-through, and a fresh build — not new code.

## Josh's lane (for awareness)

- GitHub Actions: typecheck + build on PR; deploy `dist/index.html` to GitHub Pages on merge to `main`. Once live, the public demo URL goes in the README (Steve).
- Comms demo: a free-tier SMS path (Photon account) so a judge can receive a real "signal" text during the demo. This will live behind `src/comms/` and must remain **opt-in, demo-only, and clearly simulated-data** — it changes nothing in your lanes. If an engine hook is needed, Josh coordinates with Darrell.

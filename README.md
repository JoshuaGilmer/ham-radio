# Ham Radio

Every pantry a station: broadcast expiring surplus **sideways** across B'ham's pantry network before the clock runs out.

Built at the [Claude Impact Lab](https://github.com/Birmingham-AI/claude-impact-lab) (Birmingham AI), food coordination track. The name is the mechanic — a distress broadcast over a network of stations — plus the obvious B'ham pun.

## Team

- **Team name:** Ham Radio
- **Team ID:** 5A

## Challenge and primary user

- **Challenge:** 5 — Coordinate Birmingham's Food Support Network
- **Primary user:** A pantry coordinator holding surplus that expires before their own distribution schedule can absorb it.

## Problem and repeated workflow

A coordinator realizes they have too much of something perishable. Their own line can't absorb it before it expires, so the surplus becomes a phone tree: serial calls across the network asking who can take it, who has cold storage, who's open, who can drive. The event's own synthetic dataset shows the shape of the gap — every supply record expires **before** any demand window opens, no recipient has transport, and all 8 records sit at `status: unconfirmed` with a named `confirmation_owner_type`. The missing piece isn't matching or logistics; it's the confirmation loop.

## What the project does

Birmingham's food gap isn't supply or organizations — it's that nothing moves food **pantry to pantry** when expiry outruns a distribution schedule. Today that lateral move is one coordinator's phone tree — a faith-based pantry operator described spending on the order of 8–10 hrs/week on these serial calls (their estimate, not a measurement).

Ham Radio replaces the phone tree with one asynchronous signal:

1. **Put out a signal** (~60s): category, quantity, storage requirement, expiry window, pickup window, and **next distribution date** — the reason the food can't wait.
2. **Targeted fan-out**: a rule-based filter notifies *only* physically compatible orgs (storage ≥ requirement, within radius, open during the window, opted-in category). All matches notified simultaneously — no ranking, no scoring.
3. **Claim & confirm**: first tap holds the signal 30 minutes; the poster confirms. A human says yes on both ends of every transfer.
4. **Move it**: the claim records who moves it — claimer pickup, poster drop-off, or a volunteer driver via [FeedBHM](https://gracekleincommunity.com).
5. **Resolve or escalate**: unclaimed signals escalate loudly to the CFBCA agency-relations desk with verified [211](https://www.211connectsalabama.org) links. A dead signal is never silent.

Every signal **auto-expires** — the system structurally cannot rot into a stale directory.

## Guardrails (per the Impact Lab do-not-build list)

- **No static directory** — availability data is self-declared, point-in-time, self-deleting.
- **No client data** — org-to-org only; no client ever touches the system.
- **No rationing by algorithm** — the filter gates physical safety, never need; humans confirm every transfer.
- **No synthetic-as-live** — persistent DEMO banner; every org, number, and signal on screen is invented.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · [shadcn/ui](https://ui.shadcn.com) (Radix primitives). `vite-plugin-singlefile` makes the production build a single self-contained `dist/index.html`, so the demo ships as one shareable page.

```bash
yarn          # install
yarn dev      # dev server
yarn build    # single-file build → dist/index.html
```

Demo state lives in `localStorage` (Reset demo clears it). A simulated demo clock (+15m / +1h) drives claim holds and escalation deterministically.

**Demo script:** as Fauxfield (Ray), send the default dairy signal → see "5 of 11 orgs notified" with exclusion reasons → switch persona to Mock Creek → claim (profile re-confirm + transport choice) → switch back → confirm (note the rice backhaul suggestion) → mark picked up. For the failure path: send a signal and advance the clock past the pickup window → escalation with verified links.

## Data and evidence sources

- **Everything in the app is synthetic** — every organization ("Fauxfield Church Pantry," "Mock Creek Ministries"…), every signal, every number. A persistent DEMO banner marks it on every screen; nothing is presented as live availability.
- The event's synthetic dataset ([food-supply-demand.csv](https://github.com/Birmingham-AI/claude-impact-lab/blob/main/resources/data/food-supply-demand.csv)) informed the design: 8/8 records `unconfirmed`, zero recipient transport, supply expiring before demand windows open.
- Real public sources, read for context and preserved as verified links in the artifact: [211 Connects Alabama](https://www.211connectsalabama.org), [Community Food Bank of Central Alabama](https://feedingal.org), [Grace Klein Community / FeedBHM](https://gracekleincommunity.com).
- The phone-tree friction description comes from a conversation with a faith-based pantry operator (uncredited by request; estimates, not measurements).

## Architecture and how Claude was used

The app is a Vite/React single-page demo; all state transitions are pure functions in `src/engine.ts`, unit-tested, with the matching filter gating **physical compatibility only** (storage, distance, open hours, opted-in category — never need).

Claude Code built this across six parallel lanes: scaffolding, the engine and its tests, the UI, a red-teamed PRD against the challenge's do-not-build list, in-browser verification of every flow, and an integration catch (the fan-out preview and the actual send now make the identical engine call, so they can never disagree). **Claude does not appear in the product** — the artifact is deliberately deterministic and auditable, not an AI deciding where food goes.

## Working artifact

**Live demo:** https://joshuagilmer.github.io/ham-radio/ — the single-file production build, deployed from `main` on every merge.

## What works today

The full loop at the link above: post a signal with a live "N of 11 orgs will be notified" preview (with per-org exclusion reasons) → claim via an informed-consent dialog (restates qty, storage, expiry, window, distance; records who moves it) → poster confirms → picked up. Failure path: advance the demo clock past an unclaimed window and the signal escalates loudly with verified 211/CFBCA links. Profile edits propagate everywhere, including the preview. CI enforces typecheck, tests, build, and single-file output on every merge.

## Known limitations and simulated elements

- Everything on screen is synthetic; the clock is simulated; no real pantry, inventory, or availability is represented.
- Notifications are in-app only (an opt-in SMS relay is scaffolded, demo-only, simulated data).
- Demo state is per-browser (`localStorage`); a pilot needs a shared backend.
- The compatibility rules are our synthetic assumptions — a pilot's first job is validating them with real coordinators.
- No integration with Coordinated Entry, 211's database, or any live system — by design and by the rules.

## Next step toward a pilot

Take the working demo to the **Community Food Bank of Central Alabama's agency-relations desk** — through their existing *Become a Partner* agency intake — and run a two-week paper pilot with 3–5 of their 230+ partner agencies in one neighborhood: real coordinators posting real surplus signals, transfers still confirmed by phone exactly as today, to validate the compatibility rules and measure whether signal-and-claim beats the phone tree.

## Docs

- [`docs/prd.html`](docs/prd.html) — the red-teamed PRD: persona, rubric fit, counterparty attacks and resolutions, build plan.
- [`docs/prototype.html`](docs/prototype.html) — the original single-file vanilla prototype, kept for reference.

# Flare

A claim board for expiring surplus, moving food **sideways** between Birmingham's pantry network — before the clock runs out.

Built at the [Claude Impact Lab](https://github.com/Birmingham-AI/claude-impact-lab) (Birmingham AI), food coordination track.

## What it is

Birmingham's food gap isn't supply or organizations — it's that nothing moves food **pantry to pantry** when expiry outruns a distribution schedule. Today that lateral move is one coordinator's phone tree (8–10 hrs/week of serial calls).

Flare replaces the phone tree with one asynchronous post:

1. **Post** a flare (~60s): category, quantity, storage requirement, expiry window, pickup window, and **next distribution date** — the reason the food can't wait.
2. **Targeted fan-out**: a rule-based filter notifies *only* physically compatible orgs (storage ≥ requirement, within radius, open during the window, opted-in category). All matches notified simultaneously — no ranking, no scoring.
3. **Claim & confirm**: first tap holds the flare 30 minutes; the poster confirms. A human says yes on both ends of every transfer.
4. **Move it**: the claim records who moves it — claimer pickup, poster drop-off, or a volunteer driver via [FeedBHM](https://gracekleincommunity.com).
5. **Resolve or escalate**: unclaimed flares escalate loudly to the CFBCA agency-relations desk with verified [211](https://www.211connectsalabama.org) links. A dead flare is never silent.

Every flare **auto-expires** — the system structurally cannot rot into a stale directory.

## Guardrails (per the Impact Lab do-not-build list)

- **No static directory** — availability data is self-declared, point-in-time, self-deleting.
- **No client data** — org-to-org only; no client ever touches the system.
- **No rationing by algorithm** — the filter gates physical safety, never need; humans confirm every transfer.
- **No synthetic-as-live** — persistent DEMO banner; every org, number, and flare on screen is invented.

## Running it

It's one self-contained HTML file. Open `index.html` in a browser — no build, no backend, no dependencies. Demo state lives in `localStorage` (Reset demo clears it). A simulated demo clock (+15m / +1h) drives claim holds and escalation deterministically.

**Demo script:** as Fauxfield (Ray), post the default dairy flare → see "notified N of 11" with exclusion reasons → switch persona to Mock Creek → claim (profile re-confirm + transport choice) → switch back → confirm (note the standing-need suggestion) → mark picked up. For the failure path: post a flare and advance the clock past the pickup window → escalation screen with verified links.

## Docs

- [`docs/prd.html`](docs/prd.html) — the red-teamed PRD: persona, rubric fit, counterparty attacks and resolutions, 3-hour build plan.

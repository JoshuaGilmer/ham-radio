# Ham Radio

Every pantry a station: broadcast expiring surplus **sideways** across B'ham's pantry network before the clock runs out.

Built at the [Claude Impact Lab](https://github.com/Birmingham-AI/claude-impact-lab) (Birmingham AI), food coordination track. The name is the mechanic — a distress broadcast over a network of stations — plus the obvious B'ham pun.

## What it is

Birmingham's food gap isn't supply or organizations — it's that nothing moves food **pantry to pantry** when expiry outruns a distribution schedule. Today that lateral move is one coordinator's phone tree (8–10 hrs/week of serial calls).

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

## Docs

- [`docs/prd.html`](docs/prd.html) — the red-teamed PRD: persona, rubric fit, counterparty attacks and resolutions, build plan.
- [`docs/prototype.html`](docs/prototype.html) — the original single-file vanilla prototype, kept for reference.

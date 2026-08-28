# Chris — Signal lifecycle & board UX

Your lane is the **signal ticket**: everything a coordinator sees about a signal after it exists. The board is the centerpiece of the judge demo — your job is to make a ticket's story readable at a glance from six feet away.

**Read first:** `CLAUDE.md`, then skim `src/engine.ts` (the `Signal` type — note the `log` array) and `src/App.tsx` (how tickets are rendered). Branch: `lane/chris/<topic>`.

## You own
- `src/components/SignalTicket.tsx`
- `src/components/StatusRail.tsx`

## Do not touch
`engine.ts` (ask Darrell), `SignalForm.tsx`/`ClaimDialog.tsx` (Greg), `NetworkTab.tsx`/`data.ts` (Jacob), `index.css` tokens (Steve — you may *use* tokens, not redefine them). `App.tsx`: one-line mounts only, announced first.

## P0 — must be in the demo

1. **Activity timeline.** Every `Signal` carries a `log: {at, msg}[]` that is currently rendered nowhere. Add a collapsible "Activity" section at the bottom of each ticket: timestamp (`fmtClock(entry.at)`, mono font) + message, newest last. This is our proof for the rubric line "makes ownership and status visible" — the judges should see "Mock Creek Ministries claimed — held 30 min…" in writing.
2. **Board scannability.** Resolved (`picked_up`) and `escalated` tickets currently sit full-size among live ones. Collapse them to a one-line summary row (id, category, qty, final status chip) that expands on click. During the demo the board should show live work, not history.

## P1

3. **Hold urgency.** While a signal is `claimed`, the hold countdown is plain text. Make it a visible chip that shifts tone as it drops (ok → warn ≤ 15 min → crit ≤ 5 min). Demo-clock minutes, never real time.
4. **Escalation panel polish.** The escalated state is our "a dead signal is loud" moment — give it a clear header treatment and make the three verified links prominent. Do not change the links themselves.

## Stretch

5. A subtle transition when a ticket changes status (respect `prefers-reduced-motion`).

## Lane-specific guardrails
- The status rail's states and simultaneous-notification copy are load-bearing for the "no rationing" judge answer — reword nothing that weakens "all compatible orgs were notified at the same moment."
- Keep the ticket working at mobile width (grid already collapses to 2 columns — preserve that).

## Done means
`yarn typecheck` + `yarn build` clean; click through post → claim → confirm → picked up AND the escalation path in `yarn dev`; timeline renders correct entries for both; both themes legible.

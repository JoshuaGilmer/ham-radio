# Greg — Send & claim flows

Your lane is the two **decision moments**: Ray putting out a signal, and a claimer saying yes. These are the moments the judges are grading — "smallest possible intervention" lives or dies on how effortless these two forms feel.

**Read first:** `CLAUDE.md`, then `src/components/SignalForm.tsx`, `src/components/ClaimDialog.tsx`, and the `computeMatches` function in `src/engine.ts` (you may import it; you may not edit it). Branch: `lane/greg/<topic>`.

## You own
- `src/components/SignalForm.tsx`
- `src/components/ClaimDialog.tsx`

## Do not touch
`engine.ts` (ask Darrell), `SignalTicket.tsx`/`StatusRail.tsx` (Chris), `NetworkTab.tsx`/`data.ts` (Jacob), `index.css` tokens (Steve). `App.tsx`: one-line mounts only, announced first.

## P0 — must be in the demo

1. **Live match preview in the form.** As Ray fills out the signal, show — live, before sending — "This will notify **N of 11** orgs" by calling `computeMatches` on the current form values. If N is 0, say why sending still makes sense ("no matches right now — it will escalate to the CFBCA desk if unclaimed"). This is a killer demo beat: the fan-out is visible *before* the broadcast.
2. **Real validation.** Quantity must be a positive number; pickup window end must be after start (currently silently clamped — replace with inline feedback); next-distribution field required. Use proper error text under the field, not alerts. Send button disabled until valid.

## P1

3. **Claim dialog: show what you're claiming.** The dialog confirms the claimer's profile but never restates the signal. Add a compact summary line (category, qty, storage, pickup window, distance) so the "yes" is fully informed — that's the human-confirmation guardrail done right.
4. **Urgency affordance.** Derive a small urgency indicator from "expires within" (72h calm → 24h hot) shown in the form as the value changes.

## Stretch

5. Keyboard flow: autofocus first field, Enter submits when valid, Esc cancels the dialog.

## Lane-specific guardrails
- The match preview must only ever reflect `computeMatches` output — physical compatibility. Never add anything that ranks, prioritizes, or scores recipients; never make notification sequential.
- The transport radio's FeedBHM link must survive any redesign.

## Done means
`yarn typecheck` + `yarn build` clean; post a signal with the preview matching the resulting ticket's "N of 11"; claim it via the dialog; validation blocks bad input with visible messages; both themes legible.

# Jacob — Network & org profiles

Your lane is the **Network tab and the org data model**. The judges' hardest question is "aren't your org profiles just a static directory with the same staleness problem as 211?" Our answer is *self-maintained, incentive-aligned profiles* — your job is to make that answer true on screen.

**Read first:** `CLAUDE.md`, then `src/components/NetworkTab.tsx`, `src/data.ts`, and the `lastConfirmedInfo` + `AppState` parts of `src/engine.ts`. Branch: `lane/jacob/<topic>`.

## You own
- `src/components/NetworkTab.tsx`
- `src/components/ProfileEditor.tsx` (new — create it)
- `src/data.ts` (org seed data; keep names obviously fictional)

## Do not touch
`engine.ts` directly — your P0 needs a state field, and **Darrell owns that file**: his P1 item is to add `profileOverrides` support for you. Ask him for it first thing; he ships it as a small early PR. Also hands off: `SignalTicket.tsx`/`StatusRail.tsx` (Chris), `SignalForm.tsx`/`ClaimDialog.tsx` (Greg), `index.css` tokens (Steve). `App.tsx`: one-line mounts only, announced first.

## P0 — must be in the demo

1. **Profile self-editing.** From the Network tab, the org you're currently viewing as ("YOU") can edit its own profile: storage capabilities, open hours, travel radius, standing needs. Build `ProfileEditor.tsx` (shadcn Dialog or inline card) and persist via the `profileOverrides` state Darrell adds. Editing also re-confirms the profile (resets its "last confirmed" age). Demo beat: change Fauxfield's storage, put out a signal from another org, and watch the match list change accordingly.
2. **Stale-profile nudge.** Orgs whose profile-confirmed chip is in the warn/crit band get a visible "Confirm profile" affordance (for the org you're viewing as). One click = re-confirmed. This is the incentive story made tangible.

## P1

3. **Compatibility mini-map.** A small SVG grid on the Network tab plotting orgs by their `x/y` positions relative to the current persona, radius rings optional. Makes "too far (5.0 mi, travels 4)" instantly legible. Keep it inline SVG with theme tokens — no map libraries.
4. **Standing needs surfacing.** Standing needs are the backhaul story; give them a chip treatment on org cards instead of plain text.

## Stretch

5. Sort/filter the network list (by distance, by staleness).

## Lane-specific guardrails
- Profiles describe *capability* (what an org can physically take), never need or priority. No fields like "urgency" or "deservingness."
- Org names must stay obviously fictional (Fauxfield, Mock Creek…). If you add orgs, follow that convention.
- Only the currently-viewed persona can edit its own profile — self-maintained is the whole point.

## Done means
`yarn typecheck` + `yarn build` clean; edit a profile → match results change on the next signal → "profile confirmed today" chip updates; both themes legible; mobile width usable.

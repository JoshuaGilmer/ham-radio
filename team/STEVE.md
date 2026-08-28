# Steve — Judge experience, docs & responsive/dark QA

Your lane is **everything the judges see that isn't the app's interaction flows**: the pitch surface, the README, theming, and making sure the demo doesn't fall apart on a phone or in dark mode. You're the last line of polish.

**Read first:** `CLAUDE.md`, `README.md`, `docs/prd.html` (the red-teamed PRD — your source of truth for pitch copy, especially §4 rubric fit, §5 guardrails, and §8's two rehearsed judge answers). Branch: `lane/steve/<topic>`.

## You own
- `README.md`
- `docs/*` (prd.html, prototype.html, new pages)
- `src/index.css` (theme tokens — you are the only person who edits tokens)
- `index.html` (fonts, theme script, meta)

## Do not touch
`engine.ts` (Darrell), all interaction components (Chris/Greg/Jacob/Darrell). `App.tsx`: one-line mounts only, announced first — you'll need exactly one for the judges' link (below).

## P0 — must be in the demo

1. **Judges' one-pager.** Create `docs/judges.html` (self-contained, matching the PRD's visual style — crib its CSS): the one person + decision moment, the three rubric criteria and how we hit each, the guardrail compliance table, and the two rehearsed answers (notification-fatigue, rationing) verbatim from PRD §8. Then add a small "For judges" link in the app footer (that's your one `App.tsx` line, announced first). A judge who clicks once gets the whole argument.
2. **Responsive + dark QA sweep.** Run the full demo at mobile width (375px) and in dark mode. Fix what breaks — spacing, contrast, overflow — via tokens/`index.css` where possible; file a `TODO(owner):` note in the group thread where a fix belongs in someone else's component. Desktop/light is verified; the other three quadrants are yours.

## P1

3. **README as the repo's front door.** Add a screenshot of the board mid-demo (`docs/` assets are fine), the public demo URL once Josh's Pages deploy lands, and a "run the demo in 60 seconds" section pointing at Darrell's scenario buttons.
4. **Accessibility pass.** Keyboard through the whole flow: visible focus everywhere, dialog focus-trap sanity, labels on all form controls, contrast on the chip colors in both themes (tune tokens if any fail).

## Stretch

5. A print stylesheet for `docs/judges.html` so it works as a handout.

## Lane-specific guardrails
- Pitch copy must stay grounded in the PRD — no invented stats, no implying Ray is in Birmingham (his geography is *disclosed*, that's part of the credibility story), no softening the DEMO/synthetic language.
- Token changes ripple everywhere: after any `index.css` edit, click through the app in both themes before merging.

## Done means
`yarn typecheck` + `yarn build` clean; `docs/judges.html` reads cleanly standalone and from the footer link; demo is usable at 375px in both themes; README screenshot current.

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

---

# Theory notes — why Ham Radio's mechanics work

Supporting material for the 2:00 showcase and the pilot phase.

Seven ideas earn a place in this project, and they split into two jobs: three that
sharpen the presentation, and four that belong to the pilot phase after today.

Every figure below is cross-checked against `docs/prd.html` and `src/data.ts`.

## For the presentation

### Bystander effect

The strongest one, because it names the exact problem the claim mechanic solves.

A person is less likely to help the more others are simultaneously aware, because
each individual's felt duty shrinks as the group grows. Ham Radio's fan-out notifies
every compatible org at once — that is textbook conditions for everyone assuming
someone else will take it.

The 30-minute exclusive hold with a named claimer is the antidote. It converts
"somebody should get that dairy" back into "Deb has it until 2:47." The cure is
already designed into the product; this note lets us name the disease in one
sentence on stage.

> Grounding: `HOLD_MIN = 30` in `src/data.ts`. Deb is the pantry lead at Mock Creek
> Ministries, which is dairy-capable — the claim in Scenario A is hers.

### Coordination costs

This gives us the pitch metric.

The phone tree is 8–10 hours a week of one coordinator personally holding the
network together. The coaching question that comes with this idea fits eerily well:
*what would need to be true for this to keep working without that person?*

Ham Radio is the answer. Serial calls become one broadcast.

> Grounding: PRD §"the decision moment" — Ray is modeled on a real coordinator who
> spends 8–10 hours a week on this workflow.

### Structural holes (Burt)

This explains why the network is fragile today.

When two groups that need each other don't talk, whoever sits as the sole link
carries all the leverage and all the load. Right now one coordinator's phone is the
only bridge between twelve pantries. That is a structural hole with a single human
plank across it. The product replaces the lone broker with a mesh.

It is also the honest answer to "doesn't 211 already do this?" — 211 is vertical,
resident-to-service. Nothing bridges pantry-to-pantry.

> Grounding: PRD — "Nothing moves food sideways — pantry to pantry... That lateral
> move is currently one man's phone tree." Synthetic network is 12 orgs.

## For the pilot phase

### Elinor Ostrom

The theoretical spine if this grows.

Her finding: communities sharing a limited resource sustain it for generations
through rules they make and enforce themselves, without a central authority. A
pantry network is a commons, and Ham Radio's choices — self-declared profiles, no
central dispatcher, escalation as graduated response — are Ostrom's design
principles arrived at independently.

Worth one line in the PRD so the next builder doesn't "fix" it by adding a boss.

### Reputation systems

A warning label for later.

The profile-freshness indicator is a baby reputation system, and every such system
fails four ways: inflated ratings, scores farmed as targets, early entrants
unassailable, identities restarted. Freshness-of-profile largely dodges all four
because it measures *recency, not merit*.

Keep it that way.

### The Gift (Mauss)

This reframes escalation.

Donated food is never just logistics; a gift given creates an obligation to receive
and return. A signal that dies silently isn't only wasted calories — it's a damaged
relationship with the donor.

"A dead signal is never silent" is Mauss in product form.

### Collective action problems

This validates our cleverest small mechanic.

Shared benefits with individually felt costs go unprovided, and the standard fix is
tying benefit to contribution. Claiming re-confirms your profile: the org that
benefits does the maintenance as a side effect of benefiting.

That's the fix, already built.

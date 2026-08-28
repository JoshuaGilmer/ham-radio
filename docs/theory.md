# Theory notes — why Ham Radio's mechanics work

Supporting material for the 2:00 showcase and the pilot phase. Owner: Steve.

Seven ideas earn a place in this project, and they split into two jobs: three that
sharpen the presentation, and four that belong to the pilot phase after today.

Every figure below is cross-checked against `docs/prd.html` and `src/data.ts`.

---

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

---

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

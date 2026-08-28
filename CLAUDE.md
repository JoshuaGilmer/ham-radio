# CLAUDE.md — Ham Radio

Guidance for Claude Code sessions working in this repository.

## What this is

Ham Radio is a Claude Impact Lab (Birmingham AI) deliverable: a demo app where food pantries broadcast expiring surplus "signals" sideways across a synthetic partner network. One person (Ray, a pantry coordinator) posts a signal; a physical-compatibility filter notifies only orgs that can actually take it; a human claims and a human confirms; unclaimed signals escalate loudly with verified 211/CFBCA links. Read `README.md` for the full product story and `docs/prd.html` for the red-teamed PRD.

**We are presenting this to judges today. Bias every decision toward demo clarity and polish over feature breadth.**

## Hard guardrails (from the Impact Lab do-not-build list — never violate)

1. **No static directory** — availability data must stay self-declared, point-in-time, auto-expiring.
2. **No client data** — org-to-org only. Never add anything client-facing or any personal data.
3. **No rationing by algorithm** — the filter gates physical compatibility (storage, distance, hours, category) and must NEVER score need, rank recipients, or notify in waves. All matches are notified simultaneously; humans confirm both ends of every transfer.
4. **No synthetic-as-live** — the DEMO banner stays on every screen. Org names stay obviously fictional. Never add realistic-sounding Birmingham org names.
5. The verified links (211connectsalabama.org, feedingal.org, gracekleincommunity.com) in the escalation path and footer must be preserved.

## Stack & commands

Vite · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui (Radix). Package manager is **yarn** (v4, node-modules linker) — never npm.

```bash
yarn              # install
yarn dev          # dev server
yarn typecheck    # tsc --noEmit
yarn build        # single-file build → dist/index.html (vite-plugin-singlefile)
```

The production build MUST remain a single self-contained `dist/index.html` — that's how the demo ships. Don't add external runtime dependencies (CDNs, APIs) to the app; Google Fonts links in `index.html` are the one exception.

## Team lanes — critical

Five people + Claude Code are working this repo in parallel. **Your lane is defined in `team/<YOURNAME>.md` — read it first and stay inside your owned files.** Shared rules live in `team/README.md`. If your task seems to require editing a file another lane owns, stop and flag it instead of editing.

- `src/App.tsx` is shared turf: one-line component mounts only, nothing more.
- `src/engine.ts` is owned by Darrell's lane: request interface changes, don't make them.
- Work on a branch named `lane/<yourname>/<topic>`, keep PRs small, pull `main` before starting anything new.

## Code conventions

- TypeScript strict; no `any`. State transitions are pure functions in `src/engine.ts` returning new state.
- UI uses shadcn/ui components from `src/components/ui/` and Tailwind tokens from `src/index.css` (e.g. `text-freeze`, `bg-ok-soft`, `font-display`, `font-mono`). Don't hardcode hex colors in components; add tokens to `index.css` if needed.
- Fonts: Archivo (display), Atkinson Hyperlegible (body), IBM Plex Mono (data/labels). Match the existing ticket/chip/rail visual language.
- Both light and dark themes must stay legible — the `.dark` class is driven by `index.html`'s theme script.
- Demo time is the simulated demo clock (minutes since Monday 00:00), never `Date.now()`.

# Comms demo (Josh's lane)

Presenter tooling for texting a judge a real SMS about the signal on screen. Lives entirely in `src/comms/`; the only outside touch is a one-line mount in `App.tsx`.

## Design

- **Opt-in by construction.** Nothing sends automatically: a human picks the signal, enters the number, checks the consent box, presses send. This mirrors the product's own human-confirmation guardrail.
- **Every message is prefixed** `[HAM RADIO DEMO - synthetic data]` — the no-synthetic-as-live rule applies to comms too.
- **Keys are memory-only.** This is a static page on GitHub Pages; it cannot keep secrets. The presenter pastes their own key at demo time; it is never persisted or committed.

## Providers

| Provider | Status | Notes |
|---|---|---|
| Simulated | ✅ default | No network call; message renders in the on-screen outbox. Zero-risk demo mode. |
| Textbelt | ✅ wired | Free tier: key `textbelt` = 1 real SMS/day (US/Canada). Browser-callable (CORS OK). Good fallback. |
| Photon | 🔌 wired via relay | Photon has no browser-callable send endpoint — sending goes through its `spectrum-ts` SDK server-side. The adapter posts to our relay (`relay/` at repo root, Vercel free tier) which holds the project secret. Needs Josh's account + relay deploy: see `relay/README.md`. |

## Demo flow

1. Run the board demo; post/claim a signal.
2. Open "Presenter tools — SMS demo" below the board.
3. Simulated first (audience sees the exact message), then switch to a real provider and text the judge the same message.

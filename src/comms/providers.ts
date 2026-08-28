import type { SmsProvider } from "./types";

/**
 * Simulated provider — the default. Nothing leaves the browser; the "send"
 * lands in the on-screen outbox so the audience sees exactly what would go out.
 */
const simulated: SmsProvider = {
  id: "simulated",
  label: "Simulated (on-screen only)",
  needsKey: false,
  hint: "Safe default. No network call — the message appears in the outbox below.",
  async send() {
    return { ok: true, detail: "Simulated — rendered to outbox only" };
  },
};

/**
 * Textbelt — known-working free fallback: key "textbelt" sends 1 real SMS/day
 * (US/Canada). CORS-friendly, callable straight from the browser.
 * https://textbelt.com
 */
const textbelt: SmsProvider = {
  id: "textbelt",
  label: "Textbelt (free: 1 SMS/day)",
  needsKey: true,
  hint: 'Use key "textbelt" for the free daily message, or a purchased key.',
  async send({ to, body, key }) {
    try {
      const res = await fetch("https://textbelt.com/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: to, message: body, key }),
      });
      const data: { success?: boolean; error?: string; quotaRemaining?: number } = await res.json();
      return data.success
        ? { ok: true, detail: `Sent via Textbelt (quota remaining: ${data.quotaRemaining ?? "?"})` }
        : { ok: false, detail: data.error || `Textbelt refused (HTTP ${res.status})` };
    } catch (e) {
      return { ok: false, detail: `Network error: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
};

/**
 * Photon (photon.codes) — iMessage with automatic SMS/RCS fallback.
 * Photon has NO browser-callable send endpoint: sending goes through their
 * spectrum-ts SDK with a PROJECT_SECRET, which must never reach this page.
 * So this adapter calls OUR relay (see relay/ at the repo root), which holds
 * the secret server-side. Presenter supplies the relay URL + its demo token.
 */
const photon: SmsProvider = {
  id: "photon",
  label: "Photon (iMessage/SMS via relay)",
  needsKey: true,
  needsEndpoint: true,
  hint: "Deploy relay/ (holds the Photon project secret), then paste its URL and DEMO_TOKEN here. See relay/README.md.",
  async send({ to, body, key, endpoint }) {
    if (!endpoint?.trim()) {
      return { ok: false, detail: "Relay URL required — deploy relay/ first (relay/README.md)" };
    }
    try {
      const res = await fetch(endpoint.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, body, token: key }),
      });
      const data: { ok?: boolean; detail?: string } = await res.json().catch(() => ({}));
      return res.ok && data.ok
        ? { ok: true, detail: data.detail || "Sent via Photon relay" }
        : { ok: false, detail: data.detail || `Relay refused (HTTP ${res.status})` };
    } catch (e) {
      return { ok: false, detail: `Relay unreachable: ${e instanceof Error ? e.message : String(e)}` };
    }
  },
};

export const PROVIDERS: SmsProvider[] = [simulated, textbelt, photon];

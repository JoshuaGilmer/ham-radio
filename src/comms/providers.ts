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
 * Photon — TODO(josh): wire the real API once the free account exists.
 * Fill in endpoint + payload shape below; everything else (key handling,
 * consent gate, outbox, composer) already works around it.
 */
const photon: SmsProvider = {
  id: "photon",
  label: "Photon SMS (not wired yet)",
  needsKey: true,
  hint: "Adapter stub — see TODO in src/comms/providers.ts.",
  async send(_msg) {
    // TODO(josh): replace with the real call, shaped like:
    // const res = await fetch("https://<photon-endpoint>/send", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${_msg.key}` },
    //   body: JSON.stringify({ to: _msg.to, message: _msg.body }),
    // });
    // NOTE: if Photon's API doesn't allow browser CORS, route through a tiny
    // serverless function (Vercel/Cloudflare free tier) instead of calling direct.
    return { ok: false, detail: "Photon adapter not wired yet — use Simulated or Textbelt" };
  },
};

export const PROVIDERS: SmsProvider[] = [simulated, textbelt, photon];

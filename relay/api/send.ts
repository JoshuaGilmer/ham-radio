// Photon send relay — holds the Photon PROJECT_SECRET server-side so the
// static demo page never sees it. Deployed as a Vercel serverless function.
//
// Photon (photon.codes) has no browser-callable send endpoint: outbound
// messages go through their spectrum-ts SDK in a Node runtime. This function
// is that runtime.
//
// VERIFY(josh) after creating the Photon project: the SDK's docs center on
// agent (receive/reply) flows; the two lines marked VERIFY below follow the
// landing-page example (`spectrum.send("+1…", …)`) and may need adjusting
// against https://photon.codes/docs once you can actually run it.
import type { VercelRequest, VercelResponse } from "@vercel/node";

const DEMO_PREFIX = "[HAM RADIO DEMO";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOW_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, detail: "POST only" });

  const { to, body, token } = (req.body ?? {}) as { to?: string; body?: string; token?: string };

  if (!process.env.DEMO_TOKEN || token !== process.env.DEMO_TOKEN) {
    return res.status(401).json({ ok: false, detail: "Bad or missing demo token" });
  }
  if (typeof to !== "string" || typeof body !== "string" || !to.trim() || !body.trim()) {
    return res.status(400).json({ ok: false, detail: "Fields 'to' and 'body' are required" });
  }
  // Guardrail enforced server-side: this relay only sends clearly-labeled demo messages.
  if (!body.startsWith(DEMO_PREFIX)) {
    return res.status(400).json({ ok: false, detail: "Refusing message without the demo/synthetic prefix" });
  }

  try {
    const { Spectrum } = await import("spectrum-ts");
    // VERIFY(josh): provider import path per current spectrum-ts docs.
    const { imessage } = await import("spectrum-ts");
    const app = await Spectrum({
      projectId: process.env.PHOTON_PROJECT_ID!,
      projectSecret: process.env.PHOTON_PROJECT_SECRET!,
      providers: [imessage.config()],
    });
    // VERIFY(josh): send signature — landing page shows `spectrum.send("+123456789", …)`;
    // iMessage falls back to SMS/RCS automatically per Photon's docs.
    await (app as { send: (to: string, body: string) => Promise<unknown> }).send(to.trim(), body);
    return res.status(200).json({ ok: true, detail: "Sent via Photon (iMessage with SMS/RCS fallback)" });
  } catch (e) {
    return res.status(502).json({ ok: false, detail: `Photon send failed: ${e instanceof Error ? e.message : String(e)}` });
  }
}

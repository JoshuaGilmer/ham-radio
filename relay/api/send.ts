// Photon send relay — holds the Photon PROJECT_SECRET server-side so the
// static demo page never sees it. Deployed as a Vercel serverless function.
//
// Photon (photon.codes) has no browser-callable send endpoint: outbound
// messages go through its spectrum-ts SDK in a Node runtime. This function
// is that runtime, using the proactive-send path verified against the
// scaffolded project (spectrum-ts 12.8.0):
//   im.space.create(await im.user(to)) → space.send(body)
//
// Free-plan constraint: recipients must be registered as project users in the
// Photon dashboard before outreach, or sends fail with
// "Target not allowed for this project". Add the judge's number first.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Spectrum } from "spectrum-ts";
import { imessage as imessageProvider } from "@spectrum-ts/imessage";
import { imessage } from "spectrum-ts/providers/imessage";

const DEMO_PREFIX = "[HAM RADIO DEMO";

// Reuse the Spectrum connection across warm invocations.
let appPromise: ReturnType<typeof Spectrum> | null = null;
function getApp() {
  appPromise ??= Spectrum({
    projectId: process.env.PHOTON_PROJECT_ID!,
    projectSecret: process.env.PHOTON_PROJECT_SECRET!,
    providers: [imessageProvider.config()],
  });
  return appPromise;
}

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
  if (typeof to !== "string" || typeof body !== "string" || !/^\+\d{8,15}$/.test(to.trim()) || !body.trim()) {
    return res.status(400).json({ ok: false, detail: "Fields 'to' (E.164, e.g. +12055551234) and 'body' are required" });
  }
  // Guardrail enforced server-side: this relay only sends clearly-labeled demo messages.
  if (!body.startsWith(DEMO_PREFIX)) {
    return res.status(400).json({ ok: false, detail: "Refusing message without the demo/synthetic prefix" });
  }

  try {
    const app = await getApp();
    const im = imessage(app);
    const space = await im.space.create(await im.user(to.trim()));
    await space.send(body);
    return res.status(200).json({ ok: true, detail: "Sent via Photon (iMessage with SMS/RCS fallback)" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const detail = msg.includes("Target not allowed")
      ? "Recipient not registered as a project user — add their number in the Photon dashboard first (Free-plan shared lines require it)"
      : `Photon send failed: ${msg}`;
    return res.status(502).json({ ok: false, detail });
  }
}

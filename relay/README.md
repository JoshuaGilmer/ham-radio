# Photon send relay

A single Vercel serverless function that holds the Photon project secret and sends demo messages on behalf of the static demo page. Free tier is plenty.

**Why this exists:** Photon (photon.codes) sends messages through its `spectrum-ts` SDK in a Node runtime — there is no browser-callable send endpoint, and the `PROJECT_SECRET` must never ship in the static page. The page's Photon provider posts `{to, body, token}` here; this function does the real send.

## Setup (Josh — ~10 minutes)

1. **Photon account (human step):** sign up at https://app.photon.codes, create a project, and copy the **Project ID** and **Project Secret**. Check the free tier's message allowance while you're there.
2. **Deploy the relay:**
   ```bash
   cd relay
   npx vercel deploy --prod
   ```
3. **Set env vars** (Vercel dashboard → project → Settings → Environment Variables):
   - `PHOTON_PROJECT_ID` — from step 1
   - `PHOTON_PROJECT_SECRET` — from step 1
   - `DEMO_TOKEN` — any random string; this is what gets pasted into the demo panel
   - `ALLOW_ORIGIN` — `https://joshuagilmer.github.io` (CORS lockdown; `*` while testing)
4. **Verify the SDK calls:** the two `VERIFY(josh)` comments in `api/send.ts` mark the provider import and the send signature — written from Photon's public examples, unverified until run with real credentials. Adjust against https://photon.codes/docs if the first test errors.
5. **Demo:** in the app's Presenter tools panel choose **Photon**, paste the relay URL (`https://<deployment>.vercel.app/api/send`) and the `DEMO_TOKEN`, enter the judge's number, consent box, send.

## Guardrails baked in

- Rejects any message that doesn't start with the `[HAM RADIO DEMO` prefix — the relay physically cannot send an unlabeled message.
- Requires the `DEMO_TOKEN` on every request; secrets live only in Vercel env vars.
- CORS restricted to the demo origin once `ALLOW_ORIGIN` is set.

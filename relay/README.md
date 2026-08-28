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
4. **Add the judge as a project user.** Free-plan shared lines only send to numbers registered as project users — dashboard → ham-radio → Add users. Without this, sends fail with "Target not allowed for this project". (The verified send path is `im.space.create(await im.user(to))` → `space.send(body)`, spectrum-ts 12.8.0 — already wired in `api/send.ts`.)
5. **Demo:** in the app's Presenter tools panel choose **Photon**, paste the relay URL (`https://<deployment>.vercel.app/api/send`) and the `DEMO_TOKEN`, enter the judge's number, consent box, send. Note: recipients get the message from a shared-pool number, as iMessage where possible with SMS/RCS fallback.

A scaffolded Spectrum project also lives OUTSIDE this repo at `~/Sites/photon/ham-radio` (its `.env` holds the credentials — never commit it). Useful there: `npm start` runs the echo agent; `npm run send-test -- +1XXXXXXXXXX` fires a one-shot outbound demo message, which is the fastest way to sanity-check credentials and the allowlist.

## Guardrails baked in

- Rejects any message that doesn't start with the `[HAM RADIO DEMO` prefix — the relay physically cannot send an unlabeled message.
- Requires the `DEMO_TOKEN` on every request; secrets live only in Vercel env vars.
- CORS restricted to the demo origin once `ALLOW_ORIGIN` is set.

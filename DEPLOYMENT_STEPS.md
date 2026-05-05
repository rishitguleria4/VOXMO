# Clean 100% Accurate Deployment Guide (Voxmo)

Follow these exact steps to deploy to Vercel without hitting the PRO prompt, and to ensure your frontend properly connects to your backend without rendering a blank screen.

---

## 1. Deploy the Backend (Since you deleted it)

You need to recreate the backend project on Vercel.

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New... > Project**.
2. Import your GitHub repository.
3. In the "Configure Project" screen:
   - **Project Name:** `voxmo-backend`
   - **Root Directory:** Click **Edit** and select `backend`.
   - **Framework Preset:** `Other`
   - **Build Command:** Leave as default (or type `npm run build` if Vercel forces you).
   - **Install Command:** `npm install`
4. **Environment Variables:** Open the "Environment Variables" dropdown and copy-paste these exact values. **Do not create custom environments (like "Staging"), just paste them here:**
   - `DATABASE_URL` = `postgresql://...`
   - `DIRECT_URL` = `postgresql://...`
   - `TAVILY_API_KEY` = `tvly-dev-...`
   - `SUPABASE_API_SECRET` = `sb_secret_...`
   - `STRIPE_SECRET_KEY` = `sk_test_...`
   - `AI_GATEWAY_API_KEY` = `vck_...`
   *(Wait to add `FRONTEND_URL` until Step 2 is done).*
5. Click **Deploy**. Wait for it to finish and copy the URL (e.g., `https://voxmo-backend.vercel.app`).

---

## 2. Fix & Deploy the Frontend (`voxmo-web`)

Your current frontend is blank because Vercel doesn't know it outputs to `dist`. 
**Delete your current `voxmo-web` project in Vercel (Settings > Advanced > Delete) and start fresh:**

1. Go to your Vercel Dashboard and click **Add New... > Project**.
2. Import your GitHub repository again.
3. In the "Configure Project" screen:
   - **Project Name:** `voxmo-web`
   - **Root Directory:** Click **Edit** and select `frontend`.
4. **Build and Output Settings** (Vercel will auto-detect Vite!):
   - **Framework Preset:** `Vite` (Vercel should auto-select this. If not, select Vite).
   - **Build Command:** Leave blank or default (it will use `npm run build` or `vite build`).
   - **Output Directory:** Leave blank or default (it will use `dist`).
   - **Install Command:** Leave blank or default.
5. **Environment Variables:** Add these:
   - `VITE_SUPABASE_URL` = `https://ilekzlddytmxmveeysw.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_...`
   - `VITE_VAPI_PUBLIC_KEY` = `693fc13c-...`
   - `VITE_VAPI_ASSISTANT_ID` = `b3eb9374-...`
   - `VITE_BACKEND_URL` = Paste the URL you got from Step 1 (e.g., `https://voxmo-backend.vercel.app`)
6. Click **Deploy**.

---

## 3. Connect the Two

Now that both are live:
1. Go to your **backend** project on Vercel (`voxmo-backend`).
2. Go to **Settings > Environment Variables**.
3. Add a new variable:
   - Name: `FRONTEND_URL`
   - Value: `https://voxmo-web.vercel.app` (Or whatever your new frontend URL is).
   - Ensure all three boxes (Production, Preview, Development) are checked. Do not create a new environment.
4. Go to **Deployments** for the backend, click the three dots next to the latest deployment, and click **Redeploy**.

---

## 4. Final Step: Configure Stripe Webhook

To ensure users receive credits after a successful payment, you must connect Stripe to your backend.

1. Go to your [Stripe Webhooks Dashboard](https://dashboard.stripe.com/test/webhooks).
2. Click **Add an endpoint**.
3. **Endpoint URL:** Paste your backend URL followed by `/webhook/stripe`.
   *   Example: `https://voxmo.vercel.app/webhook/stripe`
4. Click **+ Select events** and search for/check: `checkout.session.completed`.
5. Click **Add endpoint**.
6. Under the "Signing secret" section, click **Reveal**. Copy the secret (it starts with `whsec_...`).
7. Go to your **Backend** project in Vercel -> Settings -> Environment Variables.
8. Add a new variable:
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: Paste the `whsec_...` secret you just copied.
9. Go to **Deployments** for the backend and click **Redeploy** to apply the change.

Your payments will now automatically sync credits to the database!

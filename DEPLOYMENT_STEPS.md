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
4. **Build and Output Settings** (THIS FIXES THE BLANK SCREEN):
   - **Framework Preset:** `Other`
   - **Build Command:** `bun run build.ts`
   - **Output Directory:** `dist` 
   - **Install Command:** `bun install`
5. **Environment Variables:** Add these:
   - `BUN_PUBLIC_SUPABASE_URL` = `https://ilekzlddytmxmvejeysw.supabase.co`
   - `BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_...`
   - `BUN_PUBLIC_VAPI_PUBLIC_KEY` = `693fc13c-...`
   - `BUN_PUBLIC_VAPI_ASSISTANT_ID` = `b3eb9374-...`
   - `BACKEND_URL` = Paste the URL you got from Step 1 (e.g., `https://voxmo-backend.vercel.app`)
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

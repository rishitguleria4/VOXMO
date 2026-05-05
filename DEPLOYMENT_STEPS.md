# Vercel Deployment Guide (Voxmo)

Your codebase is optimized for Vercel Serverless. Follow these exact steps to go live.

---

## 1. Deploy the Backend (Node.js API)

You will create a Vercel project specifically for the `backend` folder.

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New... > Project**.
2. Import your GitHub repository.
3. **Configure Project:**
   - **Project Name:** `voxmo-backend`
   - **Root Directory:** Click **Edit** and select the `backend` folder.
4. **Build and Output Settings:**
   - **Build Command:** `npx prisma generate` (Crucial for database client)
   - **Install Command:** `npm install` (Vercel will use Node.js)
5. **Environment Variables:** Add these from your `backend/.env`:
   - `DATABASE_URL`: (Use your Supabase connection string with `?pgbouncer=true`)
   - `DIRECT_URL`: (Use your direct Supabase connection string)
   - `TAVILY_API_KEY`: (Your Tavily search key)
   - `SUPABASE_API_SECRET`: (Your Supabase service role key)
   - `AI_GATEWAY_API_KEY`: (If using Vercel AI Gateway)
   - `STRIPE_SECRET_KEY`: (Your sk_test_... key)
   - `STRIPE_WEBHOOK_SECRET`: (Get this from Stripe Dashboard > Webhooks after deploying)
   - `FRONTEND_URL`: (Set this to your frontend URL after Step 2)
   - `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc. (All model keys)
6. **Deploy.** Copy the production URL (e.g., `https://voxmo-backend.vercel.app`).

---

## 2. Deploy the Frontend (React App)

Create a *second* Vercel project for the `frontend` folder.

1. [Vercel Dashboard](https://vercel.com/dashboard) > **Add New... > Project**.
2. Import the *same* GitHub repository.
3. **Configure Project:**
   - **Project Name:** `voxmo-web`
   - **Root Directory:** Select the `frontend` folder.
4. **Build and Output Settings:**
   - **Framework Preset:** Other
   - **Build Command:** `bun run build`
   - **Output Directory:** `dist`
   - **Install Command:** `bun install`
5. **Environment Variables:**
   - `BACKEND_URL`: Paste the backend URL from Step 1.
   - `BUN_PUBLIC_SUPABASE_URL`: (From your frontend `.env.local`)
   - `BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: (From your frontend `.env.local`)
6. **Deploy.** Copy the production URL (e.g., `https://voxmo.vercel.app`).

---

## 3. Post-Deployment Finalization

1. **Backend CORS:** Go to `voxmo-backend` > Settings > Environment Variables. Update `FRONTEND_URL` to your exact frontend URL.
2. **Stripe Webhook:**
   - Go to Stripe Dashboard > Developers > Webhooks.
   - Add endpoint: `https://voxmo-backend.vercel.app/webhook/stripe`.
   - Select event: `checkout.session.completed`.
   - Copy the "Signing secret" and add it as `STRIPE_WEBHOOK_SECRET` in your backend Vercel env vars.
3. **Database Setup:** 
   - Locally, in the `backend` folder, run: `bunx prisma db push`.
   - This ensures your Supabase tables are synced with the latest schema.

**You are now live!** Your app is running on Vercel's free tier with 24/7 uptime.

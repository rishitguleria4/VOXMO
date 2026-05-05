# VOXMO — Complete Architecture & Technical Deep Dive

> **Author:** Auto-generated project documentation
> **Last Updated:** May 6, 2026
> **Status:** Production (Vercel Deployed)

---

## 1. What is VOXMO?

VOXMO is an **AI-powered search platform** — think of it as your own Perplexity.ai clone. Users type a question, the backend searches the live web using Tavily, feeds those results into a powerful LLM (like Gemini, GPT-4, Claude, etc.), and streams back a rich, sourced answer in real-time. It also supports voice conversations via the Vapi SDK.

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                       │
│                                                          │
│  React 19 + Vite + TailwindCSS 4 + React Router 7       │
│  Supabase Auth (Google/GitHub OAuth)                     │
│  Vapi Web SDK (Voice)                                    │
│                                                          │
│  Deployed on: Vercel (Static/CDN)                        │
│  URL: https://voxmo-web.vercel.app                       │
└──────────────────┬───────────────────────────────────────┘
                   │  HTTPS API calls (fetch / axios)
                   │  JWT token in Authorization header
                   ▼
┌──────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                   │
│                                                          │
│  Express 5 + TypeScript + Vercel AI SDK                  │
│  Prisma 7 ORM (via pg adapter) → Supabase PostgreSQL    │
│  Tavily API (web search)                                 │
│  Stripe (payments/credits)                               │
│  Supabase Admin Client (JWT verification)                │
│                                                          │
│  Deployed on: Vercel Serverless Functions                │
│  URL: https://voxmo.vercel.app                           │
└──────────────────┬───────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌─────────┐ ┌───────┐ ┌────────────┐
   │Supabase │ │Tavily │ │Vercel AI   │
   │Postgres │ │Search │ │Gateway     │
   │  (DB)   │ │ API   │ │(10+ LLMs)  │
   └─────────┘ └───────┘ └────────────┘
```

---

## 3. Tech Stack — Every Choice Explained

### 3.1 Frontend

| Technology | What It Does | Why We Chose It | Pros | Cons |
|---|---|---|---|---|
| **React 19** | UI rendering library | Industry standard, massive ecosystem, concurrent features | Huge community, great DevTools, reusable components | Requires bundler setup, JSX learning curve |
| **Vite 8** | Build tool & dev server | Replaces Webpack — instant HMR, lightning builds | 10x faster than Webpack, native ESM, simple config | Newer ecosystem, some plugins still maturing |
| **TailwindCSS 4** | Utility-first CSS framework | Rapid styling without writing CSS files | Consistent design system, tiny production CSS, great DX | HTML can look cluttered, learning utility names |
| **React Router 7** | Client-side routing | SPA navigation (`/`, `/auth`, `/conversation/:id`, `/pricing`) | Declarative routes, nested layouts, URL params | Breaking API changes between major versions |
| **Supabase SSR** | Auth client for browser | Handles OAuth flow (Google/GitHub login) | Drop-in auth, handles tokens/sessions automatically | Tied to Supabase ecosystem |
| **Vapi Web SDK** | Voice AI conversations | Real-time voice-to-voice via browser microphone | Low-latency, easy integration, built-in STT/TTS | Requires separate Vapi account and credits |
| **Axios** | HTTP client | Makes API calls to backend | Clean API, interceptors, automatic JSON parsing | Slightly larger than native `fetch` |
| **Lucide React** | Icon library | Beautiful, consistent SVG icons | Tree-shakeable, MIT licensed, React-native components | Limited to their icon set |
| **Radix UI** | Headless UI primitives | Accessible select/label components | WAI-ARIA compliant, unstyled (full control) | Requires manual styling |

### 3.2 Backend

| Technology | What It Does | Why We Chose It | Pros | Cons |
|---|---|---|---|---|
| **Express 5** | HTTP server framework | Routes API requests | Mature, huge middleware ecosystem, simple | No built-in TypeScript, callback-style API |
| **Prisma 7** | Database ORM | Type-safe database queries | Auto-generated types, migrations, visual Studio | Learning curve for config, binary engine size |
| **pg (node-postgres)** | PostgreSQL driver | Direct connection pool to Supabase DB | Battle-tested, connection pooling, SSL support | Low-level, requires manual query building without ORM |
| **@prisma/adapter-pg** | Prisma ↔ pg bridge | Lets Prisma use our pg Pool instead of its own connection | Required for serverless (Vercel), connection reuse | Extra dependency, Prisma 7 specific |
| **Vercel AI SDK** | Multi-provider LLM streaming | Single API for 10+ AI providers via Gateway | Provider-agnostic, built-in streaming, tool support | Tied to Vercel Gateway for multi-provider routing |
| **Tavily** | Web search API | Fetches live web results for each query | Fast, relevant results, structured JSON output | Paid API (free tier: 1000 searches/month) |
| **Stripe** | Payment processing | Credit purchase system | Industry standard, webhooks, test mode | Complex webhook setup, PCI compliance considerations |
| **Supabase Admin** | JWT verification | Validates user tokens server-side | Secure, uses service role key | Requires `SUPABASE_API_SECRET` env var |
| **express-rate-limit** | Rate limiting | Prevents API abuse (100 req/15min) | Simple middleware, configurable | In-memory store (resets on serverless cold starts) |
| **cors** | Cross-origin security | Allows frontend domain to call backend | Essential for separate frontend/backend domains | Must be configured correctly or nothing works |

### 3.3 Infrastructure

| Technology | What It Does | Why We Chose It |
|---|---|---|
| **Vercel (Frontend)** | Static CDN hosting for React app | Free tier, automatic deploys from GitHub, global CDN |
| **Vercel Serverless (Backend)** | Runs Express as serverless functions | Free tier, auto-scaling, zero server management |
| **Supabase (Database)** | Managed PostgreSQL + Auth | Free tier, built-in OAuth providers, connection pooling via PgBouncer |
| **GitHub** | Source control + CI/CD trigger | Vercel auto-deploys on every `git push` |

---

## 4. Deep Dive: Prisma + Supabase

### 4.1 What is Prisma?

Prisma is a **next-generation ORM (Object-Relational Mapper)** for Node.js/TypeScript. Instead of writing raw SQL queries, you define your database schema in a `.prisma` file and Prisma generates a fully type-safe client.

**Without Prisma (raw SQL):**
```typescript
const result = await pool.query(
  'SELECT * FROM "User" WHERE id = $1', [userId]
);
const user = result.rows[0]; // ← No type safety, could be anything
```

**With Prisma:**
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId }
}); // ← TypeScript knows user has .id, .email, .credits, etc.
```

### 4.2 Why Prisma is Excellent for VOXMO

1. **Type Safety** — Every query is fully typed. If you write `user.credts` (typo), TypeScript catches it at compile time, not in production.

2. **Schema as Source of Truth** — Our [schema.prisma](file:///home/rishitguleria/VOXMO/backend/prisma/schema.prisma) defines 5 models: `User`, `Conversation`, `Message`, `Payment`, and two enums. Prisma auto-generates migrations and the client from this single file.

3. **Relation Handling** — Prisma makes joins trivial:
   ```typescript
   // Get conversation WITH all its messages in one query
   const convo = await prisma.conversation.findFirst({
     where: { id: conversationId },
     include: { messages: { orderBy: { createdAt: 'asc' } } }
   });
   ```

4. **Transaction Support** — Our Stripe webhook uses `prisma.$transaction()` to atomically create a Payment record AND increment user credits. If either fails, both roll back.

### 4.3 How Prisma Connects to Supabase

This is where it gets interesting. Supabase provides a **managed PostgreSQL database**, but there are two ways to connect:

| Connection Type | Port | URL Env Var | Purpose |
|---|---|---|---|
| **Transaction/Pooler** | `6543` | `DATABASE_URL` | Goes through PgBouncer connection pooler. Best for serverless (short-lived connections) |
| **Direct/Session** | `5432` | `DIRECT_URL` | Direct TCP connection to Postgres. Required for migrations |

**Our setup in [db.ts](file:///home/rishitguleria/VOXMO/backend/db.ts):**
```typescript
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
```

**Why the `pg` adapter?** In Prisma 7 on Vercel Serverless, you can't use Prisma's built-in connection engine because serverless functions are short-lived. The `@prisma/adapter-pg` lets Prisma delegate connection management to the battle-tested `pg` library, which handles connection pooling properly for serverless environments.

**And in [prisma.config.ts](file:///home/rishitguleria/VOXMO/backend/prisma.config.ts):**
```typescript
export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
```
This tells the Prisma CLI (used for `prisma generate` and `prisma migrate`) which URL to use. It prefers `DIRECT_URL` (port 5432) because migrations need a direct connection, not a pooled one.

### 4.4 The Prisma 7 Migration (What Changed)

In **Prisma 5/6**, you put `url = env("DATABASE_URL")` directly in `schema.prisma`. In **Prisma 7**, this was moved to `prisma.config.ts`. When we initially tried to add `url` back into the schema (thinking it was needed for Vercel), Prisma 7 threw an error:

```
The datasource property `url` is no longer supported in schema files.
Move connection URLs to `prisma.config.ts`.
```

We reverted this change because the config file already handled it correctly.

---

## 5. Data Flow: What Happens When You Search

```
User types "What is quantum computing?" and clicks Search
    │
    ▼
[Frontend] useSearch.ts sends POST to /perplexity_ask
    │  Headers: { Authorization: "Bearer <supabase_jwt>" }
    │  Body: { query: "What is quantum computing?", model: "gemini-2.5-flash" }
    │
    ▼
[Backend] Express receives request
    │
    ├─► Middleware verifies JWT via Supabase Admin client
    │   └─► Upserts user in Prisma DB (creates if first login)
    │
    ├─► Checks user.credits > 0 (returns 403 if not)
    │
    ├─► Deducts 1 credit: prisma.user.update({ credits: { decrement: 1 } })
    │
    ├─► Creates Conversation + User Message in DB
    │
    ├─► Tavily web search (returns top 5-10 web results)
    │
    ├─► Builds prompt: system prompt + web results + user query
    │
    ├─► streamText() via Vercel AI SDK → chosen LLM
    │   └─► Streams response chunks back to browser in real-time
    │
    ├─► Saves Assistant message + sources to DB
    │
    └─► Sends <SOURCES> block at end of stream
         │
         ▼
[Frontend] useSearch.ts parses stream
    ├─► Renders markdown answer in real-time
    ├─► Extracts sources from <SOURCES> block
    ├─► Fetches follow-up questions (separate API call)
    └─► Refreshes credits + conversation list in sidebar
```

---

## 6. Authentication Flow

```
User clicks "Continue with Google"
    │
    ▼
[Auth.tsx] supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/" }
})
    │
    ▼
Browser redirects to Google OAuth consent screen
    │
    ▼
Google authenticates user, redirects back to:
  https://voxmo-web.vercel.app/?code=abc123...
    │
    ▼
[Supabase Client] Exchanges code for JWT session token
    │
    ▼
[AuthContext.ts] onAuthStateChange fires
    ├─► Sets user state
    ├─► Sets JWT token
    └─► Triggers data fetching (credits, conversations, usage)
         │
         ▼
[Backend] Every API call includes JWT in Authorization header
    └─► Middleware validates JWT, upserts user in DB, attaches userId to request
```

> [!IMPORTANT]
> **Supabase URL Configuration is critical.** If your Vercel URL isn't whitelisted in Supabase → Authentication → URL Configuration → Redirect URLs, Supabase will redirect users back to `localhost` after OAuth, breaking the entire login flow on production.

---

## 7. Every Bug We Fixed & Why It Happened

### Bug 1: Blank White Screen on Vercel

| Detail | Value |
|---|---|
| **File** | [frontend.tsx](file:///home/rishitguleria/VOXMO/frontend/src/frontend.tsx) |
| **Symptom** | `voxmo-web.vercel.app` showed a completely blank page |
| **Root Cause** | The React mount code used Bun's HMR API: `(import.meta.hot.data.root ??= createRoot(elem)).render(app)`. In production builds, `import.meta.hot` is `undefined`, causing a crash before React could even render. |
| **Fix** | Replaced with standard React 18 mounting: `createRoot(elem).render(<StrictMode><App /></StrictMode>)` |
| **Why It Existed** | Project was originally scaffolded with Bun's React template, which uses Bun-specific HMR APIs that don't exist in Vite production builds. |

---

### Bug 2: Environment Variables Not Working in Production

| Detail | Value |
|---|---|
| **Files** | [config.ts](file:///home/rishitguleria/VOXMO/frontend/src/lib/config.ts), [vapi.ts](file:///home/rishitguleria/VOXMO/frontend/src/lib/vapi.ts), [client.ts](file:///home/rishitguleria/VOXMO/frontend/src/lib/supabase/client.ts), [useVoiceAssistant.ts](file:///home/rishitguleria/VOXMO/frontend/src/lib/useVoiceAssistant.ts) |
| **Symptom** | Frontend defaulted to `localhost:3002` for all API calls |
| **Root Cause** | Code used `process.env.BUN_PUBLIC_*` — a Bun-specific pattern. Vite only processes `import.meta.env.VITE_*` variables. `process.env` is not replaced during Vite's build, so all values were `undefined`. |
| **Fix** | Changed all `process.env.BUN_PUBLIC_*` → `import.meta.env.VITE_*` and renamed env vars from `BUN_PUBLIC_` prefix to `VITE_` prefix. |
| **Why It Existed** | The project was migrated from Bun's bundler to Vite, but the environment variable access patterns were never updated. |

---

### Bug 3: OAuth Redirect to Localhost

| Detail | Value |
|---|---|
| **File** | [Auth.tsx](file:///home/rishitguleria/VOXMO/frontend/src/pages/Auth.tsx) |
| **Symptom** | After Google login, user was sent back to `localhost:3000` instead of Vercel |
| **Root Cause** | Two issues: (1) `signInWithOAuth()` had no `redirectTo` option, so Supabase used its default Site URL (`localhost:3000`). (2) The Vercel URL wasn't added to Supabase's allowed Redirect URLs list. |
| **Fix** | Added `options: { redirectTo: window.location.origin + "/" }` so the redirect is always dynamic. Added Vercel URL to Supabase Redirect URLs. |

---

### Bug 4: CORS Blocking All API Calls

| Detail | Value |
|---|---|
| **File** | [index.ts](file:///home/rishitguleria/VOXMO/backend/index.ts) (line 199-211) |
| **Symptom** | "Something went wrong" on every search; browser console showed CORS errors |
| **Root Cause** | If `FRONTEND_URL` was set with a trailing slash (`https://voxmo-web.vercel.app/`), CORS comparison failed because the browser Origin header is always without a trailing slash. `"https://voxmo-web.vercel.app" !== "https://voxmo-web.vercel.app/"` |
| **Fix** | Added `.replace(/\/$/, "")` to strip any trailing slash from the env var before passing it to the CORS middleware. |

---

### Bug 5: Wrong Backend URL Compiled Into Frontend

| Detail | Value |
|---|---|
| **Symptom** | Frontend sent API calls to an internal Vercel preview URL instead of the production backend |
| **Root Cause** | `VITE_BACKEND_URL` in Vercel was set to a preview deployment URL (with double slashes), not the production URL `https://voxmo.vercel.app`. Because Vite bakes env vars into the JS at build time, the wrong URL was permanently embedded in the bundle. |
| **Fix** | User needed to update the Vercel Environment Variable to the correct production URL and **redeploy** (changing a var alone doesn't update the already-built bundle). |

---

### Bug 6: Prisma 7 Schema Validation Error

| Detail | Value |
|---|---|
| **File** | [schema.prisma](file:///home/rishitguleria/VOXMO/backend/prisma/schema.prisma) |
| **Symptom** | `npx prisma generate` failed with "The datasource property `url` is no longer supported" |
| **Root Cause** | We added `url = env("DATABASE_URL")` to schema.prisma, but Prisma 7 moved this to `prisma.config.ts`. The schema only needs `provider = "postgresql"`. |
| **Fix** | Removed `url` and `directUrl` from schema.prisma. The connection URL was already correctly configured in `prisma.config.ts`. |

---

### Bug 7: Bun Config File Conflicts

| Detail | Value |
|---|---|
| **Files** | `bun.lock`, `bunfig.toml`, `bun-env.d.ts` (all deleted) |
| **Symptom** | Potential install/build conflicts on Vercel which uses npm |
| **Root Cause** | When the project migrated from Bun to Vite/npm, the old Bun lockfile and config files were left behind. Vercel might detect these and try to use Bun. |
| **Fix** | Deleted all three files. Also deleted `cloudflared-linux-amd64.deb` (19MB binary that had no business being in the repo). |

---

## 8. Key Environment Variables Reference

### Backend (Vercel: `voxmo`)

| Variable | Purpose | Where It's Used |
|---|---|---|
| `DATABASE_URL` | Supabase Postgres via PgBouncer (port 6543) | `db.ts` → pg Pool → Prisma adapter |
| `DIRECT_URL` | Supabase Postgres direct (port 5432) | `prisma.config.ts` → migrations only |
| `TAVILY_API_KEY` | Web search API key | `index.ts` line 13 |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key (routes to 10+ LLMs) | Used automatically by `ai` package |
| `SUPABASE_API_SECRET` | Service role key for JWT validation | `client.ts` → Supabase Admin |
| `STRIPE_SECRET_KEY` | Stripe payment processing | `index.ts` line 14 |
| `STRIPE_WEBHOOK_SECRET` | Validates Stripe webhook signatures | `index.ts` line 145 |
| `FRONTEND_URL` | Allowed CORS origin | `index.ts` line 199 |

### Frontend (Vercel: `voxmo-web`)

| Variable | Purpose | Where It's Used |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | `supabase/client.ts` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key | `supabase/client.ts` |
| `VITE_VAPI_PUBLIC_KEY` | Vapi voice SDK public key | `vapi.ts` |
| `VITE_VAPI_ASSISTANT_ID` | Vapi assistant identifier | `useVoiceAssistant.ts` |
| `VITE_BACKEND_URL` | Backend API base URL | `config.ts` |

> [!CAUTION]
> All `VITE_` variables are **publicly visible** in the browser's JavaScript bundle. This is by design — they contain only publishable keys. **Never** put secret keys (like `STRIPE_SECRET_KEY`) in a `VITE_` variable.

---

## 9. File Structure Overview

```
VOXMO/
├── backend/
│   ├── index.ts              ← Main Express server (all API routes)
│   ├── db.ts                 ← Prisma client initialization with pg adapter
│   ├── client.ts             ← Supabase admin client for JWT verification
│   ├── middleware.ts          ← Auth middleware (verify JWT, upsert user)
│   ├── prompts.ts            ← System prompts for each model tier
│   ├── prisma.config.ts      ← Prisma 7 config (datasource URL)
│   ├── prisma/schema.prisma  ← Database schema (5 models, 2 enums)
│   ├── vercel.json           ← Tells Vercel to run index.ts as serverless
│   ├── package.json          ← Dependencies
│   └── .env                  ← Local environment variables
│
├── frontend/
│   ├── index.html            ← Entry HTML (loads frontend.tsx)
│   ├── vite.config.ts        ← Vite build configuration
│   ├── src/
│   │   ├── frontend.tsx      ← React mount point
│   │   ├── App.tsx           ← Router + layout structure
│   │   ├── pages/
│   │   │   ├── Auth.tsx      ← Login page (Google/GitHub OAuth)
│   │   │   ├── Search.tsx    ← Main search interface
│   │   │   ├── Conversation.tsx ← View past conversation
│   │   │   ├── Pricing.tsx   ← Credit purchase page
│   │   │   ├── Success.tsx   ← Payment success redirect
│   │   │   └── Cancel.tsx    ← Payment cancel redirect
│   │   ├── lib/
│   │   │   ├── config.ts     ← BACKEND_URL from env
│   │   │   ├── AuthContext.ts ← Global auth state (user, JWT, credits)
│   │   │   ├── useSearch.ts  ← Search hook (streaming fetch)
│   │   │   ├── useVoiceAssistant.ts ← Vapi voice integration
│   │   │   ├── vapi.ts       ← Vapi SDK initialization
│   │   │   └── supabase/
│   │   │       ├── client.ts ← Browser Supabase client
│   │   │       └── server.ts ← SSR Supabase client
│   │   └── components/       ← UI components (AppLayout, Sidebar, Toast, etc.)
│   └── .env.local            ← Local environment variables
│
├── DEPLOYMENT_STEPS.md       ← Step-by-step Vercel deployment guide
└── README.md                 ← Project overview
```

---

## 10. The Bun → Vite Migration: Why We Did It

The project was **originally built with Bun** as both the runtime and bundler. While Bun is excellent for local development (fast installs, built-in TypeScript), it caused critical issues for Vercel deployment:

| Aspect | Bun (Before) | Vite/npm (After) |
|---|---|---|
| **Env Vars** | `process.env.BUN_PUBLIC_*` | `import.meta.env.VITE_*` |
| **HMR** | `import.meta.hot.data.root` (Bun-specific) | Standard React `createRoot()` |
| **Bundler** | Bun's built-in bundler | Vite (Rollup-based) |
| **Package Manager** | `bun install` → `bun.lock` | `npm install` → `package-lock.json` |
| **Vercel Compatibility** | ❌ Bun runtime not available | ✅ Node.js + npm natively supported |
| **Production Builds** | Fragile on CI/CD | Stable, well-documented |

**Bottom line:** Bun is great for local dev, but Vercel's build environment runs Node.js + npm. Every Bun-specific pattern silently broke in production.

---

*This document covers the complete VOXMO architecture, every technology decision with its tradeoffs, a deep dive into Prisma + Supabase integration, and a forensic analysis of every deployment bug we encountered and fixed.*

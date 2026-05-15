# 🔍 Voxmo — AI-Powered Search Engine

**Live Demo:** [https://voxmo.rishitguleria.me](https://voxmo-web.vercel.app)

> [!WARNING]
> **Stripe Webhook (Sandbox Mode):** The payment system is currently in Stripe Test Mode. For security and to prevent credit abuse with dummy cards, the webhook that syncs credits is intentionally disabled in this environment. You can test the checkout flow using Stripe's test cards, but **no real charges will occur, and no credits will be added to your account.** All search, voice, and AI features are otherwise fully functional.

**Voxmo** is a full-stack, AI-powered search engine that delivers real-time, cited answers by combining web search with large language models. Think of it as your own self-hosted Perplexity AI — with multi-model support, streaming responses, conversation history, and a credit-based payment system.

---
> [BUGS]
**CLAUDE , GPT MODELS AND SEND BUTTON HAVE SOME BUGS ( USE ENTER TO SEND MESSAGES AND USE OTHER MODELS TO TEST OUT )**
## ✨ Features

### Core
- **AI-Powered Search** — Ask any question and get a comprehensive, streamed answer synthesized from real-time web results.
- **Voice Assistant** — Integrated Vapi AI Voice SDK for a low-latency, conversational experience.
- **Multi-Model Support** — Choose from 10+ AI models across 7 providers (Gemini, GPT-4, Claude, Sonar, etc.).
- **Real-Time Web Search** — Powered by Tavily's advanced search API with source citations.
- **Streaming Responses** — Token-by-token streaming for instant feedback.
- **Source Citations** — Every answer includes clickable source cards with favicons.

### Conversations
- **Conversation History** — All searches are saved and accessible from the sidebar.
- **Continue Conversations** — Pick up any old conversation and ask follow-up questions with full context.
- **Follow-Up Questions** — AI-generated related questions after every answer.

### UX
- **Dual Theme System** — Polished light and dark modes with glassmorphism effects.
- **Responsive Sidebar** — Collapsible sidebar with credit bar, recent conversations, and theme toggle.
- **File & Image Upload** — Attach images and documents to your searches for multimodal queries.

### Payments & Credits
- **Credit System** — Each search costs 1 credit.
- **Stripe Integration** — Secure checkout for purchasing credit packs.
- **Webhook Verification** — Idempotent payment processing with duplicate protection.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router 7, **Vite 8**, TailwindCSS 4 |
| **Backend** | Express 5, **Node.js (Vercel Serverless)** |
| **Database** | PostgreSQL via [Supabase](https://supabase.com) |
| **ORM** | **Prisma 7** with `@prisma/adapter-pg` |
| **Auth** | Supabase Auth (Google + GitHub OAuth) |
| **Search** | [Tavily](https://tavily.com) Web Search API |
| **Voice** | [Vapi](https://vapi.ai) Voice SDK |
| **AI SDK** | Vercel AI SDK (routes to Google, OpenAI, Anthropic, etc.) |
| **Payments** | [Stripe](https://stripe.com) Checkout + Webhooks |

---

## 📁 Project Structure

For a deep dive into the project architecture and design decisions, see:
👉 **[ARCHITECTURE.md](./ARCHITECTURE.md)**

```
voxmo/
├── backend/
│   ├── index.ts              # Express server, all API routes
│   ├── db.ts                 # Prisma client initialization (pg adapter)
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── prisma.config.ts      # Prisma 7 config
│   ├── vercel.json           # Vercel deployment config
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── frontend.tsx      # React root mount
│   │   ├── App.tsx           # Router + providers
│   │   ├── pages/            # Search, Conversation, Auth, Pricing, etc.
│   │   ├── components/       # SearchInput, AnswerCard, Sidebar, etc.
│   │   └── lib/              # AuthContext, useSearch, Supabase clients
│   ├── vite.config.ts        # Vite build config
│   └── package.json
│
├── DEPLOYMENT_STEPS.md       # Step-by-step Vercel guide
├── ARCHITECTURE.md           # Deep technical analysis
└── README.md
```

---

## 🚀 Deployment

Voxmo is optimized for deployment on **Vercel**.

Follow the detailed step-by-step guide here:
👉 **[DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md)**

### Quick Env Reference (Frontend)
Ensure these are prefixed with `VITE_`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_BACKEND_URL`
- `VITE_VAPI_PUBLIC_KEY`
- `VITE_VAPI_ASSISTANT_ID`

### Quick Env Reference (Backend)
- `DATABASE_URL` (Pooler)
- `DIRECT_URL` (Direct)
- `TAVILY_API_KEY`
- `SUPABASE_API_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL` (Allowed CORS origin)

---

## 📄 License

This project is private and not licensed for redistribution.

---

## 🙏 Acknowledgments

- [Perplexity AI](https://perplexity.ai) — Inspiration for the product concept
- [Vercel AI SDK](https://sdk.vercel.ai) — Unified interface for AI providers
- [Tavily](https://tavily.com) — Real-time web search API
- [Supabase](https://supabase.com) — Auth and PostgreSQL hosting
- [Stripe](https://stripe.com) — Payment processing
- [Vapi](https://vapi.ai) — Voice AI platform

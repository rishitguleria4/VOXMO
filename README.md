# 🔍 Voxmo — AI-Powered Search Engine

**Voxmo** is a full-stack, AI-powered search engine that delivers real-time, cited answers by combining web search with large language models. Think of it as your own self-hosted Perplexity AI — with multi-model support, streaming responses, conversation history, and a credit-based payment system.

---

## ✨ Features

### Core
- **AI-Powered Search** — Ask any question and get a comprehensive, streamed answer synthesized from real-time web results
- **Multi-Model Support** — Choose from 10+ AI models across 7 providers:
  | Provider | Models |
  |----------|--------|
  | Google | Gemini 2.5 Flash, Gemini 2.5 Pro |
  | OpenAI | GPT-4o, GPT-4o Mini |
  | Anthropic | Claude 3.5 Sonnet, Claude 3.5 Haiku |
  | Perplexity | Sonar Pro |
  | Groq | Llama 3.1 8B |
  | Mistral | Mistral Small |
  | xAI | Grok 3 |
- **Real-Time Web Search** — Powered by Tavily's advanced search API with source citations
- **Streaming Responses** — Token-by-token streaming for instant feedback
- **Source Citations** — Every answer includes clickable source cards with favicons

### Conversations
- **Conversation History** — All searches are saved and accessible from the sidebar
- **Continue Conversations** — Pick up any old conversation and ask follow-up questions with full context
- **Delete Conversations** — Remove any conversation with a hover-to-reveal trash button
- **Follow-Up Questions** — AI-generated related questions after every answer

### UX
- **Dual Theme System** — Polished light and dark modes with glassmorphism effects, persisted to localStorage
- **File & Image Upload** — Attach images and documents to your searches for multimodal queries
- **Auto-Expanding Input** — Textarea grows as you type, supporting multi-line queries
- **Keyboard Shortcuts** — `Ctrl+K` to focus search, `Enter` to send, `Shift+Enter` for new line
- **Responsive Sidebar** — Collapsible sidebar with credit bar, recent conversations, and theme toggle
- **Loading Skeleton** — Smooth animated placeholders while results stream in

### Payments & Credits
- **Credit System** — Each search costs 1 credit (50 free on signup)
- **Stripe Integration** — Secure checkout for purchasing credit packs (100 / 500 / 2000 credits)
- **Webhook Verification** — Idempotent payment processing with duplicate protection
- **Optimistic UI** — Credits deduct instantly on the client, confirmed by the server

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | [Bun](https://bun.sh) |
| **Frontend** | React 19, React Router 7, TailwindCSS 4 |
| **Backend** | Express 5, Vercel AI SDK |
| **Database** | PostgreSQL via [Supabase](https://supabase.com) |
| **ORM** | Prisma 7 with `@prisma/adapter-pg` |
| **Auth** | Supabase Auth (Google + GitHub OAuth) |
| **Search** | [Tavily](https://tavily.com) Web Search API |
| **AI Gateway** | Vercel AI Gateway (routes to Google, OpenAI, Anthropic, etc.) |
| **Payments** | [Stripe](https://stripe.com) Checkout + Webhooks |
| **Styling** | TailwindCSS 4 + `@tailwindcss/typography` + custom glassmorphism |
| **Icons** | [Lucide React](https://lucide.dev) |

---

## 📁 Project Structure

```
voxmo/
├── backend/
│   ├── index.ts              # Express server, all API routes
│   ├── db.ts                 # Prisma client initialization
│   ├── middleware.ts         # Supabase JWT auth middleware
│   ├── client.ts             # Supabase admin client
│   ├── prompts.ts            # System prompts & prompt templates
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── prisma.config.ts      # Prisma config with .env loading
│   ├── generated/prisma/     # Generated Prisma client
│   ├── package.json
│   └── .env                  # Backend secrets (not committed)
│
├── frontend/
│   ├── src/
│   │   ├── index.ts          # Bun HTTP server entry
│   │   ├── index.html        # HTML shell
│   │   ├── frontend.tsx      # React root mount
│   │   ├── App.tsx           # Router + providers
│   │   │
│   │   ├── pages/
│   │   │   ├── Search.tsx        # Main search page (home)
│   │   │   ├── Conversation.tsx  # View & continue past conversations
│   │   │   ├── Auth.tsx          # Login page
│   │   │   ├── Dashboard.tsx     # Usage stats
│   │   │   ├── Pricing.tsx       # Credit purchase plans
│   │   │   ├── Success.tsx       # Post-payment confirmation
│   │   │   └── Cancel.tsx        # Payment cancelled
│   │   │
│   │   ├── components/
│   │   │   ├── SearchInput.tsx       # Main search textarea with file upload
│   │   │   ├── AnswerCard.tsx        # Streamed answer with copy/share
│   │   │   ├── SourceCard.tsx        # Clickable source citation card
│   │   │   ├── FollowUpChips.tsx     # AI-generated follow-up questions
│   │   │   ├── MarkdownRenderer.tsx  # Lightweight markdown-to-HTML
│   │   │   ├── LoadingSkeleton.tsx   # Animated loading placeholder
│   │   │   ├── ModelSelector.tsx     # Model dropdown + hook
│   │   │   ├── Sidebar.tsx           # Nav sidebar with conversations
│   │   │   ├── AppLayout.tsx         # Authenticated layout wrapper
│   │   │   ├── CreditGuard.tsx       # Blocks search when credits = 0
│   │   │   └── Toast.tsx             # Toast notification system
│   │   │
│   │   └── lib/
│   │       ├── AuthContext.ts    # Auth state, credits, conversations
│   │       ├── useSearch.ts      # Search hook with streaming
│   │       ├── useTheme.tsx      # Theme toggle (light/dark)
│   │       ├── SidebarContext.ts # Sidebar collapse state
│   │       ├── config.ts         # Backend URL config
│   │       └── supabase/
│   │           └── client.ts     # Supabase browser client
│   │
│   ├── styles/
│   │   └── globals.css       # TailwindCSS config + custom tokens
│   ├── package.json
│   └── .env                  # Frontend public env vars (not committed)
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.1+
- [Supabase](https://supabase.com) project (free tier works)
- [Tavily](https://tavily.com) API key
- [Stripe](https://stripe.com) account
- AI provider API key (at minimum, a Google Generative AI key)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/voxmo.git
cd voxmo
```

### 2. Set up the backend

```bash
cd backend
bun install
```

Create a `.env` file:

```env
# Database (from Supabase → Settings → Database)
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxxxx:password@aws-0-region.supabase.com:5432/postgres

# AI Providers
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
AI_GATEWAY_API_KEY=your-vercel-ai-gateway-key  # Optional, for multi-provider routing

# Web Search
TAVILY_API_KEY=tvly-...

# Auth (Supabase → Settings → API → service_role key)
SUPABASE_API_SECRET=eyJ...

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe CLI or Dashboard

# Server
PORT=3002
```

Push the database schema:

```bash
npx prisma db push
npx prisma generate
```

Start the backend:

```bash
bun index.ts
# or for hot-reload:
bun --hot index.ts
```

### 3. Set up the frontend

```bash
cd ../frontend
bun install
```

Create a `.env` file:

```env
# Supabase (from Supabase → Settings → API)
BUN_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...

# Backend URL (for production, change to your deployed URL)
BUN_PUBLIC_BACKEND_URL=http://localhost:3002
```

Start the frontend:

```bash
bun dev
```

### 4. Open the app

Navigate to [http://localhost:3000](http://localhost:3000) and sign in with Google or GitHub.

---

## 🔌 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/models` | List available AI models |

### Authenticated (requires `Authorization: Bearer <jwt>`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/credits` | Get current credit balance |
| `GET` | `/usage` | Get usage stats |
| `GET` | `/conversations` | List all conversations (newest first) |
| `GET` | `/conversation/:id` | Get conversation with messages |
| `DELETE` | `/conversation/:id` | Delete a conversation |
| `POST` | `/perplexity_ask` | Run a new search (creates conversation) |
| `POST` | `/conversation/:id/continue` | Continue an existing conversation |
| `POST` | `/perplexity_follow_up_questions` | Generate follow-up questions |
| `POST` | `/create-checkout-session` | Create Stripe checkout session |
| `POST` | `/verify-payment` | Verify payment and add credits |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/webhook/stripe` | Stripe payment webhook |

---

## 🗄️ Database Schema

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│     User     │     │  Conversation    │     │   Message     │
├──────────────┤     ├──────────────────┤     ├──────────────┤
│ id           │◄────│ userId           │     │ id           │
│ email        │     │ id               │◄────│ conversationId│
│ provider     │     │ title            │     │ content      │
│ name         │     │ slug             │     │ role         │
│ supabaseId   │     │ createdAt        │     │ sources (JSON)│
│ credits      │     │                  │     │ createdAt    │
└──────────────┘     └──────────────────┘     └──────────────┘

┌──────────────┐
│   Payment    │
├──────────────┤
│ id           │
│ sessionId    │  (unique — prevents duplicate processing)
│ userId       │
│ amount       │
│ credits      │
│ createdAt    │
└──────────────┘
```

---

## 🎨 Theming

Voxmo supports two carefully designed themes:

- **Light Mode** — Clean slate tones, white cards with subtle borders and shadows, black text
- **Dark Mode** — Deep charcoal backgrounds with glassmorphism effects, white text with indigo accents

Toggle via the sun/moon icon in the sidebar footer. Preference is persisted in `localStorage`.

The theme engine uses Tailwind v4's `@custom-variant` with the `.dark` class strategy, so every component follows the `bg-white dark:bg-neutral-900` pattern.

---

## 🔐 Security

- **JWT Authentication** — Every API request is verified against Supabase Auth
- **Row-Level Security** — Users can only access their own conversations
- **Idempotent Payments** — Stripe webhooks use `sessionId` uniqueness to prevent double-crediting
- **Credit Enforcement** — Both client-side guards and server-side checks before every search
- **CORS** — Restricted to the frontend origin
- **Input Validation** — Query length and type checks on all endpoints
- **Credit Restoration** — If a search fails after credit deduction, credits are automatically restored

---

## 📦 Deployment

The recommended deployment platform is **Railway** ($5/month hobby plan). See the [Deployment Plan](./DEPLOYMENT.md) for full step-by-step instructions covering:

1. Backend deployment with Prisma + environment variables
2. Frontend deployment with public env vars
3. Stripe webhook reconfiguration
4. Supabase OAuth redirect updates
5. Custom domain setup

**Quick summary:**

```bash
# Backend
cd backend
railway init && railway up

# Frontend
cd frontend
railway init && railway up
```

---

## 📄 License

This project is private and not licensed for redistribution.

---

## 🙏 Acknowledgments

- [Perplexity AI](https://perplexity.ai) — Inspiration for the product concept
- [Vercel AI SDK](https://sdk.vercel.ai) — Unified interface for multiple AI providers
- [Tavily](https://tavily.com) — Real-time web search API
- [Supabase](https://supabase.com) — Auth and PostgreSQL hosting
- [Stripe](https://stripe.com) — Payment processing
- [Bun](https://bun.sh) — Fast JavaScript runtime

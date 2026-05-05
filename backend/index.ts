import { streamText, type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import express from 'express';
import { tavily } from '@tavily/core';
import { SYSTEM_PROMPTS, PROMPT_TEMPLATE } from './prompts';
import { prisma } from "./db";
import { Middleware } from "./middleware";
import cors from "cors";
import Stripe from "stripe";
import rateLimit from "express-rate-limit";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const app = express();

// ─── AI Model Providers (Gateway strings) ───
// The 'ai' library automatically routes to Vercel Gateway if AI_GATEWAY_API_KEY is in .env

// Model registry — maps frontend model IDs to actual provider instances
interface ModelConfig {
    id: string;
    name: string;
    provider: string;
    description: string;
    tier: "flagship" | "fast" | "search";
    resolve: () => string;
    maxTokens?: number;
    providerOptions?: Record<string, any>;
}

const MODEL_REGISTRY: Record<string, ModelConfig> = {
    "gemini-2.5-flash": {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        provider: "Google",
        description: "Next-gen speed & efficiency",
        tier: "fast",
        resolve: () => "google/gemini-2.5-flash",
    },
    "gemini-2.5-pro": {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        provider: "Google",
        description: "Next-gen advanced reasoning",
        tier: "flagship",
        resolve: () => "google/gemini-2.5-pro",
    },
    "gpt-4o-mini": {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: "OpenAI",
        description: "Fast and affordable",
        tier: "fast",
        resolve: () => "openai/gpt-4o-mini",
    },
    "gpt-4.0": {
        id: "gpt-4.0",
        name: "GPT-4.0",
        provider: "OpenAI",
        description: "Most capable flagship model",
        tier: "flagship",
        resolve: () => "openai/gpt-4.0",
        maxTokens: 131072,
        providerOptions: {
            openai: {
                reasoningEffort: "high",
                reasoningSummary: "detailed",
            },
        },
    },
    "claude-sonnet-3.7": {
        id: "claude-sonnet-3.7",
        name: "Claude Sonnet 3.7",
        provider: "Anthropic",
        description: "Top-tier coding and reasoning",
        tier: "flagship",
        resolve: () => "anthropic/claude-sonnet-3.7",
        maxTokens: 262144,
        providerOptions: {
            anthropic: {
                thinking: { type: "adaptive" },
                effort: "high",
            },
        },
    },
    "claude-3-5-haiku": {
        id: "claude-3-5-haiku",
        name: "Claude 3.5 Haiku",
        provider: "Anthropic",
        description: "Fastest Claude model",
        tier: "fast",
        resolve: () => "anthropic/claude-3-5-haiku-latest",
    },
    "sonar-large": {
        id: "sonar-large",
        name: "Sonar Pro",
        provider: "Perplexity",
        description: "Native internet-connected model",
        tier: "search",
        resolve: () => "perplexity/sonar-pro",
    },
    "groq-llama3": {
        id: "groq-llama3",
        name: "Llama 3.1 8B",
        provider: "Groq",
        description: "Instantaneous speeds via Groq",
        tier: "fast",
        resolve: () => "groq/llama-3.1-8b-instant",
    },
    "mistral-large": {
        id: "mistral-large",
        name: "Mistral Large",
        provider: "Mistral",
        description: "Fast European model",
        tier: "fast",
        resolve: () => "mistral/mistral-small-latest",
    },
    "grok-beta": {
        id: "grok-beta",
        name: "Grok 3",
        provider: "xAI",
        description: "xAI's most powerful model",
        tier: "flagship",//
        resolve: () => "xai/grok-3",
    },
};

const DEFAULT_MODEL = "gemini-2.5-flash";

function resolveModel(modelId?: string): { model: string; tier: string; maxTokens?: number; providerOptions?: Record<string, any> } {
    const config = MODEL_REGISTRY[modelId || DEFAULT_MODEL] || MODEL_REGISTRY[DEFAULT_MODEL];
    return {
        model: config!.resolve(),
        tier: config!.tier,
        maxTokens: config!.maxTokens,
        providerOptions: config!.providerOptions,
    };
}

// Stripe: Webhook to handle successful payments
// NOTE: This must use raw body, not JSON parsed. It MUST be registered before express.json()
app.post("/webhook/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: any;

    try {
        if (!webhookSecret) {
            console.error("STRIPE_WEBHOOK_SECRET is not configured");
            res.status(500).send("Webhook secret not configured");
            return;
        }
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
        console.error("Webhook signature verification failed", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const credits = parseInt(session.metadata?.credits || "0", 10);
        const sessionId = session.id;

        if (userId && credits > 0) {
            try {
                await prisma.$transaction(async (tx) => {
                    const existing = await tx.payment.findUnique({ where: { sessionId } });
                    if (existing) {
                        console.log(`Payment ${sessionId} already processed.`);
                        return;
                    }
                    await tx.payment.create({
                        data: {
                            sessionId,
                            userId,
                            amount: session.amount_total || 0,
                            credits,
                        }
                    });
                    await tx.user.update({
                        where: { id: userId },
                        data: { credits: { increment: credits } },
                    });
                    console.log(`Added ${credits} credits to user ${userId}`);
                });
            } catch (err: any) {
                console.error("Failed to process payment via webhook:", err.message);
            }
        }
    }

    res.json({ received: true });
});

const frontendUrl = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.replace(/\/$/, "") 
    : "http://localhost:3000";

app.use(express.json({ limit: '10mb' }));
app.use(
    cors({
        origin: frontendUrl,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);
app.options(/.*/, cors());

// Apply rate limiting to all endpoints below this line
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: "Too many requests from this IP, please try again after 15 minutes." }
});
app.use(apiLimiter);

// ─── Model listing endpoint ───
app.get("/models", (_req, res) => {
    const models = Object.values(MODEL_REGISTRY).map(({ id, name, provider, description }) => ({
        id, name, provider, description,
    }));
    res.json({ models, default: DEFAULT_MODEL });
});


app.get("/conversations", Middleware, async (req, res) => {
    try {
        const conversations = await prisma.conversation.findMany({
            where: {
                userId: req.userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({ conversations });
    } catch (e) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/conversation/:conversationId", Middleware, async (req, res) => {
    try {
        const conversationId = req.params.conversationId as string;
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId: req.userId // Ensure security
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        if (!conversation) {
            res.status(404).json({ error: "Conversation not found" });
            return;
        }

        res.json({ conversation });
    } catch (e) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.delete("/conversation/:conversationId", Middleware, async (req, res) => {
    try {
        const conversationId = req.params.conversationId as string;
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId: req.userId
            }
        });

        if (!conversation) {
            res.status(404).json({ error: "Conversation not found" });
            return;
        }

        // Delete messages first (cascade), then conversation
        await prisma.message.deleteMany({
            where: { conversationId }
        });
        await prisma.conversation.delete({
            where: { id: conversationId }
        });

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Internal server error" });
    }
});

const port = Number(process.env.PORT ?? 3002);

app.post("/perplexity_ask", Middleware, async (req, res) => {
    const query = req.body.query;
    const modelId = req.body.model as string | undefined;
    const files = req.body.files as { data: string, mimeType: string, name: string }[] | undefined;

    if (typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({ error: "query is required" });
        return;
    }

    if (query.length > 100000) {
        res.status(400).json({ error: "Query exceeds maximum allowed length" });
        return;
    }

    // Check credits
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user || user.credits <= 0) {
        res.status(403).json({ error: "Insufficient credits" });
        return;
    }

    // Deduct 1 credit
    await prisma.user.update({
        where: { id: req.userId! },
        data: { credits: { decrement: 1 } }
    });

    try {
        // Create conversation and save user message
        const title = query.length > 50 ? query.substring(0, 47) + '...' : query;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const conversation = await prisma.conversation.create({
            data: {
                title,
                slug,
                userId: req.userId!,
                messages: {
                    create: [
                        {
                            content: query,
                            role: "User"
                        }
                    ]
                }
            }
        });

        // Web search — Tavily enforces a 400-char max query, so truncate for the search
        const searchQuery = query.length > 400 ? query.substring(0, 400) : query;
        const webSearchResponse = await client.search(searchQuery, {
            searchDepth: "advanced",
        });
        const webSearchResults = webSearchResponse.results;

        // Build prompt and stream LLM response
        const prompt = PROMPT_TEMPLATE
            .replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webSearchResults))
            .replace("{{USER_QUERY}}", query);

        const { model, tier, maxTokens, providerOptions } = resolveModel(modelId);

        const messages: any[] = [
            {
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    ...(files || []).map((f) => {
                        const base64Data = f.data.replace(/^data:[^;]+;base64,/, "");
                        if (f.mimeType.startsWith("image/")) {
                            return { type: "image", image: Buffer.from(base64Data, "base64"), mimeType: f.mimeType };
                        } else {
                            return { type: "file", data: Buffer.from(base64Data, "base64"), mimeType: f.mimeType };
                        }
                    })
                ]
            }
        ];

        const result = streamText({
            model,
            messages,
            system: SYSTEM_PROMPTS[tier] || SYSTEM_PROMPTS.fast,
            ...(maxTokens ? { maxTokens } : {}),
            ...(providerOptions ? { providerOptions } : {}),
        });

        let fullResponse = "";
        for await (const textPart of result.textStream) {
            fullResponse += textPart;
            res.write(textPart);
        }

        // Build sources array
        const sourcesData = webSearchResults.map(r => ({ title: r.title, url: r.url }));

        // Save assistant message with sources
        await prisma.message.create({
            data: {
                content: fullResponse,
                role: "Assistant",
                conversationId: conversation.id,
                sources: sourcesData
            }
        });

        // Stream sources
        res.write("<SOURCES>\n");
        res.write(JSON.stringify(sourcesData));
        res.write("</SOURCES>\n");
        res.end();
    } catch (err: any) {
        console.error("Search error:", err.message || err);

        // Restore the credit since the search failed
        await prisma.user.update({
            where: { id: req.userId! },
            data: { credits: { increment: 1 } }
        }).catch(() => { }); // Don't fail if restoration fails

        if (!res.headersSent) {
            res.status(500).json({ error: "Search failed. Please try again." });
        } else {
            res.end();
        }
    }
});

// Continue an existing conversation
app.post("/conversation/:conversationId/continue", Middleware, async (req, res) => {
    const conversationId = req.params.conversationId as string;
    const query = req.body.query;
    const modelId = req.body.model as string | undefined;
    const files = req.body.files as { data: string, mimeType: string, name: string }[] | undefined;

    if (typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({ error: "query is required" });
        return;
    }

    if (query.length > 100000) {
        res.status(400).json({ error: "Query exceeds maximum allowed length" });
        return;
    }

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId: req.userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
    }

    // Check credits
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user || user.credits <= 0) {
        res.status(403).json({ error: "Insufficient credits" });
        return;
    }

    // Deduct 1 credit
    await prisma.user.update({
        where: { id: req.userId! },
        data: { credits: { decrement: 1 } }
    });

    try {
        // Save user message
        await prisma.message.create({
            data: { content: query, role: "User", conversationId }
        });

        // Web search — Tavily enforces a 400-char max query, so truncate for the search
        const searchQuery = query.length > 400 ? query.substring(0, 400) : query;
        const webSearchResponse = await client.search(searchQuery, { searchDepth: "advanced" });
        const webSearchResults = webSearchResponse.results;

        // Map previous messages to native AI SDK format
        const previousMessages = conversation.messages.map(m => ({
            role: m.role.toLowerCase() as "user" | "assistant",
            content: m.content
        }));

        const prompt = PROMPT_TEMPLATE
            .replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webSearchResults))
            .replace("{{USER_QUERY}}", query);

        const { model, tier, maxTokens, providerOptions } = resolveModel(modelId);

        const messages: any[] = [
            ...previousMessages,
            {
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    ...(files || []).map((f) => {
                        const base64Data = f.data.replace(/^data:[^;]+;base64,/, "");
                        if (f.mimeType.startsWith("image/")) {
                            return { type: "image", image: Buffer.from(base64Data, "base64"), mimeType: f.mimeType };
                        } else {
                            return { type: "file", data: Buffer.from(base64Data, "base64"), mimeType: f.mimeType };
                        }
                    })
                ]
            }
        ];

        const result = streamText({
            model,
            messages,
            system: SYSTEM_PROMPTS[tier] || SYSTEM_PROMPTS.fast,
            ...(maxTokens ? { maxTokens } : {}),
            ...(providerOptions ? { providerOptions } : {}),
        });

        let fullResponse = "";
        for await (const textPart of result.textStream) {
            fullResponse += textPart;
            res.write(textPart);
        }

        // Build sources array
        const sourcesData = webSearchResults.map(r => ({ title: r.title, url: r.url }));

        // Save assistant message with sources
        await prisma.message.create({
            data: { content: fullResponse, role: "Assistant", conversationId, sources: sourcesData }
        });

        // Stream sources
        res.write("<SOURCES>\n");
        res.write(JSON.stringify(sourcesData));
        res.write("</SOURCES>\n");
        res.end();
    } catch (err: any) {
        console.error("Continue conversation error:", err.message || err);

        await prisma.user.update({
            where: { id: req.userId! },
            data: { credits: { increment: 1 } }
        }).catch(() => { });

        if (!res.headersSent) {
            res.status(500).json({ error: "Search failed. Please try again." });
        } else {
            res.end();
        }
    }
});

app.post("/perplexity_follow_up_questions", Middleware, async (req, res) => {
    const query = req.body.query;
    const answer = req.body.answer || "No previous answer provided.";
    const modelId = req.body.model as string | undefined;

    if (typeof query !== "string" || query.trim().length === 0) {
        res.status(400).json({ error: "query is required" });
        return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user || user.credits <= 0) {
        res.status(403).json({ error: "Insufficient credits to generate follow-ups" });
        return;
    }

    const prompt = `Based on the following context, suggest exactly 3 brief follow-up questions the user might ask next. Format the response as a simple JSON array of strings, without markdown formatting.

    Context:
    User Query: ${query}
    Assistant Answer: ${answer}`;

    try {
        // Use the fastest model for follow-ups
        const { model } = resolveModel("gemini-2.5-flash");

        const result = streamText({
            model,
            prompt,
            system: "You are an AI that predicts the most likely next questions a user will have.",
        });

        for await (const textPart of result.textStream) {
            res.write(textPart);
        }
        res.end();
    } catch (e) {
        console.error("Failed to generate follow-up questions", e);
        res.status(500).end("Internal server error");
    }
});

// Stripe: Create a checkout session for buying credits
app.post("/create-checkout-session", Middleware, async (req, res) => {
    try {
        const { plan } = req.body;

        let amount = 0;
        let credits = "0";
        let name = "";

        if (plan === "pro") {
            amount = 1900; // $19.00
            credits = "1000";
            name = "Pro Plan (1000 Credits)";
        } else if (plan === "max") {
            amount = 5000; // $50.00
            credits = "5000";
            name = "Max Plan (5000 Credits)";
        } else {
            res.status(400).json({ error: "Invalid plan selected" });
            return;
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: name,
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/cancel`,
            metadata: {
                userId: req.userId!,
                credits: credits,
            },
        });

        res.json({ url: session.url });
    } catch (e) {
        console.error("Failed to create checkout session", e);
        res.status(500).json({ error: "Failed to create checkout session" });
    }
});

// Verify payment and add credits (works without webhooks for local dev)
app.post("/verify-payment", Middleware, async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).json({ error: "sessionId is required" });
            return;
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Verify payment was successful
        if (session.payment_status !== "paid") {
            res.status(400).json({ error: "Payment not completed" });
            return;
        }

        // Verify this session belongs to this user
        if (session.metadata?.userId !== req.userId) {
            res.status(403).json({ error: "Unauthorized" });
            return;
        }

        const credits = parseInt(session.metadata?.credits || "0", 10);
        if (credits <= 0) {
            res.status(400).json({ error: "Invalid credits" });
            return;
        }

        // Check if already fulfilled (idempotency)
        const user = await prisma.user.findUnique({ where: { id: req.userId! } });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        // Idempotency check with transaction
        await prisma.$transaction(async (tx) => {
            const existing = await tx.payment.findUnique({ where: { sessionId } });
            if (existing) {
                throw new Error("Payment already processed");
            }
            await tx.payment.create({
                data: {
                    sessionId,
                    userId: req.userId!,
                    amount: session.amount_total || 0,
                    credits,
                }
            });
            await tx.user.update({
                where: { id: req.userId! },
                data: { credits: { increment: credits } },
            });
        });

        console.log(`✅ Verified payment: Added ${credits} credits to user ${req.userId}`);
        res.json({ success: true, credits });
    } catch (e: any) {
        console.error("Failed to verify payment", e.message);
        res.status(500).json({ error: "Failed to verify payment" });
    }
});

// Deduct voice call credits
app.post("/deduct-voice-credits", Middleware, async (req, res) => {
    try {
        const { durationSeconds } = req.body;
        
        if (typeof durationSeconds !== 'number' || durationSeconds < 0) {
            res.status(400).json({ error: "Invalid duration" });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        // Calculate credits to deduct (10 credits per minute, rounded up)
        const creditsToDeduct = Math.ceil(durationSeconds / 60) * 10;

        if (creditsToDeduct > 0) {
            const updatedUser = await prisma.user.update({
                where: { id: req.userId },
                data: { credits: { decrement: creditsToDeduct } }
            });
            console.log(`🎙️ Deducted ${creditsToDeduct} credits for voice call (${durationSeconds}s) from user ${req.userId}`);
            res.json({ success: true, credits: updatedUser.credits, deducted: creditsToDeduct });
        } else {
            res.json({ success: true, credits: user.credits, deducted: 0 });
        }

    } catch (e) {
        console.error("Deduct Voice Credits Error:", e);
        res.status(500).json({ error: "Failed to deduct credits" });
    }
});

// Save voice conversation
app.post("/save-voice-conversation", Middleware, async (req, res) => {
    try {
        const { messages } = req.body;
        
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            res.status(400).json({ error: "Invalid messages array" });
            return;
        }

        // Filter out system messages to avoid leaking prompts
        const validMessages = messages.filter(m => {
            const r = (m.role || "").toLowerCase();
            return r === 'user' || r === 'assistant' || r === 'bot' || r === 'model';
        });

        if (validMessages.length === 0) {
            res.json({ success: true, conversationId: null, message: "No valid messages to save" });
            return;
        }

        // Create a title from the first User message or default
        const firstUserMessage = validMessages.find(m => (m.role || "").toLowerCase() === 'user') || validMessages[0];
        const rawTitle = firstUserMessage.content || "Voice Conversation";
        const title = "Voice Chat: " + (rawTitle.length > 40 ? rawTitle.substring(0, 37) + "..." : rawTitle);
        const slug = "voice-chat-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);

        const conversation = await prisma.conversation.create({
            data: {
                title,
                slug,
                userId: req.userId!,
                messages: {
                    create: validMessages.map(m => {
                        const r = (m.role || "").toLowerCase();
                        const isAssistant = r === 'assistant' || r === 'bot' || r === 'model';
                        return {
                            content: m.content || "...",
                            role: isAssistant ? 'Assistant' : 'User',
                        };
                    })
                }
            }
        });

        console.log(`🎙️ Saved Voice Conversation ${conversation.id} for user ${req.userId}`);
        res.json({ success: true, conversationId: conversation.id });
    } catch (e) {
        console.error("Save Voice Conversation Error:", e);
        res.status(500).json({ error: "Failed to save voice conversation" });
    }
});

// Get user's current credit balance
app.get("/credits", Middleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.userId! } });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({ credits: user.credits });
    } catch (e) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get full user profile — used by the frontend to show name, email, credits in one call
app.get("/me", Middleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId! },
            select: { id: true, name: true, email: true, credits: true, provider: true },
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({ user });
    } catch (e) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get usage stats — total searches (conversations) and remaining credits
app.get("/usage", Middleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.userId! } });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const totalSearches = await prisma.conversation.count({
            where: { userId: req.userId! },
        });

        const totalMessages = await prisma.message.count({
            where: { conversation: { userId: req.userId! } },
        });

        res.json({
            credits: user.credits,
            totalSearches,
            totalMessages,
        });
    } catch (e) {
        res.status(500).json({ error: "Internal server error" });
    }
});


if (process.env.NODE_ENV !== "production") {
    const server = app.listen(port, () => {
        console.log(`Backend listening on http://localhost:${port}`);
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
            console.error(`Port ${port} is already in use.`);
        } else {
            console.error("Failed to start server:", err.message);
        }
        process.exit(1);
    });
}

export default app;

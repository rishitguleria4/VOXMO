import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/lib/AuthContext";
import { BACKEND_URL } from "@/lib/config";
import { useModelSelection } from "@/components/ModelSelector";
import axios from "axios";
import MarkdownRenderer from "../components/MarkdownRenderer";
import SourceCard from "../components/SourceCard";
import SearchInput from "../components/SearchInput";
import { User, Sparkles, ArrowLeft, Loader2 } from "lucide-react";

interface Source {
    title: string;
    url: string;
}

interface Message {
    id: string;
    content: string;
    role: "User" | "Assistant";
    createdAt: string;
    sources?: Source[];
    isStreaming?: boolean;
}

interface ConversationData {
    id: string;
    title: string | null;
    slug: string;
    messages: Message[];
}

export default function Conversation() {
    const { conversationId } = useParams<{ conversationId: string }>();
    const { jwt, refreshCredits, refreshConversations, deductCreditOptimistic, credits } = useAuth();
    const { models, selectedModel, selectModel } = useModelSelection();
    const navigate = useNavigate();
    const [conversation, setConversation] = useState<ConversationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, []);

    useEffect(() => {
        async function fetchConversation() {
            if (!jwt || !conversationId) return;
            setIsLoading(true);
            try {
                const res = await axios.get(`${BACKEND_URL}/conversation/${conversationId}`, {
                    headers: { Authorization: `Bearer ${jwt}` },
                });
                setConversation(res.data.conversation);
            } catch (e: any) {
                setError(e.response?.status === 404 ? "Conversation not found" : "Failed to load conversation");
            } finally {
                setIsLoading(false);
            }
        }
        fetchConversation();
    }, [jwt, conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [conversation?.messages.length, scrollToBottom]);

    const handleContinue = async (query: string, files?: { data: string; mimeType: string; name: string }[]) => {
        if (!jwt || !conversationId || !query.trim()) return;

        setIsSearching(true);
        deductCreditOptimistic();

        // Add user message optimistically
        const userMsg: Message = {
            id: `temp-user-${Date.now()}`,
            content: query,
            role: "User",
            createdAt: new Date().toISOString(),
        };

        // Add placeholder assistant message
        const assistantMsg: Message = {
            id: `temp-assistant-${Date.now()}`,
            content: "",
            role: "Assistant",
            createdAt: new Date().toISOString(),
            isStreaming: true,
        };

        setConversation(prev => {
            if (!prev) return prev;
            return { ...prev, messages: [...prev.messages, userMsg, assistantMsg] };
        });

        try {
            const response = await fetch(`${BACKEND_URL}/conversation/${conversationId}/continue`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({ query, model: selectedModel, files }),
            });

            if (!response.ok || !response.body) {
                throw new Error(`Server returned ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

                const sourcesStartIdx = fullText.indexOf("<SOURCES>");
                const answerText = sourcesStartIdx === -1 ? fullText : fullText.substring(0, sourcesStartIdx);

                setConversation(prev => {
                    if (!prev) return prev;
                    const msgs = [...prev.messages];
                    const lastIdx = msgs.length - 1;
                    msgs[lastIdx] = { ...msgs[lastIdx]!, content: answerText };
                    return { ...prev, messages: msgs };
                });
            }

            // Parse sources
            let finalAnswer = fullText;
            let sources: Source[] = [];
            const sourcesStart = fullText.indexOf("<SOURCES>");
            const sourcesEnd = fullText.indexOf("</SOURCES>");
            if (sourcesStart !== -1 && sourcesEnd !== -1) {
                finalAnswer = fullText.substring(0, sourcesStart).trim();
                try {
                    sources = JSON.parse(fullText.substring(sourcesStart + "<SOURCES>\n".length, sourcesEnd));
                } catch { /* ignore parse error */ }
            }

            setConversation(prev => {
                if (!prev) return prev;
                const msgs = [...prev.messages];
                const lastIdx = msgs.length - 1;
                msgs[lastIdx] = { ...msgs[lastIdx]!, content: finalAnswer, isStreaming: false, sources };
                return { ...prev, messages: msgs };
            });

            refreshCredits();
            refreshConversations();
        } catch (err) {
            console.error("Continue error:", err);
            refreshCredits();
        } finally {
            setIsSearching(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
        );
    }

    if (error || !conversation) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-slate-500 dark:text-white/40">{error || "Conversation not found"}</p>
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Search
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <header className="shrink-0 flex items-center gap-3 h-14 px-6 border-b border-slate-200 dark:border-white/[0.06]">
                <button
                    onClick={() => navigate("/")}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-500 hover:text-slate-800 dark:text-white/40 dark:hover:text-white/70 transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="text-sm font-medium text-slate-700 dark:text-white/70 truncate">
                    {conversation.title || conversation.slug}
                </h1>
            </header>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    {conversation.messages.map((msg) => (
                        <div key={msg.id}>
                            <div className="flex items-start gap-3">
                                <div className={`
                                    shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                                    ${msg.role === "User"
                                        ? "bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08]"
                                        : "bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 border border-indigo-200 dark:border-indigo-500/20"
                                    }
                                `}>
                                    {msg.role === "User" ? (
                                        <User className="w-4 h-4 text-slate-400 dark:text-white/50" />
                                    ) : (
                                        <Sparkles className={`w-4 h-4 text-indigo-500 dark:text-indigo-400 ${msg.isStreaming ? "animate-pulse" : ""}`} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                    {msg.role === "User" ? (
                                        <p className="text-slate-800 dark:text-white font-medium">{msg.content}</p>
                                    ) : (
                                        <>
                                            <MarkdownRenderer content={msg.content} />
                                            {msg.isStreaming && (
                                                <span className="inline-block w-2 h-5 bg-indigo-400 rounded-sm animate-pulse ml-0.5 align-text-bottom" />
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            {/* Sources for this message */}
                            {msg.role === "Assistant" && msg.sources && msg.sources.length > 0 && (
                                <div className="ml-11 mt-3 space-y-2">
                                    <p className="text-[11px] font-semibold text-slate-400 dark:text-white/25 uppercase tracking-wider">Sources</p>
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                                        {msg.sources.map((source, idx) => (
                                            <SourceCard key={idx} title={source.title} url={source.url} index={idx} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom input to continue conversation */}
            <div className="shrink-0 border-t border-slate-200 dark:border-white/[0.06] p-4">
                <div className="flex justify-center">
                    <SearchInput
                        onSubmit={handleContinue}
                        isDisabled={isSearching}
                        autoFocus
                        placeholder="Continue this conversation..."
                        models={models}
                        selectedModel={selectedModel}
                        onModelSelect={selectModel}
                    />
                </div>
            </div>
        </div>
    );
}

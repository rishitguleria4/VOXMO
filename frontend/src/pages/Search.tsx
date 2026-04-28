import { useRef, useEffect, useMemo } from "react";
import { useSearch } from "@/lib/useSearch";
import { useAuth } from "@/lib/AuthContext";
import { useModelSelection } from "@/components/ModelSelector";
import SearchInput from "../components/SearchInput";
import AnswerCard from "../components/AnswerCard";
import CreditGuard from "../components/CreditGuard";
import { Search, Zap, Globe, Sparkles, TrendingUp } from "lucide-react";

const SUGGESTED_QUERIES = [
    "What are the latest breakthroughs in AI?",
    "How does quantum computing work?",
    "Best practices for system design",
    "Explain blockchain in simple terms",
];

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 5) return "Burning the midnight oil?";
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Night owl mode";
}

export default function SearchPage() {
    const { results, isSearching, search } = useSearch();
    const { credits } = useAuth();
    const { models, selectedModel, selectModel } = useModelSelection();
    const scrollRef = useRef<HTMLDivElement>(null);
    const greeting = useMemo(getGreeting, []);

    // Auto-scroll to bottom when new results come in
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [results]);

    const hasResults = results.length > 0;

    const handleSearch = (query: string, files?: {data: string, mimeType: string, name: string}[]) => {
        search(query, selectedModel, files);
    };

    return (
        <div className="h-screen flex flex-col">
            {/* Scrollable results area */}
            <div
                ref={scrollRef}
                className={`flex-1 overflow-y-auto ${hasResults ? "pt-8 px-6" : ""}`}
            >
                {!hasResults ? (
                    /* Empty State — Centered hero */
                    <div className="h-full flex flex-col items-center justify-center px-6">
                        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto animate-fade-in-up">
                            {/* Logo */}
                            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#2f2f31] border border-slate-200 dark:border-[#3f3f42] flex items-center justify-center mb-6 shadow-sm dark:shadow-xl animate-float">
                                <Search className="w-7 h-7 text-slate-800 dark:text-white/80" />
                            </div>

                            {/* Greeting + headline */}
                            <p className="text-slate-500 dark:text-white/30 text-sm mb-2 font-medium tracking-wide uppercase">{greeting}</p>
                            <h1 className="text-4xl font-semibold text-slate-900 dark:text-white mb-3 tracking-tight">
                                What do you want to <span className="text-indigo-500 dark:text-white/70 italic">know</span>?
                            </h1>
                            <p className="text-slate-600 dark:text-white/40 text-lg mb-10 font-medium">
                                Search the web with AI-powered intelligence
                            </p>

                            {/* Search input */}
                            <CreditGuard>
                                <SearchInput
                                    onSubmit={handleSearch}
                                    isDisabled={isSearching}
                                    size="large"
                                    autoFocus
                                    placeholder="Ask anything..."
                                    models={models}
                                    selectedModel={selectedModel}
                                    onModelSelect={selectModel}
                                />
                            </CreditGuard>

                            {/* Suggested queries */}
                            {credits !== null && credits > 0 && (
                                <div className="mt-8 w-full max-w-2xl animate-fade-in delay-300">
                                    <div className="flex items-center gap-1.5 justify-center mb-3">
                                        <TrendingUp className="w-3 h-3 text-slate-400 dark:text-white/20" />
                                        <span className="text-[11px] text-slate-500 dark:text-white/20 font-medium uppercase tracking-wider">Try asking</span>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                        {SUGGESTED_QUERIES.map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => handleSearch(q)}
                                                disabled={isSearching}
                                                className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]
                                                    hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:border-indigo-200 dark:hover:border-indigo-500/20
                                                    text-slate-600 dark:text-white/35 hover:text-slate-800 dark:hover:text-white/70 text-xs
                                                    transition-all duration-200 cursor-pointer
                                                    disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Feature pills */}
                            <div className="flex flex-wrap items-center justify-center gap-3 mt-10 animate-fade-in delay-500">
                                <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-white/25 text-xs">
                                    <Globe className="w-3.5 h-3.5 text-emerald-500/70 dark:text-emerald-400/50" />
                                    Real-time web search
                                </div>
                                <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-white/25 text-xs">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500/70 dark:text-indigo-400/50" />
                                    AI-powered answers
                                </div>
                                <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-white/25 text-xs">
                                    <Zap className="w-3.5 h-3.5 text-amber-500/70 dark:text-amber-400/50" />
                                    Cited sources
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Results */
                    <div className="pb-40">
                        {results.map((result, idx) => (
                            <AnswerCard
                                key={idx}
                                query={result.query}
                                answer={result.answer}
                                sources={result.sources}
                                followUpQuestions={result.followUpQuestions}
                                isStreaming={result.isStreaming}
                                error={result.error}
                                onFollowUp={handleSearch}
                                isSearching={isSearching}
                                durationMs={result.durationMs}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Sticky bottom input (when results exist) */}
            {hasResults && (
                <div className="sticky bottom-0 w-full bg-gradient-to-t from-slate-50 via-slate-50/95 dark:from-background dark:via-background/95 to-transparent pt-8 pb-6 px-6">
                    <div className="flex justify-center">
                        <SearchInput
                            onSubmit={handleSearch}
                            isDisabled={isSearching}
                            autoFocus
                            placeholder="Ask a follow-up..."
                            models={models}
                            selectedModel={selectedModel}
                            onModelSelect={selectModel}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import SourceCard from "./SourceCard";
import FollowUpChips from "./FollowUpChips";
import LoadingSkeleton from "./LoadingSkeleton";
import { User, Sparkles, AlertCircle, Copy, Check, Clock, Share2 } from "lucide-react";

interface Source {
    title: string;
    url: string;
}

interface AnswerCardProps {
    query: string;
    answer: string;
    sources: Source[];
    followUpQuestions: string[];
    isStreaming: boolean;
    error: string | null;
    onFollowUp: (question: string) => void;
    isSearching: boolean;
    durationMs?: number | null;
}

export default function AnswerCard({
    query,
    answer,
    sources,
    followUpQuestions,
    isStreaming,
    error,
    onFollowUp,
    isSearching,
    durationMs,
}: AnswerCardProps) {
    const [copied, setCopied] = useState(false);
    const [shared, setShared] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(answer);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = answer;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        const shareText = `Q: ${query}\n\nA: ${answer}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: "Voxmo AI", text: shareText });
            } else {
                await navigator.clipboard.writeText(shareText);
                setShared(true);
                setTimeout(() => setShared(false), 2000);
            }
        } catch {
            // User cancelled share
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto animate-fade-in-up">
            {/* User query */}
            <div className="flex justify-end mb-8">
                <div className="max-w-[85%] px-5 py-3 rounded-[24px] rounded-br-[4px] bg-slate-100 dark:bg-gradient-to-br dark:from-[oklch(0.20_0.01_270)] dark:to-[oklch(0.22_0.01_270)] border border-slate-200 dark:border-white/[0.05] shadow-sm dark:shadow-lg">
                    <p className="text-slate-800 dark:text-white font-medium leading-relaxed">{query}</p>
                </div>
            </div>

            {/* AI Response */}
            <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
                    <Sparkles className={`w-4 h-4 text-indigo-400 ${isStreaming ? "animate-pulse" : ""}`} />
                </div>
                <div className="flex-1 min-w-0 space-y-5">
                    {/* Error State */}
                    {error && (
                        <div className="flex items-center gap-2.5 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/[0.06] border border-red-200 dark:border-red-500/[0.12] rounded-xl px-4 py-3 animate-scale-in">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Loading */}
                    {isStreaming && !answer && <LoadingSkeleton />}

                    {/* Answer */}
                    {answer && (
                        <div className="relative group/answer">
                            <MarkdownRenderer content={answer} />
                            {isStreaming && (
                                <span className="inline-block w-2 h-5 bg-indigo-400 rounded-sm animate-typewriter-cursor ml-0.5 align-text-bottom" />
                            )}

                            {/* Action toolbar — appears on hover or when done streaming */}
                            {!isStreaming && (
                                <div className="flex items-center gap-1 mt-4 opacity-0 group-hover/answer:opacity-100 transition-opacity duration-200">
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                                            text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-white/40 dark:hover:text-white/80 dark:hover:bg-white/[0.06]
                                            transition-all cursor-pointer"
                                        title="Copy answer"
                                    >
                                        {copied ? (
                                            <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
                                        ) : (
                                            <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
                                        )}
                                    </button>

                                    <button
                                        onClick={handleShare}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                                            text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-white/40 dark:hover:text-white/80 dark:hover:bg-white/[0.06]
                                            transition-all cursor-pointer"
                                        title="Share"
                                    >
                                        {shared ? (
                                            <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
                                        ) : (
                                            <><Share2 className="w-3.5 h-3.5" /><span>Share</span></>
                                        )}
                                    </button>

                                    {durationMs && (
                                        <div className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 dark:text-white/20 ml-auto">
                                            <Clock className="w-3 h-3" />
                                            <span>{(durationMs / 1000).toFixed(1)}s</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sources */}
                    {sources.length > 0 && (
                        <div className="space-y-2.5 animate-fade-in-up delay-150">
                            <p className="text-[11px] font-semibold text-slate-400 dark:text-white/25 uppercase tracking-wider">
                                Sources
                            </p>
                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
                                {sources.map((source, idx) => (
                                    <SourceCard key={idx} title={source.title} url={source.url} index={idx} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Follow-up Questions */}
                    {!isStreaming && followUpQuestions.length > 0 && (
                        <FollowUpChips
                            questions={followUpQuestions}
                            onSelect={onFollowUp}
                            disabled={isSearching}
                        />
                    )}
                </div>
            </div>

            {/* Divider */}
            <div className="border-b border-slate-200 dark:border-white/[0.04] mt-8 mb-8" />
        </div>
    );
}

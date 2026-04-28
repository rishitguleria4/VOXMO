import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { BACKEND_URL } from "@/lib/config";

interface Source {
    title: string;
    url: string;
}

interface SearchResult {
    query: string;
    answer: string;
    sources: Source[];
    followUpQuestions: string[];
    isStreaming: boolean;
    error: string | null;
    /** Milliseconds the search took (set when streaming finishes) */
    durationMs: number | null;
    /** Model used for this search */
    model?: string;
}

export function useSearch() {
    const { jwt, credits, refreshCredits, refreshConversations, deductCreditOptimistic } = useAuth();
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const search = useCallback(async (query: string, modelId?: string, files?: { data: string, mimeType: string, name: string }[]) => {
        if (!jwt || !query.trim()) return;

        // ── Credit guard (client-side) ──
        if (credits !== null && credits <= 0) {
            setResults(prev => [...prev, {
                query,
                answer: "",
                sources: [],
                followUpQuestions: [],
                isStreaming: false,
                error: "You're out of credits. Upgrade your plan to continue searching.",
                durationMs: null,
                model: modelId,
            }]);
            return;
        }

        // Cancel any ongoing search
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const resultIndex = results.length;
        const newResult: SearchResult = {
            query,
            answer: "",
            sources: [],
            followUpQuestions: [],
            isStreaming: true,
            error: null,
            durationMs: null,
            model: modelId,
        };

        setResults(prev => [...prev, newResult]);
        setIsSearching(true);

        // Optimistic credit deduction — UI updates immediately
        deductCreditOptimistic();

        const startTime = performance.now();

        try {
            const response = await fetch(`${BACKEND_URL}/perplexity_ask`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({ query, model: modelId, files }),
                signal: controller.signal,
            });

            if (response.status === 403) {
                setResults(prev => {
                    const updated = [...prev];
                    updated[resultIndex] = {
                        ...updated[resultIndex]!,
                        isStreaming: false,
                        error: "Insufficient credits. Please upgrade your plan.",
                        durationMs: null,
                    };
                    return updated;
                });
                // Restore the optimistic deduction since it actually failed
                refreshCredits();
                setIsSearching(false);
                return;
            }

            if (response.status === 401) {
                setResults(prev => {
                    const updated = [...prev];
                    updated[resultIndex] = {
                        ...updated[resultIndex]!,
                        isStreaming: false,
                        error: "Session expired. Please sign in again.",
                        durationMs: null,
                    };
                    return updated;
                });
                setIsSearching(false);
                return;
            }

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

                // Check if we've received the SOURCES block yet
                const sourcesStartIdx = fullText.indexOf("<SOURCES>");
                if (sourcesStartIdx === -1) {
                    // Still streaming the answer
                    setResults(prev => {
                        const updated = [...prev];
                        updated[resultIndex] = {
                            ...updated[resultIndex]!,
                            answer: fullText,
                        };
                        return updated;
                    });
                } else {
                    // We have the beginning of SOURCES; show only the answer part
                    const answerText = fullText.substring(0, sourcesStartIdx);
                    setResults(prev => {
                        const updated = [...prev];
                        updated[resultIndex] = {
                            ...updated[resultIndex]!,
                            answer: answerText,
                        };
                        return updated;
                    });
                }
            }

            const elapsed = Math.round(performance.now() - startTime);

            // Parse sources from the full text
            let finalAnswer = fullText;
            let sources: Source[] = [];
            const sourcesStart = fullText.indexOf("<SOURCES>");
            const sourcesEnd = fullText.indexOf("</SOURCES>");

            if (sourcesStart !== -1 && sourcesEnd !== -1) {
                finalAnswer = fullText.substring(0, sourcesStart).trim();
                const sourcesJson = fullText.substring(sourcesStart + "<SOURCES>\n".length, sourcesEnd);
                try {
                    sources = JSON.parse(sourcesJson);
                } catch {
                    console.error("Failed to parse sources JSON");
                }
            }

            setResults(prev => {
                const updated = [...prev];
                updated[resultIndex] = {
                    ...updated[resultIndex]!,
                    answer: finalAnswer,
                    sources,
                    isStreaming: false,
                    durationMs: elapsed,
                };
                return updated;
            });

            // Fetch follow-up questions in the background (free — no credit cost)
            try {
                const fqResponse = await fetch(`${BACKEND_URL}/perplexity_follow_up_questions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${jwt}`,
                    },
                    body: JSON.stringify({ query, answer: finalAnswer, model: modelId }),
                });

                if (fqResponse.ok && fqResponse.body) {
                    const fqReader = fqResponse.body.getReader();
                    const fqDecoder = new TextDecoder();
                    let fqText = "";

                    while (true) {
                        const { done, value } = await fqReader.read();
                        if (done) break;
                        fqText += fqDecoder.decode(value, { stream: true });
                    }

                    try {
                        // Clean up potential markdown formatting
                        const cleaned = fqText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
                        const questions = JSON.parse(cleaned);
                        if (Array.isArray(questions)) {
                            setResults(prev => {
                                const updated = [...prev];
                                updated[resultIndex] = {
                                    ...updated[resultIndex]!,
                                    followUpQuestions: questions.slice(0, 3),
                                };
                                return updated;
                            });
                        }
                    } catch {
                        console.error("Failed to parse follow-up questions");
                    }
                }
            } catch {
                // Follow-up questions are non-critical, silently fail
            }

            // Sync credits and conversations from server (confirms the optimistic deduction and gets the new chat)
            refreshCredits();
            refreshConversations();
        } catch (err: any) {
            if (err.name === "AbortError") return;
            setResults(prev => {
                const updated = [...prev];
                updated[resultIndex] = {
                    ...updated[resultIndex]!,
                    isStreaming: false,
                    error: "Something went wrong. Please try again.",
                    durationMs: null,
                };
                return updated;
            });
            // Restore credits on error
            refreshCredits();
        } finally {
            setIsSearching(false);
        }
    }, [jwt, results.length, credits, refreshCredits, refreshConversations, deductCreditOptimistic]);

    const clearResults = useCallback(() => {
        setResults([]);
    }, []);

    return { results, isSearching, search, clearResults };
}

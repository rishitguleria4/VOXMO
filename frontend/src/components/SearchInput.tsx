import { useState, useRef, useEffect } from "react";
import { ArrowUp, Loader2, Sparkles, Paperclip, X, File as FileIcon, Mic, MicOff } from "lucide-react";
import { useVoiceAssistant } from "@/lib/useVoiceAssistant";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/Toast";
import ModelSelector from "./ModelSelector";

interface Model {
    id: string;
    name: string;
    provider: string;
    description: string;
}

interface FilePayload {
    data: string; // base64
    mimeType: string;
    name: string;
}

interface SearchInputProps {
    onSubmit: (query: string, files?: FilePayload[]) => void;
    isDisabled?: boolean;
    placeholder?: string;
    autoFocus?: boolean;
    size?: "large" | "normal";
    models?: Model[];
    selectedModel?: string;
    onModelSelect?: (id: string) => void;
}

export default function SearchInput({
    onSubmit,
    isDisabled,
    placeholder,
    autoFocus = false,
    size = "normal",
    models = [],
    selectedModel = "",
    onModelSelect,
}: SearchInputProps) {
    const [query, setQuery] = useState("");
    const [files, setFiles] = useState<FilePayload[]>([]);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { credits } = useAuth();
    const { toast } = useToast();
    const { isConnecting, isConnected, isAssistantSpeaking, volumeLevel, toggleCall, hasSupport } = useVoiceAssistant();

    const MAX_QUERY_LENGTH = 100000;

    const hasCredits = credits === null || credits > 0;
    const isLarge = size === "large";

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Global Ctrl+K / Cmd+K shortcut
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const handleSubmit = (overrideQuery?: string) => {
        const queryToSubmit = overrideQuery ?? query;
        if ((!queryToSubmit.trim() && files.length === 0) || isDisabled || !hasCredits) return;
        
        if (queryToSubmit.length > MAX_QUERY_LENGTH) {
            toast(`Query is too long. Maximum allowed length is ${MAX_QUERY_LENGTH} characters.`, "error");
            return;
        }

        onSubmit(queryToSubmit.trim(), files);
        setQuery("");
        setFiles([]);
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
        }
    };

    // Vapi replaces the previous startListening/stopListening logic
    const handleVoiceToggle = () => {
        toggleCall();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        const textarea = inputRef.current;
        if (textarea) {
            textarea.style.height = "0px";
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = Math.min(scrollHeight, 200) + "px";
        }
    }, [query]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const selectedFiles = Array.from(e.target.files);

        selectedFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result && typeof event.target.result === 'string') {
                    setFiles(prev => [...prev, {
                        data: event.target!.result as string,
                        mimeType: file.type,
                        name: file.name
                    }]);
                }
            };
            reader.readAsDataURL(file);
        });

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const canSubmit = (query.trim() || files.length > 0) && !isDisabled && hasCredits;

    return (
        <div className={`relative w-full group ${isLarge ? "max-w-3xl" : "max-w-4xl"}`}>
            {/* Clean, premium container styling */}
            <div className={`
                relative flex flex-col rounded-3xl
                bg-white/70 dark:bg-[#2f2f31]/90 backdrop-blur-xl border border-slate-200 dark:border-[#3f3f42]
                focus-within:border-slate-300 dark:focus-within:border-[#5f5f64] focus-within:ring-4 focus-within:ring-slate-200/50 dark:focus-within:ring-[#ffffff05]
                shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/40
                transition-all duration-300
                ${isLarge ? "p-4" : "p-3"}
            `}>
                
                {/* File chips area */}
                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {files.map((file, idx) => {
                            const isImage = file.mimeType.startsWith('image/');
                            return (
                                <div key={idx} className="relative group flex items-center gap-2 bg-slate-50 dark:bg-[#1a1a1c] border border-slate-200 dark:border-[#3f3f42] rounded-xl p-1.5 pr-3 max-w-[200px]">
                                    {isImage ? (
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#2f2f31] flex-shrink-0 overflow-hidden border border-slate-200 dark:border-[#3f3f42]">
                                            <img src={file.data} alt={file.name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#2f2f31] flex items-center justify-center flex-shrink-0 text-slate-400 dark:text-white/50 border border-slate-200 dark:border-[#3f3f42]">
                                            <FileIcon className="w-5 h-5" />
                                        </div>
                                    )}
                                    <span className="text-xs text-slate-700 dark:text-white/80 truncate font-medium flex-1">
                                        {file.name}
                                    </span>
                                    <button 
                                        onClick={() => removeFile(idx)}
                                        className="absolute -top-2 -right-2 bg-white dark:bg-[#4f4f54] text-slate-500 hover:text-red-500 border border-slate-200 dark:border-transparent dark:hover:bg-white dark:hover:text-black dark:text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                <textarea
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={!hasCredits ? "No credits remaining..." : (placeholder || "Ask anything...")}
                    disabled={isDisabled || !hasCredits}
                    rows={1}
                    className={`
                        flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 resize-none
                        focus:outline-none disabled:opacity-40 font-medium
                        ${isLarge ? "text-lg leading-relaxed" : "text-[15px] leading-relaxed"}
                        py-1 px-1
                    `}
                />

                {/* Bottom bar: utilities + submit */}
                <div className={`flex items-center justify-between ${isLarge ? "mt-4" : "mt-2"}`}>
                    <div className="flex items-center gap-2">
                        {/* File attach button */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect} 
                            className="hidden" 
                            multiple
                            accept="image/*,.pdf,.txt,.csv,.md"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isDisabled || !hasCredits}
                            className={`
                                flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10 transition-all
                                ${isLarge ? "w-10 h-10" : "w-8 h-8"}
                            `}
                            title="Attach files or images"
                        >
                            <Paperclip className={isLarge ? "w-5 h-5" : "w-4 h-4"} />
                        </button>

                        {hasSupport && (
                            <button
                                onClick={handleVoiceToggle}
                                disabled={isDisabled || (!hasCredits && !isConnected)}
                                className={`
                                    flex items-center justify-center rounded-full transition-all relative
                                    ${isConnecting
                                        ? "bg-amber-500 text-white animate-pulse shadow-lg shadow-amber-500/20"
                                        : isConnected 
                                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10"
                                    }
                                    ${isLarge ? "w-10 h-10" : "w-8 h-8"}
                                `}
                                style={{
                                    transform: isConnected && volumeLevel > 0.1 ? `scale(${1 + volumeLevel * 0.1})` : 'scale(1)'
                                }}
                                title={isConnecting ? "Connecting..." : isConnected ? "End Call" : "Start Voice Call"}
                            >
                                {isConnecting ? (
                                    <Loader2 className={`animate-spin ${isLarge ? "w-5 h-5" : "w-4 h-4"}`} />
                                ) : isConnected ? (
                                    <MicOff className={isLarge ? "w-5 h-5" : "w-4 h-4"} />
                                ) : (
                                    <Mic className={isLarge ? "w-5 h-5" : "w-4 h-4"} />
                                )}
                                
                                {/* Dynamic volume ring for Vapi interaction */}
                                {isConnected && (
                                    <div 
                                        className="absolute inset-0 rounded-full bg-indigo-400/30"
                                        style={{
                                            transform: `scale(${1 + volumeLevel * 0.5})`,
                                            opacity: isAssistantSpeaking ? 0.8 : 0.3,
                                            transition: 'transform 0.1s ease-out, opacity 0.2s ease-in'
                                        }}
                                    />
                                )}
                            </button>
                        )}

                        {/* Model selector */}
                        {models.length > 0 && onModelSelect && (
                            <ModelSelector
                                models={models}
                                selectedModel={selectedModel}
                                onSelect={onModelSelect}
                                compact={!isLarge}
                            />
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Credit indicator */}
                        {credits !== null && (
                            <div className={`flex items-center gap-1.5 ${!hasCredits ? "text-amber-500 dark:text-amber-400/60" : "text-slate-400 dark:text-white/30"}`}>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="text-xs font-semibold tracking-wide uppercase">
                                    {credits} {credits === 1 ? "credit" : "credits"}
                                </span>
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`
                                shrink-0 rounded-full flex items-center justify-center
                                transition-all duration-300 cursor-pointer
                                ${canSubmit
                                    ? "bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:scale-105 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:shadow-lg dark:shadow-white/10"
                                    : "bg-slate-100 text-slate-300 dark:bg-[#3f3f42] dark:text-white/20 cursor-not-allowed"
                                }
                                ${isLarge ? "w-11 h-11" : "w-9 h-9"}
                            `}
                        >
                            {isDisabled ? (
                                <Loader2 className={`animate-spin ${isLarge ? "w-5 h-5" : "w-4 h-4"}`} />
                            ) : (
                                <ArrowUp className={isLarge ? "w-5 h-5 stroke-[2.5]" : "w-4 h-4 stroke-[2.5]"} />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer hints */}
            {!isDisabled && hasCredits && (
                <div className="flex items-center justify-center mt-4 px-1">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-white/20 text-xs font-medium tracking-wide">
                        <kbd className="px-2 py-0.5 rounded border border-slate-200 dark:border-[#3f3f42] bg-white dark:bg-[#2f2f31] text-slate-500 dark:text-white/40 font-sans shadow-sm">
                            {navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}+K
                        </kbd>
                        <span>to focus</span>
                        <span className="mx-2 text-slate-300 dark:text-white/10">·</span>
                        <kbd className="px-2 py-0.5 rounded border border-slate-200 dark:border-[#3f3f42] bg-white dark:bg-[#2f2f31] text-slate-500 dark:text-white/40 font-sans shadow-sm">↵</kbd>
                        <span>to send</span>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Sparkles, Zap, Brain, Check, Bot, Globe, Cpu, Wind, Terminal } from "lucide-react";
import { BACKEND_URL } from "@/lib/config";

interface Model {
    id: string;
    name: string;
    provider: string;
    description: string;
}

const PROVIDER_COLORS: Record<string, string> = {
    Google: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    OpenAI: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Anthropic: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    Perplexity: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    Groq: "text-red-400 bg-red-500/10 border-red-500/20",
    Mistral: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    xAI: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
};

const PROVIDER_ICONS: Record<string, any> = {
    Google: Sparkles,
    OpenAI: Brain,
    Anthropic: Bot,
    Perplexity: Globe,
    Groq: Cpu,
    Mistral: Wind,
    xAI: Terminal,
};

const STORAGE_KEY = "purplexity-selected-model";

export function useModelSelection() {
    const [models, setModels] = useState<Model[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEY) || "";
    });
    const [defaultModel, setDefaultModel] = useState<string>("");

    useEffect(() => {
        fetch(`${BACKEND_URL}/models`)
            .then(res => res.json())
            .then(data => {
                setModels(data.models || []);
                setDefaultModel(data.default || "");
                if (!selectedModel && data.default) {
                    setSelectedModel(data.default);
                }
            })
            .catch(() => {
                // Fallback models if backend isn't reachable
                setModels([
                    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", description: "Next-gen speed & efficiency" },
                    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", description: "Next-gen advanced reasoning" },
                ]);
                setDefaultModel("gemini-2.5-flash");
                if (!selectedModel) setSelectedModel("gemini-2.5-flash");
            });
    }, []);

    const selectModel = (id: string) => {
        setSelectedModel(id);
        localStorage.setItem(STORAGE_KEY, id);
    };

    return { models, selectedModel, defaultModel, selectModel };
}

interface ModelSelectorProps {
    models: Model[];
    selectedModel: string;
    onSelect: (id: string) => void;
    compact?: boolean;
}

export default function ModelSelector({ models, selectedModel, onSelect, compact = false }: ModelSelectorProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const current = models.find(m => m.id === selectedModel);
    const Icon = current ? (PROVIDER_ICONS[current.provider] || Zap) : Zap;
    const currentColors = current ? PROVIDER_COLORS[current.provider] : "text-white/50";

    return (
        <div ref={ref} className="relative z-50">
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(!open)}
                className={`
                    group relative flex items-center gap-2 rounded-xl border transition-all duration-300
                    cursor-pointer overflow-hidden
                    ${open 
                        ? "bg-white/[0.08] border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
                        : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15]"}
                    ${compact ? "px-2.5 py-1.5" : "px-3.5 py-2"}
                `}
            >
                {/* Subtle active glow */}
                {open && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-50 blur-xl pointer-events-none" />
                )}
                
                <div className={`flex items-center justify-center ${currentColors?.split(" ")[0]} transition-transform duration-300 ${open ? "scale-110" : ""}`}>
                    <Icon className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
                </div>
                
                <span className={`font-medium tracking-wide transition-colors duration-200 ${open ? "text-white" : "text-white/80"} ${compact ? "text-[11px]" : "text-sm"}`}>
                    {current?.name || "Select Model"}
                </span>
                
                <ChevronDown className={`ml-1 text-white/40 transition-all duration-300 ${open ? "rotate-180 text-white/80" : "group-hover:text-white/60"} ${compact ? "w-3 h-3" : "w-4 h-4"}`} />
            </button>

            {/* Dropdown Menu */}
            <div 
                className={`
                    absolute bottom-[calc(100%+8px)] left-0 w-[300px] origin-bottom-left transition-all duration-300 ease-out
                    ${open ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 translate-y-2 scale-95 pointer-events-none"}
                `}
            >
                <div className="rounded-2xl border border-white/[0.12] bg-[oklch(0.12_0.01_270)]/90 backdrop-blur-2xl shadow-2xl shadow-black p-1.5">
                    
                    <div className="flex items-center px-3 py-2 mb-1 border-b border-white/[0.06]">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em]">
                            Available Models
                        </span>
                    </div>

                    <div className="space-y-1 max-h-[340px] overflow-y-auto scrollbar-thin pr-0.5">
                        {models.map((model, idx) => {
                            const ModelIcon = PROVIDER_ICONS[model.provider] || Zap;
                            const isSelected = model.id === selectedModel;
                            const colors = PROVIDER_COLORS[model.provider] || "text-white/40 bg-white/5 border-white/10";

                            return (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        onSelect(model.id);
                                        setOpen(false);
                                    }}
                                    className={`
                                        relative w-full flex items-start gap-3 p-2.5 rounded-xl text-left
                                        transition-all duration-200 cursor-pointer overflow-hidden group
                                        ${isSelected
                                            ? "bg-white/[0.08] border border-white/[0.1]"
                                            : "hover:bg-white/[0.04] border border-transparent"
                                        }
                                    `}
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {/* Selection Glow */}
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
                                    )}

                                    <div className={`mt-0.5 w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 shadow-inner transition-transform duration-300 ${isSelected ? "scale-105" : "group-hover:scale-105"} ${colors}`}>
                                        <ModelIcon className="w-4 h-4" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 z-10">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`text-sm font-semibold truncate transition-colors ${isSelected ? "text-white" : "text-white/80 group-hover:text-white"}`}>
                                                {model.name}
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/40 line-clamp-1 leading-relaxed">
                                            {model.description}
                                        </p>
                                    </div>

                                    {/* Checkmark */}
                                    <div className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 transition-all duration-300 ${isSelected ? "bg-indigo-500 text-white opacity-100 scale-100" : "opacity-0 scale-50"}`}>
                                        <Check className="w-3 h-3" strokeWidth={3} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

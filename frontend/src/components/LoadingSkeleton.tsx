import { useState, useEffect } from "react";
import { Globe, BookOpen, Sparkles } from "lucide-react";

const phases = [
    { icon: Globe, label: "Searching the web...", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { icon: BookOpen, label: "Reading sources...", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { icon: Sparkles, label: "Generating answer...", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
];

export default function LoadingSkeleton() {
    const [phaseIndex, setPhaseIndex] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhaseIndex(1), 1500),
            setTimeout(() => setPhaseIndex(2), 3200),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    const phase = phases[phaseIndex]!;
    const Icon = phase.icon;

    return (
        <div className="space-y-5">
            {/* Phase indicator */}
            <div className="flex items-center gap-3 animate-fade-in" key={phaseIndex}>
                <div className={`w-8 h-8 rounded-xl border ${phase.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${phase.color} animate-pulse`} />
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${phase.color}`}>{phase.label}</span>
                    <div className="flex gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-white/30 animate-pulse" />
                        <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-white/30 animate-pulse delay-150" />
                        <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-white/30 animate-pulse delay-300" />
                    </div>
                </div>
            </div>

            {/* Progress steps */}
            <div className="flex items-center gap-2 px-1">
                {phases.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className={`
                            w-2 h-2 rounded-full transition-all duration-500
                            ${i <= phaseIndex
                                ? `${i === phaseIndex ? "scale-125" : ""} bg-gradient-to-r from-indigo-400 to-violet-400 shadow-sm shadow-indigo-500/40`
                                : "bg-slate-200 dark:bg-white/10"
                            }
                        `} />
                        {i < phases.length - 1 && (
                            <div className={`w-12 h-[2px] rounded-full transition-all duration-700 ${i < phaseIndex ? "bg-indigo-500/40" : "bg-slate-200 dark:bg-white/[0.06]"}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Skeleton content */}
            <div className="space-y-3 mt-2">
                <div className="h-3 bg-slate-200 dark:bg-white/[0.04] rounded-lg w-[92%] animate-pulse" />
                <div className="h-3 bg-slate-200 dark:bg-white/[0.04] rounded-lg w-[78%] animate-pulse delay-100" />
                <div className="h-3 bg-slate-200 dark:bg-white/[0.04] rounded-lg w-[85%] animate-pulse delay-200" />
                <div className="h-3 bg-slate-200 dark:bg-white/[0.04] rounded-lg w-[65%] animate-pulse delay-300" />
            </div>

            {/* Source card skeletons — only show from phase 1+ */}
            {phaseIndex >= 1 && (
                <div className="flex gap-3 animate-fade-in-up">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`
                            w-[200px] h-[60px] bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/[0.04]
                            animate-fade-in-up ${i === 1 ? "" : i === 2 ? "delay-75" : "delay-150"}
                        `}>
                            <div className="p-3 space-y-2">
                                <div className="h-2.5 bg-slate-200 dark:bg-white/[0.04] rounded w-[80%]" />
                                <div className="h-2 bg-slate-100 dark:bg-white/[0.03] rounded w-[50%]" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

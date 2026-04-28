import { ArrowRight } from "lucide-react";

interface FollowUpChipsProps {
    questions: string[];
    onSelect: (question: string) => void;
    disabled?: boolean;
}

const staggerDelays = ["", "delay-75", "delay-150"];

export default function FollowUpChips({ questions, onSelect, disabled }: FollowUpChipsProps) {
    if (questions.length === 0) return null;

    return (
        <div className="space-y-2.5 animate-fade-in">
            <p className="text-[11px] font-semibold text-slate-400 dark:text-white/25 uppercase tracking-wider">
                Related questions
            </p>
            <div className="flex flex-col gap-2">
                {questions.map((q, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(q)}
                        disabled={disabled}
                        className={`
                            group flex items-center gap-3 px-4 py-3 w-full text-left
                            bg-white dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.05]
                            border border-slate-200 dark:border-white/[0.05] hover:border-indigo-300 dark:hover:border-indigo-500/25
                            rounded-xl text-sm text-slate-600 dark:text-white/55 hover:text-slate-900 dark:hover:text-white/90
                            transition-all duration-300 cursor-pointer shadow-sm dark:shadow-none
                            disabled:opacity-30 disabled:cursor-not-allowed
                            animate-fade-in-up ${staggerDelays[i] || "delay-200"}
                        `}
                    >
                        <span className="flex-1 leading-relaxed">{q}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400/50 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 opacity-0 group-hover:opacity-100" />
                    </button>
                ))}
            </div>
        </div>
    );
}

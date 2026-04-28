import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router";
import { Sparkles, ArrowRight } from "lucide-react";

interface CreditGuardProps {
    children: React.ReactNode;
}

/**
 * Wraps search functionality — shows upgrade CTA when credits reach 0.
 * Renders children normally when user has credits.
 */
export default function CreditGuard({ children }: CreditGuardProps) {
    const { credits } = useAuth();
    const navigate = useNavigate();

    if (credits !== null && credits <= 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in-up">
                {/* Glow */}
                <div className="absolute pointer-events-none">
                    <div className="w-[300px] h-[300px] bg-amber-500/[0.04] rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center max-w-md">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center mb-5 animate-float">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">
                        You're out of credits
                    </h2>
                    <p className="text-white/40 text-sm mb-6 leading-relaxed">
                        Upgrade your plan to continue searching with AI-powered intelligence. 
                        Get instant access to web search and cited answers.
                    </p>

                    <button
                        onClick={() => navigate("/pricing")}
                        className="group flex items-center gap-2.5 px-6 py-3 rounded-xl
                            bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400
                            text-white font-semibold text-sm shadow-lg shadow-amber-500/20
                            transition-all duration-300 cursor-pointer"
                    >
                        <span>Upgrade Plan</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <p className="text-white/20 text-xs mt-4">
                        Plans start at $19 for 1,000 searches
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

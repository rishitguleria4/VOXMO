import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router";
import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { Check, Sparkles, Zap, ArrowLeft } from "lucide-react";

export default function Pricing() {
    const { jwt, credits } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleCheckout = async (plan: "pro" | "max") => {
        if (!jwt) return;
        setIsLoading(plan);
        try {
            const res = await axios.post(
                `${BACKEND_URL}/create-checkout-session`,
                { plan },
                { headers: { Authorization: `Bearer ${jwt}` } }
            );
            if (res.data.url) {
                window.location.href = res.data.url;
            }
        } catch (e) {
            console.error("Checkout failed:", e);
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="shrink-0 flex items-center gap-3 h-14 px-6 border-b border-slate-200 dark:border-white/[0.06]">
                <button
                    onClick={() => navigate("/")}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-500 hover:text-slate-800 dark:text-white/40 dark:hover:text-white/70 transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="text-sm font-medium text-slate-700 dark:text-white/70">Pricing</h1>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
                {/* Background glow */}
                <div className="absolute pointer-events-none">
                    <div className="w-[600px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Choose Your Plan</h2>
                    <p className="text-slate-500 dark:text-white/30 text-lg">
                        You currently have <span className="text-amber-500 dark:text-amber-400 font-semibold">{credits ?? "..."}</span> credits
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-3xl w-full relative z-10">
                    {/* Pro Plan */}
                    <div className="group relative bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] hover:border-indigo-300 dark:hover:border-white/[0.12] shadow-sm dark:shadow-none rounded-2xl p-8 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-100 dark:bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/10 transition-colors" />

                        <div className="relative">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Pro</h3>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-black text-slate-900 dark:text-white">$19</span>
                                <span className="text-slate-500 dark:text-white/30 ml-1">USD</span>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {["1,000 Search Credits", "Standard Response Time", "Web Search + AI Answers", "Source Citations"].map((feature) => (
                                    <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-white/60 font-medium dark:font-normal">
                                        <Check className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleCheckout("pro")}
                                disabled={isLoading !== null}
                                className="w-full py-3 px-4 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-transparent dark:border-white/[0.08] dark:hover:border-white/[0.15] text-slate-800 dark:text-white rounded-xl font-bold dark:font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer"
                            >
                                {isLoading === "pro" ? "Processing..." : "Get Pro"}
                            </button>
                        </div>
                    </div>

                    {/* Max Plan */}
                    <div className="group relative bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-500/[0.06] dark:to-white/[0.02] border border-indigo-200 dark:border-indigo-500/20 hover:border-indigo-300 dark:hover:border-indigo-500/40 shadow-md dark:shadow-none rounded-2xl p-8 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-violet-100 dark:bg-violet-500/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-violet-200 dark:group-hover:bg-violet-500/10 transition-colors" />

                        {/* Badge */}
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm dark:shadow-lg dark:shadow-indigo-500/20">
                            Best Value
                        </div>

                        <div className="relative">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                                </div>
                                <h3 className="text-lg font-bold text-indigo-900 dark:text-white">Max</h3>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-black text-indigo-950 dark:text-white">$50</span>
                                <span className="text-indigo-500 dark:text-white/30 ml-1">USD</span>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {["5,000 Search Credits", "Priority API Access", "Web Search + AI Answers", "Source Citations", "Follow-up Questions"].map((feature) => (
                                    <li key={feature} className="flex items-center gap-2.5 text-sm text-indigo-800 dark:text-white/60 font-medium dark:font-normal">
                                        <Check className="w-4 h-4 text-violet-500 dark:text-violet-400 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleCheckout("max")}
                                disabled={isLoading !== null}
                                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold dark:font-medium shadow-md dark:shadow-lg dark:shadow-indigo-500/20 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                            >
                                {isLoading === "max" ? "Processing..." : "Get Max"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

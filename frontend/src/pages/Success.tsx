import { useNavigate, useSearchParams } from "react-router";
import { CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/lib/config";

export default function Success() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { jwt, refreshCredits } = useAuth();
    const [verifying, setVerifying] = useState(true);
    const [verified, setVerified] = useState(false);
    const [addedCredits, setAddedCredits] = useState(0);

    useEffect(() => {
        const sessionId = searchParams.get("session_id");
        if (!sessionId || !jwt) {
            setVerifying(false);
            return;
        }

        // Call backend to verify the payment and add credits
        fetch(`${BACKEND_URL}/verify-payment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jwt}`,
            },
            body: JSON.stringify({ sessionId }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setVerified(true);
                    setAddedCredits(data.credits);
                    refreshCredits();
                }
            })
            .catch(() => {
                // Silently fail — credits may have already been added
            })
            .finally(() => {
                setVerifying(false);
                // Refresh credits regardless
                refreshCredits();
            });
    }, [searchParams, jwt, refreshCredits]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute pointer-events-none">
                <div className="w-[400px] h-[400px] bg-emerald-500/[0.05] rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] p-10 rounded-3xl flex flex-col items-center max-w-md w-full mx-4 text-center backdrop-blur-sm shadow-xl dark:shadow-none">
                {verifying ? (
                    <>
                        <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
                            <Loader2 className="text-indigo-400 w-8 h-8 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verifying Payment...</h1>
                        <p className="text-slate-500 dark:text-white/40 text-sm">Please wait while we confirm your purchase.</p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                            <CheckCircle className="text-emerald-400 w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful!</h1>
                        {addedCredits > 0 && (
                            <p className="text-emerald-500 dark:text-emerald-400 font-semibold text-lg mb-1">
                                +{addedCredits} credits added
                            </p>
                        )}
                        <p className="text-slate-500 dark:text-white/40 text-sm mb-8">Your credits have been added to your account. Start searching with AI-powered intelligence.</p>
                        <button
                            onClick={() => navigate("/")}
                            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
                        >
                            Start Searching
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

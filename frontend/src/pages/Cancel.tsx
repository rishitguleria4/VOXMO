import { useNavigate } from "react-router";
import { XCircle } from "lucide-react";

export default function Cancel() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute pointer-events-none">
                <div className="w-[400px] h-[400px] bg-red-500/[0.03] rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 bg-white/[0.03] border border-white/[0.08] p-10 rounded-3xl flex flex-col items-center max-w-md w-full mx-4 text-center backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
                    <XCircle className="text-red-400 w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
                <p className="text-white/40 text-sm mb-8">No charges were made to your account. You can try again anytime.</p>
                <div className="flex gap-3 w-full">
                    <button
                        onClick={() => navigate("/pricing")}
                        className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white font-medium py-3 rounded-xl transition-all cursor-pointer"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/60 font-medium py-3 rounded-xl transition-all cursor-pointer"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
}

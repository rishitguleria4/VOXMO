import { createContext, useContext, useState, useCallback, createElement, type ReactNode } from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

// ─── Types ───
type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType, duration?: number) => void;
}

// ─── Context ───
const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}

// ─── Icon map ───
const iconMap: Record<ToastType, typeof CheckCircle> = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

const colorMap: Record<ToastType, string> = {
    success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    error: "text-red-400 bg-red-500/10 border-red-500/20",
    info: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

const progressMap: Record<ToastType, string> = {
    success: "bg-emerald-400",
    error: "bg-red-400",
    info: "bg-indigo-400",
    warning: "bg-amber-400",
};

// ─── Provider ───
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = "info", duration: number = 3000) => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { id, message, type, duration }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return createElement(
        ToastContext.Provider,
        { value: { toast: addToast } },
        children,
        /* Toast container */
        createElement(
            "div",
            {
                className: "fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 pointer-events-none",
                "aria-live": "polite",
            },
            toasts.map(t => {
                const Icon = iconMap[t.type];
                return createElement(
                    "div",
                    {
                        key: t.id,
                        className: `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border
                            backdrop-blur-xl shadow-2xl shadow-black/20 min-w-[280px] max-w-[420px]
                            animate-toast-enter ${colorMap[t.type]}`,
                        role: "alert",
                    },
                    createElement(Icon, { className: "w-4 h-4 shrink-0" }),
                    createElement("p", { className: "flex-1 text-sm text-white/90 font-medium" }, t.message),
                    createElement(
                        "button",
                        {
                            onClick: () => removeToast(t.id),
                            className: "shrink-0 p-0.5 rounded-md hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors cursor-pointer",
                        },
                        createElement(X, { className: "w-3.5 h-3.5" })
                    ),
                    /* Progress bar */
                    createElement(
                        "div",
                        { className: "absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl overflow-hidden" },
                        createElement("div", {
                            className: `h-full ${progressMap[t.type]}`,
                            style: { animation: `progress-bar ${t.duration}ms linear forwards` },
                        })
                    )
                );
            })
        )
    );
}

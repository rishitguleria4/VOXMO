import { useAuth } from "@/lib/AuthContext";
import { SidebarProvider, useSidebar } from "@/lib/SidebarContext";
import { Navigate } from "react-router";
import Sidebar from "./Sidebar";
import type { ReactNode } from "react";

function LayoutInner({ children }: { children: ReactNode }) {
    const { collapsed } = useSidebar();

    return (
        <div className="min-h-screen flex relative bg-slate-50 dark:bg-background">
            {/* Ambient background mesh */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[10%] left-[15%] w-[600px] h-[600px] bg-[oklch(0.75_0.15_250)]/[0.02] rounded-full blur-[160px] animate-mesh-1" />
                <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-[oklch(0.75_0.15_250)]/[0.02] rounded-full blur-[140px] animate-mesh-2" />
            </div>

            {/* Top gradient accent bar */}
            <div className="fixed top-0 left-0 right-0 h-[1px] z-50 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

            <Sidebar />
            <main
                className="flex-1 min-h-screen transition-all duration-300 relative z-10"
                style={{ marginLeft: collapsed ? 60 : 280 }}
            >
                {children}
            </main>
        </div>
    );
}

export default function AppLayout({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background">
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                        <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    </div>
                    <p className="text-slate-500 dark:text-white/25 text-sm font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    return (
        <SidebarProvider>
            <LayoutInner>{children}</LayoutInner>
        </SidebarProvider>
    );
}

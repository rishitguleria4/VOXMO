import { useAuth } from "@/lib/AuthContext";
import { useSidebar } from "@/lib/SidebarContext";
import { useNavigate, useLocation } from "react-router";
import { MessageSquare, Settings, CreditCard, LogOut, Search, Plus, BarChart3, ChevronLeft, ChevronRight, Moon, Sun, Sparkles, Trash2 } from "lucide-react";
import { useTheme } from "../lib/useTheme";

export default function Sidebar() {
    const { user, credits, conversations, usage, signOut, deleteConversation } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { collapsed, toggle } = useSidebar();
    const navigate = useNavigate();
    const location = useLocation();

    if (!user) return null;

    // Credit bar percentage (out of 50 default credits as base gauge)
    const creditMax = Math.max(credits ?? 0, 50);
    const creditPercent = credits !== null ? Math.min((credits / creditMax) * 100, 100) : 0;
    const creditColor = credits !== null && credits <= 5
        ? "from-red-500 to-orange-500"
        : credits !== null && credits <= 20
            ? "from-amber-500 to-yellow-500"
            : "from-indigo-500 to-violet-500";

    const handleNewSearch = () => {
        if (location.pathname === "/") {
            // Already on search page — force a full reload to clear results
            window.location.reload();
        } else {
            navigate("/");
        }
    };

    return (
        <aside
            className={`
                fixed top-0 left-0 h-screen z-40 flex flex-col
                bg-white/70 dark:bg-[oklch(0.11_0.005_285)]/90 backdrop-blur-xl
                border-r border-slate-200 dark:border-white/[0.06]
                transition-all duration-300 ease-in-out
                ${collapsed ? "w-[60px]" : "w-[280px]"}
            `}
        >
            {/* Header */}
            <div className={`flex items-center h-14 px-4 border-b border-slate-200 dark:border-white/[0.06] ${collapsed ? "justify-center" : "justify-between"}`}>
                {!collapsed && (
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleNewSearch}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                            <Search className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white text-sm tracking-tight">Voxmo</span>
                    </div>
                )}
                <button
                    onClick={toggle}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-400 hover:text-slate-700 dark:text-white/30 dark:hover:text-white/60 transition-colors cursor-pointer"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* New Search Button */}
            <div className="p-3">
                <button
                    onClick={handleNewSearch}
                    className={`
                        w-full flex items-center gap-2.5 rounded-xl font-medium text-sm
                        bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
                        text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30
                        transition-all duration-200 cursor-pointer active:scale-[0.98]
                        ${collapsed ? "justify-center p-2.5" : "px-4 py-2.5"}
                    `}
                    title="New Search"
                >
                    <Plus className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>New Search</span>}
                </button>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin">
                {!collapsed && (
                    <p className="px-2 py-2 text-[11px] font-semibold text-slate-500 dark:text-white/20 uppercase tracking-wider">
                        Recent
                    </p>
                )}
                <div className="space-y-0.5">
                    {conversations.map((conv) => {
                        const isActive = location.pathname === `/conversation/${conv.id}`;
                        return (
                            <div key={conv.id} className="group/item relative flex items-center">
                                <button
                                    onClick={() => navigate(`/conversation/${conv.id}`)}
                                    title={conv.title || conv.slug}
                                    className={`
                                        w-full flex items-center gap-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer
                                        ${collapsed ? "justify-center p-2.5" : "px-3 py-2 pr-8"}
                                        ${isActive
                                            ? "bg-slate-100 text-slate-900 border border-slate-200 dark:bg-white/[0.08] dark:text-white dark:border-white/[0.06]"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-white/45 dark:hover:text-white/75 dark:hover:bg-white/[0.04] border border-transparent"
                                        }
                                    `}
                                >
                                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                                    {!collapsed && (
                                        <span className="truncate text-left text-[13px]">
                                            {conv.title || conv.slug}
                                        </span>
                                    )}
                                </button>
                                {!collapsed && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Delete this conversation?")) {
                                                deleteConversation(conv.id);
                                                if (isActive) navigate("/");
                                            }
                                        }}
                                        className="absolute right-1.5 p-1 rounded-md opacity-0 group-hover/item:opacity-100
                                            text-slate-400 hover:text-red-500 hover:bg-red-50
                                            dark:text-white/20 dark:hover:text-red-400 dark:hover:bg-red-500/10
                                            transition-all cursor-pointer"
                                        title="Delete conversation"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {conversations.length === 0 && !collapsed && (
                        <p className="px-3 py-6 text-xs text-slate-400 dark:text-white/15 text-center">No conversations yet</p>
                    )}
                </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-slate-200 dark:border-white/[0.06] p-3 space-y-1">
                {/* Credit bar */}
                {!collapsed && credits !== null && (
                    <div className="px-3 py-2.5 mb-1">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] text-slate-500 dark:text-white/30 font-medium">Credits</span>
                            <span className="text-[11px] font-semibold text-slate-800 dark:text-white/60">{credits}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r ${creditColor} transition-all duration-700 ease-out`}
                                style={{ width: `${creditPercent}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Credits (collapsed) */}
                {collapsed && (
                    <button
                        onClick={() => navigate("/pricing")}
                        className="w-full flex justify-center p-2.5 rounded-lg text-amber-400/60 hover:text-amber-400 hover:bg-white/[0.04] transition-colors cursor-pointer"
                        title={`${credits ?? "..."} credits`}
                    >
                        <Sparkles className="w-4 h-4" />
                    </button>
                )}

                {/* Usage stats */}
                {!collapsed && usage && (
                    <div className="px-3 py-1.5 flex items-center gap-2 text-slate-500 dark:text-white/25 text-[11px]">
                        <BarChart3 className="w-3 h-3" />
                        <span>{usage.totalSearches} searches</span>
                    </div>
                )}

                {/* Upgrade Plan */}
                <button
                    onClick={() => navigate("/pricing")}
                    className={`
                        w-full flex items-center gap-2.5 rounded-lg text-sm transition-colors cursor-pointer
                        text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-white/40 dark:hover:text-white/70 dark:hover:bg-white/[0.04]
                        ${collapsed ? "justify-center p-2.5" : "px-3 py-2"}
                    `}
                    title="Upgrade Plan"
                >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="text-[13px]">Upgrade Plan</span>}
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className={`
                        w-full flex items-center gap-2.5 rounded-lg text-sm transition-colors cursor-pointer
                        text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-white/40 dark:hover:text-white/70 dark:hover:bg-white/[0.04]
                        ${collapsed ? "justify-center p-2.5" : "px-3 py-2"}
                    `}
                    title="Toggle Theme"
                >
                    {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
                    {!collapsed && <span className="text-[13px]">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
                </button>

                {/* Sign Out */}
                <button
                    onClick={signOut}
                    className={`
                        w-full flex items-center gap-2.5 rounded-lg text-sm transition-colors cursor-pointer
                        text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-white/25 dark:hover:text-red-400 dark:hover:bg-red-500/[0.05]
                        ${collapsed ? "justify-center p-2.5" : "px-3 py-2"}
                    `}
                    title="Sign Out"
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="text-[13px]">Sign Out</span>}
                </button>

                {/* User info */}
                {!collapsed && user && (
                    <div className="flex items-center gap-2.5 px-3 py-2 mt-1 rounded-lg bg-slate-50 border border-slate-200 dark:bg-white/[0.02] dark:border-white/[0.04]">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm shadow-indigo-500/20">
                            {user.email?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span className="text-[11px] text-slate-600 dark:text-white/30 truncate">{user.email}</span>
                    </div>
                )}
                {collapsed && user && (
                    <div className="flex justify-center p-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {user.email?.[0]?.toUpperCase() ?? "?"}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}

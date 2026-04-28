import { createContext, useContext, useEffect, useState, useCallback, createElement, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import axios from "axios";
import { BACKEND_URL } from "@/lib/config";

const supabase = createClient();

interface Conversation {
    id: string;
    title: string | null;
    slug: string;
    userId: string;
}

interface UsageStats {
    totalSearches: number;
    totalMessages: number;
}

interface AuthContextType {
    user: User | null;
    jwt: string | null;
    credits: number | null;
    conversations: Conversation[];
    usage: UsageStats | null;
    isLoading: boolean;
    refreshCredits: () => Promise<void>;
    refreshConversations: () => Promise<void>;
    refreshUsage: () => Promise<void>;
    /** Optimistically subtract credits locally (restored on error) */
    deductCreditOptimistic: () => void;
    deleteConversation: (id: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [jwt, setJwt] = useState<string | null>(null);
    const [credits, setCredits] = useState<number | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize user
    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const { data: { session } } = await supabase.auth.getSession();
                setJwt(session?.access_token ?? null);
            }
            setIsLoading(false);
        }
        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            setJwt(session?.access_token ?? null);
            if (!session?.user) {
                setCredits(null);
                setConversations([]);
                setUsage(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const refreshCredits = useCallback(async () => {
        if (!jwt) return;
        try {
            const res = await axios.get(`${BACKEND_URL}/credits`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            setCredits(res.data.credits);
        } catch (e) {
            console.error("Failed to fetch credits:", e);
        }
    }, [jwt]);

    const refreshConversations = useCallback(async () => {
        if (!jwt) return;
        try {
            const res = await axios.get(`${BACKEND_URL}/conversations`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            setConversations(res.data.conversations ?? []);
        } catch (e) {
            console.error("Failed to fetch conversations:", e);
        }
    }, [jwt]);

    const refreshUsage = useCallback(async () => {
        if (!jwt) return;
        try {
            const res = await axios.get(`${BACKEND_URL}/usage`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            setUsage({
                totalSearches: res.data.totalSearches,
                totalMessages: res.data.totalMessages,
            });
            // Also sync credits from usage endpoint
            if (typeof res.data.credits === "number") {
                setCredits(res.data.credits);
            }
        } catch (e) {
            console.error("Failed to fetch usage:", e);
        }
    }, [jwt]);

    // Optimistic credit deduction — immediately updates UI, backend confirms later
    const deductCreditOptimistic = useCallback(() => {
        setCredits(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, []);

    const deleteConversation = useCallback(async (id: string) => {
        if (!jwt) return;
        // Optimistic removal
        setConversations(prev => prev.filter(c => c.id !== id));
        try {
            await axios.delete(`${BACKEND_URL}/conversation/${id}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
        } catch (e) {
            console.error("Failed to delete conversation:", e);
            // Restore on failure
            refreshConversations();
        }
    }, [jwt, refreshConversations]);

    // Fetch data when jwt becomes available
    useEffect(() => {
        if (jwt) {
            refreshCredits();
            refreshConversations();
            refreshUsage();
        }
    }, [jwt, refreshCredits, refreshConversations, refreshUsage]);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setJwt(null);
        setCredits(null);
        setConversations([]);
        setUsage(null);
    }, []);

    return createElement(
        AuthContext.Provider,
        {
            value: {
                user, jwt, credits, conversations, usage, isLoading,
                refreshCredits, refreshConversations, refreshUsage,
                deductCreditOptimistic, deleteConversation, signOut,
            },
        },
        children
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { BACKEND_URL } from "@/lib/config";
const supabase = createClient();

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [credits, setCredits] = useState<number | null>(null);
    const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);

    useEffect(() => {
        async function getInfo() {
            const { data, error } = await supabase.auth.getUser();
            if (error) {
                console.error(error);
            }
            if (data.user) {
                console.log("user is signed in");
                setUser(data.user);
            }
        }
        getInfo();
    }, []);

    useEffect(() => {
        async function getExistingConversations() {
            if (!user) {
                return;
            }

            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                const jwt = session?.access_token;

                if (!jwt) {
                    console.warn("No auth token available for conversations request");
                    return;
                }

                const response = await axios.get(`${BACKEND_URL}/conversations`, {
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                    },
                });

                const creditsResponse = await axios.get(`${BACKEND_URL}/credits`, {
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                    },
                });

                console.log(response.data);
                setCredits(creditsResponse.data.credits);
            } catch (error) {
                console.error("Failed to load conversations:", error);
            }
        }

        getExistingConversations();
    }, [user]);

    const handleCheckout = async (plan: 'pro' | 'max') => {
        setIsCheckoutLoading(plan);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const jwt = session?.access_token;
            if (!jwt) return;

            const response = await axios.post(`${BACKEND_URL}/create-checkout-session`, { plan }, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error("Checkout failed:", error);
        } finally {
            setIsCheckoutLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-800 dark:text-neutral-200 p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center justify-between mb-12 pb-6 border-b border-slate-200 dark:border-neutral-800">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400">Voxmo Dashboard</h1>
                        {user && <p className="text-slate-500 dark:text-neutral-400 mt-2 font-medium dark:font-normal">Welcome back, {user.email}</p>}
                    </div>

                    {!user ? (
                        <button
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors"
                            onClick={() => navigate("/auth")}
                        >
                            Sign In
                        </button>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm dark:shadow-none px-4 py-2 rounded-full flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                                <span className="font-semibold text-slate-700 dark:text-white">{credits !== null ? credits : '...'} Credits</span>
                            </div>
                            <button
                                className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white font-medium dark:font-normal transition-colors"
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    setUser(null);
                                }}
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </header>

                {user && (
                    <main>
                        <div className="mb-12">
                            <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-white">Buy More Credits</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Pro Plan Card */}
                                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-sm dark:shadow-none rounded-2xl p-8 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md dark:hover:shadow-none transition-all relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 dark:bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/20 transition-colors"></div>
                                    <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">Pro Plan</h3>
                                    <div className="text-4xl font-black mb-4 text-slate-900 dark:text-white">$19 <span className="text-lg text-slate-500 dark:text-neutral-500 font-normal">USD</span></div>
                                    <ul className="space-y-3 mb-8 text-slate-600 dark:text-neutral-300 font-medium dark:font-normal">
                                        <li className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            1,000 Search Credits
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            Standard Response Time
                                        </li>
                                    </ul>
                                    <button
                                        onClick={() => handleCheckout('pro')}
                                        disabled={isCheckoutLoading !== null}
                                        className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-white rounded-lg font-bold dark:font-medium transition-colors disabled:opacity-50"
                                    >
                                        {isCheckoutLoading === 'pro' ? 'Processing...' : 'Get Pro'}
                                    </button>
                                </div>

                                {/* Max Plan Card */}
                                <div className="bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-900/40 dark:to-neutral-900 border border-indigo-200 dark:border-indigo-500/30 shadow-md dark:shadow-none rounded-2xl p-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-200/40 dark:bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cyan-300/40 dark:group-hover:bg-cyan-500/20 transition-colors"></div>
                                    <div className="absolute top-4 right-4 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Best Value</div>
                                    <h3 className="text-xl font-bold mb-2 text-indigo-900 dark:text-indigo-100">Max Plan</h3>
                                    <div className="text-4xl font-black mb-4 text-indigo-950 dark:text-white">$50 <span className="text-lg text-indigo-500 dark:text-indigo-200/50 font-normal">USD</span></div>
                                    <ul className="space-y-3 mb-8 text-indigo-800 dark:text-neutral-300 font-medium dark:font-normal">
                                        <li className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-cyan-500 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            5,000 Search Credits
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-cyan-500 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            Priority API Access
                                        </li>
                                    </ul>
                                    <button
                                        onClick={() => handleCheckout('max')}
                                        disabled={isCheckoutLoading !== null}
                                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                                    >
                                        {isCheckoutLoading === 'max' ? 'Processing...' : 'Get Max'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Conversations placeholder - you can add the list here later */}
                        <div>
                            <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-white">Recent Conversations</h2>
                            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-8 text-center text-slate-500 dark:text-neutral-500 font-medium dark:font-normal shadow-sm dark:shadow-none">
                                Your conversations will appear here.
                            </div>
                        </div>
                    </main>
                )}
            </div>
        </div>
    );
}

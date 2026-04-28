import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from "./lib/AuthContext";
import { ToastProvider } from "./components/Toast";
import { ThemeProvider } from "./lib/useTheme";
import AppLayout from "./components/AppLayout";
import Auth from "./pages/Auth";
import SearchPage from "./pages/Search";
import Conversation from "./pages/Conversation";
import Pricing from "./pages/Pricing";
import Success from "./pages/Success";
import Cancel from "./pages/Cancel";

export function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ThemeProvider>
                    <ToastProvider>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/payment/success" element={<Success />} />
                            <Route path="/payment/cancel" element={<Cancel />} />

                            {/* Protected routes (wrapped in AppLayout with sidebar) */}
                            <Route
                                path="/"
                                element={
                                    <AppLayout>
                                        <SearchPage />
                                    </AppLayout>
                                }
                            />
                            <Route
                                path="/conversation/:conversationId"
                                element={
                                    <AppLayout>
                                        <Conversation />
                                    </AppLayout>
                                }
                            />
                            <Route
                                path="/pricing"
                                element={
                                    <AppLayout>
                                        <Pricing />
                                    </AppLayout>
                                }
                            />
                        </Routes>
                    </ToastProvider>
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

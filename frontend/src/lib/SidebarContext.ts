import { createContext, useContext, useState, type ReactNode, createElement } from "react";

interface SidebarContextType {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
    toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const toggle = () => setCollapsed(prev => !prev);

    return createElement(
        SidebarContext.Provider,
        { value: { collapsed, setCollapsed, toggle } },
        children
    );
}

export function useSidebar() {
    const ctx = useContext(SidebarContext);
    if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
    return ctx;
}

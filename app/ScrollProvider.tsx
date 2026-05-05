"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

const ScrollContext = createContext(null);

export function ScrollProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    // Disable browser scroll restoration once
    useEffect(() => {
        if ("scrollRestoration" in history) {
            history.scrollRestoration = "manual";
        }
    }, []);

    useEffect(() => {
        const resetScroll = () => {
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            window.scrollTo(0, 0);
        };

        // run after paint to avoid visual jump issues
        requestAnimationFrame(resetScroll);
    }, [pathname]);

    return (
        <ScrollContext.Provider value={null}>
            {children}
        </ScrollContext.Provider>
    );
}

export function useScroll() {
    return useContext(ScrollContext);
}
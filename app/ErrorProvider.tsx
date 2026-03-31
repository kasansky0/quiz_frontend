"use client";

import { useEffect, createContext, useContext, useState, useRef, ReactNode } from "react";
import { signIn } from "next-auth/react";
import { usePathname } from "next/navigation";

interface ErrorContextType {
    showError: (msg: string | object, showLoginButton?: boolean) => void;
    hideError: () => void;
    message: string | null;
    showLoginButton: boolean;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
    const [message, setMessage] = useState<string | null>(null);
    const [showLoginButton, setShowLoginButton] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        hideError(); // clear banner on route change
    }, [pathname]);

    const showError = (msg: string | object, showLoginBtn: boolean = false) => {
        let finalMsg = "";

        if (typeof msg === "string") {
            finalMsg = msg;
        } else if (typeof msg === "object" && msg !== null) {
            // Try known fields first, fallback to generic
            finalMsg =
                (msg as any).msg ||
                (msg as any).detail ||
                (msg as any).error ||
                "Something went wrong";
        } else {
            finalMsg = "Something went wrong";
        }

        // Limit long messages
        if (finalMsg.length > 200) finalMsg = finalMsg.slice(0, 200) + "...";

        setMessage(finalMsg);
        setShowLoginButton(showLoginBtn);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            setMessage(null);
            setShowLoginButton(false);
        }, 15000);
    };

    const hideError = () => {
        setMessage(null);
        setShowLoginButton(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    return (
        <ErrorContext.Provider value={{ showError, hideError, message, showLoginButton }}>
            {children}

            {message && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full px-6 py-3 rounded-xl bg-red-500 bg-opacity-90 text-white shadow-md flex items-center justify-between animate-slide-down">
                    <div className="flex items-center gap-4 truncate">
                        <span className="text-sm md:text-base truncate">{message}</span>

                        {showLoginButton && (
                            <button
                                onClick={() => signIn("google")}
                                className="px-3 py-1 bg-white text-gray-900 rounded-full shadow-sm hover:bg-gray-100 font-medium whitespace-nowrap transition"
                            >
                                Log In
                            </button>
                        )}
                    </div>

                    <button
                        onClick={hideError}
                        className="px-2 py-1 text-white font-bold hover:opacity-80 whitespace-nowrap"
                    >
                        ✕
                    </button>
                </div>
            )}

            <style jsx>{`
                @keyframes slide-down {
                  0% { transform: translate(-50%, -50%); opacity: 0; }
                  100% { transform: translate(-50%, 0); opacity: 1; }
                }
                .animate-slide-down { animation: slide-down 0.3s ease-out; }
            `}</style>
        </ErrorContext.Provider>
    );
}

export function useError() {
    const context = useContext(ErrorContext);
    if (!context) throw new Error("useError must be used within ErrorProvider");
    return context;
}
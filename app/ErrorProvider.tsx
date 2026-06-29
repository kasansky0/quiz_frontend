"use client";

import { useEffect, createContext, useContext, useState, useRef, ReactNode } from "react";
import { signIn } from "next-auth/react";
import { usePathname } from "next/navigation";
import StatLoaderIcon from "@/components/ui/StatLoaderIcon";

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
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        hideError(); // clear banner on route change
    }, [pathname]);

    // Replace your current showError function with this:

    const showError = (msg: string | object, showLoginBtn: boolean = false) => {
        let finalMsg = "";

        if (typeof msg === "string") {
            finalMsg = msg;
        } else if (typeof msg === "object" && msg !== null) {
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

        /* =========================
           DYNAMIC TIMEOUT BY LENGTH
           Base: 3 sec
           +45ms per character
           Min: 3 sec
           Max: 12 sec
        ========================= */
        const dynamicDuration = Math.min(
            Math.max(3000, finalMsg.length * 45),
            12000
        );

        timeoutRef.current = setTimeout(() => {
            setMessage(null);
            setShowLoginButton(false);
        }, dynamicDuration);
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
                <div className="fixed top-16 sm:top-16 left-0 w-full z-50 flex justify-center px-4 pointer-events-none">
                    <div className="w-full max-w-sm pointer-events-auto">
                        <div className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 shadow-md animate-slide-down text-center">

                            {/* LEFT ACCENT */}
                            <div className="w-1 self-stretch rounded-full bg-red-500" />

                            {/* MESSAGE */}
                            <div className="flex-1 text-sm text-neutral-800 leading-snug">
                                {message}
                            </div>

                            {/* LOGIN BUTTON */}
                            {showLoginButton && (
                                <button
                                    onClick={() => {
                                        setIsLoggingIn(true);
                                        signIn("google", { callbackUrl: "/info" });
                                    }}
                                    disabled={isLoggingIn}
                                    className="w-[110px] text-sm font-medium text-blue-600 hover:text-blue-700 transition whitespace-nowrap px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-50 active:bg-blue-100 active:border-blue-400 disabled:opacity-70 flex items-center justify-center"
                                >
                                    {isLoggingIn ? (
                                        <>
                                            <StatLoaderIcon />
                                            <span className="ml-2">Loading</span>
                                        </>
                                    ) : (
                                        "Log in"
                                    )}
                                </button>
                            )}

                            {/* CLOSE */}
                            <button
                                onClick={hideError}
                                className="text-neutral-400 hover:text-neutral-600 text-base leading-none transition"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
            @keyframes slide-down {
                0% {
                    transform: translateY(-16px) scale(0.98);
                    opacity: 0;
                }
                60% {
                    transform: translateY(2px) scale(1.01);
                    opacity: 1;
                }
                100% {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
            }

            .animate-slide-down {
                animation: slide-down 0.35s cubic-bezier(0.22, 1, 0.36, 1);
            }
        `}</style>
        </ErrorContext.Provider>
    );
}

export function useError() {
    const context = useContext(ErrorContext);
    if (!context) throw new Error("useError must be used within ErrorProvider");
    return context;
}
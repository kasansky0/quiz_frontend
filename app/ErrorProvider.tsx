"use client";

import { createContext, useContext, useState, useRef, ReactNode } from "react";

interface ErrorContextType {
    showError: (msg: string | object) => void; // allow objects
    hideError: () => void;
    message: string | null;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

// ✅ ErrorProvider
export function ErrorProvider({ children }: { children: ReactNode }) {
    const [message, setMessage] = useState<string | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showError = (msg: string | object) => {
        let finalMsg = "";

        if (typeof msg === "string") {
            finalMsg = msg;
        } else if (typeof msg === "object" && msg !== null) {
            // Try to extract a 'msg' field if exists
            finalMsg = (msg as any).msg || JSON.stringify(msg);
        }

        // Truncate long messages
        if (finalMsg.length > 5000) finalMsg = finalMsg.slice(0, 5000) + "...";

        setMessage(finalMsg);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => setMessage(null), 5000);
    };

    const hideError = () => {
        setMessage(null);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    return (
        <ErrorContext.Provider value={{ showError, hideError, message }}>
            {children}

            {message && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-xl w-full px-6 py-3 rounded-xl bg-red-500 bg-opacity-90 text-white shadow-md flex items-center justify-between animate-slide-down">
                    <span className="text-sm md:text-base">{message}</span>
                    <button
                        onClick={hideError}
                        className="ml-4 text-white font-bold hover:opacity-80"
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

// ✅ useError hook exported separately
export function useError() {
    const context = useContext(ErrorContext);
    if (!context) throw new Error("useError must be used within ErrorProvider");
    return context;
}
"use client";

import { useEffect, useState } from "react";

export default function PaymentSuccessPage() {
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("session_id");

        if (id) {
            setSessionId(id);
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center shadow-sm max-w-md w-full">

                <div className="text-green-600 text-5xl mb-4">✓</div>

                <h1 className="text-2xl font-semibold">
                    Payment successful
                </h1>

                <p className="text-sm text-neutral-500 mt-2">
                    Your payment has been completed.
                </p>

                {sessionId && (
                    <p className="text-xs text-neutral-400 mt-3">
                        Session: {sessionId}
                    </p>
                )}

                <button
                    onClick={() => (window.location.href = "/")}
                    className="mt-6 bg-[#0a66c2] text-white px-6 py-2 rounded-full"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
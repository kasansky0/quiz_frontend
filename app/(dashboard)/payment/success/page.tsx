"use client";

import { useEffect, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function PaymentSuccessPage() {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [paid, setPaid] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("session_id");

        if (!id) {
            setLoading(false);
            return;
        }

        setSessionId(id);

        const verifyPayment = async () => {
            try {
                const res = await fetch(
                    `${apiUrl}/payment/verify-session/${id}`,
                    {
                        method: "GET",
                        credentials: "include", // 🔥 IMPORTANT for _v2 cookies
                    }
                );

                if (!res.ok) {
                    setPaid(false);
                    return;
                }

                const data = await res.json();

                if (data.status === "paid") {
                    setPaid(true);
                } else {
                    setPaid(false);
                }
            } catch (err) {
                console.error("Verification error:", err);
                setPaid(false);
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Verifying payment...
            </div>
        );
    }

    if (!paid) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-600">
                Payment not confirmed
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-start justify-center bg-neutral-100 px-4 pt-24">
            <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center shadow-sm max-w-md w-full">

                <div className="text-green-600 text-5xl mb-4">✓</div>

                <h1 className="text-2xl font-semibold">
                    Payment successful
                </h1>

                <p className="text-sm text-neutral-500 mt-2">
                    Verified by server
                </p>

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
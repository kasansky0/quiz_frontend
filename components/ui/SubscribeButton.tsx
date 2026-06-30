"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useError } from "@/app/ErrorProvider"; // adjust path if needed

export default function SubscribeButton() {
    const [loading, setLoading] = useState(false);
    const { data: session } = useSession();
    const token = session?.idToken;
    const { showError } = useError();

    const handleSubscribe = async () => {

        if (!token) {
            showError("You need to log in to subscribe.", true);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscribed/create-checkout-session`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json();

            if (!res.ok) {
                // 🔥 KEY PART: detect auth issue
                if (res.status === 401 || res.status === 403 || !token) {
                    showError("You need to log in again.", true);
                    return;
                }

                showError(data.detail || "Request failed");
                return;
            }

            window.location.href = data.checkoutUrl;

        } catch (err) {
            showError("⚠️ Network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSubscribe}
            disabled={loading}
            className="
            w-full
            bg-white
            border border-blue-200
            text-blue-600
            font-semibold
            py-3 px-6
            rounded-xl
            transition
            shadow-sm
            hover:shadow-md
            hover:border-blue-300
            hover:bg-blue-50
            active:scale-[0.99]
            disabled:opacity-60
            disabled:cursor-not-allowed
        "
        >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                Redirecting
                <span className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                </span>
            </span>
            ) : (
                "Subscribe for $24.99"
            )}
        </button>
    );
}
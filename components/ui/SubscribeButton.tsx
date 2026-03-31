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
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                // 🔥 KEY PART: detect auth issue
                if (res.status === 401 || res.status === 403 || !token) {
                    showError("Oops! You need to log in again.", true);
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
            className="w-full bg-blue-400 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition"
        >
            {loading ? "Redirecting..." : "Subscribe for just 9.99$"}
        </button>
    );
}
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function SubscribeButton() {
    const [loading, setLoading] = useState(false);
    const { data: session } = useSession();
    const token = session?.idToken;

    const handleSubscribe = async () => {
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
                console.error("Backend error:", data);
                throw new Error(data.detail || "Request failed");
            }

            if (!data.checkoutUrl) {
                console.error("Missing checkoutUrl, response was:", data);
                throw new Error("No checkout URL returned");
            }

            // redirect the user
            window.location.href = data.checkoutUrl;

        } catch (err) {
            console.error(err);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition"
        >
            {loading ? "Redirecting..." : "Subscribe to Unlock Full Access"}
        </button>
    );
}
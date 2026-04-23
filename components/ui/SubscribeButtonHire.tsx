"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useError } from "@/app/ErrorProvider";

export default function HireSubscribeButton() {
    const [loading, setLoading] = useState(false);
    const { data: session } = useSession();
    const token = session?.idToken;
    const { showError } = useError();

    const handleSubscribe = async () => {
        if (!token) {
            showError("You need to log in to subscribe. 🥳", true);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/employer/subscribe`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401 || res.status === 403 || !token) {
                    showError("Oops! You need to log in again. 🤠", true);
                    return;
                }

                showError(data.detail || "Request failed");
                return;
            }

            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            }
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
            className="w-full bg-blue-400 hover:bg-blue-600 text-black font-semibold py-3 px-6 rounded-xl transition"
        >
            {loading ? "Redirecting..." : "Unlock Hire Access ($150/month)"}
        </button>
    );
}
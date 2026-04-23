"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useError } from "@/app/ErrorProvider";

type Props = {
    adId: string;
};

export default function PayAdButton({ adId }: Props) {
    const [loading, setLoading] = useState(false);
    const { data: session } = useSession();
    const token = session?.idToken;
    const { showError } = useError();

    const handlePay = async () => {
        if (!token) {
            showError("You need to log in to continue. 😟", true);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/employer/pay-ad`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ ad_id: adId }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    showError("Oops! Please log in again. 🤠", true);
                    return;
                }

                showError(data.detail || "Payment failed.");
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
            onClick={handlePay}
            disabled={loading}
            className="
                w-full bg-blue-400 hover:bg-blue-600
                text-black font-semibold
                py-2 px-4
                rounded-xl
                transition
                active:scale-[0.98]
                border border-blue-300
            "
        >
            {loading ? "Redirecting..." : "Pay $150 to Publish"}
        </button>
    );
}
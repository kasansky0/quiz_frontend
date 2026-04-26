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
        } catch {
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
            w-full max-w-xs
            mx-auto block
            text-center
            bg-white
            hover:bg-blue-50
            disabled:bg-gray-100
            text-[#0a66c2]
            font-semibold
            py-2.5
            px-6
            rounded-full
            text-sm
            shadow-sm
            transition
            active:scale-[0.98]
            border border-[#0a66c2]
            disabled:cursor-not-allowed
            disabled:text-gray-400
            disabled:border-gray-300
        "
        >
            {loading ? "Redirecting..." : "Pay $150 to Publish"}
        </button>
    );
}
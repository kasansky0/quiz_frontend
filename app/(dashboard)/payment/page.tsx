"use client";

import { useState, useEffect } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const MAX_AMOUNT = 1000;

export default function AdPaymentPage() {
    const [amount, setAmount] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);

    const paymentAmount = Number(amount);

    const isInvalidAmount =
        isNaN(paymentAmount) || paymentAmount <= 0;

    const isTooHigh = paymentAmount > MAX_AMOUNT;

    const canEnableCheckbox = !isInvalidAmount && !loading;

    const canPay =
        !isInvalidAmount &&
        !isTooHigh &&
        confirmed &&
        !loading;

    // 🔥 FIX: reset checkbox when amount becomes invalid
    useEffect(() => {
        if (isInvalidAmount) {
            setConfirmed(false);
        }
    }, [isInvalidAmount]);

    const handlePayment = async () => {
        if (!canPay) return;

        setLoading(true);

        try {
            const res = await fetch(`${apiUrl}/payment/create-session`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ amount: paymentAmount }),
            });

            const data = await res.json();

            if (data.url) {
                setTimeout(() => {
                    window.location.href = data.url;
                }, 400);
            } else {
                setLoading(false);
            }

        } catch (err) {
            console.error("Payment error:", err);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex justify-center px-4 py-8">
            <div className="w-full max-w-xl">

                <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">

                    {/* HEADER */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-semibold text-neutral-900">
                            Complete Payment
                        </h1>

                        <p className="text-sm text-neutral-500 mt-2">
                            Enter the amount for this payment.
                        </p>
                    </div>

                    {/* AMOUNT */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Payment amount
                        </label>

                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                                $
                            </span>

                            <input
                                type="number"
                                min="1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={loading}
                                className={`w-full border rounded-lg pl-8 pr-4 py-3 text-lg disabled:bg-neutral-100
                                    ${isTooHigh ? "border-red-500" : "border-neutral-300"}
                                `}
                            />
                        </div>

                        {isTooHigh && (
                            <p className="text-sm text-red-500 mt-2">
                                Maximum allowed payment is $1000
                            </p>
                        )}
                    </div>

                    {/* PREVIEW */}
                    {paymentAmount > 0 && (
                        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-5 text-center">
                            <div className="text-xs text-neutral-500">
                                Payment amount
                            </div>
                            <div className="text-3xl font-semibold">
                                ${paymentAmount}
                            </div>
                        </div>
                    )}

                    {/* CONFIRM */}
                    <div className="mb-6">
                        <label className="flex gap-3 items-center">
                            <input
                                type="checkbox"
                                checked={confirmed}
                                disabled={!canEnableCheckbox}
                                onChange={(e) => setConfirmed(e.target.checked)}
                            />
                            <span className="text-sm text-neutral-700">
                                I confirm the payment amount is correct.
                            </span>
                        </label>
                    </div>

                    {/* BUTTON */}
                    <button
                        onClick={handlePayment}
                        disabled={!canPay}
                        className={`
                            w-full py-3 rounded-full font-semibold transition flex items-center justify-center gap-2
                            ${canPay
                            ? "bg-[#0a66c2] hover:bg-[#004182] text-white"
                            : "bg-neutral-200 text-neutral-400"
                        }
                        `}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Redirecting...
                            </>
                        ) : isTooHigh ? (
                            "Max $1000 allowed"
                        ) : (
                            "Continue to Payment"
                        )}
                    </button>

                    <p className="text-xs text-neutral-500 text-center mt-4">
                        🔒 Secure payment via Stripe
                    </p>

                </div>
            </div>
        </div>
    );
}
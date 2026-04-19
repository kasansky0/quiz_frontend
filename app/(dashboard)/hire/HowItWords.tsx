"use client";

import { useState } from "react";

export default function HowItWorks() {
    const [open, setOpen] = useState(false);

    return (
        <div className="mb-6 rounded-xl bg-black/30 text-sm text-white/70 overflow-hidden">

            {/* HEADER */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-2 p-4"
            >
                <p className="font-semibold text-white">How it works</p>

                <span
                    className={`text-white/60 transition-transform duration-500 ease-in-out ${
                        open ? "rotate-180" : ""
                    }`}
                >
                    ▼
                </span>
            </button>

            {/* DROPDOWN CONTENT (smooth + slow) */}
            <div
                className={`px-4 pb-4 transition-all duration-700 ease-in-out overflow-hidden ${
                    open
                        ? "max-h-96 opacity-100 translate-y-0"
                        : "max-h-0 opacity-0 -translate-y-2"
                }`}
            >
                <ul className="space-y-1 list-disc pl-5">
                    <li>Create a job ad and submit for review.</li>
                    <li>Once approved, your ad becomes eligible for publishing.</li>
                    <li>
                        Pay a <span className="text-white font-semibold">$150</span> one-time fee for{" "}
                        <span className="text-white font-semibold">30 days of active publishing</span>.
                    </li>
                    <li>After payment, your ad will go live on the platform.</li>
                    <li>Your listing automatically expires after 30 days.</li>
                    <li>
                        Applicants who apply to your published ads will automatically appear in the Applications section below.
                    </li>
                </ul>
            </div>
        </div>
    );
}
"use client";

import { useState } from "react";

export default function HowItWorks() {
    const [open, setOpen] = useState(false);

    return (
        <div className="mb-6 rounded-xl bg-black/30 text-sm text-white/70">

            {/* HEADER (clickable) */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-2 p-4"
            >
                <p className="font-semibold text-white">How it works</p>

                <span className={`text-white/60 transition-transform ${open ? "rotate-180" : ""}`}>
                    ▼
                </span>
            </button>

            {/* DROPDOWN CONTENT */}
            {open && (
                <div className="px-4 pb-4">
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
            )}
        </div>
    );
}
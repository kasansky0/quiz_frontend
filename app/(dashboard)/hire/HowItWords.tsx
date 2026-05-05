"use client";

import { useState } from "react";

export default function HowItWorks() {
    const [open, setOpen] = useState(false);

    return (
        <div className="rounded-xl bg-black-200 text-sm text-black overflow-hidden">

            {/* HEADER */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-2 p-2"
            >
                <p className="font-semibold text-black">How it works</p>

                <span
                    className={`text-black transition-transform duration-300 ${
                        open ? "rotate-180" : ""
                    }`}
                >
                    ▼
                </span>
            </button>

            {/* CONTENT */}
            <div
                className={`
                    px-4 pb-4
                    transition-all duration-300 ease-in-out
                    overflow-hidden
                    ${open ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}
                `}
            >
                <div className="space-y-2 text-xs text-black/80">
                    <p>• Create a job ad, submit for review</p>

                    <p>• Once approved, complete payment to publish</p>

                    <p>• Published ads stay live for <span className="font-semibold">30 days</span></p>

                    <p>• After 30 days, ads automatically move to Archived and are no longer visible to public users</p>

                    <p>• Archived ads and all applications remain fully accessible in your dashboard</p>

                    <p>• You receive candidates with profile + quiz performance</p>
                </div>
            </div>
        </div>
    );
}
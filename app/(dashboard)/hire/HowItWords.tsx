"use client";

import { useState } from "react";

export default function HowItWorks() {
    const [open, setOpen] = useState(false);

    return (
        <div className="rounded-xl bg-black/30 text-sm text-white/70 overflow-hidden">

            {/* HEADER */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-2 p-2"
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

            {/* DROPDOWN CONTENT (FIXED) */}
            <div
                className={`
                    px-4 pb-4
                    transition-all duration-500 ease-in-out
                    overflow-hidden
                    ${open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
                `}
            >

                {/* 🔥 THIS IS THE IMPORTANT FIX */}
                <div className="max-h-64 overflow-y-auto pr-2 space-y-2">

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

                        {/* ================= NEW SECTION ================= */}
                        <li>
                            Once a candidate applies, you will be able to view:
                            <ul className="mt-1 space-y-1 list-disc pl-5 text-white/80">
                                <li>Basic profile information (name, email, experience, availability)</li>
                                <li>
                                    Physical location at the time of application (📍 where the applicant is currently located)
                                </li>
                                <li>
                                    Job readiness details (position preference, certifications, travel ability, overtime, relocation readiness)
                                </li>
                                <li>
                                    Quiz performance breakdown based on real technical topics
                                </li>
                            </ul>
                        </li>

                        {/* ================= QUIZ EXPLANATION ================= */}
                        <li>
                            Each applicant includes a <span className="text-white font-semibold">Quiz Performance</span> section:
                            <ul className="mt-1 space-y-1 list-disc pl-5 text-white/80">
                                <li>
                                    The system tracks how many questions were <span className="text-white">seen</span>, <span className="text-green-400">correct</span>, and <span className="text-red-400">incorrect</span>.
                                </li>

                                <li>
                                    Overall Accuracy shows total performance across all topics.
                                </li>

                                <li>
                                    Below that, <span className="text-white font-semibold">Topic Breakdown</span> shows performance per category (example: relay, transformer, safety).
                                </li>

                                <li>
                                    Each topic shows:
                                    <ul className="mt-1 space-y-1 list-disc pl-5">
                                        <li>How many questions were attempted</li>
                                        <li>Correct vs incorrect answers</li>
                                        <li>Accuracy percentage per topic</li>
                                    </ul>
                                </li>

                                <li>
                                    This allows employers to evaluate not just experience, but real technical strength by category.
                                </li>
                            </ul>
                        </li>
                    </ul>

                </div>
            </div>
        </div>
    );
}
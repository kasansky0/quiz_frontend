"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import PositionCard from "@/app/PositionCard";

// Info & Formulas Component
const InfoAndFormulas = () => {
    return (
        <div className="min-h-screen bg-black-200 text-black flex justify-center px-4 py-4">
            <div className="w-full max-w-xl space-y-4">

                {/* JOB CARD (UNCHANGED — AS REQUESTED) */}
                <PositionCard />

                {/* QUIZ CARD */}
                <Link
                    href="/quiz"
                    className="block bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition active:scale-[0.99] text-center"
                >
                    <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                        {/* Chart/Quiz Icon */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5 text-blue-500"
                        >
                            <path d="M3 3h2v18H3V3zm4 10h2v8H7v-8zm4-6h2v14h-2V7zm4 4h2v10h-2V11zm4-8h2v18h-2V3z" />
                        </svg>

                        <span>Take a Quiz</span>
                    </div>

                    <div className="text-base text-neutral-600 mt-1">
                        Test your knowledge with random questions. Aim to stay above 80%.
                    </div>

                    <div className="text-blue-500 text-base mt-3 font-medium">
                        Start quiz →
                    </div>
                </Link>

                {/* CHAT CARD */}
                <Link
                    href="/feed"
                    className="block bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition active:scale-[0.99] text-center"
                >
                    <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                        {/* Chat / Messenger SVG (same style as sidebar) */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 text-blue-500"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 4.5h-15a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5ZM6.75 8.25h3v3h-3v-3Zm0 6h10.5M12 9.75h4.5"
                            />
                        </svg>

                        <span>Feed</span>
                    </div>

                    <div className="text-base text-neutral-600 mt-1">
                        Share your learning progress and job-related milestones.
                        Keep the community focused, respectful, and career-driven.
                    </div>

                    <div className="text-blue-500 text-base mt-3 font-medium">
                        Open feed →
                    </div>
                </Link>

                {/* AUTH CARD */}
                <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm text-center">
                    <div className="flex items-center justify-center gap-2 text-lg font-semibold mb-2">
                        {/* Lock SVG */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 text-blue-500"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V7.5a4.5 4.5 0 1 0-9 0v3m-1.5 0h12a1.5 1.5 0 0 1 1.5 1.5v7.5A1.5 1.5 0 0 1 18 21h-12A1.5 1.5 0 0 1 4.5 19.5V12a1.5 1.5 0 0 1 1.5-1.5Z"
                            />
                        </svg>

                        <span>Authentication</span>
                    </div>

                    <div className="text-base text-neutral-600 leading-relaxed">
                        This platform uses Google authentication. Your session will expire after a period of inactivity, and you may need to log in again.
                    </div>
                </div>

                {/* CONTACT CARD */}
                <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm text-center">
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold mb-1">
                        {/* Mail SVG */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 text-blue-500"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21.75 6.75v10.5A2.25 2.25 0 0 1 19.5 19.5h-15A2.25 2.25 0 0 1 2.25 17.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15A2.25 2.25 0 0 0 2.25 6.75m19.5 0-9.75 6.75L2.25 6.75"
                            />
                        </svg>

                        <span>General Inquiries</span>
                    </div>

                    <a
                        href="mailto:info@netaprep.com"
                        className="text-blue-500 text-xs font-medium hover:underline"
                    >
                        info@netaprep.com
                    </a>
                </div>

            </div>
        </div>
    );
};

export default function InfoPage() {
    const { status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen text-black">
                <p className="text-xl flex items-center">
                    Loading
                    <span className="ml-2 flex space-x-1">
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce"></span>
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                    </span>
                </p>
            </div>
        );
    }

    return <InfoAndFormulas />;
}
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

                {/* PROFILE CARD */}
                <Link
                    href="/profile"
                    className="block bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition active:scale-[0.99] text-center"
                >
                    <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                        {/* Profile SVG */}
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
                                d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.964 0A9 9 0 1 0 6.018 18.725m11.964 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75A3 3 0 1 1 9 9.75a3 3 0 0 1 6 0Z"
                            />
                        </svg>

                        <span>Profile</span>
                    </div>

                    <div className="text-base text-neutral-600 mt-1">
                        View your quiz stats, posts, comments, and reply notifications.
                    </div>

                    <div className="text-blue-500 text-base mt-3 font-medium">
                        Open profile →
                    </div>
                </Link>

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
                        Test your knowledge with 1700 random questions.
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
                    </div>

                    <div className="text-blue-500 text-base mt-3 font-medium">
                        Open feed →
                    </div>
                </Link>

                {/* RESOURCES CARD */}
                <Link
                    href="/resources"
                    className="block bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition active:scale-[0.99] text-center"
                >
                    <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                        {/* Resources / Toolbox SVG */}
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
                                d="M20.25 7.5h-3.375V6A2.25 2.25 0 0 0 14.625 3.75h-5.25A2.25 2.25 0 0 0 7.125 6v1.5H3.75A2.25 2.25 0 0 0 1.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h16.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25ZM8.625 6a.75.75 0 0 1 .75-.75h5.25a.75.75 0 0 1 .75.75v1.5h-6.75V6ZM12 12.75a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"
                            />
                        </svg>

                        <span>Technician Resources</span>
                    </div>

                    <div className="text-base text-neutral-600 mt-1">
                        Find useful tools for electrical testing.
                    </div>

                    <div className="text-blue-500 text-base mt-3 font-medium">
                        View resources →
                    </div>
                </Link>

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
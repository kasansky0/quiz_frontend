"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

// Info & Formulas Component
const InfoAndFormulas = () => {
    return (
        <div className="min-h-screen bg-black-200 text-black flex justify-center px-4 py-6">
            <div className="w-full max-w-xl space-y-4">

                {/* JOB CARD (UNCHANGED — AS REQUESTED) */}
                <Link
                    href="/position"
                    className="w-full text-center text-xs block active:bg-transparent focus:bg-transparent [-webkit-tap-highlight-color:transparent]"
                >
                    <div className="flex flex-col items-center space-y-1">

                        {/* ICON + TITLE */}
                        <div className="font-semibold flex items-center justify-center gap-2 text-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-4 h-4 text-neutral-700 flex-shrink-0"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M20.25 7.5h-16.5A2.25 2.25 0 001.5 9.75v9A2.25 2.25 0 003.75 21h16.5A2.25 2.25 0 0022.5 18.75v-9A2.25 2.25 0 0020.25 7.5z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8.25 7.5V6a3.75 3.75 0 017.5 0v1.5"
                                />
                            </svg>

                            <span className="leading-none">
                                                    Hiring NETA Technicians
                                                </span>
                        </div>

                        {/* LOCATION */}
                        <div className="text-xs text-center flex items-center justify-center gap-1 text-neutral-600">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-4 h-4 text-neutral-600 flex-shrink-0"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                                />
                            </svg>

                            <span>Multiple locations • Relocation assistance</span>
                        </div>

                        {/* CTA */}
                        <div className="text-blue-400 text-xs flex items-center gap-1 group">
                            <span>View positions</span>

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-3 h-3"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M3 10a.75.75 0 01.75-.75h10.69L10.22 5.03a.75.75 0 011.06-1.06l5.5 5.5a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 11-1.06-1.06l4.22-4.22H3.75A.75.75 0 013 10z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>

                    </div>
                </Link>

                {/* QUIZ CARD */}
                <Link
                    href="/quiz"
                    className="block bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition active:scale-[0.99] text-center"
                >
                    <div className="text-lg font-semibold">
                        📊 Take a Quiz
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
                    href="/chat"
                    className="block bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition active:scale-[0.99] text-center"
                >
                    <div className="text-lg font-semibold">
                        💬 Messaging
                    </div>

                    <div className="text-base text-neutral-600 mt-1">
                        Share your study strategies, ask questions, and let us know if you passed. We maintain a respectful and focused learning environment where all posts and comments are automatically moderated.
                    </div>

                    <div className="text-blue-500 text-base mt-3 font-medium">
                        Open chat →
                    </div>
                </Link>

                {/* AUTH CARD */}
                <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm text-center">
                    <div className="text-lg font-semibold mb-2">
                        🔐 Authentication
                    </div>

                    <div className="text-base text-neutral-600 leading-relaxed">
                        This platform uses Google authentication. For security reasons, your session may expire after a few hours. If that happens, you’ll need to log in again.
                    </div>
                </div>

                {/* CONTACT CARD */}
                <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm text-center">
                    <div className="text-xs font-semibold">
                        Business Inquiries:
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
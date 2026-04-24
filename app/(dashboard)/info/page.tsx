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
                    className="w-full text-center text-base py-1 transition block active:bg-transparent focus:bg-transparent [-webkit-tap-highlight-color:transparent]"
                >
                    <div className="font-semibold">
                        💼 Hiring NETA Technicians
                    </div>

                    <div className="text-sm mt-1">
                        📍 Multiple locations • Relocation assistance
                    </div>

                    <div className="text-blue-400 text-sm mt-2">
                        View positions →
                    </div>
                </Link>

                {/* QUIZ CARD */}
                <Link
                    href="/quiz"
                    className="block bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition active:scale-[0.99] text-center"
                >
                    <div className="text-base font-semibold">
                        📊 Take a Quiz
                    </div>

                    <div className="text-sm text-neutral-600 mt-1">
                        Test your knowledge with 1000 random questions. Track your progress with a percentage score and aim to stay above 70%.
                    </div>

                    <div className="text-blue-500 text-sm mt-3 font-medium">
                        Start quiz →
                    </div>
                </Link>

                {/* CHAT CARD */}
                <Link
                    href="/chat"
                    className="block bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md transition active:scale-[0.99] text-center"
                >
                    <div className="text-base font-semibold">
                        💬 Messaging
                    </div>

                    <div className="text-sm text-neutral-600 mt-1">
                        Share your study strategies, ask questions, and let us know if you passed. We maintain a respectful and focused learning environment where all posts and comments are automatically moderated.
                    </div>

                    <div className="text-blue-500 text-sm mt-3 font-medium">
                        Open chat →
                    </div>
                </Link>

                {/* AUTH CARD */}
                <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm text-center">
                    <div className="text-base font-semibold mb-2">
                        🔐 Authentication
                    </div>

                    <div className="text-sm text-neutral-600 leading-relaxed">
                        This platform uses Google authentication tokens. Tokens expire automatically after approximately{" "}
                        <strong>1 hour</strong>. When a token expires, you will need to log in again.
                    </div>
                </div>

                {/* CONTACT CARD */}
                <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm text-center">
                    <div className="text-base font-semibold mb-2">
                        Contact
                    </div>

                    <a
                        href="mailto:info@netaprep.com"
                        className="text-blue-500 text-sm font-medium hover:underline"
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
            <div className="flex-1 flex items-center justify-center pt-[56px] text-black">
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
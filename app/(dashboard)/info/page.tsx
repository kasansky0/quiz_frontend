"use client";

import { useSession } from "next-auth/react";
import Link from "next/link"

// Info & Formulas Component
const InfoAndFormulas = () => {
    return (
        <div className="min-h-screen bg-black text-white flex justify-center px-4 py-4">
            <div className="w-full max-w-xl space-y-4">
                {/* Future Ads / Message */}
                <Link
                    href="/position"
                    className="w-full text-center text-sm py-1 transition block active:bg-transparent focus:bg-transparent [-webkit-tap-highlight-color:transparent]"
                >
                    <div className="font-semibold">
                        💼 Hiring NETA Technicians
                    </div>

                    <div className="text-xs mt-1">
                        📍 Multiple locations • Relocation assistance
                    </div>

                    <div className="text-blue-400 text-xs mt-2">
                        View positions →
                    </div>
                </Link>



                {/* 4. Quiz Progress & Performance */}
                <Link
                    href="/quiz"
                    className="w-full text-center text-sm py-1 transition block active:bg-transparent focus:bg-transparent [-webkit-tap-highlight-color:transparent]">
                    <h1 className="w-full text-2xl sm:text-3xl md:text-lg font-bold text-white-400 mb-1 text-center cursor-pointer hover:text-white transition">
                        📊 Take a Quiz
                    </h1>
                    <div className="text-blue-400 text-xs mt-2">
                        Test your knowledge with 1000 random questions →
                    </div>
                </Link>
                <p className="text-sm sm:text-base md:text-base text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-4 leading-relaxed">
                    Take a quiz to track your progress with a percentage score. Keep it above 70%.
                </p>


                {/* Page Title & Introduction */}
                <Link
                    href="/chat"
                    className="w-full text-center text-sm py-1 transition block active:bg-transparent focus:bg-transparent [-webkit-tap-highlight-color:transparent]"
                >
                    <h1 className="w-full text-2xl sm:text-3xl md:text-lg font-bold text-white-400 mb-1 text-center cursor-pointer hover:text-white transition">
                        💬 Messaging
                    </h1>

                    <div className="text-blue-400 text-xs mt-2">
                        Share your test experience →
                    </div>
                </Link>
                <p className="text-sm sm:text-base md:text-base text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-8 leading-relaxed">
                    We maintain a respectful and focused learning environment. All posts and comments are automatically moderated to ensure quality. By participating, you agree to follow the guidelines.
                </p>

                <br/>

                {/* Authentication Notice */}
                <h1 className="w-full text-2xl sm:text-3xl md:text-lg font-bold text-white-400 mb-6 text-center">
                    🔐 Authentication
                </h1>
                <p className="text-sm sm:text-base md:text-base text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-8 leading-relaxed">
                    This platform uses Google authentication tokens. Tokens expire automatically after approximately <strong>1 hour</strong>.
                    When a token expires, your session will end and you will need to log in again.
                </p>

                <br/>

                {/* 5. Contact Info Section */}
                <p className="w-full text-sm sm:text-base md:text-base text-white/80 text-center mb-6 leading-relaxed font-semibold">
                    <strong>
                        Contact:{" "}
                        <a
                            href="mailto:info@netaprep.com"
                            className="underline hover:text-white transition-colors"
                        >
                            info@netaprep.com
                        </a>
                    </strong>
                </p>
            </div>
        </div>
    );
};

export default function InfoPage() {
    const { data: session, status } = useSession();

    // Optional: you can show a loading spinner if session is still loading
    if (status === "loading")
        return (
            <div className="fixed inset-0 md:left-64 z-50 flex items-center justify-center bg-black text-white pointer-events-none">
                <p className="text-xl flex items-center">
                    Loading
                    <span className="ml-2 flex space-x-1">
                          <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce"></span>
                          <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                          <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                        </span>
                </p>
            </div>
        );

    return <InfoAndFormulas />;
}
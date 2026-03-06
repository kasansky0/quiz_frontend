"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ContactPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // Simulate a small loading delay
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800); // 0.8 sec delay
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white bg-black">
                <p className="text-xl">Loading...</p>
            </div>
        );
    }

    return (
        <div className="bg-black text-white min-h-screen flex flex-col justify-start items-center p-5">

            {/* Back Button */}
            <div className="mb-6 self-start">
                <button
                    onClick={() => router.back()}
                    className="flex items-center justify-center bg-black/70 backdrop-blur-xl border border-green-400/20 rounded-xl shadow-lg px-4 h-8 text-xs sm:text-sm text-white-300/80 font-medium hover:bg-green-500/10 active:scale-95 transition"
                >
                    Back
                </button>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white-400 mb-6 text-center">
                Contacts
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-white/80 text-center max-w-md sm:max-w-2xl md:max-w-3xl mb-8 mx-auto">
                <a
                    href="mailto:info@netaprep.com"
                    className="text-white-400 hover:underline"
                >
                    info@netaprep.com
                </a>
            </p>

        </div>

    );
}

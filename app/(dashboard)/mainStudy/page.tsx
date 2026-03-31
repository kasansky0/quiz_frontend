"use client";

import { useMainTopics } from "@/app/(dashboard)/mainStudy/mainStudyTopicHook";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import SubscribeButton from "@/components/ui/SubscribeButton";
import { useError } from "@/app/ErrorProvider";

export default function MainStudyPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    const { data: session, status } = useSession(); // status: 'loading' | 'authenticated' | 'unauthenticated'
    const token = session?.idToken;
    const { mainTopics, isPaid, loading, error, tokenExpired } = useMainTopics(apiUrl, token);
    const { showError } = useError();

    const [fade, setFade] = useState(false);

    // Show error if token expired
    useEffect(() => {
        if (tokenExpired) showError("Oops! You have to log in again.", true);
    }, [tokenExpired, showError]);

    // Trigger fade after topics are ready
    useEffect(() => {
        if (!loading && isPaid !== null && mainTopics.length) {
            const timer = setTimeout(() => setFade(true), 50);
            return () => clearTimeout(timer);
        }
    }, [loading, isPaid, mainTopics]);

    useEffect(() => {
        setFade(false);
    }, [loading]);

    // --- SHOW LOADING UNTIL SESSION AND DATA ARE READY ---
    console.log("MainStudyPage render debug:", {
        status,
        token,
        tokenExpired,
        loading,
        isPaid,
        showLoadingCondition: status === "loading" || !token || tokenExpired || loading || isPaid === null
    });

    // --- SHOW LOADING UNTIL SESSION AND DATA ARE READY ---
    if (status === "loading" || !token || tokenExpired || loading || isPaid === null) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
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
    }

    // --- NORMAL PAGE RENDER ---
    return (
        <div className="p-4 md:p-4 text-white relative min-h-screen">
            <div className={`mx-auto max-w-4xl transition-opacity duration-700 ease-in-out ${fade ? "opacity-100" : "opacity-0"}`}>
                {error && <div className="p-6 text-red-400">{error}</div>}
                {!error && mainTopics.length === 0 && <div className="p-6 text-white">No main topics found.</div>}

                <h1 className="text-2xl font-bold mb-6 text-center">Main Study Topics</h1>

                <div className="text-center mb-4">
                    {isPaid === true ? (
                        <span className="flex items-center justify-center gap-2 text-green-400 font-semibold">
                            Premium Access
                        </span>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex flex-col items-center gap-3 text-center px-4">
                                <p className="text-yellow-400 font-semibold text-lg">
                                    Subscribe to unlock all study topics
                                </p>
                            </div>

                            <div className="w-full max-w-xs">
                                <SubscribeButton />
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {mainTopics.map((mainTopic) => {
                        const locked = isPaid !== true;
                        return (
                            <Link
                                key={mainTopic}
                                href={locked ? "#" : `/mainStudy/${mainTopic}`}
                                className={`block w-full rounded-full p-4 text-center transition ${locked ? "bg-gray-700 opacity-50 cursor-not-allowed" : "bg-dark-400 hover:bg-dark-600"}`}
                            >
                                <h2 className="font-semibold text-blue-500">
                                    {mainTopic} {locked && "🔒"}
                                </h2>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
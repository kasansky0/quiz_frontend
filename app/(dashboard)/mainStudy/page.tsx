"use client";

import { useMainTopics } from "@/app/(dashboard)/mainStudy/mainStudyTopicHook";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import SubscribeButton from "@/components/ui/SubscribeButton"; // adjust path if needed

export default function MainStudyPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    const { data: session } = useSession();
    const token = session?.idToken; // or accessToken depending on your setup
    const { mainTopics, isPaid, loading, error } = useMainTopics(apiUrl, token);


    // Delayed loading
    const [showLoading, setShowLoading] = useState(true);
    // Fade in effect
    const [fade, setFade] = useState(false);

    // Debug log to see data from backend
    useEffect(() => {
        if (!loading && !error) {
            console.log("Token:", token);
            console.log("Raw main topics:", mainTopics);
            console.log("User is paid:", isPaid);
        }
    }, [mainTopics, isPaid, loading, error, token]);

    // Handle delayed loading spinner
    useEffect(() => {
        if (loading || error) {
            setShowLoading(true);
        } else {
            const timer = setTimeout(() => setShowLoading(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [loading, error]);

    // Trigger fade after topics are ready
    useEffect(() => {
        if (!loading && mainTopics.length && !showLoading) {
            const timer = setTimeout(() => setFade(true), 50);
            return () => clearTimeout(timer);
        }
    }, [loading, mainTopics, showLoading]);

    return (
        <div className="p-4 md:p-4 text-white relative min-h-screen">

            {/* Loading screen */}
            {showLoading ? (
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
            ) : (
                <div className={`mx-auto max-w-4xl transition-opacity duration-700 ease-in-out ${
                    fade ? "opacity-100" : "opacity-0"
                }`}>
                    {error && <div className="p-6 text-red-400">{error}</div>}
                    {!error && mainTopics.length === 0 && <div className="p-6 text-white">No main topics found.</div>}

                    <h1 className="text-2xl font-bold mb-6 text-center">Main Study Topics</h1>

                    {/* Optional: show if user is paid */}
                    <div className="text-center mb-4">
                        {isPaid ? (
                            <span className="text-green-400 font-semibold">
            Premium Access
        </span>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
            <span className="text-yellow-400 font-semibold">
                Subscribe to unlock all topics
            </span>

                                <div className="w-full max-w-xs">
                                    <SubscribeButton />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Grid container with 2 columns */}
                    <div className="grid grid-cols-2 gap-4">
                        {mainTopics.map((mainTopic) => {
                            const locked = !isPaid;

                            return (
                                <Link
                                    key={mainTopic}
                                    href={locked ? "#" : `/mainStudy/${mainTopic}`}
                                    className={`
                block w-full rounded-full p-4 text-center transition
                ${locked
                                        ? "bg-gray-700 opacity-50 cursor-not-allowed"
                                        : "bg-dark-400 hover:bg-dark-600"}
            `}
                                >
                                    <h2 className="font-semibold text-blue-500">
                                        {mainTopic} {locked && "🔒"}
                                    </h2>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
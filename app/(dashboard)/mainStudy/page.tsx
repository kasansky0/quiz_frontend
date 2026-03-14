"use client";

import { useMainTopics } from "@/app/(dashboard)/mainStudy/mainStudyTopicHook";
import Link from "next/link";
import { useState, useEffect } from "react";


export default function MainStudyPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    const { mainTopics, loading, error } = useMainTopics(apiUrl);


    // Delayed loading
    const [showLoading, setShowLoading] = useState(true);
    // Fade in effect
    const [fade, setFade] = useState(false);






    useEffect(() => {
        if (loading || error) {
            // Always show spinner while loading or on error
            setShowLoading(true);
        } else {
            // Only hide spinner when loading finished successfully
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
                ):(

            <div className={`mx-auto max-w-4xl transition-opacity duration-700 ease-in-out ${
                fade ? "opacity-100" : "opacity-0"
            }`}>
                {error && <div className="p-6 text-red-400">{error}</div>}
                {!error && mainTopics.length === 0 && <div className="p-6 text-white">No main topics found.</div>}

                <h1 className="text-2xl font-bold mb-6">Main Study Topics</h1>
                <div className="flex flex-col space-y-4">
                    {mainTopics.map((mainTopic) => (
                        <Link
                            key={mainTopic}
                            href={`/mainStudy/${mainTopic}`}
                            className="
                                block
                                rounded-lg
                                bg-dark-300/60
                                hover:bg-dark-300
                                transition
                                p-4
                                cursor-pointer
                            "
                        >
                            <h2 className="font-semibold text-blue-500">
                                {mainTopic}
                            </h2>
                        </Link>
                    ))}
                </div>
            </div>
            )}
        </div>
    );
}
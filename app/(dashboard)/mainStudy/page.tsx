"use client";

import { useMainTopics } from "@/app/(dashboard)/mainStudy/mainStudyTopicHook";
import Link from "next/link";
import { useState, useEffect } from "react";


export default function MainStudyPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    const { mainTopics, loading, error } = useMainTopics(apiUrl);

    // Delayed loading
    const [showLoading, setShowLoading] = useState(false);
    // Fade in effect
    const [fade, setFade] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (loading) {
            timer = setTimeout(() => setShowLoading(true), 5000);
        } else {
            setShowLoading(false);
        }

        return () => clearTimeout(timer);
    }, [loading]);

    // Trigger fade after topics are ready
    useEffect(() => {
        if (!loading && mainTopics.length) {
            const timer = setTimeout(() => setFade(true), 50);
            return () => clearTimeout(timer);
        }
    }, [loading, mainTopics]);

    return (
        <div className="p-4 md:p-4 text-white relative min-h-screen">

            {/* Loading screen */}
            {loading && showLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black text-white transition-opacity duration-700 ease-in-out">
                    <p className="text-xl">Loading...</p>
                </div>
            )}

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
        </div>
    );
}
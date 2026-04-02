"use client";

import { useMainTopics } from "@/app/(dashboard)/mainStudy/mainStudyTopicHook";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import SubscribeButton from "@/components/ui/SubscribeButton"; // adjust path if needed
import { useError } from "@/app/ErrorProvider"; // make sure you import showError


export default function MainStudyPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    const { data: session, status } = useSession();
    const token = session?.idToken; // or accessToken depending on your setup
    const { mainTopics, isPaid, loading, error, tokenExpired } = useMainTopics(apiUrl, token);
    const { showError } = useError();


    // Fade in effect
    const [fade, setFade] = useState(false);
    // Check token validity
    const [tokenValid, setTokenValid] = useState(false);

    // Show error if token expired
    useEffect(() => {
        if (tokenExpired) {
            // Only show once
            if (!localStorage.getItem("tokenExpiredShown")) {
                showError?.("Oops! You need to log in again.", true);
                localStorage.setItem("tokenExpiredShown", "true");
            }
        } else {
            localStorage.removeItem("tokenExpiredShown"); // reset when token becomes valid
        }
    }, [tokenExpired, showError]);

    // Update validToken to true when valid
    useEffect(() => {
        if (token && !tokenExpired) {
            setTokenValid(true);
        } else {
            setTokenValid(false);
        }
    }, [token, tokenExpired]);

    // Trigger fade after topics are ready
    useEffect(() => {
        if (!loading && mainTopics.length) {
            const timer = setTimeout(() => setFade(true), 50);
            return () => clearTimeout(timer);
        }
    }, [loading, mainTopics]);

    if (!tokenValid || loading || tokenExpired) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white pointer-events-none">
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

    const groupedTopics = mainTopics.reduce((acc: Record<string, string[]>, item) => {
        if (!acc[item.main_topic]) {
            acc[item.main_topic] = [];
        }
        acc[item.main_topic].push(item.title);
        return acc;
    }, {});

    // Then render all your full content with headings, subscription text, grid, etc.
    return (
        <div className={`mx-auto max-w-4xl p-4 pb-[calc(4rem+env(safe-area-inset-bottom))] text-white relative min-h-screen transition-opacity duration-700 ease-in-out ${fade ? "opacity-100" : "opacity-0"}`}>
                {error && <div className="p-6 text-red-400">{error}</div>}
                {!error && mainTopics.length === 0 && <div className="p-6 text-white">No main topics found.</div>}

                <h1 className="text-2xl font-bold mb-6 text-center">Main Study Topics</h1>

                {/* Full subscription section */}
                <div className="text-center mb-4">
                    {isPaid ? (
                        <span className="flex items-center justify-center gap-2 text-green-400 font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Premium Access
                    </span>
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-center px-4">
                            <p className="text-yellow-400 font-semibold text-lg">
                                Subscribe to unlock all study topics
                            </p>
                            <p className="text-white/70 text-sm md:text-base">
                                Most importantly, access <span className="font-bold text-green-400">topic-targeted muscle memory quizzes</span> that focus on one topic at a time.
                                <br />
                                Unlike the free version where questions come randomly from all 800+ questions, this ensures faster mastery and retention.
                            </p>

                            <div className="w-full max-w-xs">
                                <SubscribeButton />
                            </div>

                            <p className="mt-2 text-xs text-white/60">🔒 Secure payment via Stripe.</p>
                        </div>
                    )}
                </div>

                {/* Grid container with 2 columns */}
                <div className="grid grid-cols-1 gap-4">
                    {Object.entries(groupedTopics).map(([mainTopic, titles]) => {
                        const locked = !isPaid;

                        return locked ? (
                            <div
                                key={mainTopic}
                                className="w-full rounded-2xl p-4 bg-gray-700 opacity-50 cursor-not-allowed transition"
                            >
                                <h2 className="font-semibold text-blue-400 mb-2">{mainTopic} 🔒</h2>
                                <ul className="text-sm text-white/80 space-y-1 mt-2">
                                    {titles.map((title, i) => (
                                        <li key={i}>• {title}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <Link
                                key={mainTopic}
                                href={`/mainStudy/${mainTopic}`}
                                className="w-full rounded-2xl p-4 bg-dark-400 hover:bg-dark-300 transition block"
                            >
                                <h2 className="font-semibold text-blue-400 mb-2">{mainTopic}</h2>
                                <ul className="text-sm text-white/80 space-y-1 mt-2">
                                    {titles.map((title, i) => (
                                        <li key={i}>• {title}</li>
                                    ))}
                                </ul>
                            </Link>
                        );
                    })}
                </div>
        </div>
    );
}
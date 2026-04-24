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
                showError?.("Oops! You need to log in again. 🙄", true);
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
            <div className="flex-1 flex items-start justify-center pt-[56px] text-black">
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

    const groupedTopics = mainTopics.reduce((acc: Record<string, string[]>, item) => {
        if (!acc[item.main_topic]) {
            acc[item.main_topic] = [];
        }
        acc[item.main_topic].push(item.title);
        return acc;
    }, {});

    // Then render all your full content with headings, subscription text, grid, etc.
    return (
        <div className="min-h-screen w-full flex justify-center items-start p-4 md:p-8 bg-black-200 text-black">
            <div
                className={`w-full max-w-xl 2xl:max-w-2xl pb-16 transition-opacity duration-700 ease-in-out ${
                    fade ? "opacity-100" : "opacity-0"
                }`}
            >
                {error && <div className="p-6 text-red-500 text-sm">{error}</div>}
                {!error && mainTopics.length === 0 && (
                    <div className="p-6 text-neutral-600 text-sm">
                        No main topics found.
                    </div>
                )}

                <h1 className="text-2xl font-semibold mb-6 text-center text-neutral-900">
                    Main Study Topics
                </h1>

                {/* Subscription section (LinkedIn card style) */}
                <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5 text-center mb-4">
                    {isPaid ? (
                        <span className="flex items-center justify-center gap-2 text-green-600 font-medium">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.5 12.75l6 6 9-13.5"
                            />
                        </svg>
                        Includes topic-targeted questions
                    </span>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-neutral-900 font-semibold text-lg">
                                Subscribe to unlock all study topics
                            </p>

                            <p className="text-neutral-600 text-sm md:text-base leading-relaxed">
                                Access{" "}
                                <span className="font-semibold text-neutral-900">
                                topic-targeted muscle memory quizzes
                            </span>{" "}
                                that focus on one topic at a time.
                                <br />
                                Unlike the free version where questions are random across
                                800+ questions, this improves retention and speed.
                            </p>

                            <div className="w-full max-w-xs">
                                <SubscribeButton />
                            </div>

                            <p className="text-xs text-neutral-500">
                                🔒 Secure payment via Stripe.
                            </p>
                        </div>
                    )}
                </div>

                {/* Topics grid */}
                <div className="grid grid-cols-1 gap-4">
                    {Object.entries(groupedTopics).map(([mainTopic, titles]) => {
                        const locked = !isPaid;

                        const cardContent = (
                            <div
                                className={`
                                w-full rounded-xl p-4
                                bg-white border border-neutral-200
                                shadow-sm transition-all duration-200
                                ${
                                    !locked
                                        ? "hover:shadow-md hover:-translate-y-[1px] cursor-pointer"
                                        : ""
                                }
                            `}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="font-semibold text-neutral-900">
                                        {mainTopic}
                                    </h2>

                                    {locked && (
                                        <span className="text-xs text-neutral-400 font-medium">
                                        🔒 Locked
                                    </span>
                                    )}
                                </div>

                                {/* Titles */}
                                <ul className="text-sm text-neutral-600 space-y-1 mt-2">
                                    {titles.map((title, i) => (
                                        <li key={i} className="truncate">
                                            • {title}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );

                        return locked ? (
                            <div key={mainTopic}>{cardContent}</div>
                        ) : (
                            <Link key={mainTopic} href={`/mainStudy/${mainTopic}`}>
                                {cardContent}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
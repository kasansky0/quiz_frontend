"use client";

import { useSubjectById } from "@/app/(dashboard)/mainStudy/[study]/[subjectId]/oneSubjectHook";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRef } from "react";
import PositionCard from "@/app/PositionCard";

export default function SubjectPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    const { subjectId } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const token = session?.idToken;
    const topicRefs = useRef<Array<HTMLDivElement | null>>([]);
    const [activeTopic, setActiveTopic] = useState(0);


    const scrollToTopic = (index: number) => {
        const el = topicRefs.current[index];
        if (el) {
            const yOffset = -70; // adjust for your top bar height
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;

            window.scrollTo({
                top: y,
                behavior: "smooth",
            });

            setActiveTopic(index);
        }
    };




    useEffect(() => {
        const handleScroll = () => {
            topicRefs.current.forEach((el, index) => {
                if (!el) return;

                const rect = el.getBoundingClientRect();

                if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
                    setActiveTopic(index);
                }
            });
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);


    const { subject, loading, error, subscriptionRequired } = useSubjectById(
        apiUrl,
        Array.isArray(subjectId) ? subjectId[0] : subjectId ?? "",
        token
    );

    const [fade, setFade] = useState(false);

    // Trigger fade after subject is ready
    useEffect(() => {
        if (!loading && subject) {
            const timer = setTimeout(() => setFade(true), 50);
            return () => clearTimeout(timer);
        }
    }, [loading, subject]);

    // Redirect if subscription is required
    useEffect(() => {
        if (subscriptionRequired) {
            router.replace("/mainStudy");
        }
    }, [subscriptionRequired, router]);

    useEffect(() => {
        // If loading finished and there is no subject, redirect to mainStudy
        if (!loading && !subject) {
            router.replace("/mainStudy");
        }
    }, [loading, subject, router]);

    if (!subjectId)
        return <div className="p-6 text-black">Invalid subject ID</div>;

    const handleQuizClick = () => {
        router.push(`/quiz/${subjectId}`);
    };

    return (
        <div className="p-4 md:p-4 text-black relative min-h-screen">
            {loading || subscriptionRequired === undefined ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black-200/80 backdrop-blur-sm z-50 -translate-y-6">
                    <p className="text-xl flex items-center">
                        Loading
                        <span className="ml-2 flex space-x-1">
                <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce"></span>
                <span
                    className="w-2 h-2 bg-black rounded-full animate-dot-bounce"
                    style={{ animationDelay: "0.2s" }}
                ></span>
                <span
                    className="w-2 h-2 bg-black rounded-full animate-dot-bounce"
                    style={{ animationDelay: "0.4s" }}
                ></span>
            </span>
                    </p>
                </div>
            ) : subject ? (
                <div
                    className={`mx-auto max-w-xl pb-16 transition-opacity duration-700 ease-in-out ${
                        fade ? "opacity-100" : "opacity-0"
                    }`}
                >
                    {error && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-500 text-sm">
                            Error: {error}
                        </div>
                    )}

                    {/* KEEP THIS EXACTLY AS YOU SAID (UNCHANGED) */}
                    <div className="relative flex items-center mb-4">

                        {/* Left button */}
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-white border border-transparent hover:border-neutral-200 transition z-10"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-8 h-8"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 19.5 8.25 12l7.5-7.5"
                                />
                            </svg>
                        </button>

                        {/* Future Ads / Message */}
                        <PositionCard />

                    </div>

                    {/* TITLE (LinkedIn style hierarchy) */}
                    <h1 className="text-xl font-semibold text-center mb-2 text-neutral-900">
                        {subject.title}
                    </h1>

                    <p className="mb-6 text-sm text-neutral-600 text-center leading-relaxed">
                        {subject.description}
                    </p>

                    {/* QUIZ BUTTON (LinkedIn card button style) */}
                    {subject.isQuiz && (
                        <div className="flex justify-center my-4 w-full">
                            <button
                                onClick={handleQuizClick}
                                style={{ touchAction: "manipulation" }}
                                className="w-full flex justify-center items-center gap-2 py-3 rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:bg-neutral-50 transition"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-5 h-5 text-blue-600"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                                    />
                                </svg>

                                <span className="text-sm font-medium text-neutral-700">
                                Practice targeted questions
                            </span>
                            </button>
                        </div>
                    )}

                    {/* TOPICS */}
                    {(subject?.topics ?? []).length ? (
                        <div className="space-y-4">
                            {(subject?.topics ?? []).map((topic, index) => (
                                <div
                                    key={topic.id}
                                    ref={(el) => {
                                        topicRefs.current[index] = el;
                                    }}
                                    className="rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition p-4 scroll-mt-20"
                                >
                                    <h2 className="text-lg font-semibold text-green-600 mb-3">
                                        {topic.title}
                                    </h2>

                                    {topic.subtopics?.length ? (
                                        <div className="space-y-3">
                                            {topic.subtopics.map((sub) => (
                                                <div
                                                    key={sub.id}
                                                    className="rounded-lg border border-neutral-100 bg-neutral-50 p-3"
                                                >
                                                    <h3 className="font-medium text-neutral-900 text-base mb-1">
                                                        {sub.title}
                                                    </h3>

                                                    <p className="text-sm text-neutral-700 leading-relaxed">
                                                        {sub.content?.split("\n").map((line, i) => (
                                                            <span key={i}>
                                                                {line}
                                                                <br />
                                                            </span>
                                                        ))}
                                                    </p>

                                                    {sub.resources && sub.resources.length > 0 && (
                                                        <ul className="mt-2 ml-4 list-disc text-sm text-neutral-600">
                                                            {sub.resources.map((res, i) => (
                                                                <li key={`${res.code}-${i}`}>
                                                                    <span className="font-medium">
                                                                        {res.code}
                                                                    </span>{" "}
                                                                    {res.description}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="ml-2 text-sm text-neutral-500">
                                            No subtopics
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-500">No topics found</p>
                    )}

                    {/* QUIZ BUTTON AGAIN (same LinkedIn style consistency) */}
                    {subject.isQuiz && (
                        <div className="flex justify-center my-4 w-full">
                            <button
                                onClick={handleQuizClick}
                                style={{ touchAction: "manipulation" }}
                                className="w-full flex justify-center items-center gap-2 py-3 rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:bg-neutral-50 transition"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-5 h-5 text-blue-600"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                                    />
                                </svg>

                                <span className="text-sm font-medium text-neutral-700">
                                Practice targeted questions
                            </span>
                            </button>
                        </div>
                    )}

                    {/* FLOATING TOPIC NAV */}
                    {(subject?.topics ?? []).length > 0 && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[60%] lg:-translate-x-[60%] z-50">

                            <div className="flex items-center gap-2 bg-white border border-neutral-200 shadow-lg rounded-full px-3 py-2">

                                {/* TO TOP (primary / reset action) */}
                                <button
                                    onClick={() => {
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                        setActiveTopic(0);
                                    }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition"
                                    title="Scroll to top"
                                >
                                    {/* double up = “all the way up” */}
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M6 16l6-6 6 6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M6 10l6-6 6 6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>

                                {/* divider */}
                                <div className="w-px h-5 bg-neutral-200" />

                                {/* PREV TOPIC */}
                                <button
                                    onClick={() => {
                                        if (activeTopic > 0) {
                                            scrollToTopic(activeTopic - 1);
                                        }
                                    }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition text-neutral-700"
                                    title="Previous topic"
                                >
                                    {/* up arrow (subtle) */}
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M6 14l6-6 6 6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>

                                {/* divider */}
                                <div className="w-px h-5 bg-neutral-200" />

                                {/* NEXT TOPIC */}
                                <button
                                    onClick={() => {
                                        if (activeTopic < (subject?.topics ?? []).length - 1) {
                                            scrollToTopic(activeTopic + 1);
                                        }
                                    }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition text-green-600"
                                    title="Next topic"
                                >
                                    {/* down arrow = forward */}
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M6 10l6 6 6-6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>

                            </div>
                        </div>
                    )}

                </div>
            ) : null}
        </div>
    );
}
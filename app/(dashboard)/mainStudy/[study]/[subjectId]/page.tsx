"use client";

import { useSubjectById } from "@/app/(dashboard)/mainStudy/[study]/[subjectId]/oneSubjectHook";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function SubjectPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    const { subjectId } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const token = session?.idToken;

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
        return <div className="p-6 text-white">Invalid subject ID</div>;

    const handleQuizClick = () => {
        router.push(`/quiz/${subjectId}`);
    };

    return (
        <div className="p-4 md:p-4 text-white relative min-h-screen">
            {loading || subscriptionRequired === undefined ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white pointer-events-none">
                    <p className="text-xl flex items-center">
                        Loading
                        <span className="ml-2 flex space-x-1">
                            <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce"></span>
                            <span
                                className="w-2 h-2 bg-white rounded-full animate-dot-bounce"
                                style={{ animationDelay: "0.2s" }}
                            ></span>
                            <span
                                className="w-2 h-2 bg-white rounded-full animate-dot-bounce"
                                style={{ animationDelay: "0.4s" }}
                            ></span>
                        </span>
                    </p>
                </div>
            ) : subject ? (
                <div
                    className={`mx-auto max-w-4xl pb-16 transition-opacity duration-700 ease-in-out ${
                        fade ? "opacity-100" : "opacity-0"
                    }`}
                >
                    {error && <div className="p-6 text-red-400">Error: {error}</div>}

                    <div className="flex items-center justify-start mb-4">
                        <button
                            onClick={() => router.back()}
                            title="Back"
                            className="p-0 m-0 flex items-center justify-center mr-4"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="2 2 21 21"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-8 h-8 block"
                            >
                                <path
                                    strokeLinecap="butt"
                                    strokeLinejoin="miter"
                                    d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                            </svg>
                        </button>

                        <div className="text-sm sm:text-base">
                            Promoted: CBS Electrical Contractors <br /> Hiring NETA 2 Techs 📍Raleigh NC
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold mb-4 text-blue-500">{subject.title}</h1>
                    <p className="mb-4 text-gray-300">{subject.description}</p>

                    {subject.isQuiz && (
                        <div className="flex justify-center my-4 w-full">
                            <button
                                onClick={handleQuizClick}
                                style={{ touchAction: "manipulation" }}
                                className="w-full flex justify-center items-center py-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-6 h-6 text-blue-600 transition-transform"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                                    />
                                </svg>
                                <span className="ml-2 text-blue-600 font-medium text-sm sm:text-base">
                                    Practice targeted questions
                                </span>
                            </button>
                        </div>
                    )}

                    {subject.topics?.length ? (
                        <div className="space-y-6">
                            {subject.topics.map((topic) => (
                                <div
                                    key={topic.id}
                                    className="bg-dark-300/40 rounded-lg p-2 shadow-sm hover:bg-dark-300 transition"
                                >
                                    <h2 className="text-2xl text-green-500 font-semibold mb-3">{topic.title}</h2>

                                    {topic.subtopics?.length ? (
                                        <div className="space-y-3">
                                            {topic.subtopics.map((sub) => (
                                                <div key={sub.id} className="bg-dark-300/20 rounded-md">
                                                    <h3 className="font-medium text-lg">{sub.title}</h3>

                                                    <p className="text-gray-300 text-sm leading-relaxed">
                                                        {sub.content?.split("\n").map((line, i) => (
                                                            <span key={i}>
                                                                {line}
                                                                <br />
                                                            </span>
                                                        ))}
                                                    </p>

                                                    {sub.resources && sub.resources.length > 0 && (
                                                        <ul className="ml-4 list-disc text-sm text-gray-400">
                                                            {sub.resources.map((res, i) => (
                                                                <li key={`${res.code}-${i}`}>
                                                                    <span className="font-semibold">{res.code}:</span>{" "}
                                                                    {res.description}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="ml-4 text-gray-500">No subtopics</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400">No topics found</p>
                    )}


                    {subject.isQuiz && (
                        <div className="flex justify-center my-4 w-full">
                            <button
                                onClick={handleQuizClick}
                                style={{ touchAction: "manipulation" }}
                                className="w-full flex justify-center items-center py-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-6 h-6 text-blue-600 transition-transform"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                                    />
                                </svg>
                                <span className="ml-2 text-blue-600 font-medium text-sm sm:text-base">
                                    Practice targeted questions
                                </span>
                            </button>
                        </div>
                    )}


                </div>
            ) : null }
        </div>
    );
}
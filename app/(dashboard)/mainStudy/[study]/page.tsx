"use client";

import { useSubjects } from "@/app/(dashboard)/mainStudy/[study]/subjectsHook";
import {useParams, useRouter} from "next/navigation"; // get dynamic route
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";


export default function StudyPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    const params = useParams();
    const mainTopic = params.study as string;
    const router = useRouter(); // <-- add router
    const { data: session } = useSession();
    const token = session?.idToken; // or accessToken depending on your setup

    const { subjects, loadingSubjects, errorSubjects, subscriptionRequired } =
        useSubjects(apiUrl, mainTopic, token);

    const shouldRedirect = !loadingSubjects && subscriptionRequired === true;

    useEffect(() => {
        if (shouldRedirect) {
            router.replace("/mainStudy");
        }
    }, [shouldRedirect, router]);

    // Fade-in effect
    const [fade, setFade] = useState(false);

    // Trigger fade after subjects are ready
    useEffect(() => {
        if (!loadingSubjects && subscriptionRequired === false && subjects.length) {
            const timer = setTimeout(() => setFade(true), 50);
            return () => clearTimeout(timer);
        }
    }, [loadingSubjects, subscriptionRequired, subjects]);

    useEffect(() => {
        setFade(false);
    }, [loadingSubjects]);

    const showLoader =
        loadingSubjects ||
        subscriptionRequired === null ||
        (!subjects.length && !errorSubjects);

    return (
        <div className="relative min-h-screen w-full flex justify-center items-start p-4 md:p-8 text-black bg-black-200">

            {/* LOADER OVERLAY */}
            {showLoader && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black-200/80 backdrop-blur-sm z-50 -translate-y-6">
                    <p className="text-xl flex items-center">
                        Loading
                        <span className="ml-2 flex space-x-1">
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce"></span>
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                    </span>
                    </p>
                </div>
            )}

            {!showLoader && (
                <div className={`w-full max-w-xl pb-16 transition-opacity duration-700 ease-in-out ${fade ? "opacity-100" : "opacity-0"}`}>

                    {errorSubjects && (
                        <div className="mb-4 p-4 rounded-xl bg-white border border-red-200 text-red-500 shadow-sm">
                            {errorSubjects}
                        </div>
                    )}

                    {!errorSubjects && subjects.length === 0 && (
                        <div className="mb-4 p-4 rounded-xl bg-white border border-neutral-200 text-black shadow-sm">
                            No subjects found.
                        </div>
                    )}

                    {/* KEEP EVERYTHING ABOVE EXACTLY THE SAME (NETA SECTION UNTOUCHED) */}
                    <div className="relative flex items-center mb-4">

                        {/* Left button (clean LinkedIn icon style) */}
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-white border border-transparent hover:border-neutral-200 transition z-10"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                                stroke="currentColor"
                                className="w-8 h-8 text-neutral-700"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 19.5 8.25 12l7.5-7.5"
                                />
                            </svg>
                        </button>

                        {/* 🔥 DO NOT CHANGE THIS SECTION (as requested) */}
                        <Link
                            href="/position"
                            className="w-full text-center text-xs block active:bg-transparent focus:bg-transparent [-webkit-tap-highlight-color:transparent]"
                        >
                            <div className="flex flex-col items-center space-y-1">

                                {/* ICON + TITLE */}
                                <div className="font-semibold flex items-center justify-center gap-2 text-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-4 h-4 text-blue-400 flex-shrink-0"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M20.25 7.5h-16.5A2.25 2.25 0 001.5 9.75v9A2.25 2.25 0 003.75 21h16.5A2.25 2.25 0 0022.5 18.75v-9A2.25 2.25 0 0020.25 7.5z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8.25 7.5V6a3.75 3.75 0 017.5 0v1.5"
                                        />
                                    </svg>

                                    <span className="leading-none">
                                                    Hiring NETA Technicians
                                                </span>
                                </div>

                                {/* LOCATION */}
                                <div className="text-xs text-center flex items-center justify-center gap-1 text-neutral-600">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-4 h-4 text-blue-400 flex-shrink-0"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                                        />
                                    </svg>

                                    <span>Multiple locations • Relocation assistance</span>
                                </div>

                                {/* CTA */}
                                <div className="text-blue-400 text-xs flex items-center gap-1 group">
                                    <span>View positions</span>

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="w-3 h-3"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M3 10a.75.75 0 01.75-.75h10.69L10.22 5.03a.75.75 0 011.06-1.06l5.5 5.5a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 11-1.06-1.06l4.22-4.22H3.75A.75.75 0 013 10z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>

                            </div>
                        </Link>

                    </div>

                    {/* TITLE (LinkedIn-style typography) */}
                    <h1 className="text-2xl font-semibold mb-5 text-center text-neutral-900">
                        {mainTopic} Subjects
                    </h1>

                    {/* SUBJECTS LIST (LinkedIn feed cards) */}
                    <div className="flex flex-col space-y-3">

                        {subjects.map(subject => (
                            <Link
                                key={subject.id}
                                href={`/mainStudy/${mainTopic}/${subject.id}`}
                                className="
                                group
                                rounded-xl
                                bg-white
                                border border-neutral-200
                                shadow-sm
                                p-4
                                transition
                                hover:shadow-md
                                hover:-translate-y-[1px]
                                active:scale-[0.99]
                            "
                            >
                                <h2 className="font-semibold text-blue-600 group-hover:text-blue-700 transition">
                                    {subject.title}
                                </h2>

                                <p className="text-sm text-neutral-600 mt-1">
                                    {subject.description}
                                </p>
                            </Link>
                        ))}

                    </div>

                </div>
            )}
        </div>
    );
}
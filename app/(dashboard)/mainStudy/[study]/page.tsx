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

    // ✅ HARD BLOCK LOADING (PASTE HERE)
    if (loadingSubjects || subscriptionRequired === null) {
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

    return (
        <div className="min-h-screen w-full flex justify-center items-start p-4 md:p-8 text-white">
            <div className={`w-full max-w-xl pb-16 transition-opacity duration-700 ease-in-out ${fade ? "opacity-100" : "opacity-0"}`}>
                {errorSubjects && <div className="p-6 text-red-400">{errorSubjects}</div>}
                {!errorSubjects && subjects.length === 0 && <div className="p-6 text-white">No subjects found.</div>}

                <div className="relative flex items-center mb-4">

                    {/* Left button */}
                    <button
                        onClick={() => router.back()}
                        className="absolute left-0"
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
                    <Link
                        href="/position"
                        className="w-full text-center text-sm py-1 transition block active:bg-transparent focus:bg-transparent [-webkit-tap-highlight-color:transparent]"
                    >
                        <div className="font-semibold">
                            💼 Hiring NETA Technicians
                        </div>

                        <div className="text-xs mt-1">
                            📍 Multiple locations • Relocation assistance
                        </div>

                        <div className="text-blue-400 text-xs mt-2">
                            View positions →
                        </div>
                    </Link>

                </div>

                <h1 className="text-2xl font-bold mb-4 text-center">
                    {mainTopic} Subjects
                </h1>
                <div className="flex flex-col space-y-4">
                    {subjects.map(subject => (
                        <Link
                            key={subject.id}
                            href={`/mainStudy/${mainTopic}/${subject.id}`}
                            className="rounded-lg bg-dark-300/60 hover:bg-dark-300 transition p-2"
                        >
                            <h2 className="font-semibold text-blue-500">{subject.title}</h2>
                            <p className="text-sm text-gray-300">{subject.description}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
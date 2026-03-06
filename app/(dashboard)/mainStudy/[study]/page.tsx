"use client";

import { useSubjects } from "@/app/(dashboard)/mainStudy/[study]/subjectsHook";
import {useParams, useRouter} from "next/navigation"; // get dynamic route
import Link from "next/link";


export default function StudyPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    const params = useParams();
    const mainTopic = params.study as string;
    const router = useRouter(); // <-- add router



    const { subjects, loadingSubjects, errorSubjects } = useSubjects(apiUrl, mainTopic);

    if (loadingSubjects) return <div className="p-6 text-white">Loading subjects...</div>;
    if (errorSubjects) return <div className="p-6 text-red-400">{errorSubjects}</div>;
    if (!subjects.length) return <div className="p-6 text-white">No subjects found.</div>;

    return (
        <div className="p-4 md:p-4 text-white">

            <button
                onClick={() => router.back()}
                title="Back"
                className="p-0 m-0 flex items-center justify-center pb-3"
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

            <h1 className="text-2xl font-bold mb-6">{mainTopic} Subjects</h1>
            <div className="flex flex-col space-y-4">
                {subjects.map(subject => (
                    <Link
                        key={subject.id}
                        href={`/mainStudy/${mainTopic}/${subject.id}`}
                        className="rounded-lg bg-dark-300/60 hover:bg-dark-300 transition p-4"
                    >
                        <h2 className="font-semibold text-blue-500">{subject.title}</h2>
                        <p className="text-sm text-gray-300">{subject.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
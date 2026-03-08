"use client";

import { useMainTopics } from "@/app/(dashboard)/mainStudy/mainStudyTopicHook";
import Link from "next/link";

export default function MainStudyPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    const { mainTopics, loading, error } = useMainTopics(apiUrl);

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <p className="text-xl">Loading...</p>
            </div>
        );
    if (error) return <div className="p-6 text-red-400">{error}</div>;
    if (!mainTopics.length) return <div className="p-6 text-white">No main topics found.</div>;

    return (
        <div className="p-4 md:p-4 text-white">
            <div className="mx-auto max-w-4xl">
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
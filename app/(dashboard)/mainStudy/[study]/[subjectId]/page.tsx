"use client";

import { useSubjectById } from "@/app/(dashboard)/mainStudy/[study]/[subjectId]/oneSubjectHook";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function SubjectPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
    const { subjectId } = useParams();
    const router = useRouter(); // <-- add router

    const { subject, loading, error } = useSubjectById(
        apiUrl,
        Array.isArray(subjectId) ? subjectId[0] : subjectId ?? ""
    );

    if (!subjectId)
        return <div className="p-6 text-white">Invalid subject ID</div>;

    if (loading)
        return <div className="p-6 text-white">Loading subject...</div>;

    if (error)
        return <div className="p-6 text-red-400">Error: {error}</div>;

    if (!subject)
        return <div className="p-6 text-white">Subject not found</div>;

    // Function to handle quiz button click
    const handleQuizClick = () => {
        router.push(`/quiz?subjectId=${subjectId}`);
    };

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

            <h1 className="text-3xl font-bold mb-6 text-blue-500">{subject.title}</h1>
            <p className="mb-8 text-gray-300">{subject.description}</p>

            {/* ✅ Quiz note if isQuiz is true */}
            {subject.isQuiz && (
                <p className="mb-6 text-sm text-yellow-400 text-center">
                    Build muscle memory on this topic with targeted questions at the end.
                </p>
            )}

            {subject.topics?.length ? (
                <div className="space-y-6">
                    {subject.topics.map((topic) => (
                        <div
                            key={topic.id}
                            className="bg-dark-300/40 rounded-lg p-2 shadow-sm hover:bg-dark-300 transition"
                        >
                            <h2 className="text-2xl font-semibold mb-3">
                                {topic.title}
                            </h2>

                            {topic.subtopics?.length ? (
                                <div className="space-y-3">
                                    {topic.subtopics.map((sub) => (
                                        <div
                                            key={sub.id}
                                            className="bg-dark-300/20 rounded-md"
                                        >
                                            <h3 className="font-medium text-lg">
                                                {sub.title}
                                            </h3>

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
                                <p className="ml-4 text-gray-500">
                                    No subtopics
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400">No topics found</p>
            )}

            {/* ✅ Take Quiz Button at the bottom of the page */}
            {subject.isQuiz && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={handleQuizClick}
                        className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-base font-medium transition-colors"
                    >
                        {`Practice "${subject.title}" Quiz`}
                    </button>
                </div>
            )}

        </div>
    );
}
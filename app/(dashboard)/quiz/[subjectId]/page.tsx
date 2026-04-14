    "use client";

    import { useSession } from "next-auth/react";
    import { useState } from "react";
    import QuizSampleSection from "@/app/(dashboard)/quiz/components/QuizSampleSection";
    import { useParams } from "next/navigation"; // <-- import
    import type { QuestionType } from "@/app/(dashboard)/quiz/components/QuizSampleSection";
    import { useError } from "@/app/ErrorProvider";

    export default function QuizPage() {
        const { data: session } = useSession();
        const [wrongQueue, setWrongQueue] = useState<QuestionType[]>([]); // ✅ typed array
        const [answerCount, setAnswerCount] = useState(0);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const userId = session?.user?.id;
        const token = session?.idToken;
        const { showError } = useError();


        const { subjectId: param } = useParams();
        const subjectId = Array.isArray(param) ? param[0] : param; // type: string | undefined
        if (!subjectId) return <div className="p-6 text-white">No subject specified</div>;

        return (
            <QuizSampleSection
                isLoggedIn={true}
                wrongQueue={wrongQueue}
                setWrongQueue={setWrongQueue}
                apiUrl={apiUrl}
                userId={userId}
                loadingDone={true}
                mode="smart"
                token={token}
                subjectId={subjectId} // pass dynamic param here
                onAnswer={async (isCorrect, questionId, selectedOption) => {
                    setAnswerCount(prev => prev + 1);

                    if (!apiUrl || !userId) {
                        showError("⚠️ Missing API URL or user ID. Cannot record answer.");
                        return;
                    }

                    try {
                        const res = await fetch(`${apiUrl}/answer/record`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                user_id: userId,
                                question_id: questionId,
                                selected_option: selectedOption
                            }),
                        });

                        if (!res.ok) {
                            const text = await res.text().catch(() => "");
                            console.warn("Failed to record answer:", res.status, text);
                            showError("❌ Failed to record answer. Please try again.");
                        }
                    } catch (err: unknown) {
                        const message = err instanceof Error ? err.message : String(err);
                        console.warn("Error recording answer:", message);
                        showError("⚠️ Network error.");
                    }
                }}
            />
        );
    }

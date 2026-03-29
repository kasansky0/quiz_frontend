    "use client";

    import { useSession } from "next-auth/react";
    import { useState } from "react";
    import QuizSampleSection from "@/app/(dashboard)/quiz/components/QuizSampleSection";
    import { useParams } from "next/navigation"; // <-- import
    import type { QuestionType } from "@/app/(dashboard)/quiz/components/QuizSampleSection";

    export default function QuizPage() {
        const { data: session } = useSession();
        const [wrongQueue, setWrongQueue] = useState<QuestionType[]>([]); // ✅ typed array
        const [answerCount, setAnswerCount] = useState(0);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const userId = session?.user?.id;
        const token = session?.idToken;


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
                onAnswer={async (isCorrect, questionId) => {
                    setAnswerCount(prev => prev + 1);

                    if (!apiUrl || !userId) return;

                    await fetch(`${apiUrl}/answer/record`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            user_id: userId,
                            question_id: questionId,
                            correct: isCorrect
                        }),
                    });
                }}
            />
        );
    }

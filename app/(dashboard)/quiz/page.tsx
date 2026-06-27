"use client";

import { useSession } from "next-auth/react";
import { useState, useRef } from "react";
import QuizSampleSection from "@/app/(dashboard)/quiz/components/QuizSampleSection";
import type { QuestionType } from "@/app/(dashboard)/quiz/components/QuizSampleSection";
import { useError } from "@/app/ErrorProvider";

export default function QuizNoSubjectPage() {
    const { data: session, status } = useSession();
    const [wrongQueue, setWrongQueue] = useState<QuestionType[]>([]);
    const [answerCount, setAnswerCount] = useState(0);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const userId = session?.user?.id;
    const token = session?.idToken;
    const { showError } = useError();

    if (status === "loading" || !session) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen text-black">
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

    return (
        <QuizSampleSection
            isLoggedIn={true}
            wrongQueue={wrongQueue}
            setWrongQueue={setWrongQueue}
            apiUrl={apiUrl}
            userId={userId}
            mode="random"
            token={token}
            loadingDone={true}
            onAnswer={async (isCorrect, questionId, selectedOption) => {
                setAnswerCount(prev => prev + 1);

                if (!apiUrl || !userId) return;

                try {
                    const res = await fetch(`${apiUrl}/answer/record`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            question_id: questionId,
                            selected_option: selectedOption,
                        }),
                    });

                    if (!res.ok) {
                        const text = await res.text().catch(() => "");
                        console.error("Failed to record answer:", text);
                        showError("Failed to record your answer. Please try again.", true);
                    }
                } catch (err) {
                    console.error("Network error recording answer:", err);
                    showError("⚠️ Network error.", true);
                }
            }}
        />
    );
}
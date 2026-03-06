"use client";

import { useState, useEffect, useRef } from "react";
import Question from "./Question";
import Option from "./Options";
import Comment from "./Comment";
import { HeroCard } from "./HeroCard";
import { ScrollHint } from "./ScrollHint";
import { Button } from "@/app/components/ui/Button";
import { useError } from "@/app/ErrorProvider";


export interface QuestionType {
    id: number;
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

export function scrollToTopChild(container?: React.RefObject<HTMLElement | null>) {
    if (!container?.current) return;

    const topChild = container.current.firstElementChild as HTMLElement | null;

    if (topChild) {
        // Get the child's offset relative to the container
        const containerTop = container.current.getBoundingClientRect().top;
        const childTop = topChild.getBoundingClientRect().top;
        const scrollOffset = childTop - containerTop + container.current.scrollTop;

        container.current.scrollTo({
            top: scrollOffset,
            behavior: "smooth",
        });
    } else {
        // fallback to container itself
        container.current.scrollTo({ top: 0, behavior: "smooth" });
    }
}


interface QuizSampleSectionProps {
    isLoggedIn: boolean;
    onClick?: () => void;
    staticQuestion?: QuestionType;
    wrongQueue?: QuestionType[];
    setWrongQueue?: React.Dispatch<React.SetStateAction<QuestionType[]>>;
    apiUrl?: string;
    userId?: string | number;
    loadingDone?: boolean;
    style?: React.CSSProperties;
    scrollContainerRef?: React.RefObject<HTMLElement | null>;
    onAnswer?: (isCorrect: boolean, questionId: number) => void;
    subjectId?: string; // <-- add this
}


export default function QuizSampleSection({
                                              isLoggedIn,
                                              onClick,
                                              staticQuestion,
                                              wrongQueue,
                                              userId,
                                              setWrongQueue,
                                              apiUrl,
                                              loadingDone,
                                              scrollContainerRef,
                                              subjectId,
                                              onAnswer = () => {}, // default no-op
                                          }: QuizSampleSectionProps) {
    const [questionData, setQuestionData] = useState<QuestionType | null>(null);
    const [fade, setFade] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answerResult, setAnswerResult] = useState<{ correct: boolean; answer: string; explanation: string } | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const optionsRef = useRef<HTMLDivElement>(null);
    const [cycleCount, setCycleCount] = useState(0);
    const [fetchError, setFetchError] = useState(false); // <-- track fetch failures
    const QUESTIONS_BEFORE_REVIEW = 2;
    const { showError } = useError();






    // Scroll to options when an option is selected
    useEffect(() => {
        if (!selectedOption) return;
        optionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [selectedOption]);

    useEffect(() => {
        if (!loadingDone) {
            setQuestionData(null);     // prevents leftover question
            setSelectedOption(null);
            setAnswerResult(null);
        }
    }, [loadingDone]);

    useEffect(() => {
        if (!loadingDone || !apiUrl) return;

        let isMounted = true;

        async function fetchFirstQuestion() {
            try {
                const res = await fetch(`${apiUrl}/questions/next`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: isLoggedIn ? userId : null,
                        subject_id: subjectId ?? null,
                    }),
                });

                if (!res.ok) showError("Failed to fetch question"); // 🔴 show banner

                const data: QuestionType = await res.json();

                if (!data?.options?.length) return;

                if (isMounted) {
                    setQuestionData(data);
                    setTimeout(() => setFade(true), 100);
                }

            } catch (err) {
                console.error(err);
                setFetchError(true);
            }
        }

        fetchFirstQuestion();

        return () => { isMounted = false };
    }, [loadingDone, apiUrl, isLoggedIn, userId, subjectId]);


    // Handle when sidebar clicks "Next"
    async function fetchNextQuestion() {
        if (!apiUrl) return null;

        try {
            const res = await fetch(`${apiUrl}/questions/next`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: isLoggedIn ? userId : null,
                    subject_id: subjectId ?? null,
                }),
            });

            if (!res.ok) showError("Failed to fetch question"); // 🔴 show banner

            const data: QuestionType = await res.json();
            return data;

        } catch (err) {
            console.error("Failed to fetch question:", err);
            return null;
        }
    }


    const handleNextQuestion = async () => {
        setFade(false);
        await new Promise(res => setTimeout(res, 500));

        setSelectedOption(null);
        setAnswerResult(null);

        let nextQuestion: QuestionType | null = null;

        // Check if wrongQueue review is needed
        if (
            cycleCount === QUESTIONS_BEFORE_REVIEW &&
            wrongQueue &&
            wrongQueue.length > 0 &&
            setWrongQueue
        ) {
            nextQuestion = wrongQueue[0];
            setWrongQueue(prev => prev.slice(1));
            setCycleCount(0);
        } else {
            // Decide if this fetch is general or topic-specific
            const fetched = await fetchNextQuestion();
            if (!fetched) {
                setFetchError(true);
                return;
            }
            nextQuestion = fetched;
            setCycleCount(prev => prev + 1);
        }

        if (nextQuestion) setQuestionData(nextQuestion);
        setFade(true);

        scrollContainerRef?.current?.scrollTo({ top: 0, behavior: "auto" });
        window.scrollTo({ top: 0, behavior: "auto" });
    };



// 3️⃣ Handle answer click
    const handleAnswerClick = async (option: string) => {
        if (!selectedOption && questionData) {
            setSelectedOption(option);

            let correct = false;
            let answer = questionData.answer;
            let explanation = questionData.explanation;

            if (isLoggedIn && apiUrl) {
                try {
                    const res = await fetch(`${apiUrl}/answer/check`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            question_id: questionData.id,
                            selected_option: option,
                            user_id: String(userId),
                        }),
                    });

                    if (!res.ok) showError("API failed"); // 🔴 show banner

                    const result = await res.json();
                    correct = result.correct;
                    answer = result.answer;
                    explanation = result.explanation || questionData.explanation;
                } catch (err) {
                    console.error("Answer fetch failed:", err);
                    setFetchError(true); // show the reload overlay
                    return; // stop further processing
                }
            } else {
                correct = option === questionData.answer;
            }

            // ✅ Add to the back of the queue if wrong
            if (!correct && setWrongQueue && questionData) {
                setWrongQueue(prev => {
                    if (prev.some(q => q.id === questionData.id)) return prev;
                    return [...prev, questionData];
                });
            }

            if (onAnswer && questionData) onAnswer(correct, questionData.id);

            setAnswerResult({ correct, answer, explanation });
        }
    };




    return (
        <div
            className="flex-1 flex flex-col items-center justify-start p-5 sm:p-5 md:p-8 min-h-[50vh] md:h-auto bg-dark-400 w-full no-select"
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Reload overlay if fetch failed */}
            {fetchError && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-300/90 backdrop-blur-sm p-4">
                    <div className="bg-dark-400/80 border border-green-400/40 shadow-lg rounded-2xl max-w-md w-full p-6 text-center backdrop-blur-md">
                        <h2 className="text-green-400 text-lg font-semibold mb-2 drop-shadow-[0_0_12px_rgba(36,174,124,0.8)]">
                            Error
                        </h2>
                        <p className="text-green-200 text-sm mb-6">
                            Failed to load the next question. Please reload the page to continue.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-5 py-2 bg-green-500 text-black font-medium rounded-full hover:bg-green-400 transition"
                        >
                            Reload
                        </button>
                    </div>
                </div>
            )}

            {/* Quiz content */}
            {!isLoggedIn ? (
                <>
                    <div className="mb-4">
                        <ScrollHint />
                    </div>
                    {questionData && <HeroCard question={questionData} />}
                </>
            ) : (
                questionData && (
                    <div
                        key={questionData.id}
                        className={`w-full max-w-xl flex flex-col gap-6 justify-start transition-opacity duration-700 ease-in-out ${
                            fade ? "opacity-100" : "opacity-0"
                        }`}
                    >
                        {/* Question */}
                        <Question question={questionData.question} />

                        {/* Options */}
                        <div ref={optionsRef} className="flex flex-col gap-3">
                            {questionData.options.map((option) => (
                                <Option
                                    key={option}
                                    text={option}
                                    isSelected={selectedOption === option}
                                    isAnswer={answerResult?.answer === option}
                                    disabled={!!selectedOption}
                                    onClick={() => handleAnswerClick(option)}
                                />
                            ))}
                        </div>

                        {/* NEXT BUTTON */}
                        {selectedOption && (
                            <div className="flex flex-col items-center gap-2 w-full">
                                <Button
                                    onClick={handleNextQuestion}
                                    className="px-4 py-2 text-sm sm:px-6 sm:py-2.5 sm:text-base"
                                >
                                    Next
                                </Button>
                                <div className="flex flex-col items-center text-center">
                                    <ScrollHint />
                                    <span className="text-xs sm:text-sm text-light-200 opacity-80 mt-1">
                                        Study the explanation below ⬇️
                                    </span>
                                </div>

                            </div>
                        )}

                        {/* Explanation */}
                        {answerResult && selectedOption && (
                            <Comment
                                isCorrect={answerResult.correct}
                                text={answerResult.explanation}
                                correctAnswer={questionData.answer}
                            />
                        )}
                    </div>
                )
            )}
        </div>
    );

}

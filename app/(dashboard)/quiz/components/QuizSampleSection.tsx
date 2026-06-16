"use client";

import { useState, useEffect, useRef } from "react";
import Question from "./Question";
import Option from "./Options";
import Comment from "./Comment";
import { HeroCard } from "./HeroCard";
import { ScrollHint } from "./ScrollHint";
import { Button } from "@/components/ui/Button";
import { useError } from "@/app/ErrorProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PositionCard from "@/app/PositionCard";


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
    onAnswer?: (isCorrect: boolean, questionId: number, selectedOption: string) => void;
    subjectId?: string; // <-- add this
    mode?: "random" | "smart"; // ✅ ADD THIS
    token?: string;
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
                                              token,
                                              mode = "smart", // ✅ default behavior stays same
                                              onAnswer = () => {}, // default no-op
                                          }: QuizSampleSectionProps) {
    const [questionData, setQuestionData] = useState<QuestionType | null>(null);
    const [fade, setFade] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answerResult, setAnswerResult] = useState<{ correct: boolean; answer: string; explanation: string } | null>(null);
    const optionsRef = useRef<HTMLDivElement>(null);
    const [cycleCount, setCycleCount] = useState(0);
    const [fetchError, setFetchError] = useState(false); // <-- track fetch failures
    const QUESTIONS_BEFORE_REVIEW = 2;
    const { showError } = useError();
    const router = useRouter();
    const isMountedRef = useRef(true);

    const showLoading = !questionData && !fetchError;

    const [isFetchingNext, setIsFetchingNext] = useState(false);

    const adRef = useRef<HTMLAnchorElement>(null);


    useEffect(() => {
        // when component mounts
        isMountedRef.current = true;
        return () => {
            // when component unmounts
            isMountedRef.current = false;
        };
    }, []);





    function buildQuestionUrl() {
        if (!apiUrl) return "";

        let base = "";

        if (mode === "random") {
            base = `${apiUrl}/questions/random`;
        } else {
            base = `${apiUrl}/questions/random-topic`;
        }

        if (subjectId) {
            base += `?subject_id=${subjectId}`;
        }

        return base;
    }




    // Network-safe fetch wrapper with user-friendly error
    async function safeFetch(
        url: string, options:
        RequestInit,
        showError: (msg: string, isPersistent?: boolean) => void
    ) {
        try {
            if (token) {
                options.headers = {
                    ...(options.headers || {}),
                    Authorization: `Bearer ${token}`,
                };
            }

            if (!token) {
                showError("You need to log in again.", true);
                return null;
            }

            return await fetch(url, options);
        } catch (err: any) {
            console.warn("Network fetch failed:", err);
            return null;
        }
    }





// --- Scroll to options when user selects an answer --- //

    useEffect(() => {
        if (!selectedOption) return;

        const t = setTimeout(() => {
            adRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 200);

        return () => clearTimeout(t);
    }, [selectedOption]);






// --- Fetch the first question from backend --- //

    useEffect(() => {
        if (!loadingDone || !apiUrl || !token) return;

        let isMounted = true;

        async function fetchFirstQuestion() {
            const url = buildQuestionUrl();

            const res = await safeFetch(url, {
                method: "GET",
            }, showError);

            if (!res) {
                if (isMounted) {
                    setFetchError(true);
                }
                return;
            }

            // Check HTTP status
            if (!res.ok) {
                let msg = "Something went wrong. Please try again.";

                try {
                    const json = await res.json().catch(() => null);
                    if (json?.detail) {
                        msg = json.detail;
                    }
                } catch {}

                const isAuthError = res.status === 401;
                const isSubscriptionError = res.status === 403;

                if (isMountedRef.current) {
                    // 🔐 login required
                    if (isAuthError) {
                        showError(msg, true);
                    }

                    // 💳 subscription required
                    else if (isSubscriptionError) {
                        showError(msg, false);
                        router.push("/mainStudy");
                    }

                    // ⚠️ generic error
                    else {
                        showError(msg, false);
                    }

                    setFetchError(true);
                }

                return;
            }

            // Parse JSON safely
            let data: QuestionType | null = null;
            try {
                data = await res.json();
            } catch (jsonErr) {
                console.error("Failed to parse question JSON:", jsonErr);
                if (isMounted) {
                    showError("Failed to parse question data.");
                    setFetchError(true);
                }
                return;
            }

            // Ensure options exist
            if (!data?.options?.length) {
                console.warn("No options found for question:", data);
                if (isMounted) {
                    showError("No options available for this question.");
                    setFetchError(true);
                }
                return;
            }

            // ✅ Update state safely
            if (isMounted) {
                setQuestionData(data);
                requestAnimationFrame(() => setFade(true));
                setFetchError(false); // reset fetch error if successful
            }
        }

        fetchFirstQuestion();

        return () => { isMounted = false; };
    }, [loadingDone, apiUrl, isLoggedIn, userId, token, subjectId, mode]);





// --- Requests the next quiz question from backend when the user clicks Next --- //

    async function fetchNextQuestion() {
        if (!apiUrl || !token) return null;

        try {
            const url = buildQuestionUrl();

            const res = await safeFetch(url, {
                method: "GET",
            }, showError);

            if (!res) {
                if (isMountedRef.current) showError("Failed to load next question. Please try again.");
                setFetchError(true);
                return null;
            }

            // ✅ Check HTTP status
            if (!res.ok) {
                let msg = "Failed to fetch next question. Please try again.";
                try {
                    const json = await res.json().catch(() => null);
                    if (json?.detail) {
                        msg = json.detail; // backend subscription message
                    }
                } catch {}


                if (isMountedRef.current) {
                    showError(msg, res.status === 401);
                }
                setFetchError(true);
                return null;
            }

            // ✅ Parse JSON safely
            let data: QuestionType | null = null;
            try {
                data = await res.json();
            } catch (jsonErr) {
                console.error("Failed to parse next question JSON:", jsonErr);
                if (isMountedRef.current) showError("Failed to parse next question data.");
                setFetchError(true);
                return null;
            }

            // ✅ Ensure options exist
            if (!data?.options?.length) {
                console.warn("No options in next question:", data);
                if (isMountedRef.current) showError("No options available for the next question.");
                setFetchError(true);
                return null;
            }

            setFetchError(false); // reset error if successful
            return data;

        } catch (err) {
            console.error("Unable to fetch next question:", err);
            if (isMountedRef.current) showError("Unable to fetch next question. Please check your connection.");
            setFetchError(true);
            return null;
        }
    }





// --- Main controller for moving to the next quiz question --- //

    const handleNextQuestion = async () => {
        if (isFetchingNext) return;
        setIsFetchingNext(true);

        setFade(false);

        let nextQuestion: QuestionType | null = null;

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
            const fetched = await fetchNextQuestion();
            if (!fetched) {
                setIsFetchingNext(false);
                setFetchError(true);
                return;
            }
            nextQuestion = fetched;
            setCycleCount(prev => prev + 1);
        }

        // RESET STATE FIRST (IMPORTANT ORDER)
        setSelectedOption(null);
        setAnswerResult(null);

        // THEN SET NEW QUESTION
        setQuestionData(nextQuestion);

        // THEN FADE IN
        requestAnimationFrame(() => {
            setFade(true);
        });

        scrollContainerRef?.current?.scrollTo({ top: 0, behavior: "auto" });
        window.scrollTo({ top: 0, behavior: "auto" });

        setIsFetchingNext(false);
    };





// --- Runs when a user clicks one of the answer options in your quiz --- //

    const handleAnswerClick = async (option: string) => {
        if (!selectedOption && questionData) {
            setSelectedOption(option);

            let correct = false;
            let answer = questionData.answer;
            let explanation = questionData.explanation;

            if (isLoggedIn && apiUrl) {
                try {
                    const res = await safeFetch(`${apiUrl}/answer/check`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            question_id: questionData.id,
                            selected_option: option,
                            user_id: String(userId),
                        }),
                    }, showError);

                    if (!res) {
                        showError?.("Failed to check answer. Please try again.");
                        return;
                    }

                    // ✅ Check HTTP status
                    if (!res.ok) {
                        const text = await res.text().catch(() => "");
                        console.error("Answer check failed:", text);
                        showError?.("Failed to check answer. Please try again.");
                        return;
                    }

                    // ✅ Parse JSON safely
                    const result = await res.json().catch(err => {
                        console.error("Failed to parse answer JSON:", err);
                        showError?.("Failed to check answer. Please try again.");
                        return null;
                    });

                    if (result) {
                        correct = result.correct;
                        answer = result.answer;
                        explanation = result.explanation || questionData.explanation;
                    }

                } catch (err) {
                    console.error("Error checking answer:", err);
                    showError?.("Failed to check answer. Please check your connection.");
                    return;
                }
            } else {
                // fallback local check
                correct = option === questionData.answer;
            }

            // ✅ Add wrong answers to the review queue
            if (!correct && setWrongQueue && questionData) {
                setWrongQueue(prev => {
                    if (prev.some(q => q.id === questionData.id)) return prev;
                    return [...prev, questionData];
                });
            }

            if (onAnswer && questionData) onAnswer(correct, questionData.id, option);

            setAnswerResult({ correct, answer, explanation });
        }
    };





    return (
        <div
            className="flex-1 flex flex-col items-center justify-start p-5 sm:p-5 md:p-5 min-h-[50vh] md:h-auto bg-black-200 w-full no-select"
            onContextMenu={(e) => e.preventDefault()}
        >

            {showLoading ? (
                <div className="w-full flex justify-center items-center min-h-screen">
                    <p className="text-xl flex items-center">
                        Loading
                        <span className="ml-2 flex space-x-1">
                <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce"></span>
                <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
            </span>
                    </p>
                </div>
            ) : (

                <>

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
                                    className={`w-full max-w-xl flex flex-col gap-6 justify-start transition-opacity duration-700 ease-in-out
                                        bg-white border border-black/10 rounded-xl shadow-sm p-5 sm:p-6 ${
                                        fade ? "opacity-100" : "opacity-0"
                                    }`}
                                >
                                    {/* Question */}
                                    <Question question={questionData.question} />

                                    {/* Future Ads / Message */}
                                    <PositionCard />

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
                                                disabled={isFetchingNext}
                                                className="
                                                    flex items-center justify-center gap-2
                                                    px-5 py-2.5
                                                    text-sm sm:text-base font-medium
                                                    rounded-full

                                                    bg-white
                                                    text-[#0a66c2]
                                                    border border-[#0a66c2]

                                                    hover:bg-blue-50
                                                    hover:border-[#004182]
                                                    hover:text-[#004182]

                                                    transition
                                                    active:scale-[0.98]

                                                    disabled:opacity-50
                                                    disabled:cursor-not-allowed
                                                "
                                            >
                                                {isFetchingNext ? (
                                                    <span className="flex items-center gap-2 text-[#0a66c2]">
                                                        Loading
                                                        <span className="ml-2 flex space-x-1">
                                                            <span className="w-2 h-2 bg-[#0a66c2] rounded-full animate-dot-bounce"></span>
                                                            <span className="w-2 h-2 bg-[#0a66c2] rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                                                            <span className="w-2 h-2 bg-[#0a66c2] rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <>
                                                        Next
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={2}
                                                            stroke="currentColor"
                                                            className="w-4 h-4 transition-transform group-hover:translate-x-1"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M17.25 12H6.75m10.5 0-4.5-4.5m4.5 4.5-4.5 4.5"
                                                            />
                                                        </svg>
                                                    </>
                                                )}
                                            </Button>

                                            <div className="flex flex-col items-center text-center">
                                                <ScrollHint />
                                                <span className="text-xs sm:text-sm text-black opacity-70 mt-1 flex items-center gap-1">
                                                    Study the explanation below
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
                </>
            )}
        </div>
    );

}

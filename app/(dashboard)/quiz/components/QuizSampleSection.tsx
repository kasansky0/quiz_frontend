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
    const [currentIndex, setCurrentIndex] = useState(0);
    const optionsRef = useRef<HTMLDivElement>(null);
    const [cycleCount, setCycleCount] = useState(0);
    const [fetchError, setFetchError] = useState(false); // <-- track fetch failures
    const QUESTIONS_BEFORE_REVIEW = 2;
    const { showError } = useError();
    const [showLoading, setShowLoading] = useState(true);
    const [subscriptionRequired, setSubscriptionRequired] = useState(false);
    const router = useRouter();

    const isMountedRef = useRef(true);

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




    // Network-safe fetch wrapper
    async function safeFetch(url: string, options: RequestInit) {
        try {
            if (token) {
                options.headers = {
                    ...(options.headers || {}),
                    Authorization: `Bearer ${token}`,
                };
            }
            return await fetch(url, options);
        } catch (err) {
            console.warn("Network fetch failed (suppressed):", err);
            return null;
        }
    }




// --- Controls when a loading screen and spinner appears and disappears --- //

    useEffect(() => {
        if (!loadingDone) {
            setShowLoading(true);
        } else if (questionData) {
            // ensure loading shows at least 1500ms
            const timer = setTimeout(() => setShowLoading(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [loadingDone, questionData]);





// --- Scroll to options when user selects an answer --- //

    useEffect(() => {
        if (!selectedOption) return;
        optionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [selectedOption]);





// --- Reset question state when loading starts --- //

    useEffect(() => {
        if (!loadingDone) {
            setQuestionData(null);     // prevents leftover question
            setSelectedOption(null);
            setAnswerResult(null);
        }
    }, [loadingDone]);





// --- Fetch the first question from backend --- //

    useEffect(() => {
        if (!loadingDone || !apiUrl || !token) return;

        let isMounted = true;

        async function fetchFirstQuestion() {
            const url = buildQuestionUrl();

            const res = await safeFetch(url, {
                method: "GET",
            });

            if (!res) {
                if (isMounted) {
                    showError("Failed to load question. Please try again.");
                    setFetchError(true);
                }
                return;
            }

            // Check HTTP status
            if (!res.ok) {
                let msg = "Failed to load question. Please try again.";
                try {
                    const json = await res.json().catch(() => null);
                    if (json?.detail) {
                        msg = json.detail; // backend sends 'Subscription required for this subject'
                    }
                } catch {}

                if (isMountedRef.current) {
                    showError(msg, true);              // already showing the message
                    if (msg.includes("Subscription required")) {
                        router.push("/mainStudy"); // just redirect
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
                setTimeout(() => setFade(true), 100);
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
            });

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

                console.error("Failed to fetch next question:", msg);
                if (isMountedRef.current) showError(msg, true);
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
                    });

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

            if (onAnswer && questionData) onAnswer(correct, questionData.id);

            setAnswerResult({ correct, answer, explanation });
        }
    };





    return (
        <div
            className="flex-1 flex flex-col items-center justify-start p-5 sm:p-5 md:p-8 min-h-[50vh] md:h-auto bg-black-200 w-full no-select"
            onContextMenu={(e) => e.preventDefault()}
        >

            {showLoading ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
                    <p className="text-xl flex items-center">
                        Loading
                        <span className="ml-2 flex space-x-1">
                            <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce"></span>
                            <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                            <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                        </span>
                    </p>
                    {/* blockMessage removed */}
                </div>
            ) : (

                <>
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
                                        className="px-5 py-2 bg-green-400 text-black font-medium rounded-full hover:bg-green-400 transition"
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

                                    {/* Future Ads / Message */}
                                    <div className="w-full text-center text-sm py-2">
                                        Promoted: CBS Electrical Contractors <br/> Hiring NETA 2 Techs 📍Raleigh NC
                                    </div>

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
                </>
            )}
        </div>
    );

}

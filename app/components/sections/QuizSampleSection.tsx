"use client";

import { useState, useEffect, useRef } from "react";
import Question from "../quiz/Question";
import Option from "../quiz/Options";
import Comment from "../quiz/Comment";
import { HeroCard } from "../quiz/HeroCard";
import { ScrollHint } from "../quiz/ScrollHint";
import { Button } from "@/app/components/ui/Button";

export interface QuestionType {
    id: number;
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

function scrollToTop(container?: React.RefObject<HTMLElement>) {
    if (container?.current) {
        container.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
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
    scrollContainerRef?: React.RefObject<HTMLElement>;
}


export default function QuizSampleSection({
                                              isLoggedIn,
                                              onClick,
                                              staticQuestion,
                                              wrongQueue,
                                              setWrongQueue,
                                              apiUrl,
                                              loadingDone,
                                              scrollContainerRef,
                                          }: QuizSampleSectionProps) {
    const [questionData, setQuestionData] = useState<QuestionType | null>(null);
    const [fade, setFade] = useState(true);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answerResult, setAnswerResult] = useState<{ correct: boolean; answer: string; explanation: string } | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const optionsRef = useRef<HTMLDivElement>(null);
    const [nextQuestionPrefetch, setNextQuestionPrefetch] = useState<QuestionType | null>(null);


    async function fetchNextQuestion(): Promise<QuestionType> {
        if (!apiUrl) throw new Error("API URL not provided");
        const res = await fetch(`${apiUrl}/questions/random`);
        return res.json();
    }


    // Scroll to options when selected
    useEffect(() => {
        if (selectedOption) {
            optionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [selectedOption]);

    useEffect(() => {
        if (!apiUrl || !questionData) return;

        let isMounted = true;

        async function prefetchNext() {
            try {
                const res = await fetch(`${apiUrl}/questions/random`);
                const data: QuestionType = await res.json();
                if (isMounted) setNextQuestionPrefetch(data);
            } catch (err) {
                console.error("Prefetch failed:", err);
            }
        }

        prefetchNext();

        return () => { isMounted = false; };
    }, [questionData, apiUrl]);


    // Fetch first question on mount
    useEffect(() => {
        if (!loadingDone || !apiUrl) return;

        let isMounted = true;

        async function fetchFirstQuestion() {
            try {
                const res = await fetch(`${apiUrl}/questions/random`);
                const data: QuestionType = await res.json();
                if (isMounted) {
                    setQuestionData(data);
                }
            } catch (err) {
                console.error(err);
            }
        }

        // Only fetch if we have no question yet
        if (!questionData) fetchFirstQuestion();

        return () => {
            isMounted = false;
        };
    }, [loadingDone, apiUrl, questionData]);




    // Handle when user clicks "Next"
    const handleNextQuestion = async () => {
        // start fade-out
        setFade(false);

        // wait for fade-out to complete (match CSS duration)
        await new Promise(resolve => setTimeout(resolve, 500));

        // reset selections and answer result
        setSelectedOption(null);
        setAnswerResult(null);

        // get next question
        let nextQuestion: QuestionType;
        try {
            nextQuestion = nextQuestionPrefetch ?? (await fetchNextQuestion());
        } catch (err) {
            console.error("Failed to fetch next question:", err);
            return; // stop execution if fetch fails
        }

        // update question **while still invisible**
        setQuestionData(nextQuestion);
        setCurrentIndex(prev => prev + 1);

        // wait a tiny bit for DOM to update
        await new Promise(resolve => setTimeout(resolve, 50));

        // SCROLL TO TOP using both container and window (iOS fix)
        if (scrollContainerRef?.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
        window.scrollTo({ top: 0, behavior: "instant" }); // instant ensures iOS scroll works

        // fade-in smoothly
        setFade(true);
    };





    // Handle answer click
    const handleAnswerClick = async (option: string) => {
        if (!selectedOption && questionData) {
            setSelectedOption(option);
            if (onClick) onClick();

            let correct = false;
            let answer = questionData.answer;
            let explanation = questionData.explanation;

            if (isLoggedIn && apiUrl) {
                const res = await fetch(`${apiUrl}/answer/check`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ question_id: questionData.id, selected_option: option }),
                });
                const result = await res.json();
                correct = result.correct;
                answer = result.answer;
                explanation = result.explanation || questionData.explanation;

                if (!correct) {
                    setWrongQueue?.(prev => [...prev, questionData]);
                }
            } else {
                correct = option === questionData.answer;
                if (!correct) setWrongQueue?.(prev => [...prev, questionData]);
            }

            setAnswerResult({ correct, answer, explanation });
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-start p-6 md:p-8 min-h-[50vh] md:h-auto bg-black-200 w-full">
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
                        className={`w-full max-w-xl flex flex-col gap-6 justify-start transition-opacity duration-700 ease-in-out ${
                            fade ? "opacity-100" : "opacity-0"
                        }`}
                    >
                        {/* Question */}
                        <Question question={questionData.question} />

                        {/* Options */}
                        <div ref={optionsRef} className="flex flex-col gap-3">
                            {questionData.options.map(option => (
                                <Option
                                    key={option}
                                    text={option}
                                    isSelected={selectedOption === option}
                                    isAnswer={answerResult ? option === answerResult.answer : false}
                                    disabled={!!selectedOption}
                                    onClick={() => handleAnswerClick(option)}
                                />
                            ))}
                        </div>

                        {/* NEXT BUTTON */}
                        {selectedOption && (
                            <div className="mt-4 flex flex-col items-center gap-2 w-full">
                                <Button onClick={handleNextQuestion}>Next</Button>
                                <div className="flex flex-col items-center mt-2 text-center">
                                    <ScrollHint />
                                    <span className="text-white text-sm opacity-80 mt-1">
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

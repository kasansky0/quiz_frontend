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
    onAnswer?: (isCorrect: boolean) => void;
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
                                              onAnswer = () => {}, // default no-op
                                          }: QuizSampleSectionProps) {
    const [questionData, setQuestionData] = useState<QuestionType | null>(null);
    const [fade, setFade] = useState(true);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answerResult, setAnswerResult] = useState<{ correct: boolean; answer: string; explanation: string } | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const optionsRef = useRef<HTMLDivElement>(null);
    const [cycleCount, setCycleCount] = useState(0);
    const [lastQuestionId, setLastQuestionId] = useState<number | null>(null);



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

    // Fetch first question on mount
    useEffect(() => {
        if (!loadingDone || !apiUrl) return;

        let isMounted = true;

        async function fetchFirstQuestion() {
            try {
                const res = await fetch(`${apiUrl}/questions/random`);
                const data: QuestionType = await res.json();
                if (isMounted) setQuestionData(data);
            } catch (err) {
                console.error(err);
            }
        }

        fetchFirstQuestion();

        return () => { isMounted = false };
    }, [loadingDone, apiUrl]);

    // Handle when user clicks "Next"
    async function fetchRandomQuestion() {
        if (!apiUrl) return null;
        try {
            const res = await fetch(`${apiUrl}/questions/random`);
            return await res.json();
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

        if (cycleCount === 2 && wrongQueue?.length && setWrongQueue) {
            // Pick first wrong question that's NOT the same as last one
            nextQuestion = wrongQueue.find(q => q.id !== lastQuestionId) || wrongQueue[0];
            setWrongQueue(prev => prev.filter(q => q.id !== nextQuestion!.id));
            setCycleCount(0);
        } else {
            let fetched = await fetchRandomQuestion();
            // Avoid repeating last question
            if (fetched?.id === lastQuestionId) {
                fetched = await fetchRandomQuestion(); // try again
            }
            nextQuestion = fetched;
            setCycleCount(prev => prev + 1);
        }

        if (nextQuestion) {
            setQuestionData(nextQuestion);
            setLastQuestionId(nextQuestion.id);
        }

        scrollContainerRef?.current?.scrollTo({ top: 0, behavior: "auto" });
        window.scrollTo({ top: 0, behavior: "auto" });
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
            } else {
                correct = option === questionData.answer;
            }


            // ✅ Only add to wrongQueue if answered wrong
            if (!correct && setWrongQueue) {
                // After you determine correctness and before updating wrongQueue
                setWrongQueue(prev => [...prev, questionData]);
            }
            if (onAnswer) onAnswer(correct);


            setAnswerResult({ correct, answer, explanation });
        }
    };


    return (
        <div className="flex-1 flex flex-col items-center justify-start p-6 md:p-8 min-h-[50vh] md:h-auto bg-black-200 w-full no-select"
             onContextMenu={(e) => e.preventDefault()}
            >
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

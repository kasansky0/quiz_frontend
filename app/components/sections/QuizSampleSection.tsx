"use client";

import { useState, useEffect, useRef } from "react";
import Question from "../quiz/Question";
import Option from "../quiz/Options";
import Comment from "../quiz/Comment";
import { HeroCard } from "../quiz/HeroCard";
import { ScrollHint } from "../quiz/ScrollHint";
import { Button } from "@/app/components/ui/Button";

interface QuestionType {
    id: number;
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

interface QuizSampleSectionProps {
    isLoggedIn: boolean;
    onClick?: () => void;
    staticQuestion?: {
        id: number;
        question: string;
        options: string[];
        answer: string;
        explanation: string;
    };
}


export default function QuizSampleSection({ isLoggedIn, onClick, staticQuestion }: QuizSampleSectionProps) {
    const [questionData, setQuestionData] = useState<QuestionType | null>(null);
    const [fade, setFade] = useState(true); // true = visible
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answerResult, setAnswerResult] = useState<{ correct: boolean; answer: string; explanation: string } | null>(null);

    const optionsRef = useRef<HTMLDivElement>(null);

    // Scroll to options when an answer is selected
    useEffect(() => {
        if (selectedOption) {
            optionsRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }, [selectedOption]);

    // Fetch question on mount
    useEffect(() => {
        if (!isLoggedIn && staticQuestion) {
            setQuestionData(staticQuestion);
            return;
        }

        async function fetchQuestion() {
            const res = await fetch(
                isLoggedIn
                    ? `${process.env.NEXT_PUBLIC_API_URL}/questions/random`
                    : `${process.env.NEXT_PUBLIC_API_URL}/dailyQuestion/random`
            );
            const data: QuestionType = await res.json();
            setQuestionData(data);
        }
        fetchQuestion();
    }, [isLoggedIn, staticQuestion]);


    const handleNextQuestion = async () => {
        setFade(false); // fade out

        setTimeout(async () => {
            setSelectedOption(null);
            setAnswerResult(null);

            const res = await fetch(
                isLoggedIn
                    ? `${process.env.NEXT_PUBLIC_API_URL}/questions/random`
                    : `${process.env.NEXT_PUBLIC_API_URL}/dailyQuestion/random`
            );
            const data: QuestionType = await res.json();
            setQuestionData(data);

            setFade(true); // fade in
            scrollToTop();
        }, 500); // fade-out duration
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
                        className={`w-full max-w-xl flex flex-col gap-6 justify-start transition-all duration-700 ease-in-out ${
                            fade ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-95"
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
                                    isAnswer={answerResult ? option === answerResult.answer : false}
                                    disabled={!!selectedOption}
                                    onClick={async () => {
                                        if (!selectedOption) {
                                            setSelectedOption(option);
                                            if (onClick) onClick();

                                            if (isLoggedIn && questionData) {
                                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/answer/check`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        question_id: questionData.id,
                                                        selected_option: option,
                                                    }),
                                                });
                                                const result = await res.json();

                                                setAnswerResult({
                                                    correct: result.correct,
                                                    answer: result.answer,
                                                    explanation: result.explanation || questionData.explanation,
                                                });
                                            } else {
                                                setAnswerResult({
                                                    correct: option === questionData.answer,
                                                    answer: questionData.answer,
                                                    explanation: questionData.explanation,
                                                });
                                            }
                                        }
                                    }}
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

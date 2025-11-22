"use client";

import { useState, useEffect, useRef } from "react";
import Question from "../quiz/Question";
import Option from "../quiz/Options";
import Comment from "../quiz/Comment";
import { HeroCard } from "../quiz/HeroCard";
import { ScrollHint } from "../quiz/ScrollHint";
import { Button } from "@/app/components/ui/Button";

// ✓ iPhone scroll detector
const isIOS = () => {
    if (typeof navigator === "undefined") return false;
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

interface QuestionType {
    id: number;
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

// ✓ top scroll with iOS fallback using requestAnimationFrame
const scrollToTop = () => {
    if (isIOS()) {
        requestAnimationFrame(() => window.scrollTo(0, 0));
    } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
};


interface QuizSampleSectionProps {
    isLoggedIn: boolean;
    onClick?: () => void;
}

export default function QuizSampleSection({ isLoggedIn, onClick }: QuizSampleSectionProps) {
    const [currentQuestion, setCurrentQuestion] = useState<QuestionType | null>(null);
    const [nextQuestion, setNextQuestion] = useState<QuestionType | null>(null);
    const [nextNextQuestion, setNextNextQuestion] = useState<QuestionType | null>(null);

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answerResult, setAnswerResult] = useState<{ correct: boolean; answer: string; explanation: string } | null>(null);

    const optionsRef = useRef<HTMLDivElement>(null);

    // ✓ fetch helper
    async function fetchQuestion() {
        const res = await fetch(
            isLoggedIn
                ? `${process.env.NEXT_PUBLIC_API_URL}/questions/random`
                : `${process.env.NEXT_PUBLIC_API_URL}/dailyQuestion/random`
        );
        return res.json();
    }

    // ✓ Scroll to options when user selects an answer
    useEffect(() => {
        if (selectedOption) {
            optionsRef.current?.scrollIntoView({
                behavior: isIOS() ? "auto" : "smooth",
                block: "start",
            });
        }
    }, [selectedOption]);

    // ✓ Preload 3 questions on load
    useEffect(() => {
        async function load() {
            const q1 = await fetchQuestion();
            const q2 = await fetchQuestion();
            const q3 = await fetchQuestion();

            setCurrentQuestion(q1);
            setNextQuestion(q2);
            setNextNextQuestion(q3);
        }
        load();
    }, [isLoggedIn]);

    // ✓ Next question handler
    // ✓ Next question handler with instant UI update and preloading
    const handleNextQuestion = async () => {
        optionsRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
        setSelectedOption(null);
        setAnswerResult(null);

        // shift the question pipeline
        setCurrentQuestion(nextQuestion);
        setNextQuestion(nextNextQuestion);

        // preload the next question without blocking UI
        setTimeout(async () => {
            const q = await fetchQuestion();
            setNextNextQuestion(q);
        }, 100);

        scrollToTop();
    };


    return (
        <div className="flex-1 flex flex-col items-center justify-start p-6 md:p-8 min-h-[50vh] bg-black-200 w-full">
            {!isLoggedIn ? (
                <>
                    <div className="mb-4">
                        <ScrollHint />
                    </div>
                    {currentQuestion && <HeroCard question={currentQuestion} />}
                </>
            ) : (
                currentQuestion && (
                    <div className="w-full max-w-xl flex flex-col gap-6 justify-start">

                        <Question question={currentQuestion.question} />

                        <div ref={optionsRef} className="flex flex-col gap-3">
                            {currentQuestion.options.map((option) => (
                                <Option
                                    key={option}
                                    text={option}
                                    isSelected={selectedOption === option}
                                    isAnswer={answerResult ? option === answerResult.answer : false}
                                    disabled={!!selectedOption}
                                    onClick={async () => {
                                        if (!selectedOption) {
                                            setSelectedOption(option);
                                            onClick?.();

                                            if (isLoggedIn) {
                                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/answer/check`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        question_id: currentQuestion.id,
                                                        selected_option: option
                                                    })
                                                });

                                                const result = await res.json();
                                                setAnswerResult({
                                                    correct: result.correct,
                                                    answer: result.answer,
                                                    explanation: result.explanation || currentQuestion.explanation
                                                });
                                            } else {
                                                setAnswerResult({
                                                    correct: option === currentQuestion.answer,
                                                    answer: currentQuestion.answer,
                                                    explanation: currentQuestion.explanation
                                                });
                                            }
                                        }
                                    }}
                                />
                            ))}
                        </div>

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

                        {answerResult && selectedOption && (
                            <Comment
                                isCorrect={answerResult.correct}
                                text={answerResult.explanation}
                                correctAnswer={answerResult.answer}
                            />
                        )}
                    </div>
                )
            )}
        </div>
    );
}

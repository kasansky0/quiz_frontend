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

function scrollToOptions(ref: React.RefObject<HTMLDivElement>) {
    ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "start", // aligns top of the container with viewport
    });
}

interface QuizSampleSectionProps {
    isLoggedIn: boolean;
    onClick?: () => void; // optional prop
}

export default function QuizSampleSection({ isLoggedIn, onClick }: QuizSampleSectionProps) {
    const [currentQuestion, setCurrentQuestion] = useState<QuestionType | null>(null);
    const [nextQuestion, setNextQuestion] = useState<QuestionType | null>(null);


    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answerResult, setAnswerResult] = useState<{ correct: boolean; answer: string; explanation: string } | null>(null);

    // ✅ Create the ref inside the component
    const optionsRef = useRef<HTMLDivElement>(null);

// Scroll to options when an answer is selected
    useEffect(() => {
        if (selectedOption) {
            optionsRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start", // aligns top of options container with viewport
            });
        }
    }, [selectedOption]);


    // Load initial and next question
    useEffect(() => {
        async function fetchQuestion() {
            const res = await fetch(
                isLoggedIn
                    ? `${process.env.NEXT_PUBLIC_API_URL}/questions/random`
                    : `${process.env.NEXT_PUBLIC_API_URL}/dailyQuestion/random`
            );
            return res.json();
        }

        async function load() {
            const first = await fetchQuestion();
            setCurrentQuestion(first);

            const second = await fetchQuestion();
            setNextQuestion(second);
        }
        load();
    }, [isLoggedIn]);



    const isCorrect = answerResult?.correct ?? false;

    const handleNextQuestion = async () => {
        setSelectedOption(null);
        setAnswerResult(null);

        // Instantly swap
        setCurrentQuestion(nextQuestion);

        // Preload again in background
        const res = await fetch(
            isLoggedIn
                ? `${process.env.NEXT_PUBLIC_API_URL}/questions/random`
                : `${process.env.NEXT_PUBLIC_API_URL}/dailyQuestion/random`
        );
        const newQ = await res.json();
        setNextQuestion(newQ);

        scrollToTop();
    };


    return (
        <div className="flex-1 flex flex-col items-center justify-start p-6 md:p-8 min-h-[50vh] md:h-auto bg-black-200 w-full">
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

                        {/* Question */}
                        <Question question={currentQuestion.question} />

                        {/* Options */}
                        <div ref={optionsRef} className="flex flex-col gap-3">
                            {currentQuestion?.options?.map((option) => (
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

                                            if (isLoggedIn && currentQuestion) {
                                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/answer/check`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        question_id: currentQuestion.id,
                                                        selected_option: option
                                                    })
                                                });
                                                const result = await res.json();

                                                // ✅ Only set after API response
                                                setAnswerResult({
                                                    correct: result.correct,       // from backend
                                                    answer: result.answer,         // safer than using currentQuestion.answer
                                                    explanation: result.explanation || currentQuestion.explanation
                                                });
                                            } else {
                                                setAnswerResult({
                                                    correct: option === currentQuestion?.answer,
                                                    answer: currentQuestion?.answer!,
                                                    explanation: currentQuestion?.explanation!
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
                                <Button onClick={handleNextQuestion}>
                                    Next
                                </Button>

                                {/* Scroll hint pointing to comment */}
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
                            <>
                                <Comment
                                    isCorrect={answerResult.correct} // ✅ ONLY use backend result
                                    text={answerResult.explanation}
                                    correctAnswer={answerResult.answer}
                                />
                            </>
                        )}



                    </div>
                )
            )}
        </div>
    );
}

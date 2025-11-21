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
    const [questions, setQuestions] = useState<QuestionType[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [selectedOption, setSelectedOption] = useState<string | null>(null);

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


    // Fetch all questions on mount
    useEffect(() => {
        async function fetchQuestions() {
            const res = await fetch("/api/quiz");
            const data: QuestionType[] = await res.json();
            setQuestions(data);
        }
        fetchQuestions();
    }, []);

    const questionData = questions[currentIndex];
    const isCorrect = selectedOption === questionData?.answer;

    const handleNextQuestion = () => {
        setCurrentIndex((prev) => (prev + 1) % questions.length);
        setSelectedOption(null);

        // Delay to ensure question renders before scrolling
        setTimeout(() => {
            scrollToTop();
        }, 20);
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
                    <div className="w-full max-w-xl flex flex-col gap-6 justify-start">

                        {/* Question */}
                        <Question question={questionData.question} />

                        {/* Options */}
                        <div ref={optionsRef} className="flex flex-col gap-3">
                            {questionData.options.map((option) => (
                                <Option
                                    key={option}
                                    text={option}
                                    isSelected={selectedOption === option}
                                    isAnswer={option === questionData.answer}
                                    disabled={!!selectedOption}
                                    onClick={() => {
                                        if (!selectedOption) {
                                            setSelectedOption(option);
                                            if (onClick) onClick(); // ✅ call parent handler if provided
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
                        {selectedOption && (
                            <Comment isCorrect={isCorrect} text={questionData.explanation} />
                        )}


                    </div>
                )
            )}
        </div>
    );
}

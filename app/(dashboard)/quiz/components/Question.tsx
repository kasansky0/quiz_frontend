"use client";

import { forwardRef } from "react";

interface QuestionProps {
    question: string;
}

const Question = forwardRef<HTMLHeadingElement, QuestionProps>(
    ({ question }, ref) => {
        return (
            <h2
                ref={ref}
                className="
                    scroll-mt-24
                    text-base sm:text-xl md:text-lg
                    font-semibold
                    text-black
                    leading-snug
                "
            >
                {question}
            </h2>
        );
    }
);

Question.displayName = "Question";

export default Question;
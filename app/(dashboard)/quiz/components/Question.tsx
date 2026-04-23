"use client";

interface QuestionProps {
    question: string;
}

export default function Question({ question }: QuestionProps) {
    return (
        <h2 className="text-base sm:text-xl md:text-lg font-semibold text-black border-l-4 border-green-500 pl-3">
            {question}
        </h2>

    );
}

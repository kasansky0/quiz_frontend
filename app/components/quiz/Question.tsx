"use client";

interface QuestionProps {
    question: string;
}

export default function Question({ question }: QuestionProps) {
    return (
        <h2 className="text-xl md:text-3xl font-semibold text-white mb-4 border-l-4 border-green-500 pl-3">
            {question}
        </h2>
    );
}

"use client";

interface CommentProps {
    isCorrect: boolean;
    text: string;
}

export default function Comment({ isCorrect, text }: CommentProps) {
    const baseClass = `p-4 rounded-xl border font-medium transition-all duration-300 shadow-md
        ${isCorrect ? "bg-green-600 border-green-500 text-white" : "bg-red-600 border-red-500 text-white"}`;

    return (
        <div className={baseClass}>
            <div className="mb-2 font-bold">
                {isCorrect ? "Correct ✅" : "Wrong ❌"}
            </div>
            <div>{text}</div>
        </div>
    );
}

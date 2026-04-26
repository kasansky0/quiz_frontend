"use client";

interface CommentProps {
    isCorrect: boolean;
    text: string;
    correctAnswer?: string;
}

export default function Comment({ isCorrect, text, correctAnswer }: CommentProps) {
    const paragraphs = text?.split("\n").filter(p => p.trim() !== "") || [];

    return (
        <div className="p-4 sm:p-5 rounded-xl border border-black/10 bg-white shadow-sm transition">

            {/* HEADER */}
            <div className="flex items-center gap-2 mb-3">
                <span
                    className={`w-2 h-2 rounded-full ${
                        isCorrect ? "bg-green-500" : "bg-red-500"
                    }`}
                />
                <div className="font-semibold text-sm sm:text-base text-black">
                    {isCorrect ? "Correct" : "Incorrect"}
                </div>
            </div>

            {/* TEXT */}
            <div className="space-y-2 text-sm sm:text-base text-black leading-relaxed">
                {paragraphs.map((p, index) => (
                    <p key={index}>{p}</p>
                ))}

                {!isCorrect && correctAnswer && (
                    <div className="mt-3 pt-3 border-t border-black/10">
                        <span className="font-semibold text-black">
                            Correct answer:
                        </span>{" "}
                        <span className="text-black">{correctAnswer}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
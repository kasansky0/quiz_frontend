    "use client";

    interface CommentProps {
        isCorrect: boolean;
        text: string;
        correctAnswer?: string; // optional prop to display actual correct answer
    }

    export default function Comment({ isCorrect, text, correctAnswer }: CommentProps) {
        const baseClass = `p-3 sm:p-4 rounded-xl border font-medium transition-all duration-300 shadow-md
            ${isCorrect ? "bg-green-500/50 border-green-500/50 text-black" : "bg-red-500/50 border-red-500/50 text-black"}`;

        // Split text by newlines to create paragraphs
        const paragraphs = text?.split("\n").filter(p => p.trim() !== "") || [];

        return (
            <div className={baseClass}>
                <div className="mb-1 sm:mb-2 font-bold text-base sm:text-lg">
                    {isCorrect ? "Correct ✅" : "Wrong ❌"}
                </div>

                <div className="space-y-2">
                    {paragraphs.map((p, index) => (
                        <p key={index} className="text-xs sm:text-sm leading-relaxed">
                            {p}
                        </p>
                    ))}
                    {/* Show correct answer if sidebar was wrong */}
                    {!isCorrect && correctAnswer && (
                        <p className="text-xs sm:text-sm font-semibold mt-1 sm:mt-2">
                            Correct Answer: {correctAnswer}
                        </p>
                    )}
                </div>
            </div>
        );
    }

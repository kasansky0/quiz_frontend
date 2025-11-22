    "use client";

    interface CommentProps {
        isCorrect: boolean;
        text: string;
        correctAnswer?: string; // optional prop to display actual correct answer
    }

    export default function Comment({ isCorrect, text, correctAnswer }: CommentProps) {
        const baseClass = `p-4 rounded-xl border font-medium transition-all duration-300 shadow-md
            ${isCorrect ? "bg-green-600 border-green-500 text-white" : "bg-red-600 border-red-500 text-white"}`;

        // Split text by newlines to create paragraphs
        const paragraphs = text.split("\n").filter(p => p.trim() !== "");

        return (
            <div className={baseClass}>
                <div className="mb-2 font-bold text-lg">
                    {isCorrect ? "Correct ✅" : "Wrong ❌"}
                </div>

                <div className="space-y-2">
                    {paragraphs.map((p, index) => (
                        <p key={index} className="text-sm leading-relaxed">
                            {p}
                        </p>
                    ))}
                    {/* Show correct answer if user was wrong */}
                    {!isCorrect && correctAnswer && (
                        <p className="text-sm font-semibold mt-2">
                            Correct Answer: {correctAnswer}
                        </p>
                    )}
                </div>
            </div>
        );
    }

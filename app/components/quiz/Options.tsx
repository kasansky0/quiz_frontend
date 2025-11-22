"use client";

interface OptionProps {
    text: string;
    isSelected: boolean;
    isAnswer: boolean;
    disabled: boolean;
    onClick: () => void;
}

export default function Option({ text, isSelected, isAnswer, disabled, onClick }: OptionProps) {
    let baseClass =
        "p-3 rounded-xl border text-white font-medium cursor-pointer transition-all duration-300 shadow-sm select-none";

    if (disabled) {
        if (isSelected && isAnswer) {
            // Selected correct → dull green
            baseClass += " bg-green-600 border-green-500 shadow-lg hover:scale-[1.02]";
        } else if (isSelected && !isAnswer) {
            // Selected wrong → dull red
            baseClass += " bg-red-600 border-red-500 shadow-lg hover:scale-[1.02]";
        } else if (!isSelected && isAnswer) {
            // Correct answer not selected → dull green
            baseClass += " bg-green-600 border-green-500 shadow-md hover:scale-[1.02]";
        } else {
            // Unselected and not correct → dark gray + keep hover effect
            baseClass += " bg-gray-800 border-gray-500 text-gray-400 shadow-inner hover:bg-gray-700 hover:scale-[1.02]";
        }

    } else if (isSelected) {
        baseClass += " bg-gray-700 shadow-md";
    } else {
        // Normal unselected option
        baseClass +=
            " bg-gray-900 border-gray-700 hover:bg-gray-800 hover:scale-[1.02] hover:shadow-md";
    }

    return (
        <div
            className={baseClass}
            onClick={() => !disabled && onClick()}
            style={{ WebkitTapHighlightColor: "transparent" }} // ✅ prevents iPhone tap flash
        >
            {text}
        </div>
    );

}

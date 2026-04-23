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
        "p-2 sm:p-3 rounded-xl border text-black text-sm sm:text-base font-medium cursor-pointer transition-all duration-300 shadow-sm select-none";

    if (disabled) {
        if (isSelected && isAnswer) {
            // Selected correct → dull green
            baseClass += " bg-green-500/40 border-green-500/50 shadow-lg hover:scale-[1.02]";
        } else if (isSelected && !isAnswer) {
            // Selected wrong → dull red
            baseClass += " bg-white border-black shadow-md hover:scale-[1.02]";
        } else if (!isSelected && isAnswer) {
            // Correct answer not selected → dull green
            baseClass += " bg-green-500/40 border-green-500/50 shadow-md hover:scale-[1.02]";
        } else {
            // Unselected and not correct → dark gray + keep hover effect
            baseClass += " bg-white border-black text-black shadow-inner hover:bg-black-200 hover:scale-[1.02]";
        }

    } else if (isSelected) {
        baseClass += " bg-gray-700 shadow-md";
    } else {
        // Normal unselected option
        baseClass +=
            " bg-white border-black hover:bg-black-200 hover:scale-[1.02] hover:shadow-md";
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

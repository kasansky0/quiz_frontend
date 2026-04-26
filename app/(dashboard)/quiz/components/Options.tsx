"use client";

interface OptionProps {
    text: string;
    isSelected: boolean;
    isAnswer: boolean;
    disabled: boolean;
    onClick: () => void;
}

export default function Option({
                                   text,
                                   isSelected,
                                   isAnswer,
                                   disabled,
                                   onClick,
                               }: OptionProps) {
    let baseClass =
        "p-3 sm:p-4 rounded-2xl border text-sm sm:text-base font-medium cursor-pointer transition-all duration-200 select-none bg-white text-black border-neutral-200";

    // BEFORE ANSWER IS REVEALED (interactive state)
    if (!disabled) {
        if (isSelected) {
            baseClass += " border-[#0a66c2] bg-blue-50 text-[#0a66c2]";
        } else {
            baseClass += " hover:border-[#0a66c2] hover:bg-blue-50/40";
        }
    }

    // AFTER ANSWER IS REVEALED (review state)
    if (disabled) {
        if (isAnswer) {
            baseClass += " bg-green-100 border-green-500 text-green-700";
        }

        if (isSelected) {
            baseClass += " border-[#0a66c2] bg-blue-50 text-[#0a66c2]";
        }

        baseClass += " cursor-default";
    }

    return (
        <div
            className={baseClass}
            onClick={() => !disabled && onClick()}
            style={{ WebkitTapHighlightColor: "transparent" }}
        >
            {text}
        </div>
    );
}
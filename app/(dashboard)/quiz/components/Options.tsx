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
        "p-3 sm:p-4 rounded-2xl border text-sm sm:text-base font-medium cursor-pointer transition-all duration-200 select-none bg-white text-black";

    // DEFAULT (LinkedIn clean hover)
    if (!disabled) {
        if (isSelected) {
            baseClass += " border-[#0a66c2] bg-blue-50";
        } else {
            baseClass += " border-neutral-200 hover:border-[#0a66c2] hover:bg-blue-50/40";
        }
    }

    if (disabled) {
        if (isAnswer) {
            baseClass += " border-green-500 bg-green-50";
        }

        if (isSelected && !isAnswer) {
            baseClass += " border-red-400 bg-red-50/40";
        }

        if (!isSelected && !isAnswer) {
            baseClass += " opacity-60";
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
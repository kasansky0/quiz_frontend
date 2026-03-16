"use client";

import { FC, useEffect } from "react";

interface InlineStatusTextProps {
    message: string;
    type?: "error" | "loading" | "success";
    onClose?: () => void;
}

const InlineStatusText: FC<InlineStatusTextProps> = ({ message, type = "loading", onClose }) => {
    // Optional: auto-hide after 3 seconds
    useEffect(() => {
        if (!onClose) return;
        const timer = setTimeout(() => onClose(), 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const color =
        type === "error" ? "text-red-400" :
            type === "success" ? "text-emerald-400" :
                "text-blue-400";

    return (
        <div className={`text-sm mb-1 ${color}`}>
            {message}
        </div>
    );
};

export default InlineStatusText;
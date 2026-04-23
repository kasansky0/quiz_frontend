// Textarea.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                ref={ref}
                className={cn(
                    `flex w-full rounded-xl border 
                         bg-green-500/[0.02] px-3 py-2 
                         text-black placeholder-white
                         backdrop-blur-sm text-base
                         focus:outline-none focus:ring-2 focus:ring-green-500/50
                         caret-white transition-colors duration-200`,
                    className
                )}
                {...props}
            />
        );
    }
);

Textarea.displayName = "Textarea";

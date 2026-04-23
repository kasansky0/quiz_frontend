// Input.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    `flex h-10 w-full rounded-xl border border-green-400/20 
           bg-green-500/[0.02] px-3 py-2 text-black placeholder-green-500 
           backdrop-blur-sm
           focus:outline-none focus:ring-2 focus:ring-green-400/50
           caret-green-300 transition-colors duration-200`,
                    className
                )}
                {...props}
            />
        );
    }
);

Input.displayName = "Input";

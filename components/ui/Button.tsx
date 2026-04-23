"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonVariants = "primary" | "secondary" | "outline";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
    variant?: ButtonVariants;
}

const buttonVariants: Record<ButtonVariants, string> = {
    primary: `
        bg-blue-600 text-white
        hover:bg-blue-700
        active:scale-95
        shadow-sm hover:shadow-md
    `,

    secondary: `
        bg-gray-100 text-gray-900
        hover:bg-gray-200
        active:scale-95
        border border-gray-200
    `,

    outline: `
        border border-gray-300 text-gray-800
        hover:bg-gray-100
    `,
};

const Button = React.forwardRef<React.ElementRef<"button">, ButtonProps>(
    ({ className, asChild, variant = "primary", ...props }, ref) => {
        const Comp = asChild ? Slot : "button";

        return (
            <Comp
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200",
                    buttonVariants[variant],
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";

export { Button };
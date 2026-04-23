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
    bg-green-500/40 text-neutral-600
    hover:bg-green-500/50
    active:scale-95
    shadow-sm hover:shadow-md
    `,

    secondary: `
        bg-black-200 text-black
        hover:bg-black-200
        active:scale-95
        border border-black
    `,

    outline: `
        border border-black text-black
        hover:bg-black-200
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
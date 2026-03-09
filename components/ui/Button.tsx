"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonVariants = "glass" | "solid" | "outline";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
    variant?: ButtonVariants;
}

const buttonVariants: Record<ButtonVariants, string> = {
    glass: `
    bg-[linear-gradient(145deg,rgba(0,70,0,0.65),rgba(0,40,0,0.45))]
    border border-green-800/40
    shadow-[0_6px_20px_rgba(0,255,150,0.18)]
    hover:scale-[1.04] hover:border-white/20 hover:shadow-[0_10px_30px_rgba(0,255,180,0.28)]
    active:scale-[0.97] active:shadow-[0_2px_10px_rgba(0,255,150,0.18)]
    text-white
  `,
    solid: `
    bg-green-600 hover:bg-green-700
    shadow-md hover:shadow-lg
    text-white
  `,
    outline: `
    border border-green-500 text-green-300
    hover:bg-green-500/10
  `,
};

const Button = React.forwardRef<React.ElementRef<"button">, ButtonProps>(
    ({ className, asChild, variant = "glass", ...props }, ref) => {
        const Comp = asChild ? Slot : "button";

        return (
            <Comp
                className={cn(
                    "relative inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-medium transition-all duration-300",
                    buttonVariants[variant],
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";

export { Button };

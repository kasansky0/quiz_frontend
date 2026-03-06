"use client";

import { ReactNode, useState, useEffect } from "react";

interface PageTransitionProps {
    children: ReactNode;
    isVisible: boolean;
    pageKey?: string | number;
    duration?: number; // seconds
}

export default function PageTransition({
                                           children,
                                           isVisible,
                                           pageKey,
                                           duration = 0.5,
                                       }: PageTransitionProps) {
    const [fade, setFade] = useState(isVisible);
    const [content, setContent] = useState<ReactNode>(isVisible ? children : null);

    useEffect(() => {
        if (isVisible) {
            // Fade in after content is mounted
            setContent(children);
            setTimeout(() => setFade(true), 10);
        } else {
            // Fade out
            setFade(false);
            const timer = setTimeout(() => setContent(null), duration * 1000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, children, duration]);

    if (!content) return null;

    return (
        <div
            key={pageKey ?? "page"}
            style={{
                opacity: fade ? 1 : 0,
                transition: `opacity ${duration}s ease-in-out`,
                position: "absolute",
                width: "100%",
            }}
        >
            {content}
        </div>
    );
}
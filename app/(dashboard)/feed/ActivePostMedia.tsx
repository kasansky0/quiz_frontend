"use client";

import { useState } from "react";

type PostMediaProps = {
    images: string[];
    alt?: string;
    tags?: string[];
    onOpenChange?: (open: boolean) => void;
};

export default function PostMedia({
                                      images,
                                      alt = "post image",
                                      tags = [],
    onOpenChange,
                                  }: PostMediaProps) {
    const [index, setIndex] = useState(0);
    const [loaded, setLoaded] = useState<Record<number, boolean>>({});
    const [open, setOpen] = useState(false);

    if (!images || images.length === 0) return null;

    const total = images.length;
    const visibleImages = images;

    const prev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIndex((i) => (i === 0 ? total - 1 : i - 1));
    };

    const next = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIndex((i) => (i === total - 1 ? 0 : i + 1));
    };

    const setLightbox = (value: boolean) => {
        setOpen(value);
        onOpenChange?.(value);
    };

    return (
        <div className="mb-3 w-full">

            {/* LINKEDIN-STYLE WRAPPER */}
            <div className="
                relative w-full overflow-hidden rounded-xl border border-black/10 bg-black
                aspect-[4/3]
            ">

                <div className="absolute inset-0 flex items-center justify-center">

                    {/* LOADER */}
                    {!loaded[index] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                            <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                    )}

                    {/* IMAGE */}
                    <img
                        src={visibleImages[index]}
                        alt={`${alt}-${index}`}
                        loading="lazy"
                        onClick={() => setLightbox(true)}
                        onLoad={() => {
                            setLoaded((prev) => ({
                                ...prev,
                                [index]: true,
                            }));
                        }}
                        className="
                            absolute inset-0 w-full h-full object-contain cursor-zoom-in
                            transition-opacity duration-300 ease-out
                            opacity-100
                        "
                    />
                </div>

                {/* LEFT ARROW */}
                {total > 1 && (
                    <button
                        onClick={prev}
                        className="
                            absolute left-3 top-1/2 -translate-y-1/2 z-10
                            bg-black/40 hover:bg-black/70
                            text-white p-2 rounded-full
                            transition-all opacity-80 hover:opacity-100
                        "
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </button>
                )}

                {/* RIGHT ARROW */}
                {total > 1 && (
                    <button
                        onClick={next}
                        className="
                            absolute right-3 top-1/2 -translate-y-1/2 z-10
                            bg-black/40 hover:bg-black/70
                            text-white p-2 rounded-full
                            transition-all opacity-80 hover:opacity-100
                        "
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* DOTS */}
            {total > 1 && (
                <div className="flex justify-center mt-2 gap-1">
                    {Array.from({ length: total }).map((_, i) => (
                        <div
                            key={i}
                            className={`
                                w-1.5 h-1.5 rounded-full transition-all duration-200
                                ${
                                i === index
                                    ? "bg-black/70 scale-110"
                                    : "bg-black/20"
                            }
                            `}
                        />
                    ))}
                </div>
            )}

            {/* 🔥 FULL SCREEN LIGHTBOX */}
            {open && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center pt-16"
                    onClick={() => setLightbox(false)}
                >

                    {/* CLOSE BUTTON (NEW) */}
                    <button
                        onClick={() => setLightbox(false)}
                        className="
                            absolute top-16 right-4
                            bg-black/50 hover:bg-black/80
                            text-white rounded-full
                            w-10 h-10 flex items-center justify-center
                            text-lg z-50
                        "
                    >
                        ✕
                    </button>

                    {/* LEFT ARROW (MATCHED STYLE) */}
                    {total > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                prev();
                            }}
                            className="
                                absolute left-4 top-1/2 -translate-y-1/2
                                bg-black/50 hover:bg-black/80
                                text-white p-3 rounded-full
                                z-50 transition
                            "
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                    )}

                    {/* IMAGE */}
                    <img
                        src={visibleImages[index]}
                        alt={`${alt}-fullscreen`}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* RIGHT ARROW (MATCHED STYLE) */}
                    {total > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                next();
                            }}
                            className="
                                absolute right-4 top-1/2 -translate-y-1/2
                                bg-black/50 hover:bg-black/80
                                text-white p-3 rounded-full
                                z-50 transition
                            "
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    )}

                    {/* BOTTOM TAGS */}
                    {Array.isArray(tags) && tags.length > 0 && (
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="
                                absolute bottom-24 left-4 z-50
                                flex flex-wrap gap-2
                                max-w-[80%]
                                lg:hidden sm:hidden
                            "
                        >
                            {tags.slice(0, 5).map((tag, idx) => {
                                if (typeof tag !== "string") return null;

                                const cleanTag = tag.trim();
                                if (!cleanTag) return null;

                                return (
                                    <span
                                        key={`${cleanTag}-${idx}`}
                                        className="
                                            text-xs px-2 py-1 rounded-full
                                            bg-black/60 text-white
                                            backdrop-blur-md
                                        "
                                    >
                                        #{cleanTag}
                                    </span>
                                );
                            })}
                        </div>
                    )}


                </div>
            )}
        </div>
    );
}
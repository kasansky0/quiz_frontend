"use client";

import { useState } from "react";

type PostThumbnailProps = {
    images: string[];
};

export default function PostThumbnail({ images }: PostThumbnailProps) {
    const [index, setIndex] = useState(0);
    const [loaded, setLoaded] = useState<Record<number, boolean>>({});

    if (!images || images.length === 0) return null;

    const visibleImages = images.slice(0, 5);
    const total = visibleImages.length;

    const isSingle = total === 1;

    const prev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIndex((i) => (i === 0 ? total - 1 : i - 1));
    };

    const next = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIndex((i) => (i === total - 1 ? 0 : i + 1));
    };

    return (
        <div className="flex flex-col items-center gap-1 flex-shrink-0">

            {/* IMAGE WRAPPER */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-24 h-20 sm:w-28 sm:h-22 md:w-32 md:h-24 overflow-hidden rounded-xl border border-black/10 bg-gray-200"
            >

                {/* SINGLE IMAGE MODE */}
                {isSingle ? (
                    <img
                        src={visibleImages[0]}
                        alt="thumbnail"
                        loading="lazy"
                        onLoad={() =>
                            setLoaded((prev) => ({
                                ...prev,
                                0: true,
                            }))
                        }
                        className={`
                            w-full h-full object-cover
                            transition-all duration-500 ease-out
                            ${
                            loaded[0]
                                ? "opacity-100 scale-100 blur-0"
                                : "opacity-0 scale-105 blur-md"
                        }
                        `}
                    />
                ) : (
                    <>
                        {/* CAROUSEL MODE */}

                        <img
                            src={visibleImages[index]}
                            alt={`image-${index}`}
                            loading="lazy"
                            onLoad={() =>
                                setLoaded((prev) => ({
                                    ...prev,
                                    [index]: true,
                                }))
                            }
                            className={`
                                w-full h-full object-cover
                                transition-all duration-500 ease-out
                                ${
                                loaded[index]
                                    ? "opacity-100 scale-100 blur-0"
                                    : "opacity-0 scale-105 blur-md"
                            }
                            `}
                        />

                        {/* LEFT ARROW */}
                        <button
                            onClick={prev}
                            className="
                                absolute left-1 top-1/2 -translate-y-1/2
                                bg-black/30 hover:bg-black/60
                                text-white p-1 rounded-full
                                transition-all opacity-70 hover:opacity-100
                            "
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-3 h-3"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>

                        {/* RIGHT ARROW */}
                        <button
                            onClick={next}
                            className="
                                absolute right-1 top-1/2 -translate-y-1/2
                                bg-black/30 hover:bg-black/60
                                text-white p-1 rounded-full
                                transition-all opacity-70 hover:opacity-100
                            "
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-3 h-3"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    </>
                )}
            </div>

            {/* DOTS (only for multiple images) */}
            {!isSingle && (
                <div className="flex items-center gap-1">
                    {visibleImages.map((_, i) => (
                        <div
                            key={i}
                            className={`
                                w-1.5 h-1.5 rounded-full transition-all
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
        </div>
    );
}
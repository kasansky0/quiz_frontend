"use client";

import { useState } from "react";

interface ShareProps {
    postId: string;
    title?: string;
}

export default function Share({
                                  postId,
                                  title = "NetaPrep",
                              }: ShareProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = `${window.location.origin}/post/${postId}`;

        // Mobile + supported desktop browsers
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: title,
                    url,
                });
                return;
            } catch {
                // User cancelled share
            }
        }

        // Fallback
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch {
            console.error("Failed to copy link");
        }
    };

    return (
        <button
            onClick={handleShare}
            title={copied ? "Copied!" : "Share"}
            className="
                relative
                flex
                items-center
                justify-center
                p-1
                rounded-full
                hover:bg-neutral-100
                active:scale-95
                transition
            "
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20"
                viewBox="0 -960 960 960"
                width="20"
                fill="currentColor"
                className="text-neutral-600 hover:text-black transition-colors"
            >
                <path d="M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5q0 8-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T720-200q0-17-11.5-28.5T680-240q-17 0-28.5 11.5T640-200q0 17 11.5 28.5T680-160ZM200-440q17 0 28.5-11.5T240-480q0-17-11.5-28.5T200-520q-17 0-28.5 11.5T160-480q0 17 11.5 28.5T200-440Zm508.5-291.5Q720-743 720-760t-11.5-28.5Q697-800 680-800t-28.5 11.5Q640-777 640-760t11.5 28.5Q663-720 680-720t28.5-11.5ZM680-200ZM200-480Zm480-280Z" />
            </svg>

            {copied && (
                <div
                    className="
                        absolute
                        -top-9
                        left-1/2
                        -translate-x-1/2
                        whitespace-nowrap
                        rounded-md
                        bg-black
                        px-2
                        py-1
                        text-[11px]
                        text-white
                        shadow-lg
                    "
                >
                    Link copied!
                </div>
            )}
        </button>
    );
}
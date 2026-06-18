"use client";

import { useState, useEffect } from "react";

export default function Calculator() {
    const [open, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [error, setError] = useState(false);

    // detect screen size
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // hide completely on mobile
    if (isMobile) return null;

    return (
        <div className="w-full">

            {/* HEADER */}
            <div
                onClick={() => setOpen(prev => !prev)}
                className="w-full flex items-center justify-between px-2 py-1 text-sm font-medium text-black group cursor-pointer hover:text-blue-400 transition-colors"
            >
                <div className="flex items-center gap-2">

                    {/* ICON */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6 text-black group-hover:text-blue-400 flex-shrink-0"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z"
                        />
                    </svg>

                    <h2 className="text-black group-hover:text-blue-400 text-lg font-medium select-none">
                        Calculator
                    </h2>

                    {/* ARROW */}
                    <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                            open ? "rotate-180" : ""
                        } group-hover:text-blue-400`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>

                </div>
            </div>

            {/* CONTENT (no jump) */}
            <div
                className={`w-full overflow-hidden transition-all duration-300 ${
                    open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="relative w-full h-[500px]">

                    {/* IFRAME */}
                    {!error && (
                        <iframe
                            src="/ti84/index.html?mode=sidebar"
                            className="w-full h-full border-0 block"
                            onError={() => setError(true)}
                        />
                    )}

                    {/* LINKED STYLE ERROR OVERLAY */}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm">
                            <div className="text-center border border-black/10 shadow-md rounded-xl p-4 bg-white max-w-[240px]">
                                <div className="text-sm font-semibold text-black mb-1">
                                    Calculator not responding
                                </div>
                                <div className="text-xs text-gray-500 mb-3">
                                    TI engine failed to load
                                </div>

                                <button
                                    onClick={() => {
                                        setError(false);
                                        window.location.reload();
                                    }}
                                    className="text-xs px-3 py-1 border rounded-md hover:bg-gray-100"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}
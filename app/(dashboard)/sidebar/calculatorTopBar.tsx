"use client";

import { useState } from "react";

export default function CalculatorMobile() {
    const [expanded, setExpanded] = useState(false);
    const [error, setError] = useState(false);

    return (
        <>

            {/* =========================
                COLLAPSED VIEW
            ========================== */}
            {!expanded && (
                <div className="w-full">

                    {/* EXPAND BUTTON */}
                    <button
                        onClick={() => {
                            setExpanded(true);
                            setError(false);
                        }}
                        className="flex items-center mb-2 rounded-full text-sm font-medium text-neutral-700 hover:bg-neutral-100 active:scale-95 transition"
                    >
                        {/* EXPAND SVG */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="20px"
                            viewBox="0 -960 960 960"
                            width="20px"
                            fill="#1f1f1f"
                            className="opacity-80"
                        >
                            <path d="M200-200v-240h80v160h160v80H200Zm480-320v-160H520v-80h240v240h-80Z" />
                        </svg>

                        <span>Full screen</span>
                    </button>

                    {/* PREVIEW WINDOW */}
                    <div className="h-[66vh] rounded-xl bg-white overflow-auto relative">

                        {/* IFRAME (UNCHANGED) */}
                        {!error && (
                            <iframe
                                src="/ti84/index.html"
                                className="w-full h-[72vh]"
                                onError={() => setError(true)}
                            />
                        )}

                        {/* ERROR OVERLAY */}
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
            )}

            {/* =========================
                FULLSCREEN VIEW
            ========================== */}
            {expanded && (
                <div className="fixed top-[calc(56px+env(safe-area-inset-top))] left-0 right-0 bottom-0 z-50 bg-white flex flex-col">

                    {/* TOP BAR */}
                    <div className="flex items-center justify-between p-2 bg-white">

                        {/* COLLAPSE BUTTON */}
                        <button
                            onClick={() => setExpanded(false)}
                            className="flex items-center gap-2 rounded-full text-sm font-medium text-neutral-700 hover:bg-neutral-100 active:scale-95 transition"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="20px"
                                viewBox="0 -960 960 960"
                                width="20px"
                                fill="#1f1f1f"
                                className="opacity-80"
                            >
                                <path d="M440-440v240h-80v-160H200v-80h240Zm160-320v160h160v80H520v-240h80Z" />
                            </svg>

                            <span>Exit full screen</span>
                        </button>

                    </div>

                    {/* SINGLE IFRAME (PRESERVED STATE) */}
                    <div className="relative w-full h-full">

                        {!error && (
                            <iframe
                                src={`/ti84/index.html?mode=${expanded ? "full" : "compact"}`}
                                className="w-full h-full"
                                onError={() => setError(true)}
                            />
                        )}

                        {/* ERROR OVERLAY */}
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm">
                                <div className="text-center border border-black/10 shadow-md rounded-xl p-4 bg-white max-w-[240px]">
                                    <div className="text-sm font-semibold text-black mb-1">
                                        Calculator not responding
                                    </div>

                                    <div className="text-xs text-gray-500 mb-3">
                                        Try reconnecting to TI engine
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
            )}

        </>
    );
}
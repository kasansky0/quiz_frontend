"use client";

import { useEffect, useState } from "react";

export default function LoadingBanner() {
    const [showDelayMessage, setShowDelayMessage] = useState(false);
    const [showStillLoading, setShowStillLoading] = useState(false);
    const [showPleaseWaitAgain, setShowPleaseWaitAgain] = useState(false);

    useEffect(() => {
        // First message after 10s
        const timer1 = setTimeout(() => setShowDelayMessage(true), 10000);

        // Second message after 7s
        const timer2 = setTimeout(() => setShowStillLoading(true), 7000);

        // Third message after 12s
        const timer3 = setTimeout(() => setShowPleaseWaitAgain(true), 14000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    return (
        <div className="w-full h-full flex items-center justify-center bg-black/80 backdrop-blur-md p-4">

            <div className="w-full max-w-md md:max-w-lg p-6 md:p-8 bg-black/70 backdrop-blur-xl border border-green-400/20 rounded-2xl shadow-lg flex flex-col items-center">

                <h1 className="text-2xl md:text-3xl font-bold text-green-400/70 tracking-wider uppercase mb-2 text-center">
                    ⚡ NETA Level 2
                </h1>
                <p className="text-md md:text-lg font-mono text-green-400/50 uppercase tracking-widest text-center">
                    Loading...
                </p>

                <div className="mt-6 w-2/3 h-1 bg-green-400/20 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full w-1/3 bg-green-400/60 rounded-full animate-loading"></div>
                </div>

                <div className="mt-4 text-sm font-mono text-green-400/40 text-center leading-snug">
                    {showStillLoading && <p>Still loading...</p>}
                    {showDelayMessage && <p>Taking few more seconds</p>}
                    {showPleaseWaitAgain && <p>Please wait...</p>}
                </div>

            </div>

        </div>
    );
}

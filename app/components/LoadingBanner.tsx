"use client";

import { useEffect, useState } from "react";

const formulas = [
    // Ohm’s Law
    "Ohm’s Law: V = I × R",

    // Single-phase power
    "Real Power (1φ): P = V × I × PF",
    "Apparent Power (1φ): S = V × I",
    "Reactive Power (1φ): Q = V × I × sin(θ)",

    // Three-phase power
    "Real Power (3φ): P = √3 × V_L × I_L × PF",
    "Apparent Power (3φ): S = √3 × V_L × I_L",
    "Reactive Power (3φ): Q = √3 × V_L × I_L × sin(θ)",
];

export default function LoadingBanner() {
    const [showStillLoading, setShowStillLoading] = useState(false);
    const [showWhileWaiting, setShowWhileWaiting] = useState(false);
    const [currentFormula, setCurrentFormula] = useState("");

    useEffect(() => {
        const t1 = setTimeout(() => setShowStillLoading(true), 7000);
        const t2 = setTimeout(() => setShowWhileWaiting(true), 10000);

        let formulaInterval: NodeJS.Timeout;

        // Start formula rotation after 10s
        setTimeout(() => {
            formulaInterval = setInterval(() => {
                const random = formulas[Math.floor(Math.random() * formulas.length)];
                setCurrentFormula(random);
            }, 10000); // Change formula every 3 seconds
        }, 10000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearInterval(formulaInterval);
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

                <div className="mt-4 text-sm font-mono text-green-400/40 text-center leading-snug min-h-[60px]">
                    {showStillLoading && <p>Still loading...</p>}
                    {showWhileWaiting && <p>While waiting...</p>}
                    {showWhileWaiting && currentFormula && (
                        <p className="mt-2 text-green-400/60">{currentFormula}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

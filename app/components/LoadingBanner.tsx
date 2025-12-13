"use client";

import { useEffect, useState } from "react";

const formulas = [
    "Ohm’s Law: \nV = I × R",
    "Ohm’s Law: \nI = V / R",
    "Ohm’s Law: \nR = V / I",
    "W (1φ): \nP = V × I × PF",
    "VA (1φ): \nS = V × I",
    "W (1φ): \nS = I² × R",
    "W (1φ): \nS = V² / R",
    "VAR (1φ): \nQ = V × I × sin(θ)",
    "W (3φ): \nP = √3 × V × I × PF",
    "VA (3φ): \nS = √3 × V × I",
    "VAR (3φ): \nQ = √3 × V × I × sin(θ)",
];

export default function LoadingBanner() {
    const [showStillLoading, setShowStillLoading] = useState(false);
    const [showWhileWaiting, setShowWhileWaiting] = useState(false);
    const [currentFormula, setCurrentFormula] = useState("");

    useEffect(() => {
        const t1 = setTimeout(() => setShowStillLoading(true), 7000);

        const t2 = setTimeout(() => {
            setShowStillLoading(false);  // 👈 REMOVE "Still loading..."
            setShowWhileWaiting(true);   // Show next phase
        }, 10000);

        let formulaInterval: NodeJS.Timeout;
        let t3: NodeJS.Timeout;

        // Start formula rotation at 11s
        t3 = setTimeout(() => {
            // Show first formula immediately
            const random = formulas[Math.floor(Math.random() * formulas.length)];
            setCurrentFormula(random);

            // Then rotate every 10 seconds
            formulaInterval = setInterval(() => {
                const random = formulas[Math.floor(Math.random() * formulas.length)];
                setCurrentFormula(random);
            }, 10000);
        }, 11000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);       // 👈 IMPORTANT: clear formula start timeout
            clearInterval(formulaInterval);
        };

    }, []);

    return (
        <div className="w-full h-full flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-md md:max-w-lg p-6 md:p-8 bg-black/70 backdrop-blur-xl border border-green-400/20 rounded-2xl shadow-lg flex flex-col items-center">

                <h1 className="text-2xl md:text-3xl font-bold text-green-400/70 tracking-wider uppercase mb-2 text-center">
                    NETA Level 2
                </h1>

                <p className="text-md md:text-lg font-mono text-green-400/50 uppercase tracking-widest text-center">
                    Loading...
                </p>

                <div className="mt-6 w-2/3 h-4 bg-green-500/10 rounded overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/40 to-transparent animate-shimmer rounded" />
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
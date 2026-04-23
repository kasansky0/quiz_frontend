"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {useRouter} from "next/navigation";
import {useSession} from "next-auth/react";

interface CalculatorProps {
    mobile?: boolean; // optional, defaults to false
}
function formatNumber(num: number) {
    return parseFloat(num.toPrecision(10)).toString();
}

function sinDeg(x: number) {
    return Math.sin((x * Math.PI) / 180);
}

function cosDeg(x: number) {
    return Math.cos((x * Math.PI) / 180);
}

function tanDeg(x: number) {
    return Math.tan((x * Math.PI) / 180);
}

export default function Calculator({ mobile = false }: CalculatorProps) {
    const [calcInput, setCalcInput] = useState("");
    const [calcResult, setCalcResult] = useState<number | "Error" | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [calcOpen, setCalcOpen] = useState(false);
    const calcRef = useRef<HTMLDivElement>(null);
    const displayRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();
    const [rageClicks, setRageClicks] = useState(0);
    const [shake, setShake] = useState(false);
    const [explosion, setExplosion] = useState(false);
    const [chaos, setChaos] = useState(false);
    const [calm, setCalm] = useState(false);
    const [powerSurge, setPowerSurge] = useState(false);
    const [breakerMode, setBreakerMode] = useState(false);
    const sidebarLink = `
                          w-full
                          text-left
                          px-2
                          py-1
                          text-black
                          font-medium
                          text-sm
                          sm:text-base
                          md:text-base
                          lg:text-base
                          rounded
                          transition-colors
                          hover:text-black
                          cursor-pointer
                        `;



    const showUI = mobile ? true : calcOpen;

    if (!session) return null;




    const handleRageClick = () => {
        setRageClicks(prev => {
            const next = prev + 1;

            // ALWAYS immediate feedback
            setShake(true);
            setTimeout(() => setShake(false), 150);

            if (next === 1) {
                // small shake already handled
            }

            if (next === 2) {
                setExplosion(true);
                setCalcResult(null);
                setCalcInput("");
                setTimeout(() => setExplosion(false), 1200);
            }

            if (next === 3) {
                setChaos(true);
                setTimeout(() => setChaos(false), 3000);
            }

            if (next === 4) {
                setCalm(true);
                setTimeout(() => setCalm(false), 3000);
            }

            if (next === 5) {
                setPowerSurge(true);
                setTimeout(() => {
                    setPowerSurge(false);
                    setRageClicks(0);
                }, 3000);
            }

            if (next >= 6) {
                setBreakerMode(true);
                setTimeout(() => {
                    setBreakerMode(false);
                    setRageClicks(0);
                }, 5000);
            }

            return next;
        });
    };


    return (
        <>
        {/* Premium Calculator */}

    {/* Title */}

    <div ref={calcRef} className="w-full hidden md:block">
        <div
            className={`${sidebarLink} group mb-0 flex items-center justify-between cursor-pointer w-full`}
            onClick={() => setCalcOpen(prev => !prev)}
        >
            {/* Centered flex row for text + arrow */}
            <div className="flex items-center gap-2">

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

                <svg
                    className={`w-4 h-4 text-black transition-all duration-200 ${calcOpen ? "rotate-180" : ""} group-hover:text-blue-400`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>

    </div>



    <AnimatePresence>
        {showUI && (
            <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{
                    scaleY: 1,
                    opacity: powerSurge
                        ? [1, 0.6, 1, 0.8, 1]
                        : breakerMode
                            ? [1, 0.5, 1, 0.3, 1]  // <-- red flicker for breaker mode
                            : 1,
                    x: shake ? [0, -8, 8, -6, 6, 0] : 0,
                    rotate: chaos ? [0, 2, -2, 1, -1, 0] : 0,
                }}
                exit={{ scaleY: 0, opacity: 0, transition: { duration: 0.25, ease: "easeInOut" } }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{ transformOrigin: "top" }}
                className={`max-w-full px-1 sm:px-2 pt-2 pb-4 w-full backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col items-center overflow-hidden border border-black/20
        ${powerSurge
                    ? "bg-blue-900 border-2 border-blue-400 shadow-[0_0_40px_rgba(0,150,255,0.8)] animate-pulse"
                    : breakerMode
                        ? "bg-red-900 border-2 border-red-400 shadow-[0_0_40px_rgba(255,50,50,0.8)] animate-pulse"
                        : "bg-black-200 "
                }
        `}
            >
                {/* History */}
                <div className="text-black text-xs overflow-y-auto max-h-16 hide-scrollbar w-full px-2 flex flex-col-reverse">
                    {history.map((item, i) => {
                        const parts = item.split(" = ");
                        const rawResult = parts[1] ?? parts[0]; // original value

                        // Use formatNumber to format the result
                        const formattedResult = !isNaN(Number(rawResult)) ? formatNumber(Number(rawResult)) : rawResult;

                        // Build display text
                        const displayText = parts[1] ? `${parts[0]} = ${formattedResult}` : formattedResult;

                        return (
                            <div
                                key={i}
                                className="cursor-pointer pt-1 hover:text-black transition-colors whitespace-nowrap overflow-hidden truncate"
                                onClick={() =>
                                    // append formatted result to input
                                    setCalcInput(prev => prev + (!isNaN(Number(rawResult)) ? formatNumber(Number(rawResult)) : rawResult))
                                }
                                title={displayText} // show formatted text on hover
                            >
                                {displayText}
                            </div>
                        );
                    })}
                </div>






                {/* Display */}
                <div
                    ref={displayRef}
                    className={`w-full sm:w-72 md:w-full px-1 sm:px-3 py-2 sm:py-3 rounded-xl mb-1 mt-1 text-right font-bold text-sm sm:text-base md:text-base overflow-hidden whitespace-nowrap
                            border ${calcResult === "Error" || isNaN(Number(calcResult)) ? "border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)] text-red-500" : "border-black/20 text-black"}
                            bg-black-200`}
                >
                    {calcResult !== null
                        ? calcResult === "Error" || isNaN(Number(calcResult))
                            ? "Error"
                            : formatNumber(Number(calcResult)) // use conditional formatting
                        : explosion
                            ? "💥 MATH OVERLOAD 💥"
                            : calm
                                ? "Breathe in... 🌿"
                                : powerSurge
                                    ? "⚡ HIGH VOLTAGE ⚡"
                                    : calcInput || "0"}
                </div>






                {/* Buttons */}
                <div className="grid grid-cols-4 gap-1 sm:gap-2 md:gap-2 w-full">
                    {[
                        "⌫","C","=","/",
                        "7","8","9","*",
                        "4","5","6","-",
                        "1","2","3","+",
                        "(",")","0",".",
                        "√","tan","sin","cos",
                        "√3","π","x²","😤"
                    ].map((btn) => {
                        // Dynamic button classes
                        const base = "h-6 sm:h-8 md:h-10 rounded-xl font-medium text-sm sm:text-base flex items-center justify-center transition-all duration-150 active:scale-95 border border-black/20";
                        const colorClasses =
                            btn === "="
                                ? "bg-green-500/80 text-black font-bold shadow-[0_0_20px_rgba(0,255,120,0.5)] hover:bg-green-500"
                                : btn === "C"
                                    ? "bg-red-500/70 text-black hover:bg-red-600/80"
                                    : btn === "⌫"
                                        ? "bg-yellow-500/60 text-black hover:bg-yellow-400/70"
                                        : ["/","*","-","+","."].includes(btn)
                                            ? "bg-white/10 text-black hover:bg-white/20"
                                            : ["√","x²","sin","cos","√3","π","tan"].includes(btn)
                                                ? "bg-black-200 text-blue-300 hover:bg-white/20"
                                                : "bg-black-200 text-black hover:bg-white/10";

                        return (
                            <button
                                key={btn}
                                className={`${base} ${colorClasses} backdrop-blur-xl ${chaos ? "animate-pulse" : ""}`}
                                style={
                                    chaos
                                        ? { transform: `rotate(${Math.random() * 10 - 5}deg)` }
                                        : powerSurge
                                            ? { boxShadow: "0 0 15px rgba(0,150,255,0.8)" } // blue glow
                                            : breakerMode
                                                ? { boxShadow: "0 0 15px rgba(255,50,50,0.8)" } // red glow
                                                : {}
                                }
                                onClick={() => {
                                    // Prevent "=" on empty input
                                    if (btn === "=" && !calcInput.trim()) return;

                                    // Prevent multiple consecutive operators
                                    if (["+", "-", "*", "/"].includes(btn) && /[+\-*/]$/.test(calcInput)) return;

                                    // Prevent ")" if there is no matching "("
                                    if (btn === ")" && (calcInput.split("(").length <= calcInput.split(")").length)) return;

                                    if (btn === "C") {
                                        setCalcInput("");
                                        setCalcResult(null);
                                    } else if (btn === "=") {
                                        try {
                                            let expr = calcInput
                                                .replace(/([0-9]+)²/g, "($1**2)")
                                                .replace(/sin\(([^)]+)\)/g, "sinDeg($1)")
                                                .replace(/cos\(([^)]+)\)/g, "cosDeg($1)")
                                                .replace(/tan\(([^)]+)\)/g, "tanDeg($1)")
                                                .replace(/√\(([^)]+)\)/g, "Math.sqrt($1)")
                                                .replace(/π/g, "Math.PI")
                                                .replace(/√3/g, "Math.sqrt(3)");

                                            const res = Function(
                                                "sinDeg",
                                                "cosDeg",
                                                "tanDeg", // <--- add this
                                                `"use strict"; return (${expr})`
                                            )(sinDeg, cosDeg, tanDeg);

                                            setHistory(prev => [`${calcInput} = ${res}`, ...prev].slice(0, 3));
                                            setCalcResult(res);
                                            setCalcInput("");
                                        } catch (err) {
                                            setCalcResult("Error");
                                        }
                                    } else if (btn === "√") {
                                        setCalcInput(prev => prev + "√(");
                                        setCalcResult(null);
                                    } else if (btn === "x²") {
                                        setCalcInput(prev => prev + "²");
                                    } else if (btn === "sin" || btn === "cos") {
                                        setCalcInput(prev => prev + btn + "(");
                                        setCalcResult(null);
                                    } else if (btn === "tan") {
                                        setCalcInput(prev => prev + "tan(");
                                        setCalcResult(null);
                                    } else if (btn === "π") {
                                        setCalcInput(prev => prev + "π");
                                    } else if (btn === "😤") {
                                        handleRageClick();
                                        return;
                                    } else if (btn === "√3") {
                                        setCalcInput(prev => prev + "√3");
                                    } else if (btn === "⌫") {
                                        setCalcInput(prev => prev.slice(0, -1));
                                        setCalcResult(null);
                                    } else {
                                        setCalcInput(prev => {
                                            let start = prev;
                                            if (!prev && typeof calcResult === "number" && ["+", "-", "*", "/"].includes(btn)) {
                                                start = Number.isInteger(calcResult) ? calcResult.toString() : calcResult.toFixed(5);
                                            }
                                            return start + btn;
                                        });
                                        setCalcResult(null);
                                    }
                                }}
                            >
                                {btn}
                            </button>
                        );
                    })}
                </div>
            </motion.div>
        )}
    </AnimatePresence>

    </>
    );
}
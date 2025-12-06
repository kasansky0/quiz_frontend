"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";        // ✅ React hook
import { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "../ui/Button";

interface UserStatsProps {
    userPercentage: number;
    nickname?: string;
    totalOnlineTime: number;
    loading: boolean;
}

function formatNumber(num: number) {
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
}

// Format seconds into hours and minutes only
function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}


function NicknameLoading() {
    return (
        <div className="w-32 h-4 bg-green-500/10 rounded overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/40 to-transparent animate-shimmer rounded" />
        </div>
    );
}

function PercentageLoading() {
    return (
        <div className="w-16 h-4 bg-green-500/10 rounded overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/40 to-transparent animate-shimmer rounded" />
        </div>
    );
}


function TimeLoading() {
    return (
        <div className="w-16 h-4 bg-green-500/10 rounded overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/40 to-transparent animate-shimmer rounded" />
        </div>
    );
}

function sinDeg(x: number) {
    return Math.sin((x * Math.PI) / 180);
}

function cosDeg(x: number) {
    return Math.cos((x * Math.PI) / 180);
}






export default function UserStats({ userPercentage, nickname, totalOnlineTime, loading }: UserStatsProps) {
    const { data: session } = useSession();
    const [calcInput, setCalcInput] = useState("");
    const [calcResult, setCalcResult] = useState<number | "Error" | null>(null);
    const displayRef = useRef<HTMLDivElement>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [calcOpen, setCalcOpen] = useState(false);
    const calcRef = useRef<HTMLDivElement>(null);





    useEffect(() => {
        if (displayRef.current) {
            displayRef.current.scrollLeft = displayRef.current.scrollWidth;
        }
    }, [calcInput, calcResult]);

    if (!session) return null;

    useEffect(() => {
        if (calcOpen && calcRef.current) {
            calcRef.current.scrollIntoView({
                behavior: "smooth", // smooth scrolling animation
                block: "start",     // align top of element with top of viewport
            });
        }
    }, [calcOpen]);


    return (
        <div className="flex flex-col items-center w-full text-white font-sans">

            {/* Styled Google Sign-Out Button (matches sign-in button) */}
            <motion.div whileHover={{scale: 1.05}} whileTap={{scale: 0.95}} className="mt-6">
                <button
                    onClick={() => signOut()}
                    className="flex items-center mt-0 gap-3 px-4 py-2 rounded-full bg-black/70 backdrop-blur-xl border border-green-400/20 shadow-lg"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="w-6 h-6"
                    >
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                    <span className="text-white font-medium">Sign out</span>
                </button>
            </motion.div>

            <div className="flex flex-col items-center space-y-4 mt-6 w-full">

            {/* Nickname badge */}
                <div className="flex items-center justify-center bg-black/70 backdrop-blur-xl border border-green-400/20
                rounded-full shadow-lg px-3 h-8 min-w-[80px] frame-shimmer">
                    {loading ? (
                        <NicknameLoading />
                    ) : (
                        <span className="text-green-300 text-sm font-medium">
                            {nickname ?? session.user?.name ?? "User"}
                        </span>
                    )}
                </div>



                {/* Score + Total Time row */}
                <div className="flex items-center space-x-3">
                    {/* Score circle */}
                    <div
                        className={`flex items-center justify-center bg-black/70 backdrop-blur-xl border border-green-400/20
                               rounded-full shadow-lg relative px-2 frame-shimmer`}
                        style={{
                            width: loading
                                ? "40px"
                                : `${Math.max(40, 12 * String(userPercentage).length)}px`,
                            height: "40px",
                            transition: "width 0.3s ease"
                        }}
                    >
                        {loading ? (
                            <PercentageLoading />
                        ) : (
                            <span className="text-green-300 text-xs font-medium">
                                 {userPercentage.toFixed()}
                            </span>
                        )}
                    </div>



                    {/* Total Online Time */}
                    <div
                        className="flex items-center justify-center bg-black/70 backdrop-blur-xl border border-green-400/20
             rounded-full shadow-lg relative px-3 whitespace-nowrap frame-shimmer"
                        style={{ height: "40px" }}
                    >
                        {loading ? (
                            <div className="w-12 h-3 bg-green-500/10 rounded overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/40 to-transparent animate-shimmer rounded" />
                            </div>
                        ) : (
                            <span className="text-green-300 text-xs font-medium">
                                 {formatTime(totalOnlineTime)}
                            </span>
                        )}
                    </div>


                </div>

            </div>





            {/* Premium Calculator */}

            {/* Title */}
            <div ref={calcRef} className="w-full">
                <div
                    className="w-full flex justify-center mt-6 mb-4 cursor-pointer"
                    onClick={() => setCalcOpen(prev => !prev)}
                >
                    {/* Centered flex row for text + arrow */}
                    <div className="flex items-center gap-2">
                        <h2 className="text-green-300 text-sm font-medium select-none">
                            Calculator
                        </h2>

                        <motion.div
                            className="w-6 h-6 flex items-center justify-center"
                            animate={{ y: [0, 4, 0] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                        >
                            <div className="relative w-6 h-6 bg-black/70 border border-green-400/20 rounded-full frame-shimmer flex items-center justify-center">
                                <svg
                                    className="w-3 h-3 text-yellow-400"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    viewBox="0 0 24 24"
                                >
                                    {calcOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    )}
                                </svg>
                            </div>
                        </motion.div>
                    </div>
                </div>

            </div>



            <AnimatePresence>
                {calcOpen && (
                    <motion.div
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        exit={{ scaleY: 0, opacity: 0, transition: { duration: 0.25, ease: "easeInOut" } }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        style={{ transformOrigin: "top" }}
                        className="w-full mb-4 p-4 bg-black/50 backdrop-blur-xl border border-green-400/20 rounded-2xl shadow-2xl flex flex-col items-center overflow-hidden"
                    >
                {/* History */}
                        <div className="text-green-200 text-xs mb-2 overflow-y-auto max-h-16 hide-scrollbar w-full px-2 flex flex-col-reverse">
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
                                        className="cursor-pointer hover:text-green-100 transition-colors whitespace-nowrap overflow-hidden truncate"
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
                            className={`w-full px-4 py-3 rounded-xl mb-3 text-right font-bold text-lg overflow-x-auto whitespace-nowrap hide-scrollbar
                            border ${calcResult === "Error" || isNaN(Number(calcResult)) ? "border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)] text-red-500" : "border-green-400/20 text-green-400"}
                            bg-black`}
                        >
                            {calcResult !== null
                                ? calcResult === "Error" || isNaN(Number(calcResult))
                                    ? "Error"
                                    : formatNumber(Number(calcResult)) // use conditional formatting
                                : calcInput || "0"}
                        </div>






                        {/* Buttons */}
                <div className="grid grid-cols-4 gap-3 w-full">
                    {[
                        "⌫","C","=","/",
                        "7","8","9","*",
                        "4","5","6","-",
                        "1","2","3","+",
                        "(","0",")",".",
                        "√","x²","sin","cos"
                    ].map((btn) => {
                        // Dynamic button classes
                        const base = "h-12 rounded-xl font-medium text-base flex items-center justify-center transition-all duration-150 active:scale-95";
                        const colorClasses =
                            btn === "="
                                ? "bg-green-500/80 text-black font-bold shadow-[0_0_20px_rgba(0,255,120,0.5)] hover:bg-green-400"
                                : btn === "C"
                                    ? "bg-red-500/70 text-white hover:bg-red-600/80"
                                    : btn === "⌫"
                                        ? "bg-yellow-500/60 text-black hover:bg-yellow-400/70"
                                        : ["/","*","-","+"].includes(btn)
                                            ? "bg-white/10 text-green-300 hover:bg-white/20"
                                            : ["√","x²","sin","cos"].includes(btn)
                                                ? "bg-white/10 text-blue-300 hover:bg-white/20"
                                                : "bg-white/5 text-white hover:bg-white/10";

                        return (
                            <button
                                key={btn}
                                className={`${base} ${colorClasses} backdrop-blur-xl`}
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
                                                .replace(/√\(([^)]+)\)/g, "Math.sqrt($1)");

                                            const res = Function(
                                                "sinDeg",
                                                "cosDeg",
                                                `"use strict"; return (${expr})`
                                            )(sinDeg, cosDeg);

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
                                    } else if (btn === "⌫") {
                                        setCalcInput(prev => prev.slice(0, -1));
                                        setCalcResult(null);
                                    } else {
                                        setCalcInput(prev => {
                                            let start = prev;
                                            if (!prev && calcResult !== null && ["+", "-", "*", "/"].includes(btn)) {
                                                start = String(Number(calcResult.toFixed(2)));
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


            <div className="w-full mt-1 p-4 bg-black/70 backdrop-blur-xl border border-green-400/20 rounded-2xl shadow-lg relative
                h-64 flex flex-col">

                {/* Heading (fixed) */}
                <h2 className="text-green-300 text-sm font-medium mb-3 text-center z-10">
                    Formula Sheet
                </h2>

                {/* Formula List (scrollable & isolated) */}
                <ul
                    className="w-full text-xs font-mono space-y-1 overflow-y-auto flex-1 overscroll-contain"
                    style={{
                        scrollbarWidth: "none", // Firefox
                        msOverflowStyle: "none" // IE 10+
                    }}
                    onWheel={(e) => e.stopPropagation()} // prevent parent scroll when scrolling formulas
                >
                    <li>
                        <span className="text-green-300 font-medium">Ohm's Law:</span>
                        <div className="text-green-100 ml-2">V = IR</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Power single phase:</span>
                        <div className="text-green-100 ml-2">P(kVA) = VI / 1000</div>
                        <div className="text-green-100 ml-2">P(kW) = VIpf / 1000</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Power three phase:</span>
                        <div className="text-green-100 ml-2">P(kVA) = √3VI / 1000</div>
                        <div className="text-green-100 ml-2">P(kW) = √3VIpf / 1000</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Capacitance:</span>
                        <div className="text-green-100 ml-2">C = Q / V</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Inductance:</span>
                        <div className="text-green-100 ml-2">V = L × (dI/dt)</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Series R :</span>
                        <div className="text-green-100 ml-2">Rₛ = R₁ + R₂ + ...</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Parallel R :</span>
                        <div className="text-green-100 ml-2">1/Rₚ = 1/R₁ + 1/R₂ + ...</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Inductive Z :</span>
                        <div className="text-green-100 ml-2">XL=2πfL</div>
                    </li>
                    <li>
                        <span className="text-green-300 font-medium">Capacitive Z :</span>
                        <div className="text-green-100 ml-2">XC=1/2πfC</div>
                    </li>
                    {/* Add more formulas here */}
                </ul>
            </div>






        </div>
    );
}

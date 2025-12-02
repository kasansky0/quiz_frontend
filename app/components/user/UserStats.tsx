"use client";

import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { useState } from "react";        // ✅ React hook
import { Button } from "../ui/Button";

interface UserStatsProps {
    userPercentage: number;
    nickname?: string;
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
        <div className="w-10 h-10 bg-green-500/10 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/40 to-transparent animate-shimmer rounded-full" />
        </div>
    );
}




export default function UserStats({ userPercentage, nickname }: UserStatsProps) {
    const { data: session } = useSession();
    const [calcInput, setCalcInput] = useState("");
    const [calcResult, setCalcResult] = useState<number | null>(null);


    if (!session) return null;

    return (
        <div className="flex flex-col items-center w-full text-white font-sans">

            {/* Avatar
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 flex items-center justify-center text-3xl font-bold text-white shadow-md">
                {session.user?.name?.[0] ?? "?"}
            </div> */}

            <h2 className="font-semibold mt-4 tracking-wide text-center">

                {/* Nickname shimmer while loading */}
                {!nickname ? (
                    <NicknameLoading />
                ) : (
                    <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                        {nickname}
                     </span>
                )}

            </h2>





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



            {/* Row container */}
            <div className="flex items-center space-x-3 mt-6">

                <div
                    className="flex items-center justify-center bg-black/70 backdrop-blur-xl border border-green-400/20
                        rounded-full shadow-lg relative px-2"
                    style={{
                        width: `${Math.max(40, 12 * String(userPercentage).length)}px`,
                        height: "40px",
                        transition: "width 0.3s ease",
                    }}
                >
                    {userPercentage === 0 ? (
                        <PercentageLoading />
                    ) : (
                        <span className="text-green-300 text-xs font-medium flex items-center justify-center leading-tight">
                             {userPercentage.toFixed()}
                        </span>
                    )}
                </div>



                {/* Percentage score */}
                <div className="w-10 h-10 flex items-center justify-center bg-black/70 backdrop-blur-xl border border-green-400/20 rounded-full shadow-lg relative">
                    <span className="text-green-300 text-xs font-medium flex flex-col items-center leading-tight">
                        10h
                    </span>
                </div>

            </div>

            {/* Basic Calculator */}
            <div className="w-full mt-4 mb-4 p-4 bg-black/70 backdrop-blur-xl border border-green-400/20 rounded-2xl shadow-lg flex flex-col items-center">
                <h2 className="text-green-300 text-sm font-medium mb-3 text-center">
                    Calculator
                </h2>

                {/* Display */}
                <input
                    type="text"
                    className="w-full bg-black/50 text-black-200 px-3 py-2 rounded-md text-right mb-2 focus:outline-none border border-green-400/20 font-bold"
                    placeholder="0"
                    value={calcResult !== null ? String(calcResult) : calcInput}
                    readOnly
                />

                {/* Buttons */}
                <div className="grid grid-cols-4 gap-2 w-full">
                    {["⌫","C","=","/",
                        "7","8","9","*",
                        "4","5","6","-",
                        "1","2","3","+",
                        "(","0",")",".",
                        "√","x²","sin","cos"].map((btn) => (
                        <button
                            key={btn}
                            className="px-3 py-2 bg-green-500/70 hover:bg-green-600/80 rounded-md text-white font-bold flex items-center justify-center"
                            onClick={() => {
                                if (btn === "C") {
                                    setCalcInput("");
                                    setCalcResult(null);
                                } else if (btn === "=") {
                                    try {
                                        // Replace any √(...) with Math.sqrt(...)
                                        let expr = calcInput
                                            .replace(/√\(([^)]+)\)/g, "Math.sqrt($1)")
                                            .replace(/sin\(([^)]+)\)/g, "Math.sin($1)")
                                            .replace(/cos\(([^)]+)\)/g, "Math.cos($1)");
                                        const res = Function(`"use strict"; return (${expr})`)();
                                        setCalcResult(res);
                                        setCalcInput("");
                                    } catch {
                                        setCalcResult(NaN);
                                    }
                                } else if (btn === "√") {
                                    setCalcInput((prev) => prev + "√"); // just insert the symbol
                                    setCalcResult(null);
                                } else if (btn === "x²") {
                                    setCalcInput((prev) => prev + "**2");
                                } else if (btn === "sin" || btn === "cos") {
                                    setCalcInput((prev) => prev + btn + "("); // auto add opening parenthesis
                                    setCalcResult(null);
                                } else if (btn === "⌫") {
                                    setCalcInput((prev) => {
                                        if (prev.endsWith("√()")) return prev.slice(0, -3); // remove entire empty sqrt
                                        return prev.slice(0, -1); // remove last char
                                    });
                                    setCalcResult(null);
                                } else {
                                    setCalcInput((prev) => {
                                        // If calcInput is empty but we have a previous result and the user pressed an operator
                                        let start = prev;
                                        if (!prev && calcResult !== null && ["+", "-", "*", "/"].includes(btn)) {
                                            start = String(calcResult);
                                        }

                                        if (prev.endsWith("√()")) {
                                            return start.slice(0, -1) + btn + ")";
                                        }
                                        return start + btn;
                                    });
                                    setCalcResult(null);
                                }

                            }}
                        >
                            {btn}
                        </button>
                    ))}
                </div>
            </div>

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

"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface FormulaSheetProps {
    mobile?: boolean;
}

export default function FormulaSheet({ mobile }: FormulaSheetProps) {
    const [formulaOpen, setFormulaOpen] = useState(false);
    const formulaRef = useRef<HTMLDivElement>(null);

    const sidebarLink = `
    hidden md:flex
    w-full
    text-left
    px-2
    py-1
    mb-5
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

    const formulaContent = (

        <ul
            className="w-full text-xs font-mono space-y-1 overflow-y-auto flex-1 overscroll-contain hide-scrollbar"
            style={{
                scrollbarWidth: "none", // Firefox
                msOverflowStyle: "none", // IE 10+
            }}
            onWheel={(e) => e.stopPropagation()} // prevent parent scroll
        >
            <li>
                <span className="text-black font-medium">Find kVA:</span>
                <div className="text-black ml-2">1φ kVA = V * I / 1k</div>
                <div className="text-black ml-2">3φ kVA = √3 * V * I / 1k</div>
                <div className="text-black ml-2">kVA = kW / pf</div>
                <div className="text-black ml-2">kVA = kW / cosθ</div>
                <div className="text-black ml-2">kVA = √(kW² + kVAR²)</div>
            </li>
            <li>
                <span className="text-black font-medium">Find kW:</span>
                <div className="text-black ml-2">1φ kW = V * I * pf / 1k</div>
                <div className="text-black ml-2">3φ kW = √3 * V * I * pf / 1k</div>
                <div className="text-black ml-2">kW = kVA × pf</div>
                <div className="text-black ml-2">kW = kVA × cosθ</div>
            </li>
            <li>
                <span className="text-black font-medium">Find kVAR:</span>
                <div className="text-black ml-2">kVAR = √(kVA² − kW²)</div>
                <div className="text-black ml-2">kVAR = kW × tanθ</div>
                <div className="text-black ml-2">kVAR = kVA × sinθ</div>
            </li>
            <li>
                <span className="text-black font-medium">Find pf & Angle:</span>
                <div className="text-black ml-2">PF = kW / kVA</div>
                <div className="text-black ml-2">PF = cosθ</div>
                <div className="text-black ml-2">sinθ = √(1 − pf²)</div>
            </li>
            <li>
                <span className="text-black font-medium">Inductive Z :</span>
                <div className="text-black ml-2">XL = 2πfL</div>
            </li>
            <li>
                <span className="text-black font-medium">Capacitive Z :</span>
                <div className="text-black ml-2">XC = 1 / 2πfC</div>
            </li>
            <li>
                <span className="text-black font-medium">Ohm's Law:</span>
                <div className="text-black ml-2">V = IR</div>
            </li>
            <li>
                <span className="text-black font-medium">Series R :</span>
                <div className="text-black ml-2">Rₛ = R₁ + R₂ + ...</div>
            </li>
            <li>
                <span className="text-black font-medium">Parallel R :</span>
                <div className="text-black ml-2">1/Rₚ = 1/R₁ + 1/R₂ + ...</div>
            </li>
        </ul>
    );

    // Mobile: always show formulas
    if (mobile) {
        return (
            <div
                className="w-full p-4 bg-black-200 backdrop-blur-xl border border-green-400/20 rounded-2xl shadow-lg flex flex-col h-64 overflow-auto"
                ref={formulaRef}
            >
                {formulaContent}
            </div>
        );
    }

    // Desktop: toggleable formulas
    return (
        <>
            <div
                className={`${sidebarLink} group mb-4 mt-4 flex items-center gap-2`} // <- added flex here
                onClick={() => setFormulaOpen((prev) => !prev)}
            >

                <svg
                    className="w-5 h-5 text-black group-hover:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.745 3A23.933 23.933 0 0 0 3 12c0 3.183.62 6.22 1.745 9M19.5 3c.967 2.78 1.5 5.817 1.5 9s-.533 6.22-1.5 9M8.25 8.885l1.444-.89a.75.75 0 0 1 1.105.402l2.402 7.206a.75.75 0 0 0 1.104.401l1.445-.889m-8.25.75.213.09a1.687 1.687 0 0 0 2.062-.617l4.45-6.676a1.688 1.688 0 0 1 2.062-.618l.213.09"
                    />
                </svg>

                <h2 className="text-black group-hover:text-blue-400 font-medium select-none">Formula Sheet</h2>
                <motion.div
                    animate={{ rotate: formulaOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-black group-hover:text-blue-400"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.div>
            </div>

            <AnimatePresence>
                {formulaOpen && (
                    <motion.div
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        exit={{ scaleY: 0, opacity: 0, transition: { duration: 0.25, ease: "easeInOut" } }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        style={{ transformOrigin: "top" }}
                        className="w-full p-4 bg-black-200 backdrop-blur-xl border border-green-400/20 rounded-2xl shadow-lg flex flex-col h-64 overflow-auto"
                        ref={formulaRef}
                    >
                        {formulaContent}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
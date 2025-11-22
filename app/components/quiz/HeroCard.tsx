"use client";

import { motion } from "framer-motion";
import { QuestionOptions } from "./QuestionOptions";

export function HeroCard({ question }: { question: any }) {
    return (
        <motion.div
            initial={{ rotateY: -28, rotateX: 6, translateZ: -60, opacity: 0, y: 40, scale: 0.96 }}
            animate={{ rotateY: -10, rotateX: 2, translateZ: 0, opacity: 1, y: 0, scale: 1 }}
            whileHover={{
                rotateY: 2,
                rotateX: -1,
                translateZ: 25,
                scale: 1.04,
                boxShadow: "0 20px 60px rgba(0,255,150,0.35)",
                transition: { duration: 0.35, ease: "easeOut" }
            }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: "preserve-3d", perspective: 1400 }}
            className="group relative max-w-xl w-full bg-gradient-to-br from-green-600/60 to-green-400/40 backdrop-blur-2xl border border-green-300/30 rounded-2xl shadow-[0_10px_40px_rgba(0,180,90,0.25)] p-4 md:p-6 text-white"
        >
            {/* Visual effects */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
            <motion.div
                initial={{ x: "-150%" }}
                animate={{ x: "150%" }}
                transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                className="absolute inset-y-0 w-1/3 left-0 bg-gradient-to-r from-white/5 via-white/10 to-transparent rounded-2xl blur-xl pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-green-300/10 rounded-2xl pointer-events-none" />

            {/* Content */}
            <h2 className="text-xl font-bold mb-3">NETA Level 2 Practice Question</h2>
            <p className="text-base font-semibold mb-3">{question.question}</p>

            <QuestionOptions options={question.options} />

            <div className="mt-4">
                <p className="text-sm font-bold text-green-100">Correct Answer:</p>
                <p className="text-sm mt-1">{question.answer}</p>
            </div>

            <div className="mt-3">
                <p className="text-sm font-bold text-green-100">Explanation:</p>
                <p className="text-xs mt-1 leading-relaxed">
                    {question.explanation}
                </p>
            </div>
        </motion.div>
    );
}

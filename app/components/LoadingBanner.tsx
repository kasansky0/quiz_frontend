"use client";

import { motion } from "framer-motion";

export default function LoadingBanner() {
    return (
        <div className="w-full flex flex-col items-center justify-center py-12 bg-green-900/50 backdrop-blur-xl border border-green-700 rounded-3xl shadow-lg">
            {/* Animated electrical nodes */}
            <div className="grid grid-cols-5 gap-4 mb-6">
                {Array.from({ length: 15 }).map((_, idx) => (
                    <motion.div
                        key={idx}
                        animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                        transition={{
                            duration: 1 + Math.random(),
                            repeat: Infinity,
                            delay: Math.random(),
                        }}
                        className="w-6 h-6 rounded-full bg-green-400 shadow-[0_0_10px_rgba(0,255,0,0.8)]"
                    />
                ))}
            </div>

            {/* Loading Text */}
            <motion.p
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-center text-green-300 font-mono uppercase tracking-wider"
            >
                {/* First line */}
                <span className="block text-lg md:text-xl font-semibold">Loading</span>
                {/* Second line */}
                <span className="block text-2xl md:text-3xl font-bold mt-1">NETA Level 2 Quiz... ⚡</span>
            </motion.p>

        </div>
    );
}

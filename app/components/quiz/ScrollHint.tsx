"use client";

import { motion } from "framer-motion";

export function ScrollHint() {
    return (
        <motion.div
            className="mt-6 flex justify-center md:hidden"
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
        >
            <svg
                className="w-6 h-6 text-white opacity-70"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
        </motion.div>
    );
}

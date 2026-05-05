"use client";

import { motion } from "framer-motion";

export function ScrollHint() {
    return (
        <motion.div
            className="flex justify-center"
            animate={{ y: [0, 4, 0] }}
            transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: "easeInOut",
            }}
        >
            <svg
                className="w-5 h-5 text-black opacity-50"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                />
            </svg>
        </motion.div>
    );
}
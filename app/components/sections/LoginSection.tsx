"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

export default function LoginSection() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex flex-col items-center gap-5 md:gap-7 text-center relative"
        >
            {/* Hero Title */}
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                  NetaPrep
                </span>
            </h1>

            {/* Hero Description */}
            <p className="text-sm md:text-base font-semibold tracking-tight text-white">
              <span className="bg-gradient-to-r from-green-500 to-green-900 bg-clip-text text-transparent">
                NETA Level 2 quizzes — with clear explanations.
              </span>
            </p>





            {/* Value Statement */}
            <p className="text-xs text-white/80 mt-1 md:mt-2">
                Quick login. Start practicing immediately.
                <br />
                Mobile-friendly and optimized for on-the-go learning.
            </p>




            {/* Google Sign-in Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button
                    onClick={() => signIn("google")}
                    className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/70 backdrop-blur-xl border border-green-400/20 shadow-lg hover:bg-black/60"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                    <span className="text-white font-medium">Sign in with Google</span>
                </button>
            </motion.div>

            {/* Security & Credibility */}
            <div className="flex flex-col gap-1 text-xs text-white/70 text-center">
                <span>🔒 Secure login with Google OAuth 2.0</span>
            </div>
        </motion.div>
    );
}

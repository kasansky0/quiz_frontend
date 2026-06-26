"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

export default function LoginSection() {

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-md"
        >
            {/* CARD */}
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm px-7">

                {/* HEADER */}
                <div className="flex flex-col items-center text-center">

                    {/* LOGO */}
                    <img
                        src="/images/left_computer_image.png"
                        className="h-[100px] w-auto object-contain"
                    />

                    {/* TEXT */}
                    <div className="mt-4 space-y-1 max-w-md">
                        <p className="text-sm text-green-600 font-medium">
                            Free NETA Level 2 practice + targeted quizzes with explanations and hiring partner support
                        </p>

                        <p className="text-sm text-black">
                            Exam simulations built for real-world electrical readiness
                        </p>

                        <p className="text-sm text-black/80 mt-1">
                            Grow your skills with a continuously expanding question bank for certification success
                        </p>
                    </div>

                </div>

                {/* METRICS (Single LinkedIn-style block) */}
                <div className="mt-6 rounded-2xl bg-neutral-50 border border-neutral-200 p-4">
                    <div className="flex items-center justify-center gap-6 text-center">

                        {/* FAST */}
                        <div className="flex-1">
                            <p className="text-lg font-semibold text-black">Fast</p>
                            <p className="text-xs text-neutral-600 mt-1">
                                Instant feedback
                            </p>
                        </div>

                        {/* DIVIDER */}
                        <div className="w-px self-stretch bg-neutral-300" />

                        {/* REAL */}
                        <div className="flex-1">
                            <p className="text-lg font-semibold text-black">Real</p>
                            <p className="text-xs text-neutral-600 mt-1">
                                Exam-style questions
                            </p>
                        </div>

                    </div>
                </div>

                {/* SPACING CONTROL (important fix) */}
                <div className="h-6" />

                {/* GOOGLE BUTTON ONLY */}
                <motion.button
                    whileHover={{
                        scale: 1.03,
                        y: -2
                    }}
                    whileTap={{
                        scale: 0.97,
                        y: 1
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 18
                    }}
                    onClick={() => signIn("google")}
                    className="
                        w-full
                        flex items-center justify-center gap-3
                        px-5 py-3
                        rounded-xl
                        bg-white
                        border border-neutral-300
                        shadow-sm
                        hover:bg-neutral-50
                        hover:shadow-md
                        active:shadow-sm
                        cursor-pointer
                        select-none
                        will-change-transform
                    "
                >
                    {/* Google Logo */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="w-5 h-5 shrink-0"
                    >
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>

                    <span className="text-sm font-medium text-black">
                        Sign in with Google
                    </span>
                </motion.button>

                {/* SECURITY */}
                <p className="mt-5 text-xs text-center text-neutral-500">
                    🔒 Secure Google OAuth · Encrypted login
                </p>
                {/* STATS (LinkedIn-style info cards) */}
                <div className="my-4 grid grid-cols-2 gap-4 w-full max-w-sm">

                    <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center shadow-sm">
                        <div className="text-xl font-bold text-black">90%</div>
                        <div className="text-xs text-neutral-500 mt-1">Pass Rate</div>
                    </div>

                    <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center shadow-sm">
                        <div className="text-xl font-bold text-black">1200+</div>
                        <div className="text-xs text-neutral-500 mt-1">Questions</div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}
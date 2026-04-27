"use client";

import { signIn, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { fetchWithToken } from "@/app/hooks/refreshToken";

export default function LoginSection() {
    const { data: session } = useSession();
    const tokenSentRef = useRef(false);

    useEffect(() => {
        const syncBackend = async () => {
            if (!session?.idToken || tokenSentRef.current) return;
            tokenSentRef.current = true;

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                if (!apiUrl) return;

                await fetchWithToken(`${apiUrl}/auth/google`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ token: session.idToken }),
                });
            } catch (err) {
                console.error(err);
            }
        };

        syncBackend();
    }, [session?.idToken]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-md"
        >
            {/* CARD */}
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm px-7 py-8">

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
                            Free for practice, supported by hiring partners and advanced premium exam tracks
                        </p>

                        <p className="text-sm text-black">
                            Structured NETA Level 2 exam simulations with clear, professional explanations
                        </p>

                        <p className="text-sm text-black/80 mt-1">
                            Learn at your pace with a continuously expanding question bank designed for real exam readiness
                        </p>
                    </div>

                </div>

                {/* METRICS (FIXED — no ugly 90% / 1000+) */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 text-center">
                        <p className="text-lg font-semibold text-black">Fast</p>
                        <p className="text-xs text-neutral-600">Instant feedback</p>
                    </div>

                    <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 text-center">
                        <p className="text-lg font-semibold text-black">Real</p>
                        <p className="text-xs text-neutral-600">Exam-style questions</p>
                    </div>
                </div>

                {/* SPACING CONTROL (important fix) */}
                <div className="h-6" />

                {/* GOOGLE BUTTON ONLY */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => signIn("google")}
                    className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white border border-neutral-300 shadow-sm hover:bg-neutral-50 transition"
                >
                    {/* Google Logo (kept exactly) */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
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
            </div>
        </motion.div>
    );
}
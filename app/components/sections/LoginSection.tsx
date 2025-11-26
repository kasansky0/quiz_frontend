"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "../ui/Button";
import castle from "@/public/images/castle.png"; // <-- import the image

export default function LoginSection() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex flex-col items-center gap-5 md:gap-7 text-center relative"
        >
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                    NetaPrep
                </span>
            </h1>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-4 mt-4 md:mt-6">
                {/* Left placeholder */}
                <img src={castle.src} alt="Engineer Castle" className="w-30 h-12" />

                <Button
                    variant="glass"
                    onClick={() => signIn("google")}
                >
                    Sign in with Google
                </Button>

                {/* Right placeholder */}
                <img src={castle.src} alt="Engineer Castle" className="w-30 h-12" />
            </motion.div>


            <p className="text-xs text-dark-600 mt-2">
                Secure authentication via Google OAuth 2.0
            </p>
        </motion.div>
    );
}

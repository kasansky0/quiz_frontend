"use client";

import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "../ui/Button";

export default function UserStats() {
    const { data: session } = useSession();

    if (!session) return null;

    return (
        <div className="flex flex-col items-center w-full">
            {/* Avatar with green glow */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-green-500 to-green-700 flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_15px_rgba(0,255,0,0.5)] animate-pulse">
                {session.user?.name?.[0] ?? "?"}
                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping-slow"></div>
            </div>

            {/* Username */}
            <h2 className="text-xl font-semibold text-white mt-4 tracking-wide">
                {session.user?.name || "User"}
            </h2>

            {/* Futuristic Electrical-themed Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full mt-6 p-6 bg-green-900/30 backdrop-blur-xl border border-green-700 rounded-3xl shadow-[0_10px_30px_rgba(0,255,0,0.3)]"
            >
                <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 9 }).map((_, idx) => (
                        <motion.div
                            key={idx}
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{
                                duration: 1 + Math.random(),
                                repeat: Infinity,
                                delay: Math.random(),
                            }}
                            className="w-8 h-8 rounded-full bg-green-400 shadow-[0_0_8px_rgba(0,255,0,0.7)]"
                        />
                    ))}
                </div>
                <p className="mt-4 text-green-300 text-center font-mono">
                    NETA Level 2 Electrical Technician
                </p>
            </motion.div>

            {/* Sign Out Button (functional) */}
            <Button
                className="w-full mt-6 rounded-xl py-3 font-medium bg-white/10 backdrop-blur-md hover:bg-white/20 transition"
                onClick={() => signOut({ callbackUrl: "/" })}
            >
                Sign Out
            </Button>
        </div>
    );
}

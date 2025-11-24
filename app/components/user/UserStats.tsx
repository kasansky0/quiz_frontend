"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "../ui/Button";

export default function UserStats() {
    const { data: session } = useSession();

    if (!session) return null;

    return (
        <div className="flex flex-col items-center w-full text-white font-sans">

            {/* Avatar */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 flex items-center justify-center text-3xl font-bold text-white shadow-md">
                {session.user?.name?.[0] ?? "?"}
            </div>

            {/* Username */}
            <h2 className="text-xl font-semibold mt-4 tracking-wide">
                {session.user?.name || "User"}
            </h2>

            {/* Tesla-style Info Card */}
            <div className="w-full mt-6 p-6 bg-black/70 backdrop-blur-xl border border-green-400/20 rounded-2xl shadow-lg flex flex-col items-center relative">

                {/* Optional subtle glow line */}
                <div className="absolute top-0 left-0 w-full h-full border border-green-400/20 rounded-2xl pointer-events-none"></div>

                {/* Info Grid with Emojis */}
                <div className="w-full grid grid-cols-1 gap-4 text-green-300 font-mono text-center">
                    <div className="flex justify-between items-center">
                        <span className="text-green-400 text-lg">⚡</span>
                        <span>NETA Level 2</span>
                    </div>
                </div>
            </div>

            {/* Sign Out Button */}
            <Button
                className="w-full mt-6 rounded-xl py-3 font-medium bg-white/10 backdrop-blur-md hover:bg-white/20 transition"
                onClick={() => signOut({ callbackUrl: "/" })}
            >
                Sign Out
            </Button>
        </div>
    );
}

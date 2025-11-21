"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "../ui/Button";

interface BackendUserStats {
    quizzesCompleted: number;
    averageScore: number;
    lastAttempt: string;
}

interface UserStatsProps {
    backendStats: BackendUserStats | null;
}

export default function UserStats({ backendStats }: UserStatsProps) {
    const { data: session } = useSession();

    if (!session) return null;

    return (
        <div className="flex flex-col items-center w-full">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold text-white shadow-inner">
                {session.user?.name?.[0] ?? "?"}
            </div>

            {/* Username */}
            <h2 className="text-xl font-semibold text-white mt-4 tracking-wide">
                {session.user?.name || "User"}
            </h2>

            {/* Emoji Stats Card */}
            <div
                className="
                    w-full mt-6 p-4
                    bg-white/5
                    rounded-2xl
                    backdrop-blur-md
                    border border-white/10
                    shadow-sm
                    space-y-3
                "
            >
                {/* Quizzes Completed */}
                <div className="flex items-center justify-between text-gray-300">
                    <span className="flex items-center gap-2">
                        🧠 <span className="text-sm">Quizzes</span>
                    </span>
                    <span className="text-white font-medium">
                        {backendStats?.quizzesCompleted ?? 0}
                    </span>
                </div>

                {/* Average Score */}
                <div className="flex items-center justify-between text-gray-300">
                    <span className="flex items-center gap-2">
                        📊 <span className="text-sm">Score</span>
                    </span>
                    <span className="text-white font-medium">
                        {backendStats?.averageScore ?? 0}%
                    </span>
                </div>

                {/* Last Attempt */}
                <div className="flex items-center justify-between text-gray-300">
                    <span className="flex items-center gap-2">
                        🕒 <span className="text-sm">Last</span>
                    </span>
                    <span className="text-white font-medium">
                        {backendStats?.lastAttempt ?? "N/A"}
                    </span>
                </div>
            </div>

            {/* Logout Button */}
            <Button
                className="w-full mt-6 rounded-xl py-3 font-medium bg-white/10 backdrop-blur-md hover:bg-white/20 transition"
                onClick={() => signOut({ callbackUrl: "/" })}
            >
                Sign Out
            </Button>
        </div>
    );
}

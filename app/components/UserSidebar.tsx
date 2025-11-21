"use client";

import { useSession } from "next-auth/react";
import UserStats from "./user/UserStats";

export default function UserSidebar({ backendStats }: { backendStats: any }) {
    const { data: session } = useSession();

    return (
        <aside className="
                flex
                flex-col
                w-64
                h-screen
                bg-gradient-to-b from-[#111] to-[#1a1a1a]
                border-r border-white/10
                shadow-xl
                p-6
            ">
            <UserStats backendStats={backendStats} />
        </aside>

    );
}

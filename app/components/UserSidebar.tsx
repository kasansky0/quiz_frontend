"use client";

import { useSession } from "next-auth/react";
import UserStats from "./user/UserStats";

export default function UserSidebar() {
    const { data: session } = useSession();

    return (
        <aside className="
    flex flex-col
    w-64 h-screen
    bg-[linear-gradient(180deg,#070707_0%,#0b0b0b_40%,#0f0f0f_100%)]
    border-r border-white/10
    shadow-[4px_0_25px_rgba(0,0,0,0.6)]
    backdrop-blur-md
    p-6
    overflow-y-auto
    touch-pan-y
    font-sans
">
            <UserStats />
        </aside>

    );
}

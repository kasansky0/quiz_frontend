"use client";

import { useSession } from "next-auth/react";
import UserStats from "./user/UserStats";

interface UserSidebarProps {
    userPercentage: number;
    nickname?: string;
}

export default function UserSidebar({ userPercentage, nickname }: UserSidebarProps) {
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
            overflow-y-auto hide-scrollbar
            touch-pan-y
            font-sans
        ">
            <UserStats userPercentage={userPercentage} nickname={nickname} />
        </aside>
    );
}

"use client";

import { useSession } from "next-auth/react";
import UserStats from "@/app/(dashboard)/sidebar/UserStats";
import { useRouter } from "next/navigation";

interface UserSidebarProps {
    userPercentage: number;
    nickname?: string;
    totalOnlineTime: number;
    loading: boolean;
    onLinkClick?: () => void; // ✅ optional callback
}

export default function UserSidebar({ userPercentage, nickname, totalOnlineTime, loading, onLinkClick }: UserSidebarProps) {
    const { data: session } = useSession();
    const router = useRouter(); // ✅ must be inside component

    if (!session) return null;

    return (
        <aside className="flex flex-col w-64 h-full bg-dark-400/80 backdrop-blur-xl space-y-4 text-white p-4">
            <UserStats
                userPercentage={userPercentage}
                nickname={nickname}
                totalOnlineTime={totalOnlineTime}
                loading={loading}
                onLinkClick={onLinkClick} // ✅ pass callback
            />

        </aside>
    );
}

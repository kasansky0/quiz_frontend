"use client";

import { useSession } from "next-auth/react";
import UserStats from "@/app/(dashboard)/sidebar/UserStats";
import { useRouter } from "next/navigation";
import { SeenQuestionsType } from "@/types/userStats";


interface UserSidebarProps {
    userPercentage: number;
    isEmployer: boolean;
    nickname?: string;
    totalOnlineTime: number;
    loading: boolean;
    onLinkClick?: () => void;
    seenQuestions?: SeenQuestionsType;
}

export default function UserSidebar({ userPercentage, nickname, isEmployer, totalOnlineTime, loading, onLinkClick, seenQuestions }: UserSidebarProps) {
    const { data: session } = useSession();
    const router = useRouter(); // ✅ must be inside component

    if (!session) return null;

    return (
        <aside className="flex flex-col w-64 h-full bg-black-200 backdrop-blur-xl space-y-4 text-white p-4">
            <UserStats
                userPercentage={userPercentage}
                isEmployer={isEmployer}
                seenQuestions={seenQuestions}
                nickname={nickname}
                totalOnlineTime={totalOnlineTime}
                loading={loading}
                onLinkClick={onLinkClick}
            />

        </aside>
    );
}

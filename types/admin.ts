export type AdminPostStatsOut = {
    posts_by_nickname: Record<string, number>;
    comments_by_nickname: Record<string, number>;
};

export type AdminUserDetailedOut = {
    email: string;
    name?: string;
    nickname?: string;
    seenQuestionsCount: number;
    totalOnlineTime: number;
    userPercentage: number;
    last_updated?: string;
};

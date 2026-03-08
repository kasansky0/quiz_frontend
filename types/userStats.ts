export interface QuestionAttemptType {
    answered_correctly: boolean;
    // attempts?: number; // optional, if you want to count multiple per object
}

export interface SeenQuestionsType {
    [questionId: string]: QuestionAttemptType[];
}

export interface UserStatsType {
    user_id: string;         // or number, depending on your DB
    name: string;
    email: string;
    userPercentage: number;
    image?: string | null;
    google_id?: string | null;
    nickname: string;
    totalOnlineTime: number;
    loading: boolean;
    seenQuestions?: SeenQuestionsType; // ✅ use updated type
}
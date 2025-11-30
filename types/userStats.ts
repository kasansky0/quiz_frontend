export interface UserStatsType {
    user_id: string;         // or number, depending on your DB
    name: string;
    email: string;
    userPercentage: number;
    image?: string | null;
    google_id?: string | null;
}

// app/hooks/sessionClient.ts

export type SessionUser = {
    user_id: string;
    email: string;
    nickname: string;
    image?: string;
};

export type SessionResponse = {
    user: SessionUser;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Fetch current session from backend using HTTP-only cookie
 */
export async function fetchSession(): Promise<SessionResponse | null> {
    try {
        const res = await fetch(`${API_URL}/session`, {
            method: "GET",
            credentials: "include", // 👈 IMPORTANT (cookie sent automatically)
        });

        if (!res.ok) {
            return null;
        }

        return await res.json();
    } catch (err) {
        console.warn("Session fetch failed:", err);
        return null;
    }
}

/**
 * New replacement for fetchWithToken
 * - no tokens
 * - cookie-based auth only
 */
export async function fetchWithToken_v2(
    url: string,
    options: RequestInit = {}
): Promise<{ success: boolean; data?: any; status?: number } | null> {
    try {
        const res = await fetch(url, {
            ...options,
            credentials: "include", // 👈 ALWAYS include cookie
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
        });

        if (!res.ok) {
            if (res.status === 401) {
                return { success: false, status: 401 };
            }
            return { success: false, status: res.status };
        }

        const data = await res.json();

        return {
            success: true,
            data,
            status: res.status,
        };
    } catch (err) {
        console.warn("fetchWithToken_v2 network error:", err);
        return null;
    }
}
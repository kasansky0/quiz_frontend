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
        const res = await fetch(`${API_URL}/auth/session`, {
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

    console.log("🌍 fetchWithToken_v2 START:", url);
    const totalStart = performance.now();

    try {
        const fetchStart = performance.now();

        const res = await fetch(url, {
            ...options,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
        });

        console.log(
            "📥 fetch completed:",
            (performance.now() - fetchStart).toFixed(2),
            "ms",
            "status:",
            res.status
        );

        if (!res.ok) {
            console.log(
                "❌ fetchWithToken_v2 finished:",
                (performance.now() - totalStart).toFixed(2),
                "ms"
            );

            if (res.status === 401) {
                return { success: false, status: 401 };
            }

            return { success: false, status: res.status };
        }

        const jsonStart = performance.now();

        const data = await res.json();

        console.log(
            "📦 JSON parsed:",
            (performance.now() - jsonStart).toFixed(2),
            "ms"
        );

        console.log(
            "✅ fetchWithToken_v2 TOTAL:",
            (performance.now() - totalStart).toFixed(2),
            "ms"
        );

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
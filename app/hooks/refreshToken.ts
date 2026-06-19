import { signOut } from "next-auth/react";

// --- SESSION EXPIRED HANDLER ---
export async function handleSessionExpired() {
    await signOut({ redirect: false });
    console.warn("Session expired, user signed out");
}

// --- MAIN FETCH WRAPPER (COOKIE AUTH ONLY) ---
export async function fetchWithToken(
    url: string,
    options: RequestInit = {},
    retries = 1
) {
    try {
        const res = await fetch(url, {
            ...options,
            credentials: "include", // ✅ send cookies automatically
            headers: {
                ...(options.headers || {}),
                "Content-Type": "application/json",
            },
        });

        // optional retry for transient auth issues
        if (res.status === 401 && retries > 0) {
            await new Promise(r => setTimeout(r, 200));
            return fetchWithToken(url, options, retries - 1);
        }

        const text = await res.text().catch(() => "");
        let data;

        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = { error: text || "Unknown server error" };
        }

        if (!res.ok) {
            return {
                success: false,
                status: res.status,
                data,
            };
        }

        return {
            success: true,
            data,
        };
    } catch (err: any) {
        console.error("Fetch failed:", err);
        return {
            success: false,
            status: 0,
            message: "Network error, please check your connection.",
        };
    }
}
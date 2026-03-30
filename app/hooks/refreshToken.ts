import { getSession, signOut } from "next-auth/react";

// --- HELPER FUNCTION TO REVALIDATE THE TOKEN BEFORE IT IS EXPIRED ---
export async function handleSessionExpired() {
    // Sign out the user without using React hooks
    await signOut({ redirect: false });
    console.warn("Session expired, user signed out");
}

export async function refreshToken() {
    const session = await getSession();

    if (!session?.idToken) {
        console.warn("No session after refresh");
        return null;
    }

    return session.idToken;
}

export async function fetchWithToken(url: string, options: RequestInit = {}, retries = 1) {
    const currentSession = await getSession();
    let idToken = currentSession?.idToken;

    if (!idToken) {
        console.warn("Session not ready yet");
        return { success: false, status: 0, message: "Session not ready" };
    }

    options.headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${idToken}`,
    };

    try {
        let res = await fetch(url, options);

        if (res.status === 401 && retries > 0) {
            const newToken = await refreshToken();

            if (!newToken) {
                return { success: false, status: 401, message: "Session expired. Please log in again." };
            }

            idToken = newToken;

            await new Promise(r => setTimeout(r, 200)); // keep delay

            options.headers = {
                ...(options.headers as Record<string, string> || {}),
                Authorization: `Bearer ${idToken}`,
            };

            return fetchWithToken(url, options, retries - 1);
        }

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            return { success: false, status: res.status, message: `Server error: ${text}` };
        }

        const data = await res.json();
        return { success: true, data };
    } catch (err: any) {
        console.error("Fetch failed:", err);
        return { success: false, status: 0, message: "Network error, please check your connection." };
    }
}
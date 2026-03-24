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
        return null; // ⛔ just stop, DO NOT log out
    }

    options.headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${idToken}`,
    };

    try {
        let res = await fetch(url, options);

        // Retry once on 401
        // Retry once on 401
        if (res.status === 401 && retries > 0) {
            const newToken = await refreshToken();

            if (!newToken) {
                console.error("Failed to refresh token");
                return null; // exit early if refresh fails
            }

            idToken = newToken; // now safe to assign

            await new Promise(r => setTimeout(r, 200));

            options.headers = {
                ...(options.headers as Record<string, string> || {}),
                Authorization: `Bearer ${idToken}`,
            };

            return fetchWithToken(url, options, retries - 1);
        }

        return res;
    } catch (err) {
        console.error("Fetch failed:", err);
        return null;
    }
}
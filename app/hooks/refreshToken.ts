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
        await handleSessionExpired();
        console.error("No session after refresh");
        return null; // indicate failure without throwing
    }

    return session.idToken;
}

export async function fetchWithToken(url: string, options: RequestInit = {}, retries = 1) {
    const currentSession = await getSession();
    let idToken = currentSession?.idToken;

    if (!idToken) {
        await handleSessionExpired();
        console.error("No session token");
        return null; // fail gracefully instead of throwing
    }

    options.headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${idToken}`,
    };

    try {
        let res = await fetch(url, options);

        // Retry once on 401
        if (res.status === 401 && retries > 0) {
            idToken = await refreshToken();
            if (!idToken) {
                console.error("Failed to refresh token");
                return null;
            }

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
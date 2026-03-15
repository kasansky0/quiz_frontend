import {getSession, signOut} from "next-auth/react";

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
        throw new Error("No session after refresh");
    }

    return session.idToken;
}

export async function fetchWithToken(url: string, options: RequestInit = {}, retries = 1) {
    const currentSession = await getSession();
    let idToken = currentSession?.idToken;
    if (!idToken) {
        await handleSessionExpired();
        throw new Error("No session token");
    }

    options.headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${idToken}`,
    };

    let res = await fetch(url, options);

    if (res.status === 401 && retries > 0) {
        idToken = await refreshToken();   // get new token

        await new Promise(r => setTimeout(r, 200));

        options.headers = {
            ...(options.headers as Record<string, string> || {}),
            Authorization: `Bearer ${idToken}`,
        };

        return fetchWithToken(url, options, retries - 1);
    }

    return res;
}




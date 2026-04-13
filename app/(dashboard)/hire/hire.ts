const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function fetchEmployerAds(token: string) {
    try {
        const res = await fetch(`${apiUrl}/submitAds/my`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            const error = await res.json().catch(() => null);
            return { error: error?.detail || "Failed to fetch ads" };
        }

        const data = await res.json();
        return { data };
    } catch {
        return { error: "Network error" };
    }
}
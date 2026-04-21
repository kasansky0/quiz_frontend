const apiUrl = process.env.NEXT_PUBLIC_API_URL;

type FetchEmployerAdsResponse = {
    data?: any;
    error?: string;
    status: number;
};

export async function fetchEmployerAds(
    token: string
): Promise<FetchEmployerAdsResponse> {
    try {
        const res = await fetch(`${apiUrl}/submitAds/my`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
            return {
                error: json?.detail || "Failed to fetch ads",
                status: res.status
            };
        }

        return {
            data: json?.data || [],   // ✅ flatten here
            status: res.status
        };

    } catch {
        return {
            error: "Network error",
            status: 0
        };
    }
}
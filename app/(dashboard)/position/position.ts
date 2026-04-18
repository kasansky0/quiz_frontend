export async function fetchPublicAds() {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/submitAds/public`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const data = await res.json();

        if (!res.ok) {
            return { error: data.detail || "Failed to fetch ads" };
        }

        return { data: data.data };
    } catch (err) {
        return { error: "Network error" };
    }
}
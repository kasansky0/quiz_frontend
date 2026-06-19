import { getSession } from "next-auth/react";

export interface SubmitAdPayload {
    title: string;
    location: string;

    pay?: {
        min: number | null;
        max: number | null;
    };

    type: string;
    travel: string;
    overtime: string;
    relocation: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function submitAd(payload: SubmitAdPayload, token: string) {
    try {
        if (!token) {
            return {
                error: "You need to log in again.",
                loginRequired: true,
            };
        }

        const res = await fetch(`${apiUrl}/submitAds/`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => null);

            return {
                error: errorData?.detail || "Failed to create job ad.",
            };
        }

        const data = await res.json();
        return { data };

    } catch {
        return { error: "Network error. Please try again." };
    }
}
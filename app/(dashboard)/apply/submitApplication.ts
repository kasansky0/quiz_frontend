import { getSession } from "next-auth/react";

export interface ApplyFormPayload {
    name: string;
    email: string;
    background: boolean;
    location: string;
    availability: string;
    certifications: string;
    travel: string;
    overtime: string;
    readyToMove: string;
    experience: string;
    position: string;
    message: string;
    consent: boolean;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function submitApplication(payload: ApplyFormPayload) {
    try {
        const session = await getSession();
        const token = session?.idToken;

        if (!token) {
            // let caller handle this
            return { error: "User not authenticated" };
        }

        const res = await fetch(`${apiUrl}/apply/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            return { error: errorData?.message || res.statusText };
        }

        return { data: await res.json() };
    } catch (err: any) {
        return { error: err?.message || "Unknown error occurred" };
    }
}
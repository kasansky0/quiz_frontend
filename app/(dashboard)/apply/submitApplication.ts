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
            return { error: errorData?.detail || "Request failed" };
        }

        return { data: await res.json() };
    } catch (err: any) {
        return { error: err?.message || "Unknown error occurred" };
    }
}



// Check if email has already submitted an application
export async function checkApplicationEmail(email: string) {
    try {
        const res = await fetch(`${apiUrl}/apply/check-email?email=${encodeURIComponent(email)}`);
        if (!res.ok) throw new Error("Failed to check email");
        return await res.json(); // { exists: true/false }
    } catch (err: any) {
        console.error(err);
        return { exists: false }; // default to false on error
    }
}
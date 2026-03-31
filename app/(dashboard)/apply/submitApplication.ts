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
            // Let client know user needs to log in
            return { error: "Oops! You need to log in again.", loginRequired: true };
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

            // Friendly messages for known cases
            if (res.status === 401) {
                return { error: "Oops! You need to log in again.", loginRequired: true };
            }

            return { error: errorData?.detail || "Request failed. Please try again." };
        }

        const data = await res.json();
        return { data };
    } catch (err) {
        // Always return a simple, user-friendly message
        return { error: "⚠️ Network error." };
    }
}



// Check if email has already submitted an application
export async function checkApplicationEmail(email: string) {
    try {
        const res = await fetch(
            `${apiUrl}/apply/check-email?email=${encodeURIComponent(email)}`
        );

        if (!res.ok) {
            // Handle known cases
            if (res.status === 401) {
                return { error: "Oops! You need to log in again.", loginRequired: true };
            }

            return { error: "Failed to check email. Please try again." };
        }

        const data = await res.json(); // { exists: true/false }
        return { data };
    } catch (err) {
        // Friendly network error message
        return { error: "⚠️ Network error." };
    }
}
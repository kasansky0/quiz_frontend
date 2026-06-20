import { useState, useEffect } from "react";
import { useError } from "@/app/ErrorProvider";


export interface Resource {
    code: string;
    description: string;
}

export interface Subtopic {
    id: string;
    title: string;
    content: string;
    resources?: Resource[];
}

export interface Topic {
    id: string;
    title: string;
    subtopics?: Subtopic[];
}

export interface Subject {
    id: string;
    title: string;
    description: string;
    topics?: Topic[];
    isQuiz?: boolean; // <-- add this line
}

export function useSubjectById(apiUrl: string, subjectId: string, token?: string) {
    const [subject, setSubject] = useState<Subject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [subscriptionRequired, setSubscriptionRequired] = useState(false);

    const { showError } = useError();

    useEffect(() => {
        if (!apiUrl || !subjectId) return;

        if (!token) {
            setLoading(false);
            setError("You need to log in again️.");
            showError("You need to log in again.", true);
            return;
        }

        const fetchSubject = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`${apiUrl}/subjects/${subjectId}`, {
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (res.status === 403) {
                    setSubscriptionRequired(true);
                    return;
                }

                if (!res.ok) {
                    showError("You need to log in again.", true);
                }

                const data: Subject = await res.json();
                setSubject(data);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                setError(message);
                console.warn("Fetch error:", message);
            } finally {
                setLoading(false);
            }
        };

        fetchSubject();
    }, [apiUrl, subjectId, token]);

    return { subject, loading, error, subscriptionRequired };
}
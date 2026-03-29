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
            setError("Oops! You need to log in again to continue.");
            showError(
                "Oops! You need to log in again to continue.",
                true
            );
            return;
        }

        setLoading(true);
        setError(null);

        fetch(`${apiUrl}/subjects/${subjectId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
            .then(res => {
                if (res.status === 403) {
                    setSubscriptionRequired(true);   // ✅ set flag
                    showError("Subscription required");
                    return;
                }
                if (!res.ok) {
                    setSubscriptionRequired(true);   // ✅ set flag
                    showError(
                        "Oops! You need to log in again to continue.",
                        true
                    );
                }
                return res.json();
            })
            .then(data => setSubject(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [apiUrl, subjectId, token]);

    return { subject, loading, error, subscriptionRequired };
}
"use client";
import { useState, useEffect, useCallback } from "react";
import { useError } from "@/app/ErrorProvider";


export interface Subject {
    id: string;
    title: string;
    description: string;
    isQuiz?: boolean; // <-- add this
}

export function useSubjects(apiUrl: string, mainTopic: string, token?: string) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [errorSubjects, setErrorSubjects] = useState<string | null>(null);
    const [subscriptionRequired, setSubscriptionRequired] = useState<boolean | null>(null);
    const { showError } = useError();

    const fetchSubjects = useCallback(async () => {
        if (!apiUrl || !mainTopic) return;

        if (!token) {
            setLoadingSubjects(false);       // ✅ stop infinite loading
            setErrorSubjects("Not authenticated"); // ✅ show error
            return;
        }

        setLoadingSubjects(true);
        setErrorSubjects(null);

        try {
            const res = await fetch(`${apiUrl}/subjects/?main_topic=${encodeURIComponent(mainTopic)}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (res.status === 403) {
                setSubscriptionRequired(true);   // ✅ set flag
                showError("Subscription required");
                return;
            }

            if (!res.ok) {
                setSubscriptionRequired(true);   // ✅ set flag
                showError(
                    "Oops! You need to log in again.",
                    true
                );
                return;
            }

            // ✅ SUCCESS CASE
            setSubscriptionRequired(false);

            const data = await res.json();

            const filtered: Subject[] = data?.map((s: any) => ({
                id: s.id,
                title: s.title,
                description: s.description,
                isQuiz: s.isQuiz ?? false,
            })) ?? [];

            setSubjects(filtered);
        } catch (err: any) {
            const message = err.message || "Unknown error fetching subjects";
            setErrorSubjects(message);
            showError(`❌ ${message}`);
        } finally {
            setLoadingSubjects(false);
        }
    }, [apiUrl, mainTopic, token]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    return { subjects, loadingSubjects, errorSubjects, subscriptionRequired, refetchSubjects: fetchSubjects };
}
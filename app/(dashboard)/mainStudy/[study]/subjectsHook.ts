"use client";
import { useState, useEffect, useCallback } from "react";
import { useError } from "@/app/ErrorProvider";


export interface Subject {
    id: string;
    title: string;
    description: string;
    isQuiz?: boolean; // <-- add this
}

export function useSubjects(apiUrl: string, mainTopic: string) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [errorSubjects, setErrorSubjects] = useState<string | null>(null);
    const { showError } = useError();

    const fetchSubjects = useCallback(async () => {
        if (!apiUrl || !mainTopic) return;

        setLoadingSubjects(true);
        setErrorSubjects(null);

        try {
            const res = await fetch(`${apiUrl}/subjects/?main_topic=${encodeURIComponent(mainTopic)}`);
            if (!res.ok) {
                showError("Failed to fetch subjects");
                return null;
            }

            const data = await res.json();

            console.log("📦 Raw data received:", data);
            console.log("📊 Data length:", data.length);
            console.log("🔎 First item:", data[0]);

            // Filter only id, title, description from backend (in case backend sends extra fields)
            const filtered: Subject[] = data?.map((s: any) => ({
                id: s.id,
                title: s.title,
                description: s.description,
                isQuiz: s.isQuiz ?? false, // <-- include isQuiz, default false
            })) ?? [];

            setSubjects(filtered);
        } catch (err: any) {
            const message = err.message || "Unknown error fetching subjects";
            setErrorSubjects(message);
            showError(`❌ ${message}`);
        } finally {
            setLoadingSubjects(false);
        }
    }, [apiUrl, mainTopic, showError]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    return { subjects, loadingSubjects, errorSubjects, refetchSubjects: fetchSubjects };
}
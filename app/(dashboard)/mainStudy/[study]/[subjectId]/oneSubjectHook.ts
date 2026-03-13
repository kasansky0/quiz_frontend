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

export function useSubjectById(apiUrl: string, subjectId: string) {
    const [subject, setSubject] = useState<Subject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showError } = useError();


    useEffect(() => {
        if (!apiUrl || !subjectId) return;

        setLoading(true);
        setError(null);

        fetch(`${apiUrl}/subjects/${subjectId}`)
            .then(res => {
                if (!res.ok) showError("Failed to fetch subject"); // 🔴 show banner
                return res.json();
            })
            .then(data => {
                // ✅ Log the data here
                console.log("📦 Raw data received:", data);
                if (Array.isArray(data)) {
                    console.log("📊 Data length:", data.length);
                    console.log("🔎 First item:", data[0]);
                }

                setSubject(data);
            })
            .catch(err => {
                const message = err.message || "Unknown error fetching subject";
                setError(message);
                showError(`❌ ${message}`); // 🔴 show banner
            })
            .finally(() => setLoading(false));
    }, [apiUrl, subjectId]);

    return { subject, loading, error };
}
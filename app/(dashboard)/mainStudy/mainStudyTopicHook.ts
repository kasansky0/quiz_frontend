"use client";
import { useState, useEffect } from "react";
import { useError } from "@/app/ErrorProvider";


export function useMainTopics(apiUrl: string) {
    const [mainTopics, setMainTopics] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showError } = useError();


    useEffect(() => {
        const fetchMainTopics = async () => {
            try {
                const res = await fetch(`${apiUrl}/subjects/`);
                if (!res.ok) throw new Error("Failed to fetch subjects");

                const data = await res.json();

                // extract unique main_topic values from subjects array
                const topics = Array.from(
                    new Set(
                        data
                            .map((s: any) => s.main_topic)
                            .filter((t: unknown): t is string => typeof t === "string" && t.length > 0) // ✅ fixed type
                    )
                ) as string[];
                setMainTopics(topics);
            } catch (err: any) {
                const msg = "❌ Failed to fetch main topics: " + (err?.message || err);
                setError(msg);        // now MainStudyPage sees error
            } finally {
                setLoading(false);
            }
        };
        fetchMainTopics();
    }, [apiUrl]);

    return { mainTopics, loading, error };
}
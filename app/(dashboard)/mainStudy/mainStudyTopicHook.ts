"use client";
import { useState, useEffect } from "react";

export function useMainTopics(apiUrl: string) {
    const [mainTopics, setMainTopics] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMainTopics = async () => {
            try {
                const res = await fetch(`${apiUrl}/subjects/`);
                if (!res.ok) throw new Error("Failed to fetch subjects");

                const data = await res.json();

                console.log("📦 Raw data received:", data);
                console.log("📊 Data length:", data.length);
                console.log("🔎 First item:", data[0]);

                // extract unique main_topic values from subjects array
                const topics = Array.from(new Set(data.map((s: any) => s.main_topic).filter(Boolean)));
                setMainTopics(topics);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Unknown error");
            } finally {
                setLoading(false);
            }
        };
        fetchMainTopics();
    }, [apiUrl]);

    return { mainTopics, loading, error };
}
"use client";
import { useState, useEffect, useCallback } from "react";
import { useError } from "@/app/ErrorProvider";

interface MainTopicItem {
    main_topic: string;
    title: string;
    new?: boolean;
}

// --- We no longer need MainTopic interface per item, just array + boolean ---
interface MainTopicsResponse {
    data: MainTopicItem[];
    is_paid: boolean;
}

export function useMainTopics(apiUrl: string, token?: string) {
    const [mainTopics, setMainTopics] = useState<MainTopicItem[]>([]);
    const [isPaid, setIsPaid] = useState(false);                // backend boolean
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showError } = useError();
    const [tokenExpired, setTokenExpired] = useState(false);

    const fetchMainTopics = useCallback(async () => {
        if (!apiUrl) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${apiUrl}/subjects/main-topics`, {
                credentials: "include",
            });

            if (res.status === 401) {          // <-- Unauthorized
                setTokenExpired(true);
                return;
            }

            const data: MainTopicsResponse = await res.json(); // parse as object

            setMainTopics(data.data);
            setIsPaid(data.is_paid);         // boolean
        } catch (err: any) {
            const msg = "❌ Network error";
            setError(msg);   // optional, if you want to keep error state
            showError(msg);  // this will always display "Network error"
        } finally {
            setLoading(false);
        }
    }, [apiUrl, token, showError]);

    useEffect(() => {
        fetchMainTopics();
    }, [fetchMainTopics]);

    return { mainTopics, isPaid, loading, error, tokenExpired, refetchMainTopics: fetchMainTopics };
}
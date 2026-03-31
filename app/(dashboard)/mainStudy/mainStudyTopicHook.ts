"use client";
import { useState, useEffect, useCallback } from "react";
import { useError } from "@/app/ErrorProvider";

// --- We no longer need MainTopic interface per item, just array + boolean ---
interface MainTopicsResponse {
    main_topics: string[];
    is_paid: boolean;
}

export function useMainTopics(apiUrl: string, token?: string) {
    const [mainTopics, setMainTopics] = useState<string[]>([]); // array of strings now
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
                headers: token
                    ? { "Authorization": `Bearer ${token}` }
                    : undefined,
            });

            if (res.status === 401) {          // <-- Unauthorized
                setTokenExpired(true);
                return;
            }

            const data: MainTopicsResponse = await res.json(); // parse as object

            setMainTopics(data.main_topics); // array of strings
            setIsPaid(data.is_paid);         // boolean
        } catch (err: any) {
            const msg = "❌ Failed to fetch main topics: " + (err?.message || err);
            setError(msg);
            showError(msg);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, token, showError]);

    useEffect(() => {
        fetchMainTopics();
    }, [fetchMainTopics]);

    return { mainTopics, isPaid, loading, error, tokenExpired, refetchMainTopics: fetchMainTopics };
}
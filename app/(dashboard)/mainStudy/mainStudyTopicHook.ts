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
    const [isPaid, setIsPaid] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tokenExpired, setTokenExpired] = useState(false);
    const { showError } = useError();

    const fetchMainTopics = useCallback(async () => {
        if (!apiUrl || !token) return;

        setLoading(true);
        setError(null);
        setTokenExpired(false);

        try {
            const res = await fetch(`${apiUrl}/subjects/main-topics`, {
                headers: { "Authorization": `Bearer ${token}` },
            });

            if (!res.ok) {
                if (res.status === 401) {
                    // Token expired, preserve previous isPaid value
                    setTokenExpired(true);
                    showError("Session expired. Please log in again.", true);
                } else {
                    setMainTopics([]);
                    setIsPaid(null);
                    const msg = `Failed to fetch main topics (status ${res.status})`;
                    setError(msg);
                    showError(msg);
                }
                return;
            }

            const data: MainTopicsResponse = await res.json();
            setMainTopics(data.main_topics);
            setIsPaid(data.is_paid);
        } catch (err) {
            const msg = "⚠️ Network error.";
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
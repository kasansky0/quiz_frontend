"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { UserStatsType } from "@/types/userStats";
import { useUser } from "@/app/UserContext";
import { signOut } from "next-auth/react";
import { useError } from "@/app/ErrorProvider";

interface UseUserSidebarDataProps {
    session: any;
    apiUrl: string | undefined;
    answerCount: number;
    answeredState: "correct" | "wrong" | null;
}

export function useUserSidebarData({
                                       session,
                                       apiUrl,
                                       answerCount,
                                       answeredState
                                   }: UseUserSidebarDataProps) {

    const [userStats, setUserStats] = useState<UserStatsType | null>(null);
    const [onlineTime, setOnlineTime] = useState(0);
    const [userPercentage, setUserPercentage] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchInFlightRef = useRef(false);
    const lastFetchRef = useRef(0);
    const sessionKeyRef = useRef<string | null>(null);

    const { setUserId } = useUser();
    const [errorState, setErrorState] = useState<string | null>(null);
    const [isLoggedOut, setIsLoggedOut] = useState(false);
    const { showError } = useError();

    const [platformStats, setPlatformStats] = useState({
        total_users: 0,
        users_visited_today: 0,
    });

    const api = apiUrl;

    // ----------------------------
    // SESSION HANDLING (SAFE)
    // ----------------------------
    const handleSessionExpired = useCallback(async () => {
        await signOut({ redirect: false });
        setIsLoggedOut(true);
        setErrorState(null);
    }, []);

    // ----------------------------
    // CORE FETCH (PROTECTED)
    // ----------------------------
    const fetchData = useCallback(async () => {
        if (!api) return;
        if (isLoggedOut) return;
        if (fetchInFlightRef.current) return;

        fetchInFlightRef.current = true;

        try {
            const res = await fetch(`${api}/user/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({}),
            });

            if (res.status === 401) {
                handleSessionExpired();
                return;
            }

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                console.error("Backend error:", text);
                showError("Unable to load sidebar data.");
                return;
            }

            const data = await res.json();

            setUserStats(data);
            setPlatformStats({
                total_users: data?.platform_stats?.total_users ?? 0,
                users_visited_today: data?.platform_stats?.users_visited_today ?? 0,
            });

        } catch (err) {
            console.error("Network error:", err);
            showError("Network error while loading sidebar.");
        } finally {
            fetchInFlightRef.current = false;
            setLoading(false);
        }
    }, [api, isLoggedOut, showError, handleSessionExpired]);

    // ----------------------------
    // SESSION RESET
    // ----------------------------
    useEffect(() => {
        setIsLoggedOut(false);
        setUserStats(null);
        setLoading(true);
    }, [session?.user?.email]);

    // ----------------------------
    // INIT FETCH (GUARDED)
    // ----------------------------
    useEffect(() => {
        if (!api) return;
        if (!session?.user?.email) return;

        const key = session.user.email;

        if (sessionKeyRef.current === key) return;
        sessionKeyRef.current = key;

        fetchData();
    }, [api, session?.user?.email, fetchData]);

    // ----------------------------
    // USER ID SYNC
    // ----------------------------
    useEffect(() => {
        if (userStats?.user_id) {
            setUserId(userStats.user_id);
        }
    }, [userStats?.user_id, setUserId]);

    // ----------------------------
    // ONLINE TIME (SAFE ACCUMULATION)
    // ----------------------------
    useEffect(() => {
        if (!userStats) return;

        setOnlineTime(userStats.totalOnlineTime ?? 0);

        const interval = setInterval(() => {
            setOnlineTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [userStats]);

    // ----------------------------
    // COOLDOWN FETCH WRAPPER
    // ----------------------------
    const safeFetch = useCallback(() => {
        const now = Date.now();

        if (fetchInFlightRef.current) return;
        if (now - lastFetchRef.current < 3000) return;

        lastFetchRef.current = now;
        fetchData();
    }, [fetchData]);

    // ----------------------------
    // FOCUS + VISIBILITY REFRESH
    // ----------------------------
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === "visible") safeFetch();
        };

        const onFocus = () => safeFetch();

        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onFocus);

        return () => {
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", onFocus);
        };
    }, [safeFetch]);

    // ----------------------------
    // ANSWER-BASED UPDATE (DEBOUNCED LOGIC SAFETY)
    // ----------------------------
    useEffect(() => {
        if (!userStats?.user_id) return;
        if (!api) return;
        if (answerCount === 0 || answeredState === null) return;

        const timeout = setTimeout(async () => {
            try {
                const res = await fetch(`${api}/userPercentage/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        userId: userStats.user_id,
                        userPercentage,
                        totalOnlineTime: onlineTime,
                    }),
                });

                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    showError("Failed to update user stats.");
                    return;
                }

            } catch (err: any) {
                showError("Update failed: " + (err?.message || err));
            }
        }, 500); // small debounce prevents spam calls

        return () => clearTimeout(timeout);
    }, [answerCount, answeredState, userStats?.user_id, userPercentage, onlineTime, api, showError]);

    // ----------------------------
    // INITIAL PERCENTAGE LOAD
    // ----------------------------
    useEffect(() => {
        if (!userStats?.user_id) return;
        setUserPercentage(userStats.userPercentage ?? 0);
    }, [userStats]);

    // ----------------------------
    // RETURN
    // ----------------------------
    return {
        userStats,
        platformStats,
        isEmployer: userStats?.isEmployer ?? false,
        onlineTime,
        userPercentage,
        loading,
        fetchData,
        errorState,
        isLoggedOut,
        handleSessionExpired
    };
}
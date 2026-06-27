"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { UserStatsType } from "@/types/userStats";
import { useUser } from "@/app/UserContext";
import { signOut} from "next-auth/react";
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
    const tokenSentRef = useRef(false);
    const {setUserId} = useUser();
    const [errorState, setErrorState] = useState<string | null>(null);
    const [isLoggedOut, setIsLoggedOut] = useState(false);
    const { showError } = useError();
    const [platformStats, setPlatformStats] = useState({
        total_users: 0,
        users_visited_today: 0,
    });





    const fetchData = useCallback(async () => {
        if (isLoggedOut) return;
        if (!apiUrl) return;

        try {
            const res = await fetch(`${apiUrl}/user/`, {
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
                showError("Unable to load sidebar data. Please try again.", true);
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
            showError("⚠️ Network error.", true);
        } finally {
            setLoading(false);
        }
    }, [session, apiUrl, isLoggedOut, showError]);










    const handleSessionExpired = async () => {
        await signOut({ redirect: false });
        setIsLoggedOut(true); // ✅ match the renamed state
        setErrorState(null);
    };

























    // Load existing time from DB into state
    useEffect(() => {
        if (!userStats) return;

        setOnlineTime(userStats.totalOnlineTime ?? 0);
    }, [userStats]);


    useEffect(() => {
        if (!session?.user || !userStats) return; // wait for both session and DB data

        const interval = setInterval(() => {
            setOnlineTime(prev => prev + 1); // +1 second
        }, 1000);

        return () => clearInterval(interval);
    }, [session?.user, userStats]);


    useEffect(() => {
        if (userStats?.user_id) {
            setUserId(userStats.user_id); // ✅ set backend UUID
        }
    }, [userStats?.user_id, setUserId]);


    // ✅ Fetch sidebar stats
    useEffect(() => {
        if (!apiUrl) return;
        fetchData();
    }, [apiUrl]);









    // ✅ Session check on tab visibility or focus
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                fetchData();
            }
        };

        const handleFocus = () => {
            fetchData();
        };

        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("focus", handleFocus);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("focus", handleFocus);
        };
    }, [session, apiUrl]);


    useEffect(() => {
        const lastTime = {current: performance.now()};

        const interval = setInterval(() => {
            const now = performance.now();
            if (now - lastTime.current > 20000) { // 20s pause => tab was frozen
                showError("Tab inactive/frozen, refetching sidebar stats");
                fetchData();
            }
            lastTime.current = now;
        }, 1000);

        return () => clearInterval(interval);
    }, [fetchData]);



    useEffect(() => {
        if (!userStats?.user_id || answerCount === 0 || answeredState === null) return;

        const updatePercentage = async () => {
            try {
                const res = await fetch(`${apiUrl}/userPercentage/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: userStats.user_id,
                        userPercentage: userPercentage,
                        totalOnlineTime: onlineTime,
                    }),
                });

                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    showError("Failed to update user percentage: " + text);
                    return;
                }

                const data = await res.json();
                showError("User percentage updated: " + JSON.stringify(data));

            } catch (err: any) {
                showError("Failed to update sidebar percentage: " + (err?.message || err));
            }
        };

        updatePercentage();
    }, [answerCount, userPercentage, userStats, onlineTime, apiUrl, answeredState, showError]);


    // 1️⃣ Add another useEffect to initialize userPercentage from DB
    useEffect(() => {
        if (!userStats?.user_id) return;

        // Set initial percentage from DB
        setUserPercentage(userStats.userPercentage ?? 0);
    }, [userStats]);










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








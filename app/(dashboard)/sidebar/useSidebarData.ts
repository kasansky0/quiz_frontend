"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { UserStatsType } from "@/types/userStats";
import type { QuestionType } from "@/app/(dashboard)/quiz/components/QuizSampleSection";
import { useUser } from "@/app/UserContext";
import {signIn, signOut} from "next-auth/react";





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





    const fetchData = useCallback(async () => {
        if (isLoggedOut) return;

        if (!session?.user?.email) {
            handleSessionExpired();
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/user/`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
                body: JSON.stringify({
                    name: session.user.name,
                    email: session.user.email,
                    image: session.user.image,
                    google_id: session.user.id ?? null,
                }),
            });

            // Auth/session expired
            if (res.status === 401) {
                handleSessionExpired();
                return;
            }

            // Other backend errors → do NOT log out
            if (!res.ok) {
                setErrorState("Unable to load sidebar data.");
                return;
            }

            const data = await res.json();
            setUserStats(data);

        } catch {
            // 🚨 Network / fetch failed → treat as logged out
            handleSessionExpired();
        } finally {
            setLoading(false);
        }
    }, [session, apiUrl, isLoggedOut]);










    const handleSessionExpired = async () => {
        await signOut({ redirect: false });
        setIsLoggedOut(true); // ✅ match the renamed state
        setErrorState(null);
    };

















    useEffect(() => {
        if (!session?.idToken) return;
        if (tokenSentRef.current) return; // 🚫 already sent

        tokenSentRef.current = true; // ✅ lock immediately

        async function sendToken() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({token: session.idToken}),
                    credentials: "include",
                });

                const data = await res.json();
                console.log("✅ Google auth response:", data);

                fetchData(); // safe to call after auth
            } catch (err) {
                console.error("❌ Failed to send Google token:", err);
            }
        }

        sendToken();
    }, [session?.idToken]);


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
        if (!session || !session.user || !session.user.email) return;
        if (!apiUrl) return console.error("❌ NEXT_PUBLIC_API_URL is not set");

        fetchData();
    }, [session, apiUrl]);


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
                console.log("Tab inactive/frozen, refetching sidebar stats");
                fetchData();
            }
            lastTime.current = now;
        }, 1000);

        return () => clearInterval(interval);
    }, [fetchData]);


    useEffect(() => {
        if (!userStats?.user_id || answerCount === 0 || answeredState === null) return;

        // Every 5 answers, push to backend
        fetch(`${apiUrl}/userPercentage/update`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                userId: userStats.user_id,
                userPercentage: userPercentage,
                totalOnlineTime: onlineTime  // 👈 SEND UPDATED TIME
            }),
        })

            .then(res => res.json())
            .then(data => console.log("User percentage updated:", data))
            .catch(err => console.error("Failed to update sidebar percentage:", err));
        // }
    }, [answerCount, userPercentage, userStats]);


    // 1️⃣ Add another useEffect to initialize userPercentage from DB
    useEffect(() => {
        if (!userStats?.user_id) return;

        // Set initial percentage from DB
        setUserPercentage(userStats.userPercentage ?? 0);
    }, [userStats]);










    return {
        userStats,
        onlineTime,
        userPercentage,
        loading,
        fetchData,
        errorState,
        isLoggedOut,
        handleSessionExpired
    };




}








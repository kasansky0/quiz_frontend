"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import UserSidebar from "./sidebar/UserSidebar";
import type {UserStatsType} from "@/types/userStats";
import type {QuestionType} from "@/app/(dashboard)/quiz/components/QuizSampleSection";
import {useUser} from "@/app/UserContext";
import { AnimatePresence, motion } from "framer-motion";
import FormulaSheet from "@/app/(dashboard)/sidebar/formulasSheet"
import { useError } from "@/app/ErrorProvider";
import { fetchWithToken, handleSessionExpired } from "@/app/hooks/refreshToken";
import CalculatorMobile from "@/app/(dashboard)/sidebar/calculatorTopBar";
import { fetchWithToken_v2, fetchSession } from "@/app/hooks/sessionClient"



export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const authInitializedRef = useRef(false);
    const lastSessionKeyRef = useRef<string | null>(null);


    const router = useRouter();
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [userStats, setUserStats] = useState<UserStatsType | null>(null);
    const [wrongQueue, setWrongQueue] = useState<QuestionType[]>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const mainRef = useRef<HTMLElement>(null);
    const fetchingRef = useRef(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const [answerCount, setAnswerCount] = useState(0);
    const [answeredState, setAnsweredState] = useState<"correct" | "wrong" | null>(null);
    const [userPercentage, setUserPercentage] = useState(0);
    const [onlineTime, setOnlineTime] = useState(0);
    const [errorState, setErrorState] = useState<string | null>(null);
    const tokenSentRef = useRef(false);
    const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
    const { setUserId, setIsEmployer } = useUser();
    type MobileSheet = "calculator" | "formula" | "sidebar" | null;
    const [activeSheet, setActiveSheet] = useState<MobileSheet>(null);
    const { showError } = useError();

    const [platformStats, setPlatformStats] = useState<{
        total_users: number;
        users_visited_today: number;
    }>({
        total_users: 0,
        users_visited_today: 0,
    });


    useEffect(() => {
        if (userStats?.user_id) {
            setUserId(userStats.user_id);
        }

        setIsEmployer(userStats?.isEmployer ?? null);
    }, [userStats, setUserId, setIsEmployer]);









    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/");
        }
    }, [status, router]);

















    useEffect(() => {
        let timer: NodeJS.Timeout;

        const showTemporary = (message: string) => {
            showError(message, false);

            // clear previous timer (important)
            if (timer) clearTimeout(timer);

            timer = setTimeout(() => {
                showError("", false); // hide it
            }, 5000);
        };

        const handleOnline = () => {
            showTemporary("✅ Back online!");
        };

        const handleOffline = () => {
            showTemporary("⚠️ You are offline");
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            if (timer) clearTimeout(timer);
        };
    }, [showError]);












    useEffect(() => {
        if (status !== "authenticated") return;

        if (window.location.pathname === "/") {
            router.replace("/info");
        }
    }, [status, router]);













    // inside your UserStats component
    const refreshStats = useCallback(async () => {
        setLoading(true);

        try {
            const res = await fetch("/api/questionStats");

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                const msg = errData?.error || errData?.detail || `Failed to refresh stats (status ${res.status})`;
                showError(msg, true);
                return;
            }

            const data = await res.json();
            setUserStats(prev => prev ? { ...prev, ...data } : data);
        } catch (err: any) {
            // Network or unexpected error
            if (err.name === "TypeError") {
                showError("⚠️ Network error: check your connection");
            } else {
                showError("⚠️ Failed to refresh stats: " + (err?.message || err));
            }
        } finally {
            setLoading(false);
        }
    }, [showError]);



    useEffect(() => {
        if (answerCount === 0 || answeredState === null) return; // skip initial render
        refreshStats();
    }, [answerCount, answeredState, refreshStats]);












    // Load existing time from DB into state
    useEffect(() => {
        if (!userStats?.totalOnlineTime) return;
        setOnlineTime(userStats.totalOnlineTime);
    }, [userStats?.totalOnlineTime]);














    useEffect(() => {
        if (!session?.user || !userStats) return; // wait for both session and DB data

        const interval = setInterval(() => {
            setOnlineTime(prev => prev + 1); // +1 second
        }, 1000);

        return () => clearInterval(interval);
    }, [session?.user, userStats]);








    const fetchData = useCallback(async () => {
        if (fetchingRef.current) return; // 🚫 prevent duplicate fetches
        fetchingRef.current = true;

        if (!session?.user?.email) {
            handleSessionExpired();
            fetchingRef.current = false;
            return;
        }

        if (!apiUrl) {
            console.error("NEXT_PUBLIC_API_URL missing");
            fetchingRef.current = false;
            return;
        }

        try {
            const res = await fetchWithToken_v2(`${apiUrl}/user/`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: session.user.name,
                    email: session.user.email,
                    image: session.user.image,
                    google_id: session.user.id ?? null,
                }),
            });

            // Handle fetch failure (null) separately
            if (!res) {
                setErrorState("Network error: unable to reach server.");
                showError("❌ Network error: server unreachable.");
                return;
            }

            // Backend returned error → show message
            if (!res.success) {
                setErrorState("Network error");   // optional, just to keep error state consistent
                showError("❌ Network error");     // always shows network error to user
                return;
            }

            const data = await res.data;
            setUserStats(data);
            setPlatformStats({
                total_users: data?.platform_stats?.total_users ?? 0,
                users_visited_today: data?.platform_stats?.users_visited_today ?? 0,
            });
            setErrorState(null); // clear previous error
        } catch (err: any) {
            // Network failure → show error but keep dashboard
            setErrorState("Network error: unable to load sidebar data.");
            showError("❌ Network error: " + (err?.message || err));
        } finally {
            setLoading(false);
        }
    }, [session, apiUrl, showError]);













    useEffect(() => {
        if (status !== "authenticated") return;
        if (!session?.user?.email) return;

        const sessionKey = `${session.user.email}-${session.idToken}`;

        // 👇 if same session, skip
        if (lastSessionKeyRef.current === sessionKey) return;

        lastSessionKeyRef.current = sessionKey;

        const runAuth = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                if (!apiUrl) return;

                if (session?.idToken) {
                    await fetch(`${apiUrl}/auth/google`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ token: session.idToken }),
                        credentials: "include",
                    }).catch(() => {});
                }

                // 🔥 IMPORTANT: wait for cookie propagation
                await new Promise(res => setTimeout(res, 200));

                await fetchData();

            } catch (err) {
                console.warn("Auth/init error:", err);
            }
        };

        runAuth();
    }, [status, session?.idToken, session?.user?.email]);













    useEffect(() => {
        if (userStats?.user_id) {
            setUserId(userStats.user_id); // ✅ set backend UUID
        }
    }, [userStats?.user_id, setUserId]);








    // ✅ Session check when tab becomes visible again
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                fetchData();
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [fetchData]);

























    useEffect(() => {
        if (answeredState === null) return; // skip on initial render

        setUserPercentage(prev => {
            if (answeredState === "correct") {
                return +(prev + 1).toFixed(3);
            } else if (answeredState === "wrong") {
                return +(prev - 1).toFixed(3);
            }
            return prev;
        });
    }, [answerCount, answeredState]);







    useEffect(() => {
        if (!apiUrl) return;
        if (!userStats?.user_id || answerCount === 0 || answeredState === null) return;

        const updatePercentage = async () => {
            try {
                const res = await fetchWithToken_v2(`${apiUrl}/userPercentage/update`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: userStats.user_id,
                        userPercentage: userPercentage,
                        totalOnlineTime: onlineTime
                    }),
                });

                if (!res) {
                    showError("❌ Could not reach the server. Please try again.");
                    return;
                }

                if (!res.success) {
                    showError("❌ Failed to update user percentage. Server returned an error.");
                    return;
                }

                const data = await res.data;
                showError("✅ User percentage updated");
            } catch (err: any) {
                showError("❌ Failed to update sidebar percentage: " + (err?.message || err));
            }
        };

        updatePercentage();

    }, [answerCount, answeredState, userStats?.user_id, onlineTime, apiUrl]);









    // 1️⃣ Add another useEffect to initialize userPercentage from DB
    useEffect(() => {
        if (!userStats?.user_id) return;

        // Set initial percentage from DB
        setUserPercentage(userStats.userPercentage ?? 0);
    }, [userStats]);




    // Handle loading and unauthenticated state
    if (status === "loading") {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen text-black">
                <p className="text-xl flex items-center">
                    Loading
                    <span className="ml-2 flex space-x-1">
                          <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce"></span>
                          <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                          <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                        </span>
                </p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center h-screen text-black">
                Redirecting to login...
            </div>
        );
    }


















    const isEmployer = userStats?.isEmployer ?? false;

    return (
        <div className="h-screen flex flex-col bg-black-200 text-black">



            {/* ===== TOP BAR ===== */}
            <div className="fixed top-0 left-0 right-0 z-[100]
            pt-[env(safe-area-inset-top)]
            h-[calc(56px+env(safe-area-inset-top))]
            bg-white shadow-md">

                {/* CENTERED CONTAINER */}
                <div className="h-full max-w-4xl mx-auto px-6 sm:px-2 flex items-center justify-between">







                    {/* LOGO (RIGHT SIDE) */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push("/quiz/")}
                            className="transition hover:scale-105 active:scale-95"
                        >
                            <img
                                src="/images/android-chrome-512x512.png"
                                alt="Left decoration"
                                className="h-7 w-7 rounded-lg"
                            />
                        </button>

                        <span className="font-semibold hidden md:block">
                            Neta<span className="text-green-500">Prep</span>
                        </span>
                    </div>


                        {/* MOBILE QUICK ICONS */}
                        <div className="flex-1 flex justify-center md:hidden items-center gap-4 text-black">

                            {/* CHAT */}
                            <button
                                onClick={() => {
                                    router.push("/feed"); // then navigate
                                }}
                                className={`
                                    group
                                    rounded-full
                                    transition transform duration-150 ease-out
                                    active:scale-95 active:bg-neutral-200
                                    focus:outline-none focus:ring-0
                                    hover:scale-105 hover:bg-neutral-100
                                    touch-manipulation
                                    p-2
                                `}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="size-7 lg:group-hover:text-blue-400"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19.5 4.5h-15a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5ZM6.75 8.25h3v3h-3v-3Zm0 6h10.5M12 9.75h4.5"
                                    />
                                </svg>
                            </button>

                            {/* STUDY */}
                            <button
                                onClick={() => router.push("/mainStudy")}
                                className={`
                                    group
                                    rounded-full
                                    transition transform duration-150 ease-out
                                    active:scale-95 active:bg-neutral-200
                                    focus:outline-none focus:ring-0
                                    hover:scale-105 hover:bg-neutral-100
                                    touch-manipulation
                                    p-2
                                `}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-7 h-7 text-black transition-colors duration-150 group-hover:text-neutral-700"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
                                    />
                                </svg>
                            </button>


                            {/* CALCULATOR */}
                            <button
                                onClick={() => setActiveSheet(prev => prev === "calculator" ? null : "calculator")}
                                className={`
                                    group
                                    rounded-full
                                    transition transform duration-150 ease-out
                                    active:scale-95 active:bg-neutral-200
                                    focus:outline-none focus:ring-0
                                    hover:scale-105 hover:bg-neutral-100
                                    touch-manipulation
                                    p-2
                                `}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-7 h-7 text-black"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z"
                                    />
                                </svg>
                            </button>

                            {/* FORMULA SHEET */}
                            <button
                                onClick={() => setActiveSheet(prev => prev === "formula" ? null : "formula")}
                                className={`
                                    group
                                    rounded-full
                                    transition transform duration-150 ease-out
                                    active:scale-95 active:bg-neutral-200
                                    focus:outline-none focus:ring-0
                                    hover:scale-105 hover:bg-neutral-100
                                    touch-manipulation
                                    p-2
                                `}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-6 h-6 text-black transition-colors duration-150 group-hover:text-neutral-700"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4.745 3A23.933 23.933 0 0 0 3 12c0 3.183.62 6.22 1.745 9M19.5 3c.967 2.78 1.5 5.817 1.5 9s-.533 6.22-1.5 9M8.25 8.885l1.444-.89a.75.75 0 0 1 1.105.402l2.402 7.206a.75.75 0 0 0 1.104.401l1.445-.889m-8.25.75.213.09a1.687 1.687 0 0 0 2.062-.617l4.45-6.676a1.688 1.688 0 0 1 2.062-.618l.213.09"
                                    />
                                </svg>
                            </button>
                        </div>




                    {/* LEFT SIDE */}
                    <div className="flex items-center gap-3">

                        {/* Mobile Toggle (clean outline version) */}
                        <button
                            ref={buttonRef}
                            className={`
                                md:hidden
                                rounded-full
                                p-2
                                transition transform duration-150 ease-out
                                active:scale-95 active:bg-neutral-200
                                focus:outline-none focus:ring-0
                                hover:scale-105 hover:bg-neutral-100
                                touch-manipulation
                            `}
                            onClick={() => setActiveSheet(prev => prev === "sidebar" ? null : "sidebar")}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-6 h-6 text-black"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                                />
                            </svg>
                        </button>


                    </div>











                </div>

            </div>










            {/* ===== BODY WRAPPER ===== */}
            <div className="flex flex-1 pt-[calc(56px+env(safe-area-inset-top))] justify-center">
                <div className="flex w-full max-w-4xl items-start">

                    {/* ===== SIDEBAR ===== */}
                    <aside
                        ref={sidebarRef}
                        className="
                        hidden md:flex
                        w-64
                        sticky
                        top-[calc(56px+env(safe-area-inset-top)+16px)]
                        max-h-[calc(100vh-(56px+env(safe-area-inset-top)+32px))]
                        bg-white
                        rounded-2xl
                        shadow-lg
                        border border-neutral-200
                        overflow-hidden
                      "
                    >
                        <div className="flex-1 overflow-y-auto hide-scrollbar">
                            <UserSidebar
                                userPercentage={userPercentage}
                                seenQuestions={userStats?.seenQuestions}
                                nickname={userStats?.nickname}
                                totalOnlineTime={onlineTime}
                                loading={loading || !userStats}
                                onLinkClick={() => {}}
                                isEmployer={isEmployer}
                                platformStats={platformStats}
                            />
                        </div>
                    </aside>

                    {/* ===== MAIN CONTENT ===== */}
                    <div className="flex-1 flex flex-col overflow-hidden">

                        <main className="flex-1 overflow-y-auto hide-scrollbar">
                            {children}
                        </main>

                    </div>
                </div>
            </div>





            <AnimatePresence mode="sync">
                {activeSheet && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 bg-black-200/60 z-50 md:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActiveSheet(null)} // close any active sheet
                        />

                        {/* Bottom Sheet */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "tween", duration: 0.3 }}
                            className="fixed bottom-0 left-0 right-0 z-50 md:hidden
                                bg-white border-t border-green-500
                                rounded-t-2xl p-4 shadow-2xl
                                max-h-[85dvh] overflow-y-auto hide-scrollbar pb-6"
                        >
                            {/* Drag Handle */}
                            <div className="relative flex justify-center">
                                <div
                                    className="absolute -top-2 w-10 h-1 bg-white/30 rounded-full cursor-pointer"
                                    onClick={() => setActiveSheet(null)}
                                />
                            </div>

                            { activeSheet === "sidebar" && <UserSidebar
                                userPercentage={userPercentage}
                                isEmployer={isEmployer}
                                seenQuestions={userStats?.seenQuestions}
                                nickname={userStats?.nickname}
                                totalOnlineTime={onlineTime}
                                loading={loading || !userStats}
                                onLinkClick={() => setActiveSheet(null)}
                                platformStats={platformStats}
                            /> }

                            {activeSheet === "calculator" && <CalculatorMobile/>}
                            {activeSheet === "formula" && <FormulaSheet mobile />}

                        </motion.div>
                    </>
                )}
            </AnimatePresence>














        </div>
    );
}

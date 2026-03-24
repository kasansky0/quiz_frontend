"use client";

import {getSession, signIn, signOut, useSession} from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import UserSidebar from "./sidebar/UserSidebar";
import type {UserStatsType} from "@/types/userStats";
import type {QuestionType} from "@/app/(dashboard)/quiz/components/QuizSampleSection";
import {useUser} from "@/app/UserContext";
import { AnimatePresence, motion } from "framer-motion";
import Calculator from "@/app/(dashboard)/sidebar/calculator"
import FormulaSheet from "@/app/(dashboard)/sidebar/formulasSheet"
import { useError } from "@/app/ErrorProvider";
import { fetchWithToken, handleSessionExpired } from "@/app/hooks/refreshToken";



export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
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
    const { setUserId } = useUser();
    type MobileSheet = "calculator" | "formula" | "sidebar" | null;
    const [activeSheet, setActiveSheet] = useState<MobileSheet>(null);
    const { showError } = useError();








    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/");
        }
    }, [status, router]);

























    useEffect(() => {
        if (session) {
            // Only redirect if current path is exactly "/dashboard" (or wherever this layout is)
            if (window.location.pathname === "/") {
                router.push("/info");
            }
        }
    }, [session, router]);













    // inside your UserStats component
    const refreshStats = useCallback(async () => {
        setLoading(true);

        try {
            const res = await fetch("/api/questionStats");
            const data = await res.json();

            // Update userStats with the new question stats
            setUserStats(prev => prev ? { ...prev, ...data } : data);
        } catch (err: any) {
            showError("Failed to refresh stats: " + (err?.message || err));
        }

        setLoading(false);
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
            const res = await fetchWithToken(`${apiUrl}/user/`, {
                method: "POST",
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
            if (!res.ok) {
                setErrorState("Unable to load sidebar data.");
                showError("❌ Failed to fetch user data from server.");
                return;
            }

            const data = await res.json();
            setUserStats(data);
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
        // Type your session
        interface ExtendedSession {
            idToken?: string;
            user: {
                name?: string;
                email?: string;
                image?: string;
                id?: string;
            };
        }

        const extendedSession = session as ExtendedSession;

        if (!extendedSession?.idToken) return;
        if (tokenSentRef.current) return; // 🚫 already sent

        tokenSentRef.current = true; // ✅ lock immediately

        // Helper function to wrap fetch safely
        const safeFetch = async (url: string, options: RequestInit) => {
            try {
                return await fetch(url, options);
            } catch (err) {
                console.warn("Network fetch failed (suppressed):", err);
                return null;
            }
        };

        const sendToken = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                if (!apiUrl) {
                    console.warn("NEXT_PUBLIC_API_URL is missing"); // ⚠️ use warn instead of error
                    return;
                }

                const res = await safeFetch(`${apiUrl}/auth/google`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: extendedSession.idToken }),
                    credentials: "include",
                });

                if (!res) {
                    // Backend unreachable → user-friendly message
                    showError("❌ Authentication failed: server unreachable.");
                    return;
                }

                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    console.warn("Google token auth failed:", res.status, text); // ⚠️ use warn
                    return;
                }

                // Wait for token verification before fetching user data
                await fetchData();
            } catch (err: unknown) {
                // Any unexpected error → suppressed red console error
                const message = err instanceof Error ? err.message : String(err);
                console.warn("Failed to send Google token (suppressed):", message);
                showError("❌ Authentication failed. Please refresh.");
            }
        };

        sendToken();
    }, [session?.idToken, fetchData, showError]);













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
                const res = await fetchWithToken(`${apiUrl}/userPercentage/update`, {
                    method: "POST",
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

                if (!res.ok) {
                    showError("❌ Failed to update user percentage. Server returned an error.");
                    return;
                }

                const data = await res.json();
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
            <div className="flex items-center justify-center h-screen text-white">
                Loading...
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center h-screen text-white">
                Redirecting to login...
            </div>
        );
    }


















    return (
        <div className="h-screen flex flex-col bg-black-200 text-white">



            {/* ===== TOP BAR ===== */}
            <div className="fixed top-0 left-0 right-0 h-14 bg-green-500 shadow-md flex items-center px-4 justify-between z-50">

                {/* LEFT SIDE */}
                <div className="flex items-center gap-3">

                    {/* Mobile Toggle (clean outline version) */}
                    <button
                        ref={buttonRef}
                        className="md:hidden p-2 text-white transition hover:scale-105 active:scale-95"
                        onClick={() => setActiveSheet(prev => prev === "sidebar" ? null : "sidebar")}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-7 h-7"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                            />
                        </svg>
                    </button>


                </div>



                    {/* MOBILE QUICK ICONS */}
                    <div className="flex-1 flex justify-center md:hidden items-center gap-8 text-white">

                        {/* CHAT */}
                        <button
                            onClick={() => {
                                router.push("/chat"); // then navigate
                            }}
                            className="transition hover:scale-105 active:scale-95"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-7 h-7"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                                />
                            </svg>
                        </button>

                        {/* STUDY */}
                        <button
                            onClick={() => router.push("/mainStudy")}
                            className="transition hover:scale-105 active:scale-95"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-8 h-8"
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
                            className="transition hover:scale-105 active:scale-95"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-7 h-7"
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
                            className="transition hover:scale-105 active:scale-95"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-7 h-7"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.745 3A23.933 23.933 0 0 0 3 12c0 3.183.62 6.22 1.745 9M19.5 3c.967 2.78 1.5 5.817 1.5 9s-.533 6.22-1.5 9M8.25 8.885l1.444-.89a.75.75 0 0 1 1.105.402l2.402 7.206a.75.75 0 0 0 1.104.401l1.445-.889m-8.25.75.213.09a1.687 1.687 0 0 0 2.062-.617l4.45-6.676a1.688 1.688 0 0 1 2.062-.618l.213.09"
                                />
                            </svg>
                        </button>
                    </div>








                {/* LOGO (RIGHT SIDE) */}
                <div className="flex items-center">
                    <button
                        onClick={() => router.push("/quiz/")}
                        className="transition hover:scale-105 active:scale-95"
                    >
                        <img
                            src="/images/android-chrome-512x512.png"
                            className="w-9 h-9"
                        />
                    </button>
                </div>

            </div>










            {/* ===== BODY WRAPPER ===== */}
            <div className="flex flex-1 overflow-hidden pt-14">

                {/* ===== SIDEBAR ===== */}
                <aside
                    ref={sidebarRef}
                    className={`
                      hidden md:block
                      w-64 bg-dark-400 backdrop-blur-md shadow-lg
                      overflow-y-auto hide-scrollbar
                      border-r-[0.5px] border-green-500
                    `}
                >
                    <UserSidebar
                        userPercentage={userPercentage}
                        seenQuestions={userStats?.seenQuestions}
                        nickname={userStats?.nickname}
                        totalOnlineTime={onlineTime}
                        loading={loading || !userStats}
                        onLinkClick={() => {}}
                    />
                </aside>

                {/* ===== MAIN CONTENT ===== */}
                <div className="flex-1 flex flex-col overflow-hidden">

                    <main className="flex-1 overflow-y-auto">
                        {children}
                    </main>

                </div>
            </div>





            <AnimatePresence mode="sync">
                {activeSheet && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 bg-black/50 z-50 md:hidden"
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
                           bg-black-200 border-t border-green-500
                           rounded-t-2xl p-4 shadow-2xl
                           max-h-[45vh] overflow-y-auto"
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
                                seenQuestions={userStats?.seenQuestions}
                                nickname={userStats?.nickname}
                                totalOnlineTime={onlineTime}
                                loading={loading || !userStats}
                                onLinkClick={() => setActiveSheet(null)}
                            /> }

                            {activeSheet === "calculator" && <Calculator mobile />}
                            {activeSheet === "formula" && <FormulaSheet mobile />}

                            <button
                                onClick={() => setActiveSheet(null)}
                                className="mt-3 w-full bg-green-500 text-black py-2 rounded-xl"
                            >
                                Close
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>














        </div>
    );
}

"use client";

import {useSession} from "next-auth/react";
import {useEffect, useState, useRef} from "react";
import UserSidebar from "../components/UserSidebar";
import QuizSampleSection from "../components/sections/QuizSampleSection";
import Footer from "../components/sections/Footer";
import LoadingBanner from "../components/LoadingBanner";
import type { UserStatsType } from "@/types/userStats"

// ✅ Import your QuestionType if you have it
import type {QuestionType} from "../components/sections/QuizSampleSection";

export default function LoggedInPage() {
    const [loading, setLoading] = useState(true);
    const {data: session} = useSession();
    const [userStats, setUserStats] = useState<UserStatsType | null>(null);
    const [wrongQueue, setWrongQueue] = useState<QuestionType[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null); // ref for toggle button
    const mainRef = useRef<HTMLElement>(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const [answerCount, setAnswerCount] = useState(0);
    const [answeredState, setAnsweredState] = useState<"correct" | "wrong" | null>(null);
    const [userPercentage, setUserPercentage] = useState(0);
    // Track total online time (in seconds)
    const [onlineTime, setOnlineTime] = useState(0);




    // ✅ Wake backend to prevent cold start
    async function forceWakeAPI(apiUrl: string) {
        try {
            await fetch(`${apiUrl}/questions/random`, {method: "GET"});
            console.log("🔄 Backend wake ping sent (questions/random)");
        } catch (err) {
            console.error("❌ Wake failed:", err);
        }
    }

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


    // ✅ Fetch user stats
    useEffect(() => {
        if (!session || !session.user || !session.user.email) return;
        if (!apiUrl) return console.error("❌ NEXT_PUBLIC_API_URL is not set");

        const fetchData = async () => {
            try {
                const res = await fetch(`${apiUrl}/user/`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        name: session.user.name,
                        email: session.user.email,
                        image: session.user.image,
                        google_id: session.user.id ?? null
                    })
                });
                const data = await res.json();
                console.log("userStats from backend:", data); // 🔍 see if nickname is there
                setUserStats(data);
            } catch (err) {
                console.error("❌ Failed to fetch user stats:", err);
            } finally {
                // Minimum 3-second loading
                setTimeout(() => setLoading(false), 2300);
            }
        };

        fetchData();
    }, [session, apiUrl]);

    // ✅ Progressive wake retry
    useEffect(() => {
        if (!loading || !apiUrl) return;

        const timeout = setTimeout(() => {
            forceWakeAPI(apiUrl);
        }, 5000);

        // Prevent multiple retries
        return () => clearTimeout(timeout);
    }, [loading, apiUrl]);


    // ✅ Close sidebar if clicked outside
    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (
                sidebarOpen &&
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target as Node) &&
                !buttonRef.current?.contains(event.target as Node)
            ) {
                setSidebarOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [sidebarOpen]);

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
        if (!userStats?.user_id || answerCount === 0 || answeredState === null) return;

        // Every 5 answers, push to backend
       // if (answerCount % 5 === 0) {
        fetch(`${apiUrl}/userPercentage/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: userStats.user_id,
                userPercentage: userPercentage,
                totalOnlineTime: onlineTime  // 👈 SEND UPDATED TIME
            }),
        })

            .then(res => res.json())
                .then(data => console.log("User percentage updated:", data))
                .catch(err => console.error("Failed to update user percentage:", err));
       // }
    }, [answerCount, userPercentage, userStats]);

    // 1️⃣ Add another useEffect to initialize userPercentage from DB
    useEffect(() => {
        if (!userStats?.user_id) return;

        // Set initial percentage from DB
        setUserPercentage(userStats.userPercentage ?? 0);
    }, [userStats]);


    return (
        <div className="min-h-screen flex bg-black-200 relative">
            {/* ======= SLIDE-IN SIDEBAR ======= */}
            <div
                ref={sidebarRef}
                className={`
                    h-full w-64 bg-black-400/90 backdrop-blur-md shadow-lg
                    fixed inset-y-0 right-0 z-50 transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
                    md:sticky md:top-0 md:translate-x-0 md:transition-none md:shadow-none md:z-auto
                `}
            >
                <UserSidebar userPercentage={userPercentage} nickname={userStats?.nickname} totalOnlineTime={onlineTime} loading={loading || !userStats} />
            </div>

            {/* ======= MAIN PANEL ======= */}
            <div className="flex-1 flex flex-col">
                {/* MOBILE MENU BUTTON */}
                <button
                    ref={buttonRef}
                    className="md:hidden p-2 text-green-300 fixed top-2 right-4 z-50
               bg-transparent border border-green-400/30 rounded-full
               hover:bg-green-500/10 hover:border-green-400/50
               transition-all duration-200"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? "→" : "☰"}
                </button>


                {/* QUIZ SECTION */}
                <main
                    ref={mainRef}
                    className="flex-1 flex flex-col items-center justify-start p-6 md:p-8 overflow-y-auto min-h-[50vh]">
                    {loading || !apiUrl || !session?.user ? (
                        <LoadingBanner/>
                    ) : (
                            <QuizSampleSection
                                isLoggedIn={true}
                                wrongQueue={wrongQueue}
                                setWrongQueue={setWrongQueue}
                                apiUrl={apiUrl}
                                userId={session.user.id}
                                onClick={() => {
                                    setSidebarOpen(false);
                                    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                loadingDone={!loading}
                                style={{minHeight: "300px"}} // optional: reserve height
                                scrollContainerRef={mainRef}
                                onAnswer={(isCorrect) => {
                                    setAnsweredState(isCorrect ? "correct" : "wrong");
                                    setAnswerCount(prev => prev + 1); // always increments
                                }}
                            />
                    )}
                </main>

                {/* FOOTER */}
                <Footer/>
            </div>
        </div>
    );
}

"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import UserSidebar from "../components/UserSidebar";
import QuizSampleSection from "../components/sections/QuizSampleSection";
import Footer from "../components/sections/Footer";
import LoadingBanner from "../components/LoadingBanner";

// ✅ Import your QuestionType if you have it
import type { QuestionType } from "../components/sections/QuizSampleSection";

export default function LoggedInPage() {
    const [loading, setLoading] = useState(true);
    const { data: session } = useSession();
    const [userStats, setUserStats] = useState(null);


    // ✅ Wrong queue state for spaced repetition logic
    const [wrongQueue, setWrongQueue] = useState<QuestionType[]>([]);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null); // ref for toggle button

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // ✅ Wake backend to prevent cold start
    async function forceWakeAPI(apiUrl: string) {
        try {
            await fetch(`${apiUrl}/questions/random`, { method: "GET" });
            console.log("🔄 Backend wake ping sent (questions/random)");
        } catch (err) {
            console.error("❌ Wake failed:", err);
        }
    }

    // ✅ Fetch user stats
    useEffect(() => {
        if (!session || !session.user || !session.user.email) return;
        if (!apiUrl) return console.error("❌ NEXT_PUBLIC_API_URL is not set");

        const fetchData = async () => {
            try {
                const res = await fetch(`${apiUrl}/user/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: session.user.name,
                        email: session.user.email,
                        image: session.user.image,
                        google_id: session.user.id ?? null
                    })
                });
                const data = await res.json();
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
    }, []);


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
                <UserSidebar />
            </div>

            {/* ======= MAIN PANEL ======= */}
            <div className="flex-1 flex flex-col">
                {/* MOBILE MENU BUTTON */}
                <button
                    ref={buttonRef}
                    className="md:hidden p-3 text-white absolute top-4 right-4 z-50
                               bg-black-400/60 backdrop-blur-sm rounded-full shadow-md
                               hover:bg-green-500/30 transition-colors duration-200"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? "→" : "☰"}
                </button>

                {/* QUIZ SECTION */}
                <main className="flex-1 flex flex-col items-center justify-start p-6 md:p-8 overflow-y-auto min-h-[50vh]">
                    {loading || !apiUrl || !session?.user ? (
                        <LoadingBanner />
                    ) : (
                        <QuizSampleSection
                            isLoggedIn={true}
                            wrongQueue={wrongQueue}
                            setWrongQueue={setWrongQueue}
                            apiUrl={apiUrl}
                            userId={session.user.id}
                            onClick={() => {
                                setSidebarOpen(false);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            loadingDone={!loading}
                            style={{ minHeight: "300px" }} // optional: reserve height
                        />
                    )}
                </main>

                {/* FOOTER */}
                <Footer />
            </div>
        </div>
    );
}

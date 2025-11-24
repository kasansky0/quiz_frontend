"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import UserSidebar from "../components/UserSidebar";
import QuizSampleSection from "../components/sections/QuizSampleSection";
import Footer from "../components/sections/Footer";
import LoadingBanner from "../components/LoadingBanner";


export default function LoggedInPage() {
    const [loading, setLoading] = useState(true);
    const { data: session } = useSession();
    const [userStats, setUserStats] = useState(null);

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const sidebarRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null); // ref for toggle button

    async function forceWakeAPI(apiUrl: string) {
        try {
            await fetch(`${apiUrl}/questions/random`, { method: "GET" });
            console.log("🔄 Backend wake ping sent (questions/random)");
        } catch (err) {
            console.error("❌ Wake failed:", err);
        }
    }


    useEffect(() => {
        if (!session || !session.user || !session.user.email) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
            console.error("❌ NEXT_PUBLIC_API_URL is not set");
            return;
        }

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
                // Force a minimum 3-second loading
                setTimeout(() => setLoading(false), 3000);
            }
        };

        fetchData();
    }, [session]);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // Progressive wake retry delays in ms
    const wakeDelays = [5000, 12000, 25000];

    useEffect(() => {
        if (!loading) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
            console.error("❌ NEXT_PUBLIC_API_URL is not set");
            return;
        }

        let retryIndex = 0;
        let timeout: NodeJS.Timeout;

        function scheduleWake() {
            if (retryIndex >= wakeDelays.length) return;

            const delay = wakeDelays[retryIndex];
            console.log(`⏳ Backend still loading → retry ${retryIndex + 1} in ${delay / 1000}s`);

            timeout = setTimeout(() => {
                console.log(`🔄 Wake attempt #${retryIndex + 1}`);
                forceWakeAPI(apiUrl); // TypeScript knows apiUrl is a string here
                retryIndex++;
                scheduleWake();
            }, delay);
        }

        scheduleWake();

        return () => clearTimeout(timeout);
    }, [loading]);


    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                sidebarOpen &&
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setSidebarOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [sidebarOpen]);

    return (

        <div className="min-h-screen flex bg-black-200 relative">

            {/* ======= SLIDE-IN SIDEBAR ======= */}
            <div
                ref={sidebarRef}
                className={`
    h-full w-64 bg-black-400/90 backdrop-blur-md shadow-lg

    /* MOBILE: slide-in with transition */
    fixed inset-y-0 right-0 z-50 transition-transform duration-300 ease-in-out
    ${sidebarOpen ? "translate-x-0" : "translate-x-full"}

    /* DESKTOP: no transition, static layout */
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
                <main className="flex-1 flex flex-col items-center justify-start p-6 md:p-8 overflow-y-auto">
                    {loading ? (
                        <LoadingBanner />
                    ) : (
                        <QuizSampleSection
                            isLoggedIn={true}
                            onClick={() => {
                                setSidebarOpen(false);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                        />
                    )}
                </main>





                {/* FOOTER */}
                <Footer />
            </div>
        </div>
    );
}

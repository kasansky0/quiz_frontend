"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import UserSidebar from "../components/UserSidebar";
import QuizSampleSection from "../components/sections/QuizSampleSection";
import Footer from "../components/sections/Footer";

export default function LoggedInPage() {
    const { data: session } = useSession();
    const [userStats, setUserStats] = useState(null);

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const sidebarRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null); // ref for toggle button
    const mainRef = useRef<HTMLDivElement>(null); // add this

    useEffect(() => {
        if (!session || !session.user || !session.user.email) return; // ✅ add this check

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
            console.error("❌ NEXT_PUBLIC_API_URL is not set");
            return;
        }

        fetch(`${apiUrl}/api/v1/user/${session.user.email}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
                google_id: session.user.id
            })
        })
            .then(res => res.json())
            .then(data => setUserStats(data))
            .catch(err => console.error("❌ Failed to fetch user stats:", err));
    }, [session]);



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
                <UserSidebar backendStats={userStats} />
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
                <main ref={mainRef} className="flex-1 flex flex-col items-center justify-start p-6 md:p-8 overflow-y-auto">
                    <QuizSampleSection
                        isLoggedIn={true}
                        onClick={() => {
                            setSidebarOpen(false);
                            if (mainRef.current) {
                                mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
                            }
                        }}
                    />
                </main>


                {/* FOOTER */}
                <Footer />
            </div>
        </div>
    );
}

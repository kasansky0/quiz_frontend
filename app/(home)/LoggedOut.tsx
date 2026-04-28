"use client";

import LoginSection from "./LoginSection";
import Footer from "@/app/(home)/Footer";

export default function LoggedOutPage() {
    return (
        <div className="min-h-screen bg-[#f3f2ef] flex flex-col">

            {/* CENTER WRAPPER */}
            <main className="flex-1 flex flex-col items-center justify-center px-4">

                {/* LOGIN CARD */}
                <LoginSection />

            </main>

            {/* FOOTER */}
            <Footer />

        </div>
    );
}
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

                {/* STATS (LinkedIn-style info cards) */}
                <div className="my-4 grid grid-cols-2 gap-4 w-full max-w-sm">

                    <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center shadow-sm">
                        <div className="text-xl font-bold text-black">90%</div>
                        <div className="text-xs text-neutral-500 mt-1">Pass Rate</div>
                    </div>

                    <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center shadow-sm">
                        <div className="text-xl font-bold text-black">1000+</div>
                        <div className="text-xs text-neutral-500 mt-1">Questions</div>
                    </div>

                </div>

            </main>

            {/* FOOTER */}
            <Footer />

        </div>
    );
}
"use client";

import LoginSection from "../components/sections/LoginSection";
import Footer from "@/app/components/sections/Footer";

export default function LoggedOutPage() {
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-black-200">

            {/* LEFT SIDE (login + metrics) */}
            <main className="md:flex-1 flex flex-col w-full min-h-[100vh] p-0">

                <div className="w-full flex justify-center mt-6 md:mt-10 mb-6 z-4">
                    <img
                        src="/images/android-chrome-512x512.png"
                        alt="NetaPrep Logo"
                        className="w-24 md:w-32"
                    />
                </div>


                {/* Top content wrapper */}
                <div className="flex flex-col items-center w-full">
                    <LoginSection />

                    <div className="mt-2 flex flex-row justify-center gap-4 text-center w-full">
                        <div className="flex flex-col text-white items-center">
                            <span className="text-2xl md:text-3xl font-bold">90%</span>
                            <span className="text-green-200 text-sm md:text-base font-normal">Pass Rate</span>
                        </div>
                        <div className="flex flex-col text-white items-center">
                            <span className="text-2xl md:text-3xl font-bold">600+</span>
                            <span className="text-green-200 text-sm md:text-base font-normal">Practice Questions</span>
                        </div>
                    </div>
                </div>

                {/* Footer always at bottom */}
                <div className="w-full mt-4 md:mt-6">
                    <Footer />
                </div>
            </main>

            {/* RIGHT SIDE (remove quiz preview entirely) */}
            {/* <div className="md:flex-1 flex items-center justify-center md:p-9 w-full">
                <QuizSampleSection isLoggedIn={false} staticQuestion={staticQuestion} />
            </div> */}

        </div>
    );
}
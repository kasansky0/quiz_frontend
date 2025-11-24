"use client";

import LoginSection from "../components/sections/LoginSection";
import QuizSampleSection from "../components/sections/QuizSampleSection";
import Footer from "@/app/components/sections/Footer";

const staticQuestion = {
    id: 1,
    question: "What is the standard voltage for a Level 2 electrical panel?",
    options: ["120V", "240V", "480V", "12V"],
    answer: "240V",
    explanation: "Level 2 panels in residential setups typically use 240V circuits."
};


export default function LoggedOutPage() {
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-black-200">

            {/* LEFT SIDE (login + metrics) */}
            <main className="md:flex-1 flex flex-col w-full min-h-screen p-0">
                {/* Top content wrapper */}
                <div className="flex flex-col items-center flex-1 justify-center w-full">
                    <LoginSection />

                    <div className="mt-4 flex flex-row justify-center gap-4 text-center w-full">
                        <div className="flex flex-col text-white items-center">
                            <span className="text-2xl md:text-3xl font-bold">90%</span>
                            <span className="text-green-200 text-sm md:text-base font-normal">Pass Rate</span>
                        </div>
                        <div className="flex flex-col text-white items-center">
                            <span className="text-2xl md:text-3xl font-bold">270+</span>
                            <span className="text-green-200 text-sm md:text-base font-normal">Practice Questions</span>
                        </div>
                    </div>
                </div>

                {/* Footer always at bottom */}
                <div className="mt-auto w-full mt-4 md:mt-0">
                    <Footer />
                </div>
            </main>



            {/* RIGHT SIDE (Quiz preview) */}
            <div className="md:flex-1 flex items-center justify-center md:p-9 w-full">
                <QuizSampleSection isLoggedIn={false} staticQuestion={staticQuestion} />
            </div>


        </div>

    );
}

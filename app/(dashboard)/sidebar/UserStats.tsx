"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";        // ✅ React hook
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation"; // make sure this is at the top
import Calculator from "./calculator"
import FormulaSheet from "./formulasSheet"
import { useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { SeenQuestionsType } from "@/types/userStats";
import { useMemo } from "react";




interface UserStatsProps {
    userPercentage: number;
    nickname?: string;
    totalOnlineTime: number;
    loading: boolean;
    onLinkClick?: () => void;
    seenQuestions?: SeenQuestionsType;
    onRefreshStats?: () => void;
}






function DotLoader({ size = 2, color = "white" }: { size?: number; color?: string }) {
    return (
        <span className="flex items-center space-x-1">
      <span
          className={`w-${size} h-${size} bg-${color} rounded-full animate-dot-bounce`}
          style={{ animationDelay: "0s" }}
      />
      <span
          className={`w-${size} h-${size} bg-${color} rounded-full animate-dot-bounce`}
          style={{ animationDelay: "0.2s" }}
      />
      <span
          className={`w-${size} h-${size} bg-${color} rounded-full animate-dot-bounce`}
          style={{ animationDelay: "0.4s" }}
      />
    </span>
    );
}



function calculateQuestionStats(seenQuestions?: SeenQuestionsType) {
    if (!seenQuestions) return { total: 0, correct: 0, wrong: 0 };

    let total = 0;
    let correct = 0;

    // Loop through each question's attempts
    for (const attempts of Object.values(seenQuestions)) {
        if (!Array.isArray(attempts)) continue;

        for (const attempt of attempts) {
            total += 1;
            if (attempt.answered_correctly) correct += 1;
        }
    }

    const wrong = total - correct;

    return { total, correct, wrong };
}



function PercentageBar({ correct, total, onRefreshStats }: { correct: number; total: number; onRefreshStats?: () => void }) {
    const [percent, setPercent] = useState(0);
    const progress = (correct / total) * 100;

    useEffect(() => {
        if (onRefreshStats) {
            onRefreshStats();
        }

        const controls = animate(0, progress, {
            duration: 2,
            ease: "easeInOut",
            onUpdate(value) {
                setPercent(Math.round(value));
            },
        });

        return () => controls.stop();
    }, [progress, onRefreshStats]); // ✅ both stable

    return (
        <div className="flex flex-col w-full space-y-1 mt-1">
<span className="text-white/60 text-sm italic">
  Aim to stay above <span className="text-green-400 font-semibold">70%</span>
</span>            <div className="w-full h-6 bg-white/20 rounded overflow-hidden relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="h-full bg-green-500 rounded"
                />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50 text-sm font-medium">
                    {percent}%
                </span>
            </div>
        </div>
    );
}





// Format seconds into hours and minutes only
function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}


function NicknameLoading() {
    return (
        <span className="flex items-center space-x-1">
      <span>Loading</span>
      <span className="flex space-x-1">
        <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce"></span>
        <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
        <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
      </span>
    </span>
    );
}

function PercentageLoading() {
    return <DotLoader />;
}


function TimeLoading() {
    return (
        <div className="w-16 h-4 bg-green-500/10 rounded overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/40 to-transparent animate-shimmer rounded" />
        </div>
    );
}











export default function UserStats({ nickname, loading, onLinkClick, seenQuestions }: UserStatsProps) {
    const { data: session } = useSession();
    const router = useRouter(); // <-- initialize router here
    const [showStats, setShowStats] = useState(false);
    const questionStats = calculateQuestionStats(seenQuestions); // ✅ calculate stats






    const sidebarLink = `
                          w-full
                          text-left
                          px-2
                          py-1
                          mb-5
                          text-white/70
                          font-medium
                          text-sm        /* default for very small screens */
                          sm:text-base   /* small screens and up */
                          md:text-lg     /* medium screens and up */
                          lg:text-xl     /* large screens and up */
                          rounded
                          transition-colors
                          hover:text-white
                          cursor-pointer
                        `;










    return (
        <div className="flex flex-col items-center w-full text-white font-sans">

            {/* Styled Google Sign-Out (icon left, text right) */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className=" w-full">
                <div
                    onClick={() =>
                        signOut({
                            redirect: true,   // ensures NextAuth handles redirect
                            callbackUrl: "/"  // or any page you want to go after logout
                        })
                    }
                    className={`flex items-center gap-2 ${sidebarLink}`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="w-5 h-5 flex-shrink-0"
                    >
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                    <span className="text-white font-medium">Sign out</span>
                </div>
            </motion.div>

            <div className="flex flex-col space-y-1 w-full mb-5">



                {/* Nickname badge with icon and arrow */}
                <div
                    onClick={() => setShowStats(prev => !prev)} // toggle stats
                    className={`
                      w-full
                      text-left
                      px-2 py-1
                      text-white/70
                      font-medium
                      text-sm sm:text-base md:text-lg lg:text-xl
                      rounded
                      transition-colors
                      hover:text-white
                      cursor-pointer
                      flex items-center gap-2
                    `}
                >
                    {/* Left Icon */}
                    <div className="flex items-center gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-7 h-7 text-white"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                        </svg>

                        {/* Nickname text */}
                        <span>
                          {loading
                              ? <NicknameLoading />
                              : nickname ?? session?.user?.name ?? "User"}
                        </span>
                    </div>


                    <svg
                        className={`w-4 h-4 ml-2 transition-transform duration-200 ${showStats ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>

                </div>




                {/* Stats dropdown */}
                <AnimatePresence>
                    {showStats && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-col pl-9 space-y-2"
                        >
                            {/* ✅ Stats Table */}
                            {loading ? (
                                <>
                                    <PercentageLoading />
                                    <PercentageLoading />
                                    <PercentageLoading />
                                </>
                            ) : seenQuestions && Object.keys(seenQuestions).length > 0 ? (
                                <div className="flex flex-col space-y-1 text-white/70 text-sm sm:text-base md:text-lg lg:text-xl">

                                    {/* Total Questions */}
                                    <div className="flex justify-between w-full">
                                        <span>Total Questions:</span>
                                        <span>{questionStats.total}</span>
                                    </div>

                                    {/* Correct */}
                                    <div className="flex justify-between w-full">
                                        <span>Correct:</span>
                                        <span>{questionStats.correct}</span>
                                    </div>

                                    {/* Wrong */}
                                    <div className="flex justify-between w-full">
                                        <span>Wrong:</span>
                                        <span>{questionStats.wrong}</span>
                                    </div>

                                    {/* Percentage bar */}
                                    <div className="flex-1 mr-2">
                                        <PercentageBar correct={questionStats.correct} total={questionStats.total} />
                                    </div>


                                </div>
                            ) : (
                                <div className="text-white/70">No questions answered yet</div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>






            <Calculator/>
            <FormulaSheet/>



























































            {/* Group chat button */}
            <div
                onClick={() => {
                    router.push("/chat");
                    onLinkClick?.()
                }}
                className={`${sidebarLink} hidden md:flex items-center gap-2`} // <-- flex added
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                     stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/>
                </svg>

                <span className="text-white font-medium">
                    Messenger
                </span>
            </div>


            {/* Quiz Button */}
            <div
                onClick={() => {
                    router.push("/quiz");
                    onLinkClick?.()
                }}
                className={`${sidebarLink} hidden md:flex items-center gap-2`} // <-- make inline like others
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                     stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"/>
                </svg>

                <span className="text-white font-medium">
                    Full Quiz
                </span>
            </div>


            <div
                onClick={() => {
                    router.push("/mainStudy");
                    onLinkClick?.();
                }}
                className={`${sidebarLink} hidden md:flex items-center gap-2`} // keep inline like others
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                     stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"/>
                </svg>

                <span className="text-white font-medium">
                    Study
                </span>
            </div>


            <div
                onClick={() => {
                    router.push("/info");
                    onLinkClick?.()
                }}
                className={`${sidebarLink} flex items-center gap-2`} // <-- inline layout
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6 text-white flex-shrink-0"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                    />
                </svg>
                <span className="text-white font-medium">
                    Information
                </span>
            </div>












        </div>
    );
}

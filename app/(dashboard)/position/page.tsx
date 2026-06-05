"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useError } from "@/app/ErrorProvider";
import { motion, AnimatePresence } from "framer-motion";
import { formatLocalDate } from "@/app/hooks/formatLocalDate";

type Job = {
    _id: string;
    company: string;
    location: string;
    title: string;
    pay?: {
        min: number;
        max: number;
    } | null;
    relocation: string;
    perDiem?: string;
    overtime: string;
    travel?: string;
    type: string;
    createdAt: string;
};

export default function AdsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const token = session?.idToken;
    const { showError } = useError();

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    const onBack = () => {
        router.back();
    };

    const [open, setOpen] = useState(false);
    const [sortBy, setSortBy] = useState("newest");

    // -----------------------------
    // FETCH ADS FROM DB
    // -----------------------------
    useEffect(() => {
        const fetchAds = async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/submitAds/public`
                );

                const data = await res.json();

                if (!res.ok) {
                    showError?.(data.detail || "Failed to load ads");
                    return;
                }

                setJobs(data.data || []);
            } catch (err) {
                showError?.("Network error");
            } finally {
                setLoading(false);
            }
        };

        fetchAds();
    }, []);

    // -----------------------------
    // SORT JOBS (UNCHANGED LOGIC)
    // -----------------------------
    const sortedJobs = [...jobs].sort((a, b) => {
        switch (sortBy) {
            case "oldest":
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

            case "company":
                return a.company.localeCompare(b.company);

            case "newest":
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    // -----------------------------
    // LOADING STATE (OPTIONAL SIMPLE)
    // -----------------------------
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen text-black">
                <p className="text-xl flex items-center">
                    Loading
                    <span className="ml-2 flex space-x-1">
                    <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce"></span>
                    <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                </span>
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex justify-center items-start p-4 md:p-8 bg-black-200">
            <div className="w-full max-w-xl text-black">

                {/* Header */}
                <div className="flex items-center justify-between mb-2">

                    <button
                        onClick={onBack}
                        title="Back"
                        className="p-2 rounded-full hover:bg-white border border-transparent hover:border-neutral-200 transition z-10"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-8 h-8 text-neutral-700"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 19.5 8.25 12l7.5-7.5"
                            />
                        </svg>
                    </button>

                    <h1 className="text-xl font-semibold text-center flex-1 flex items-center justify-center gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 text-neutral-700"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20.25 7.5h-16.5A2.25 2.25 0 001.5 9.75v9A2.25 2.25 0 003.75 21h16.5A2.25 2.25 0 0022.5 18.75v-9A2.25 2.25 0 0020.25 7.5z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 7.5V6a3.75 3.75 0 017.5 0v1.5"
                            />
                        </svg>

                        Job Opportunities
                    </h1>

                    <div className="w-8" />
                </div>

                {/* Subtitle */}
                <p className="text-xs text-neutral-600 text-center mb-5">
                    Choose a job that matches your position and location
                </p>

                {/* SORT CARD */}
                <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden mb-4">

                    {/* HEADER */}
                    <button
                        onClick={() => setOpen(!open)}
                        className="w-full flex items-center justify-between pt-3 px-3"
                    >
                    <span className="font-medium text-sm text-neutral-700">
                        Sort by: <span className="font-semibold capitalize">{sortBy}</span>
                    </span>

                        <span
                            className={`text-neutral-500 transition-transform duration-300 ${
                                open ? "rotate-180" : ""
                            }`}
                        >
                        ▼
                    </span>
                    </button>

                    {/* DROPDOWN */}
                    <div
                        className={`px-3 pb-3 transition-all duration-300 overflow-hidden ${
                            open ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                        }`}
                    >
                        <div className="space-y-2 text-sm mt-1 text-neutral-600">

                            <button
                                onClick={() => {
                                    setSortBy("newest");
                                    setOpen(false);
                                }}
                                className="w-full text-left hover:text-black"
                            >
                                Newest
                            </button>

                            <button
                                onClick={() => {
                                    setSortBy("oldest");
                                    setOpen(false);
                                }}
                                className="w-full text-left hover:text-black"
                            >
                                Oldest
                            </button>

                            <button
                                onClick={() => {
                                    setSortBy("company");
                                    setOpen(false);
                                }}
                                className="w-full text-left hover:text-black"
                            >
                                Company (A–Z)
                            </button>

                        </div>
                    </div>
                </div>

                {/* EMPTY STATE */}
                {sortedJobs.length === 0 && (
                    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5 text-center">
                        <div className="text-sm font-semibold text-neutral-800">
                            NETA Technician Job Listings
                        </div>

                        <div className="text-xs text-neutral-600 mt-1">
                            New opportunities will appear here. Stay tuned.
                        </div>

                        <div className="text-[11px] text-neutral-500 mt-2">
                            Keep studying and aim for 80%+ on the quiz.
                        </div>
                    </div>
                )}

                {/* FEED */}
                {sortedJobs.length > 0 && (
                    <div className="space-y-3">

                        <AnimatePresence mode="popLayout">
                            {sortedJobs.map((job) => (
                                <motion.div
                                    key={job._id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <Link
                                        href={`/position/apply/${job._id}`}
                                        className="block"
                                    >
                                        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm hover:shadow-md transition p-4">

                                            {/* COMPANY */}
                                            <div className="font-semibold text-sm text-neutral-900 mb-1">
                                                Company: {job.company}
                                            </div>

                                            {/* TITLE */}
                                            <div className="text-base font-medium text-neutral-800 mb-2">
                                                Position: {job.title}
                                            </div>

                                            {/* META ROW */}
                                            <div className="flex flex-wrap gap-2 text-xs text-neutral-600 mb-3">

                                            <span className="flex items-center gap-1">
                                                📍 {job.location}
                                            </span>

                                                {(job.pay?.min != null || job.pay?.max != null) && (
                                                    <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                                                        {job.pay?.min != null && job.pay?.max != null && (
                                                            <>${job.pay.min}–${job.pay.max}/hr</>
                                                        )}

                                                        {job.pay?.min != null && job.pay?.max == null && (
                                                            <>${job.pay.min}+/hr</>
                                                        )}

                                                        {job.pay?.min == null && job.pay?.max != null && (
                                                            <>Up to ${job.pay.max}/hr</>
                                                        )}
                                                    </span>
                                                )}

                                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                                {job.relocation}
                                            </span>

                                            <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                                                {job.type}
                                            </span>

                                                {job.overtime && (
                                                    <span className="px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                                                    {job.overtime}
                                                </span>
                                                )}
                                            </div>

                                            {/* FOOTER DATE */}
                                            <div className="text-xs text-neutral-500">
                                                {formatLocalDate(job.createdAt)}
                                            </div>

                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
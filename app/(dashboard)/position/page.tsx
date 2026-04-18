"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useError } from "@/app/ErrorProvider";

type Job = {
    _id: string;
    company: string;
    location: string;
    title: string;
    pay: {
        min: number;
        max: number;
    };
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
    const sortedJobs = [...jobs].sort(
        (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
    );

    // -----------------------------
    // LOADING STATE (OPTIONAL SIMPLE)
    // -----------------------------
    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
                <p className="text-xl flex items-center">
                    Loading
                    <span className="ml-2 flex space-x-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                </span>
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex justify-center items-start p-4 md:p-8">
            <div className="w-full max-w-xl text-white">

                {/* Header */}
                <div className="flex items-center justify-between mb-2">

                    <button onClick={onBack} title="Back">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-8 h-8"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 19.5 8.25 12l7.5-7.5"
                            />
                        </svg>
                    </button>

                    <h1 className="text-2xl font-bold text-center flex-1">
                        💼 Job Opportunities
                    </h1>

                    <div className="w-8" />
                </div>

                {/* Subtitle */}
                <p className="text-xs text-white/60 text-center mb-6">
                    Choose a job that matches your position and location
                </p>

                {/* Jobs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sortedJobs.map((job) => (
                        <Link
                            key={job._id}
                            href={`/position/apply/${job._id}`}
                            className="block w-full rounded-lg transition
                                flex flex-col items-start justify-start gap-1 mb-4
                                active:bg-transparent focus:bg-transparent
                                [-webkit-tap-highlight-color:transparent]"
                        >

                            <div className="flex flex-col gap-2 text-xs text-white/80 p-2 rounded-xl border border-white/20">

                                {/* TOP ROW (tags) */}

                                <span className="font-semibold text-sm text-white">
                                    Company: {job.company}
                                </span>

                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span className="text-white/60">
                                        Location: 📍 {job.location}
                                    </span>
                                    <span className="text-white/80">
                                        Position: {job.title}
                                    </span>

                                    {job.pay && (
                                        <span className="text-[10px] rounded bg-green-500/20 text-green-300 leading-none">
                                            ${job.pay.min}–${job.pay.max}/hr
                                        </span>
                                    )}

                                    <span className="text-[10px] rounded bg-blue-500/20 text-blue-300 leading-none">
                                        {job.relocation}
                                    </span>

                                    <span className="text-[10px] rounded bg-white/10 text-yellow-600 leading-none">
                                        {job.type}
                                    </span>

                                    {job.overtime && (
                                        <span className="text-[10px] rounded bg-white/5 text-blue-300 leading-none">
                                            {job.overtime}
                                        </span>
                                    )}
                                </div>

                                {/* BOTTOM ROW (posted date) */}
                                <p className="text-xs text-white/50">
                                    Posted:{" "}
                                    {new Date(job.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>

                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
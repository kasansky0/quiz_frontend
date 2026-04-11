"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const jobs = [
    {
        id: 1,
        company: "ABM",
        location: "Charlotte, Raleigh NC area, New York, Miami FL",
        title: "NETA 3 Technician",
        pay: "$40–$55/hr",
        relocation: "Paid relocation",
        perDiem: "$120/day",
        overtime: "OT available",
        travel: "Nationwide",
        type: "Full-time / Travel",
        createdAt: "2026-02-10T14:30:00Z"
    },
    {
        id: 2,
        company: "CBS",
        location: "Raleigh NC",
        title: "NETA 2 Technician",
        pay: "$30–$45/hr",
        relocation: "No relocation",
        perDiem: "$100/day",
        overtime: "OT available",
        travel: "Regional",
        type: "Local / Full-time",
        createdAt: "2026-04-10T14:30:00Z"
    },
    {
        id: 3,
        company: "Schneider",
        location: "Dallas TX",
        title: "Substation Technician",
        pay: "$45–$60/hr",
        relocation: "Paid relocation",
        perDiem: "$150/day",
        overtime: "Guaranteed OT",
        travel: "Nationwide",
        type: "Travel / Field",
        createdAt: "2026-03-10T14:30:00Z"
    },
];

const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);

export default function AdsPage() {
    const router = useRouter();

    const onBack = () => {
        router.back();
    };

    return (
        <div className="min-h-screen p-4">

            {/* Header */}
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

                {/* spacer */}
                <div className="w-8" />
            </div>

            {/* Subtitle BELOW header */}
            <p className="text-xs text-white/60 text-center mb-6">
                Choose a job that matches your position and location
            </p>

            {/* Jobs */}
            <div className="grid grid-cols-1 gap-3 text-center">
                {sortedJobs.map((job) => (
                    <Link
                        key={job.id}
                        href={`/position/apply/${job.id}`}
                        className="block w-full rounded-lg transition
                            flex flex-col items-center justify-center gap-1 mb-4
                            active:bg-transparent focus:bg-transparent
                            [-webkit-tap-highlight-color:transparent]"
                    >
                        <div className="text-sm font-semibold">
                            Company: {job.company}
                        </div>

                        <div className="text-xs text-white/80">
                            Position: {job.title}
                        </div>

                        <div className="text-xs text-white/60">
                            Location: 📍 {job.location}
                        </div>

                        {/* 💰 MONEY */}
                        <div className="mt-2 flex flex-wrap gap-1 justify-center">
                            {job.pay && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-300">
                                    {job.pay}
                                  </span>
                            )}

                            {job.perDiem && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-200">
                                    Per Diem: {job.perDiem}
                                  </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                              {job.relocation}
                            </span>
                        </div>

                        {/* ⚙️ WORK */}
                        <div className="flex flex-wrap gap-1 justify-center">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                              {job.type}
                            </span>

                            {job.overtime && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/60">
                                  {job.overtime}
                                </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-200">
                              {job.travel}
                            </span>
                        </div>
                        <p className="text-xs text-white/50">
                            Posted: {new Date(job.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useError } from "@/app/ErrorProvider";
import Link from "next/link";
import { fetchEmployerAds } from "@/app/(dashboard)/hire/hire";
import PayAdButton from "@/components/ui/PayAdButton";
import HowItWorks from "@/app/(dashboard)/hire/HowItWords"
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "@/app/UserContext";
import { formatLocalDate } from "@/app/hooks/formatLocalDate";

/* =========================
   TYPES (UNCHANGED)
========================= */

type Application = {
    _id: string;
    name: string;
    email: string;
    location: string;
    experience: string;
    availability: string;
    position?: string;
    certifications?: string;
    travel?: string;
    overtime?: string;
    readyToMove?: string;

    stats?: Stats; // 👈 use ONE clean type
};

type Stats = {
    total: {
        seen: number;
        correct: number;
        wrong: number;
        accuracy: number;
    };
    topics: Record<string, {
        seen: number;
        correct: number;
        wrong: number;
    }>;
};

type Ad = {
    _id: string;
    title: string;
    location: string;
    status: "pending" | "approved" | "rejected" | "published";
    publishedAt?: string;
    applications?: Application[];
};

/* =========================
   COMPONENT
========================= */

export default function HirePage() {
    const { data: session, status } = useSession();
    const token = session?.idToken;
    const { showError } = useError();

    const [loading, setLoading] = useState(true);
    const [fade, setFade] = useState(false);

    const [ads, setAds] = useState<Ad[]>([]);

    const [openAdId, setOpenAdId] = useState<string | null>(null);

    const { isEmployer, userId } = useUser();
    const [blocked, setBlocked] = useState(false);

    const [openStatsMap, setOpenStatsMap] = useState<Record<string, boolean>>({});
    const toggleStats = (id: string) => {
        setOpenStatsMap((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const totalApplications = ads.reduce((total, ad) => {
        return total + (ad.applications?.length ?? 0);
    }, 0);

    /* =========================
       REDIRECT CHECK
    ========================= */

    useEffect(() => {
        if (userId === null || isEmployer === undefined) return;

        if (!isEmployer) {
            window.location.replace("/info");
        }
    }, [isEmployer, userId]);

    /* =========================
       FETCH ADS + STATS
    ========================= */

    useEffect(() => {
        const loadAds = async () => {
            if (!token) return;

            try {
                const res = await fetchEmployerAds(token);

                console.log("🔥 RAW RESPONSE:", res);
                console.log("📊 STATS:", res.data?.stats);

                if (res.error) {
                    showError?.(res.error, true);
                    setBlocked(true);

                    if (res.status === 403) {
                        window.location.replace("/info");
                        return;
                    }
                    return;
                }

                setAds([...(res.data?.ads || [])].reverse());

            } catch (err) {
                showError?.("Failed to load ads");
                setBlocked(true);
            } finally {
                setLoading(false);
            }
        };

        loadAds();
    }, [token, showError]);

    /* =========================
       FADE IN
    ========================= */

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => setFade(true), 50);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    /* =========================
       LOADING STATES
    ========================= */

    if (status === "loading") {
        return (
            <div className="flex-1 flex items-center justify-center pt-[56px] text-black">
                <p className="text-xl flex items-center">
                    Loading
                    <span className="ml-2 flex space-x-1">
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce" />
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.4s]" />
                    </span>
                </p>
            </div>
        );
    }

    const isReady =
        session &&
        isEmployer !== undefined &&
        userId !== null &&
        !loading;

    if (!isReady || blocked) {
        return (
            <div className="flex-1 flex items-center justify-center pt-[56px] text-black">
                <p className="text-xl flex items-center">
                    Loading
                    <span className="ml-2 flex space-x-1">
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce" />
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.4s]" />
                    </span>
                </p>
            </div>
        );
    }

    if (!isEmployer) return null;

    /* =========================
       UI
    ========================= */

    return (
        <div className="min-h-screen w-full flex justify-center items-start p-4 md:p-8 text-black">
            <div className={`w-full max-w-xl 2xl:max-w-2xl pb-16 transition-opacity duration-700 ease-in-out ${fade ? "opacity-100" : "opacity-0"}`}>

                {/* HEADER */}
                <h1 className="text-2xl font-bold mb-2 text-center">
                    Employer Dashboard
                </h1>

                <HowItWorks />

                {/* CREATE AD */}
                <div className="mb-6 flex justify-center">
                    <Link
                        href="/hire/hireForm"
                        className="
                            w-full max-w-xs
                            text-center
                            bg-[#0a66c2]
                            hover:bg-[#004182]
                            text-white
                            font-semibold
                            py-2.5
                            px-6
                            rounded-full
                            text-sm
                            shadow-sm
                            transition
                            active:scale-[0.98]
                        "
                    >
                        + Create New Job Ad
                    </Link>
                </div>

                {/* ADS LIST */}
                <div>
                    <h2 className="text-xl font-semibold mb-3">Your Ads</h2>

                    {ads.length === 0 ? (
                        <p className="text-black">No ads yet.</p>
                    ) : (
                        <div className="space-y-3">

                            {ads.map((ad) => {
                                const status = ad.status?.toLowerCase();
                                const apps = ad.applications ?? [];
                                const isOpen = openAdId === ad._id;

                                return (
                                    <div key={ad._id} className="bg-black-200 p-4 rounded-xl border border-black">

                                        <h3 className="font-bold">Position: {ad.title}</h3>
                                        <p className="text-black text-sm">Location 📍 {ad.location}</p>

                                        {/* STATUS */}
                                        <div className="flex flex-col gap-1 mb-2">

                                            <div className="flex items-center gap-2 flex-wrap">

                                                {status === "pending" && (
                                                    <span className="text-yellow-400 text-xs">
                                                        Pending Review • {ad.publishedAt && formatLocalDate(ad.publishedAt)}
                                                    </span>
                                                )}

                                                {status === "approved" && (
                                                    <span className="text-blue-400 text-xs">
                                                        Approved (Awaiting Payment) • {ad.publishedAt && formatLocalDate(ad.publishedAt)}
                                                    </span>
                                                )}

                                                {status === "rejected" && (
                                                    <span className="text-red-500 text-xs">
                                                        Rejected • {ad.publishedAt && formatLocalDate(ad.publishedAt)}
                                                    </span>
                                                )}

                                                {status === "published" && (
                                                    <span className="text-green-500 text-xs">
                                                        Published • {ad.publishedAt && formatLocalDate(ad.publishedAt)}
                                                    </span>
                                                )}

                                            </div>

                                        </div>

                                        {status === "approved" && <PayAdButton adId={ad._id} />}

                                        {/* APPLICATIONS */}
                                        <div className="mt-4 border-t border-black pt-3">

                                            <div
                                                onClick={() => setOpenAdId(isOpen ? null : ad._id)}
                                                className="flex justify-between cursor-pointer"
                                            >
                                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                                    Applications
                                                    <span
                                                        className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200
                                                            ${
                                                                apps.length === 0
                                                                    ? "bg-white/10 text-black border border-black/10"
                                                                    : apps.length < 5
                                                                        ? "bg-blue-500/80 text-black"
                                                                        : "bg-blue-600 text-black shadow-md shadow-blue-500/30"
                                                            }
                                                        `}
                                                    >
                                                        {apps.length}
                                                    </span>
                                                </h4>
                                                <span className="text-xs text-blue-400">
                                                    {isOpen ? "Hide" : "View"}
                                                </span>
                                            </div>

                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                    >
                                                        {apps.length > 0 ? (
                                                            <div className="space-y-3">

                                                                {apps.map((app, index) => (
                                                                    <div key={app._id}>

                                                                        <div className="text-xs space-y-1">

                                                                            <div className="text-black space-y-1">
                                                                                <p>
                                                                                    <span className="font-bold text-blue-400">Name:</span>{" "}
                                                                                    <span className="text-black">{app.name}</span>
                                                                                </p>

                                                                                <p>
                                                                                    <span className="font-bold text-blue-400">Email:</span>{" "}
                                                                                    <a
                                                                                        href={`mailto:${app.email}`}
                                                                                        className="text-blue-300 hover:text-blue-200 underline"
                                                                                    >
                                                                                        {app.email}
                                                                                    </a>
                                                                                </p>
                                                                            </div>

                                                                            <p><span className="font-bold text-blue-400">Current location:</span> <span className="text-black">📍 {app.location}</span></p>
                                                                            <p><span className="font-bold text-blue-400">Experience:</span> <span className="text-black">{app.experience}</span></p>
                                                                            <p><span className="font-bold text-blue-400">Availability:</span> <span className="text-black">{app.availability}</span></p>
                                                                            <p><span className="font-bold text-blue-400">Goal:</span> <span className="text-black">{app.position}</span></p>
                                                                            <p><span className="font-bold text-blue-400">Certifications:</span> <span className="text-black">{app.certifications}</span></p>
                                                                            <p><span className="font-bold text-blue-400">Travel:</span> <span className="text-black">{app.travel}</span></p>
                                                                            <p><span className="font-bold text-blue-400">Overtime:</span> <span className="text-black">{app.overtime}</span></p>
                                                                            <p><span className="font-bold text-blue-400">Ready to move:</span> <span className="text-black">{app.readyToMove}</span></p>

                                                                            {/* =========================
                                                                               🔥 ADDED: USER STATS (UNDER EVERYTHING)
                                                                            ========================= */}
                                                                            {/* STATS DROPDOWN */}
                                                                            <div className="mt-2 border-t border-gray-800 pt-2 text-[10px] text-black">

                                                                                {(() => {
                                                                                    // ✅ normalize once (safe fallback)
                                                                                    const stats = app.stats ?? {
                                                                                        total: { seen: 0, correct: 0, wrong: 0, accuracy: 0 },
                                                                                        topics: {},
                                                                                    };

                                                                                    return (
                                                                                        <>
                                                                                            {/* ================= ALWAYS VISIBLE OVERALL ================= */}
                                                                                            <div className="bg-black-200 p-2 rounded-md border border-gray-800 flex items-center justify-between">

                                                                                                {/* LEFT: summary */}
                                                                                                <div className="space-y-1">
                                                                                                    <div className="text-black font-semibold">
                                                                                                        Applicant Quiz Performance
                                                                                                    </div>

                                                                                                    <div>
                                                                                                        Seen {stats.total.seen} | ✔ {stats.total.correct} | ✖ {stats.total.wrong}
                                                                                                    </div>

                                                                                                    <div className="text-blue-300">
                                                                                                        Accuracy: {stats.total.accuracy.toFixed(1)}%
                                                                                                    </div>
                                                                                                </div>

                                                                                                {/* RIGHT: dropdown toggle */}
                                                                                                <button
                                                                                                    onClick={() => toggleStats(app._id)}
                                                                                                    className="text-[10px] text-blue-400 hover:text-blue-300"
                                                                                                >
                                                                                                    {openStatsMap[app._id] ? "Hide details" : "View topics"}
                                                                                                </button>

                                                                                            </div>

                                                                                            {/* ================= DROPDOWN: TOPICS ================= */}
                                                                                            {openStatsMap[app._id] && app.stats?.topics && Object.keys(app.stats.topics).length > 0 && (
                                                                                                <div className="mt-2 bg-black-200 p-2 rounded-md border border-gray-800">

                                                                                                    <div className="font-semibold text-black mb-1">
                                                                                                        Topic Breakdown
                                                                                                    </div>

                                                                                                    <div className="space-y-1">

                                                                                                        {Object.entries(app.stats.topics)
                                                                                                            // ✅ SORT BY HIGHEST "seen"
                                                                                                            .sort(([, a], [, b]) => b.seen - a.seen)
                                                                                                            .map(([topic, t]) => {

                                                                                                                const percent = t.seen
                                                                                                                    ? (t.correct / t.seen) * 100
                                                                                                                    : 0;

                                                                                                                return (
                                                                                                                    <div
                                                                                                                        key={topic}
                                                                                                                        className="flex items-center justify-between text-[10px]"
                                                                                                                    >
                                                                                                                        <div className="text-blue-300 w-28 truncate">
                                                                                                                            {topic}
                                                                                                                        </div>

                                                                                                                        <div className="flex gap-2 text-black">
                                                                                                                            <span>{t.seen}</span>
                                                                                                                            <span className="text-green-500">✔ {t.correct}</span>
                                                                                                                            <span className="text-red-400">✖ {t.wrong}</span>
                                                                                                                        </div>

                                                                                                                        <div className="text-green-500 w-12 text-right">
                                                                                                                            {percent.toFixed(1)}%
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                );
                                                                                                            })}

                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </>
                                                                                    );
                                                                                })()}
                                                                            </div>

                                                                        </div>

                                                                        {index !== apps.length - 1 && (
                                                                            <div className="border-t border-gray-800 my-3" />
                                                                        )}
                                                                    </div>
                                                                ))}

                                                            </div>
                                                        ) : (
                                                            <p className="text-black text-xs mt-2">
                                                                No applications yet
                                                            </p>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                        </div>
                                    </div>
                                );
                            })}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
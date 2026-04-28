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
    status: "pending" | "approved" | "rejected" | "published" | "archived";
    publishedAt?: string;
    applications?: Application[];
    company?: string;
};

/* =========================
   COMPONENT
========================= */

export default function HirePage() {
    const { data: session, status } = useSession();
    const token = session?.idToken;
    const { showError } = useError();

    const [openLegal, setOpenLegal] = useState<null | "terms" | "privacy">(null);

    const [loading, setLoading] = useState(true);
    const [fade, setFade] = useState(false);

    const [ads, setAds] = useState<Ad[]>([]);

    const [openAdId, setOpenAdId] = useState<string | null>(null);

    const { isEmployer, userId } = useUser();
    const [blocked, setBlocked] = useState(false);

    const FOOTER_POLICY = {
        terms: {
            title: "Terms of Service",
            content: [
                "This platform is designed for legitimate hiring and job-seeking purposes related to NETA Level 2 and related technical roles.",

                "Employers must be manually verified before being allowed to post job advertisements. We reserve the right to approve or reject employer access at our discretion.",

                "All job advertisements are subject to review and will remain in 'pending' status until approved by the platform.",

                "Only approved job ads may proceed to payment. Payment is required before a job advertisement becomes publicly visible on the platform.",

                "We reserve the right to reject, remove, or archive any job advertisement that is misleading, irrelevant, low quality, or violates platform standards.",

                "Applicants submit their information voluntarily when applying to job postings. Applications may be reviewed before being shared with employers to ensure quality and relevance.",

                "Once approved, applicant data such as name, email, and relevant profile information may be shared with the employer who posted the job ad.",

                "Employers agree to use applicant data solely for legitimate hiring purposes and not for marketing, spam, or unauthorized distribution.",

                "Users are responsible for ensuring that all information submitted to the platform is accurate and not misleading.",

                "We may suspend or permanently remove accounts that violate these Terms, abuse the platform, or attempt to bypass moderation systems.",

                "By using the platform, users acknowledge and agree to the full hiring workflow, including verification, moderation, approval, and payment-based publishing."
            ]
        },
        privacy: {
            title: "Privacy Policy",
            content: [
                "We collect basic account information such as name, email, and authentication data for account creation and login.",

                "Users may be verified as employers only after manual review to ensure they represent a legitimate company and not a recruitment agency.",

                "Job advertisements submitted by employers are first reviewed and marked as 'pending'. Only approved ads may proceed to payment and publishing.",

                "After approval, employers must complete payment before their job ad becomes publicly visible on the platform.",

                "Published job ads may include company name, job title, and job location, and are visible to all users on the platform.",

                "When a candidate applies to a job, their application is reviewed before being shared with the employer.",

                "Once approved, the employer receives the applicant’s name, email, and relevant application details to continue communication directly.",

                "We do not sell personal data or share it with third-party advertisers or external marketing platforms.",

                "Platform messaging and activity data may be used internally to improve learning tools, exam preparation features, and candidate evaluation quality.",

                "All data processing is designed to support recruitment, exam preparation, and legitimate hiring workflows only."
            ]
        }
    };

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
   FETCH ADS + SORT
   ACTIVE ADS FIRST (newest → oldest)
   ARCHIVED ALWAYS LAST
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

                const sortedAds = [...(res.data?.ads || [])].sort((a, b) => {
                    const aArchived = a.status?.toLowerCase() === "archived";
                    const bArchived = b.status?.toLowerCase() === "archived";

                    // ✅ Archived always at bottom
                    if (aArchived && !bArchived) return 1;
                    if (!aArchived && bArchived) return -1;

                    // ✅ Sort remaining by newest date first
                    const aDate = new Date(
                        a.publishedAt || (a as any).createdAt || 0
                    ).getTime();

                    const bDate = new Date(
                        b.publishedAt || (b as any).createdAt || 0
                    ).getTime();

                    return bDate - aDate;
                });

                setAds(sortedAds);

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
            <div className="absolute inset-0 flex items-center justify-center bg-black-200/80 backdrop-blur-sm z-50 pointer-events-auto">
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

    const isReady =
        session &&
        isEmployer !== undefined &&
        userId !== null &&
        !loading;

    if (!isReady || blocked) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center text-black">
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
                            mx-auto block
                        "
                    >
                        + Create New Job Ad
                    </Link>
                </div>

                <p className="text-[10px] text-neutral-400 text-center mt-2">
                    By posting a job ad, you agree to our{" "}
                    <button
                        onClick={() => setOpenLegal("terms")}
                        className="underline hover:text-black"
                    >
                        Terms
                    </button>{" "}
                    and{" "}
                    <button
                        onClick={() => setOpenLegal("privacy")}
                        className="underline hover:text-black"
                    >
                        Privacy Policy
                    </button>.
                </p>

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
                                    <div key={ad._id} className="bg-white p-4 rounded-xl border border-black/10">

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

                                                {status === "archived" && (
                                                    <span className="text-red-500 text-xs">
                                                        Archived • {ad.publishedAt && formatLocalDate(ad.publishedAt)}
                                                    </span>
                                                )}

                                            </div>

                                        </div>

                                        {status === "approved" && <PayAdButton adId={ad._id} />}

                                        {/* APPLICATIONS */}
                                        <div className="mt-3 border-t border-black/10 pt-3">

                                            <div
                                                onClick={() => {
                                                    if (isOpen) {
                                                        setOpenAdId(null);
                                                        setOpenStatsMap({}); // reset all "View topics"
                                                    } else {
                                                        setOpenAdId(ad._id);
                                                    }
                                                }}
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
                                                                    <div
                                                                        key={app._id}
                                                                        className="bg-white border border-neutral-200 rounded-xl p-4 mt-3 shadow-sm"
                                                                    >

                                                                        <div className="text-xs space-y-1">

                                                                            <div className="text-black space-y-1">
                                                                                <p>
                                                                                    <span className="font-bold text-blue-400">Name:</span>{" "}
                                                                                    <span className="text-black">{app.name}</span>
                                                                                </p>

                                                                                <p>
                                                                                    <span className="font-bold text-blue-400">Email:</span>{" "}
                                                                                    <a
                                                                                        href={`mailto:${app.email}?subject=${encodeURIComponent(
                                                                                            `${ad.company} Job Application`
                                                                                        )}&body=${encodeURIComponent(
                                                                                            `Hello,

Thank you for your interest in the position at ${ad.company}.

We would like to move forward with your application. Please reply to this email with your updated resume.

We look forward to reviewing your application.

Best regards,
${ad.company} Hiring Team`
                                                                                        )}`}
                                                                                        className="text-blue-400 underline"
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
                                                                            <div className="mt-2 border-t border-black/10 pt-2 text-[10px] text-black">

                                                                                {(() => {
                                                                                    // ✅ normalize once (safe fallback)
                                                                                    const stats = app.stats ?? {
                                                                                        total: { seen: 0, correct: 0, wrong: 0, accuracy: 0 },
                                                                                        topics: {},
                                                                                    };

                                                                                    return (
                                                                                        <>
                                                                                            {/* ================= ALWAYS VISIBLE OVERALL ================= */}
                                                                                            <div className="flex items-center justify-between">

                                                                                                {/* LEFT: summary */}
                                                                                                <div className="space-y-1">
                                                                                                    <div className="text-black font-semibold">
                                                                                                        Applicant Quiz Performance
                                                                                                    </div>

                                                                                                    <div>
                                                                                                        Seen {stats.total.seen} | ✔ {stats.total.correct} | ✖ {stats.total.wrong}
                                                                                                    </div>

                                                                                                    <div className="text-blue-400">
                                                                                                        Accuracy: {stats.total.accuracy.toFixed(1)}%
                                                                                                    </div>
                                                                                                </div>

                                                                                                {/* RIGHT: dropdown toggle */}
                                                                                                <button
                                                                                                    onClick={() => toggleStats(app._id)}
                                                                                                    className="text-[10px] text-blue-400 hover:text-blue-400"
                                                                                                >
                                                                                                    {openStatsMap[app._id] ? "Hide details" : "View topics"}
                                                                                                </button>

                                                                                            </div>

                                                                                            {/* ================= DROPDOWN: TOPICS ================= */}
                                                                                            <AnimatePresence initial={false}>
                                                                                                {openStatsMap[app._id] &&
                                                                                                    app.stats?.topics &&
                                                                                                    Object.keys(app.stats.topics).length > 0 && (
                                                                                                        <motion.div
                                                                                                            initial={{ opacity: 0, height: 0 }}
                                                                                                            animate={{ opacity: 1, height: "auto" }}
                                                                                                            exit={{ opacity: 0, height: 0 }}
                                                                                                            transition={{ duration: 0.25, ease: "easeInOut" }}
                                                                                                            className="mt-2 overflow-hidden"
                                                                                                        >

                                                                                                            {/* Divider */}
                                                                                                            <div className="border-t border-black/10 mb-2" />

                                                                                                            <div className="font-semibold text-black mb-1">
                                                                                                                Topic Breakdown
                                                                                                            </div>

                                                                                                            <div className="space-y-1">
                                                                                                                {Object.entries(app.stats.topics)
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
                                                                                                                                <div className="text-blue-400 w-28 truncate">
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
                                                                                                        </motion.div>
                                                                                                    )}
                                                                                            </AnimatePresence>
                                                                                        </>
                                                                                    );
                                                                                })()}
                                                                            </div>

                                                                        </div>

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

            {openLegal && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => setOpenLegal(null)}
                >
                    <div
                        className="bg-white max-w-xl w-full rounded-2xl p-6 relative max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* CLOSE */}
                        <button
                            onClick={() => setOpenLegal(null)}
                            className="absolute top-3 right-3 text-neutral-500 hover:text-black"
                        >
                            ✕
                        </button>

                        {/* TITLE */}
                        <h1 className="text-xl font-semibold mb-4">
                            {openLegal === "terms"
                                ? FOOTER_POLICY.terms.title
                                : FOOTER_POLICY.privacy.title}
                        </h1>

                        {/* CONTENT */}
                        <div className="space-y-3 text-sm text-neutral-700 leading-relaxed">
                            {(openLegal === "terms"
                                    ? FOOTER_POLICY.terms.content
                                    : FOOTER_POLICY.privacy.content
                            ).map((item, i) => (
                                <p key={i}>• {item}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
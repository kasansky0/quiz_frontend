"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useError } from "@/app/ErrorProvider";
import Link from "next/link";
import { fetchEmployerAds } from "@/app/(dashboard)/hire/hire"; // 👈 adjust path if needed
import PayAdButton from "@/components/ui/PayAdButton";
import HowItWorks from "@/app/(dashboard)/hire/HowItWords"
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "@/app/UserContext";

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
};

type Ad = {
    _id: string;
    title: string;
    location: string;
    status: "pending" | "approved" | "rejected" | "published";
    publishedAt?: string;
    applications?: Application[];
};

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

    const totalApplications = ads.reduce((total, ad) => {
        return total + (ad.applications?.length ?? 0);
    }, 0);

    useEffect(() => {
        // wait until context is initialized (important)
        if (userId === null || isEmployer === undefined) return;

        if (!isEmployer) {
            window.location.replace("/info");
        }
    }, [isEmployer, userId]);

    // -----------------------------
    // LOAD ADS ONLY (NO DIRECT FETCH)
    // -----------------------------
    useEffect(() => {
        const loadAds = async () => {
            if (!token) return;

            try {
                const res = await fetchEmployerAds(token);

                if (res.error) {
                    showError?.(res.error, true);

                    setBlocked(true);   // 🚨 force loading screen

                    if (res.status === 403) {
                        window.location.replace("/info");
                        return;
                    }

                    return;
                }

                setAds(res.data?.data || []);
            } catch (err) {
                showError?.("Failed to load ads");

                setBlocked(true);
            } finally {
                setLoading(false);
            }
        };

        loadAds();
    }, [token, showError]);

    // -----------------------------
    // FADE IN
    // -----------------------------
    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => setFade(true), 50);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    if (status === "loading") {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white pointer-events-none">
                <p className="text-xl flex items-center">
                    Loading
                    <span className="ml-2 flex space-x-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce" />
                        <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.4s]" />
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white pointer-events-none">
                <p className="text-xl flex items-center">
                    Loading
                    <span className="ml-2 flex space-x-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce" />
                        <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.4s]" />
                    </span>
                </p>
            </div>
        );
    }

    if (!isEmployer) {
        return null;
    }

    return (
        <div className="min-h-screen w-full flex justify-center items-start p-4 md:p-8 text-white">
            <div
                className={`w-full max-w-xl 2xl:max-w-2xl pb-16 transition-opacity duration-700 ease-in-out ${
                    fade ? "opacity-100" : "opacity-0"
                }`}
            >
                {/* ---------------- HEADER ---------------- */}
                <h1 className="text-2xl font-bold mb-2 text-center">
                    Employer Dashboard
                </h1>

                <HowItWorks />

                {/* ---------------- CREATE AD BUTTON ---------------- */}
                <div className="mb-6 flex justify-center">
                    <Link
                        href="/hire/hireForm"
                        className="
                        w-full max-w-xs text-center
                        bg-blue-400 hover:bg-blue-600
                        text-white font-semibold
                        py-3 px-6
                        rounded-xl
                        transition
                        active:scale-[0.98]
                    "
                    >
                        + Create New Job Ad
                    </Link>
                </div>

                {/* ---------------- ADS LIST ---------------- */}
                <div>
                    <h2 className="text-xl font-semibold mb-3">Your Ads</h2>

                    {ads.length === 0 ? (
                        <p className="text-white/60">No ads yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {ads.map((ad) => {
                                const status = ad.status?.toLowerCase();
                                const apps = ad.applications ?? [];
                                const isOpen = openAdId === ad._id;

                                return (
                                    <div
                                        key={ad._id}
                                        className="bg-black/40 p-4 rounded-xl border border-gray-700"
                                    >
                                        <h3 className="font-bold">{ad.title}</h3>
                                        <p className="text-white/70 text-sm">
                                            {ad.location}
                                        </p>

                                        {/* STATUS BADGE */}
                                        <div className="flex items-center gap-2 mb-2">
                                            {status === "pending" && (
                                                <span className="text-xs text-yellow-400">
                                    Pending Review
                                </span>
                                            )}

                                            {status === "approved" && (
                                                <span className="text-xs text-blue-400">
                                    Approved (Awaiting Payment)
                                </span>
                                            )}

                                            {status === "rejected" && (
                                                <span className="text-xs text-red-500">
                                    Rejected
                                </span>
                                            )}

                                            {status === "published" && (
                                                <span className="text-xs text-green-400">
                                    Published
                                </span>
                                            )}
                                        </div>

                                        {/* PUBLISHED DATE */}
                                        {ad.publishedAt && status === "published" && (
                                            <p className="text-xs text-gray-400 mb-2">
                                                Published on:{" "}
                                                {new Date(ad.publishedAt).toLocaleDateString()}
                                            </p>
                                        )}

                                        {/* PAY BUTTON ONLY FOR APPROVED */}
                                        {status === "approved" && (
                                            <PayAdButton adId={ad._id} />
                                        )}

                                        {/* ---------------- APPLICATIONS DROPDOWN ---------------- */}
                                        <div className="mt-4 border-t border-gray-700 pt-3">

                                            {/* HEADER (CLICK TO TOGGLE) */}
                                            <div
                                                onClick={() =>
                                                    setOpenAdId(isOpen ? null : ad._id)
                                                }
                                                className="flex justify-between items-center cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-semibold text-white">
                                                        Applications
                                                    </h4>

                                                    <span className="
                                                    bg-green-400/20 text-green-300
                                                    text-xs font-semibold
                                                    px-2.5 py-0.5
                                                    rounded-full
                                                  ">
                                                    {apps.length}
                                                  </span>
                                                </div>

                                                <span className="text-xs text-blue-400">
                                                    {isOpen ? "Hide" : "View"}
                                                </span>
                                            </div>

                                            {/* DROPDOWN CONTENT */}
                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                                        className="overflow-hidden mt-3"
                                                    >
                                                        {apps.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {apps.map((app, index) => (
                                                                    <div key={app._id}>
                                                                        <div className="text-xs space-y-1">

                                                                            <div className="text-white space-y-1">
                                                                                <p>
                                                                                    <span className="font-bold text-blue-400">Name:</span>{" "}
                                                                                    <span className="text-white/80">{app.name}</span>
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

                                                                            <p>
                                                                                <span className="font-bold text-blue-400">Current location:</span>{" "}
                                                                                <span className="text-white/60">📍 {app.location}</span>
                                                                            </p>

                                                                            <p>
                                                                                <span className="font-bold text-blue-400">Experience:</span>{" "}
                                                                                <span className="text-white/60">{app.experience}</span>
                                                                            </p>

                                                                            <p>
                                                                                <span className="font-bold text-blue-400">Availability:</span>{" "}
                                                                                <span className="text-white/60">{app.availability}</span>
                                                                            </p>

                                                                            <p>
                                                                                <span className="font-bold text-blue-400">Position:</span>{" "}
                                                                                <span className="text-white/60">{app.position}</span>
                                                                            </p>

                                                                            <p>
                                                                                <span className="font-bold text-blue-400">Certifications:</span>{" "}
                                                                                <span className="text-white/60">{app.certifications}</span>
                                                                            </p>

                                                                            <p>
                                                                                <span className="font-bold text-blue-400">Travel:</span>{" "}
                                                                                <span className="text-white/60">{app.travel}</span>
                                                                            </p>

                                                                            <p>
                                                                                <span className="font-bold text-blue-400">Overtime:</span>{" "}
                                                                                <span className="text-white/60">{app.overtime}</span>
                                                                            </p>

                                                                            <p>
                                                                                <span className="font-bold text-blue-400">Ready to move:</span>{" "}
                                                                                <span className="text-white/60">{app.readyToMove}</span>
                                                                            </p>
                                                                        </div>

                                                                        {/* DIVIDER */}
                                                                        {index !== apps.length - 1 && (
                                                                            <div className="border-t border-gray-800 my-3" />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-white/50 text-xs mt-2">
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
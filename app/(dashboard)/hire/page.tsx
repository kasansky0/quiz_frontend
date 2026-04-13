"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useError } from "@/app/ErrorProvider";
import Link from "next/link";
import { fetchEmployerAds } from "@/app/(dashboard)/hire/hire"; // 👈 adjust path if needed

type Ad = {
    _id: string;
    title: string;
    location: string;
    status: "pending" | "approved" | "rejected";
};

export default function HirePage() {
    const { data: session } = useSession();
    const token = session?.idToken;

    const { showError } = useError();

    const [loading, setLoading] = useState(true);
    const [fade, setFade] = useState(false);

    const [ads, setAds] = useState<Ad[]>([]);

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
                    return;
                }

                setAds(res.data?.data || []);
            } catch (err) {
                showError?.("Failed to load ads", true);
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

    // -----------------------------
    // LOADING SCREEN
    // -----------------------------
    if (!token || loading) {
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

    return (
        <div className="min-h-screen w-full flex justify-center items-start p-4 md:p-8 text-white">
            <div
                className={`w-full max-w-xl 2xl:max-w-2xl pb-16 transition-opacity duration-700 ease-in-out ${
                    fade ? "opacity-100" : "opacity-0"
                }`}
            >
                {/* ---------------- HEADER ---------------- */}
                <h1 className="text-2xl font-bold mb-6 text-center">
                    Hire Dashboard
                </h1>

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
                            {ads.map((ad) => (
                                <div
                                    key={ad._id}
                                    className="bg-black/40 p-4 rounded-xl border border-gray-700"
                                >
                                    <h3 className="font-bold">{ad.title}</h3>
                                    <p className="text-white/70 text-sm">
                                        {ad.location}
                                    </p>
                                    <span className="text-xs text-gray-400">
                                        Status: {ad.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
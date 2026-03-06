"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import LoggedInAdmin from "./LoggedInAdmin";
import { useRouter } from "next/navigation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Info & Formulas Component
const InfoAndFormulas = () => {
    const router = useRouter(); // initialize router for back button

    return (
        <div className="text-black min-h-screen flex flex-col justify-start items-center p-5">
            <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold text-white-400 mb-6 text-left">
                Community Guidelines & Messaging Policy
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-8 mx-auto leading-relaxed">
                NetaPrep is committed to maintaining a professional, respectful, and focused learning environment.
                All posts and comments are subject to automated moderation and content validation.
                By participating in discussions, you agree to follow the guidelines outlined below.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-white-400 mb-4 text-left max-w-md sm:max-w-2xl md:max-w-3xl mx-auto">
                What Is Allowed
            </h2>

            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-8 mx-auto leading-relaxed">
                <li>Professional and respectful discussion related to NETA topics</li>
                <li>Constructive questions about practice problems and explanations</li>
                <li>Sharing study strategies and exam preparation advice</li>
                <li>Polite disagreement supported by technical reasoning</li>
                <li>Clear and concise communication</li>
            </ul>

            <h2 className="text-xl sm:text-2xl font-bold text-white-400 mb-4 text-left max-w-md sm:max-w-2xl md:max-w-3xl mx-auto">
                What Is Not Allowed
            </h2>

            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-8 mx-auto leading-relaxed">
                <li>Profanity, harassment, or offensive language</li>
                <li>Personal attacks, insults, or discriminatory remarks</li>
                <li>Spam, advertisements, or promotional links</li>
                <li>Posting malicious or suspicious URLs</li>
                <li>Sexual, explicit, or inappropriate content</li>
                <li>Excessive repeated characters or flooding comments</li>
                <li>Attempts to bypass word filters or moderation systems</li>
            </ul>

            <h2 className="text-xl sm:text-2xl font-bold text-white-400 mb-4 text-left max-w-md sm:max-w-2xl md:max-w-3xl mx-auto">
                Automated Moderation & Enforcement
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-6 mx-auto leading-relaxed">
                All content is automatically scanned for prohibited language, spam patterns,
                malicious links, excessive formatting, and abusive behavior.
                Comments that violate policy may be:
            </p>

            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-8 mx-auto leading-relaxed">
                <li>Rejected before posting</li>
                <li>Automatically removed</li>
                <li>Subject to temporary posting restrictions</li>
            </ul>

            <p className="text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mx-auto leading-relaxed">
                Repeated violations may result in temporary or permanent account restrictions.
                Flooding comments within a short time window will trigger automatic blocking.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-white-400 mb-4 text-left max-w-md sm:max-w-2xl md:max-w-3xl mx-auto">
                Writing Recommendations
            </h2>

            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-8 mx-auto leading-relaxed">
                <li>Keep messages under 500 characters</li>
                <li>Avoid excessive capitalization or punctuation</li>
                <li>Limit formatting to simple emphasis (bold/italic)</li>
                <li>Stay focused on technical and exam-related topics</li>
                <li>Be respectful — assume good intent from others</li>
            </ul>

            <p className="text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mx-auto leading-relaxed">
                Our goal is to provide a distraction-free, professional learning environment.
                Thank you for helping keep NetaPrep focused, respectful, and high-quality.
            </p>
        </div>


    );
};

export default function AdminPage() {
    const { data: session, status } = useSession();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [loadingAdmin, setLoadingAdmin] = useState<boolean>(false);
    const [minLoading, setMinLoading] = useState<boolean>(true);

    // Fetch admin status
    const fetchAdminStatus = useCallback(async () => {
        if (!session) return;

        setLoadingAdmin(true);

        try {
            const res = await fetch(`${apiUrl}/admin/check`, {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });
            setIsAdmin(res.status === 200);
        } catch (err) {
            console.error("Failed to check admin status:", err);
            setIsAdmin(false);
        } finally {
            setLoadingAdmin(false);
        }
    }, [session]);

    useEffect(() => {
        if (session) fetchAdminStatus();
        else setIsAdmin(false);

        // Minimum loading timer (3 seconds)
        const timer = setTimeout(() => setMinLoading(false), 800);
        return () => clearTimeout(timer);
    }, [session, fetchAdminStatus]);

    // Show loading if session is still loading OR admin check is ongoing OR min loading not finished
    if (status === "loading" || loadingAdmin || minLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white bg-black">
                <p className="text-xl">Loading...</p>
            </div>
        );
    }

    // Admin → dashboard
    if (isAdmin) return <LoggedInAdmin />;

    // Everyone else → info + formulas
    return <InfoAndFormulas />;
}

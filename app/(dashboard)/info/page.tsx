"use client";

import { useSession } from "next-auth/react";
import Link from "next/link"

// Info & Formulas Component
const InfoAndFormulas = () => {
    return (
        <div className="text-black min-h-screen flex flex-col justify-start items-center p-5">
            {/* Future Ads / Message */}
            <Link href={"/apply"}>
                <div className="w-full text-center text-sm py-2">
                    Promoted: CBS Electrical Contractors <br/> Hiring NETA 2 Techs 📍Raleigh NC <br/> Click to apply
                </div>
            </Link>

            <br/>

            {/* Authentication Notice */}
            <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold text-white-400 mb-6 text-left">
                🔐 Authentication
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-8 leading-relaxed mx-auto">
                This platform uses Google authentication tokens. Tokens expire automatically after approximately <strong>1 hour</strong>.
                When a token expires, your session will end and you will need to log in again.
            </p>

            {/* Page Title & Introduction */}
            <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold text-white-400 mb-6 text-left">
                💬 Messaging
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-8 mx-auto leading-relaxed">
                NetaPrep is committed to maintaining a professional, respectful, and focused learning environment.
                All posts and comments are subject to automated moderation and content validation.
                By participating in discussions, you agree to follow the guidelines outlined below.
            </p>

            {/* 1. Community Guidelines */}
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white-400 mb-4 text-left max-w-md sm:max-w-2xl md:max-w-3xl mx-auto">
                👍 Allowed
            </h2>
            <div className="max-w-md sm:max-w-2xl md:max-w-3xl mx-auto">
                <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base md:text-lg text-white/80 leading-relaxed">
                    <li>Professional and respectful discussion related to NETA topics</li>
                    <li>Constructive questions about practice problems and explanations</li>
                    <li>Sharing study strategies and exam preparation advice</li>
                    <li>Polite disagreement supported by technical reasoning</li>
                    <li>Clear and concise communication</li>
                </ul>
            </div>
            <br/>

            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white-400 mb-4 text-left max-w-md sm:max-w-2xl md:max-w-3xl mx-auto">
                🚫 Not Allowed
            </h2>
            <div className="max-w-md sm:max-w-2xl md:max-w-3xl mx-auto">
                <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base md:text-lg text-white/80 leading-relaxed">
                    <li>Profanity, harassment, or offensive language</li>
                    <li>Personal attacks, insults, or discriminatory remarks</li>
                    <li>Spam, advertisements, or promotional links</li>
                    <li>Posting malicious or suspicious URLs</li>
                    <li>Sexual, explicit, or inappropriate content</li>
                    <li>Excessive repeated characters or flooding comments</li>
                    <li>Attempts to bypass word filters or moderation systems</li>
                </ul>
            </div>
            <br/>

            {/* 2. Automated Moderation & Enforcement */}
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white-400 mb-4 text-left max-w-md sm:max-w-2xl md:max-w-3xl mx-auto">
                ⚖ Automated Moderation
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-6 mx-auto leading-relaxed">
                All content is automatically scanned for prohibited language, spam patterns,
                malicious links, excessive formatting, and abusive behavior.
                Comments that violate policy may be:
            </p>
            <div className="max-w-md sm:max-w-2xl md:max-w-3xl mx-auto">
                <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base md:text-lg text-white/80 leading-relaxed">
                    <li>Rejected before posting</li>
                    <li>Automatically removed</li>
                    <li>Subject to temporary posting restrictions</li>
                </ul>
            </div>
            <br/>
            <p className="text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mx-auto mb-8 leading-relaxed">
                Repeated violations may result in temporary or permanent account restrictions.
                Flooding comments within a short time window will trigger automatic blocking.
            </p>

            {/* 3. Writing Recommendations */}
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white-400 mb-4 text-left max-w-md sm:max-w-2xl md:max-w-3xl mx-auto">
                📝 Writing Recommendations
            </h2>
            <div className="max-w-md sm:max-w-2xl md:max-w-3xl mx-auto">
                <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base md:text-lg text-white/80 leading-relaxed">
                    <li>Keep messages under 500 characters</li>
                    <li>Avoid excessive capitalization or punctuation</li>
                    <li>Stay focused on exam-related topics</li>
                    <li>Be respectful, assume good intent from others</li>
                </ul>
            </div>
            <br/>
            <p className="text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mx-auto mb-8 leading-relaxed">
                Our goal is to provide a distraction-free, professional learning environment.
                Thank you for helping keep NetaPrep focused, respectful, and high-quality.
            </p>

            {/* 4. Quiz Progress & Performance */}
            <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold text-white-400 mb-6 text-left">
                📊 Quiz Progress
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-4 mx-auto leading-relaxed">
                Your quiz progress is tracked using a progress bar that reflects your performance.
                The percentage is calculated as:
            </p>
            <p className="text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-4 mx-auto leading-relaxed font-semibold">
                <strong>Correct Questions Answered ÷ Total Questions Answered × 100%</strong>
            </p>
            <p className="text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-4 mx-auto leading-relaxed">
                For example, if you have answered 15 questions and 12 are correct, your progress percentage would be 80%.
                This gives you a real-time view of your understanding and helps track your study progress.
            </p>

            <br/>

            {/* 5. Contact Info Section */}
            <p className="text-sm sm:text-base md:text-lg text-white/80 text-left max-w-md sm:max-w-2xl md:max-w-3xl mb-6 mx-auto leading-relaxed font-semibold">
                <strong>
                    Contact:{" "}
                    <a
                        href="mailto:info@netaprep.com"
                        className="underline hover:text-white transition-colors"
                    >
                        info@netaprep.com
                    </a>
                </strong>
            </p>
        </div>
    );
};

export default function InfoPage() {
    const { data: session, status } = useSession();

    // Optional: you can show a loading spinner if session is still loading
    if (status === "loading") return <p>Loading...</p>;

    return <InfoAndFormulas />;
}
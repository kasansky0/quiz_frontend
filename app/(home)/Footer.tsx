"use client";

import { useState } from "react";

const POLICY_CONTENT = [
    {
        title: "Overview",
        text: "This platform provides NETA Level 2 exam preparation, practice questions, and job opportunities through hiring partners. We are committed to protecting your privacy and handling your data responsibly."
    },
    {
        title: "Information We Collect",
        text: "We collect basic account information such as your name, email address, and authentication data provided by Google OAuth when you sign in."
    },
    {
        title: "Community Messaging and Learning Use",
        text: "The platform includes a community messaging feature where users communicate using display nicknames. Messages are visible to other users and may be used to support learning-related discussions, including exam preparation strategies, technical concepts, and NETA Level 2 study guidance. Messages are not linked to personal identity such as email addresses and are used to improve the learning experience within the community environment."
    },
    {
        title: "Learning and Progress Data",
        text: "We track learning activity such as questions viewed, correct and incorrect answers, and overall progress to improve your exam preparation experience and provide personalized recommendations."
    },
    {
        title: "Job Applications and Data Sharing",
        text: "When you submit a job application through the platform, we may share relevant information with hiring partners. This may include your name, email address, and learning progress such as completion status and accuracy rates to help employers assess candidate readiness."
    },
    {
        title: "Data Protection",
        text: "Your data is not shared with employers unless you actively submit a job application. If you do not apply, no personal or learning data is shared."
    },
    {
        title: "Security and Fraud Prevention",
        text: "All authentication and API communication is secured. If you receive job-related communication without submitting an application, please treat it as suspicious and report it."
    },
    {
        title: "Reporting Issues",
        content: (
            <>
                If you suspect fraudulent activity or unauthorized communication, please report it to{" "}
                <a
                    href="mailto:info@netaprep.com"
                    className="text-blue-600 hover:underline"
                >
                    info@netaprep.com
                </a>
            </>
        )
    }
];




const TERMS_CONTENT = [
    {
        title: "Overview",
        text: "These Terms govern your use of the NETA Prep platform, including exam practice tools and job application features."
    },
    {
        title: "Use of Platform",
        text: "You agree to use this platform for lawful purposes only and not to misuse exam content, data, or hiring features."
    },
    {
        title: "Account Responsibility",
        text: "You are responsible for maintaining the security of your account and ensuring that all information provided is accurate."
    },
    {
        title: "Job Applications",
        text: "By submitting a job application, you authorize the platform to share relevant information with hiring partners for recruitment purposes."
    },
    {
        title: "Prohibited Activity",
        text: "You may not attempt to manipulate quiz results, access unauthorized data, or misuse employer communication channels."
    },
    {
        title: "Termination",
        text: "We reserve the right to suspend accounts that violate these terms or engage in fraudulent activity."
    },
    {
        title: "Contact",
        content: (
            <>
                For questions about these Terms, contact{" "}
                <a
                    href="mailto:info@netaprep.com"
                    className="text-blue-600 hover:underline"
                >
                    info@netaprep.com
                </a>
            </>
        )
    }
];






export default function Footer() {
    const [openPolicy, setOpenPolicy] = useState(false);
    const [openTerms, setOpenTerms] = useState(false);
    const [openCookies, setOpenCookies] = useState(false);
    const [openSupport, setOpenSupport] = useState(false);

    return (
        <>
            <footer className="w-full border-t border-neutral-200 bg-white py-4 flex flex-col items-center gap-2">

                {/* LINKS */}
                <div className="flex items-center gap-4 text-xs text-neutral-500">

                    <button onClick={() => setOpenPolicy(true)} className="hover:underline">
                        Privacy
                    </button>

                    <span>•</span>

                    <button onClick={() => setOpenTerms(true)} className="hover:underline">
                        Terms
                    </button>

                    <span>•</span>

                    <button onClick={() => setOpenCookies(true)} className="hover:underline">
                        Cookies
                    </button>

                    <span>•</span>

                    <button onClick={() => setOpenSupport(true)} className="hover:underline">
                        Support
                    </button>

                </div>

                <p className="text-xs text-neutral-500">
                    © {new Date().getFullYear()} NetaPrep · All rights reserved
                </p>
            </footer>

            {/* MODAL */}
            {openPolicy && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => setOpenPolicy(false)}
                >
                    <div
                        className="bg-white max-w-2xl w-full rounded-2xl p-6 relative max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* CLOSE */}
                        <button
                            onClick={() => setOpenPolicy(false)}
                            className="absolute top-3 right-3 text-neutral-500 hover:text-black"
                        >
                            ✕
                        </button>

                        {/* HEADER */}
                        <h1 className="text-xl font-semibold mb-1">
                            Privacy Policy
                        </h1>

                        {/* CONTENT */}
                        <div className="space-y-5 text-sm text-neutral-700 leading-relaxed">
                            {POLICY_CONTENT.map((section, i) => (
                                <div key={i}>
                                    <h2 className="font-semibold text-black">
                                        {section.title}
                                    </h2>
                                    <div className="mt-1">
                                        {section.content ?? section.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            )}





            {openTerms && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => setOpenTerms(false)}
                >
                    <div
                        className="bg-white max-w-2xl w-full rounded-2xl p-6 relative max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <button
                            onClick={() => setOpenTerms(false)}
                            className="absolute top-3 right-3 text-neutral-500 hover:text-black"
                        >
                            ✕
                        </button>

                        <h1 className="text-xl font-semibold mb-1">
                            Terms of Service
                        </h1>

                        <div className="space-y-5 text-sm text-neutral-700 leading-relaxed">
                            {TERMS_CONTENT.map((section, i) => (
                                <div key={i}>
                                    <h2 className="font-semibold text-black">
                                        {section.title}
                                    </h2>
                                    <div className="mt-1">
                                        {section.content ?? section.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            )}





            {openCookies && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => setOpenCookies(false)}
                >
                    <div
                        className="bg-white max-w-xl w-full rounded-2xl p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <button
                            onClick={() => setOpenCookies(false)}
                            className="absolute top-3 right-3 text-neutral-500 hover:text-black"
                        >
                            ✕
                        </button>

                        <h1 className="text-xl font-semibold mb-1">
                            Cookies Policy
                        </h1>

                        <div className="space-y-4 text-sm text-neutral-700 leading-relaxed">

                            <p>
                                We use essential cookies required for authentication and session management.
                                These cookies allow you to stay logged in and securely use the platform.
                            </p>

                            <p>
                                We do not use cookies for advertising or third-party tracking.
                            </p>

                            <p>
                                By using this platform, you agree to the use of these essential cookies.
                            </p>

                        </div>

                    </div>
                </div>
            )}







            {openSupport && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => setOpenSupport(false)}
                >
                    <div
                        className="bg-white max-w-xl w-full rounded-2xl p-6 relative"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* CLOSE */}
                        <button
                            onClick={() => setOpenSupport(false)}
                            className="absolute top-3 right-3 text-neutral-500 hover:text-black"
                        >
                            ✕
                        </button>

                        {/* TITLE */}
                        <h1 className="text-xl font-semibold mb-3">
                            Support & Inquiries
                        </h1>

                        <p className="text-sm text-neutral-600 mb-5">
                            For any questions about quizzes, job applications, or partnerships,
                            please contact below.
                        </p>

                        {/* EMAIL */}
                        <div className="text-sm text-neutral-700 space-y-2">

                            <p className="font-semibold text-black">Contact Email</p>

                            <a
                                href="mailto:info@netaprep.com"
                                className="text-blue-600 hover:underline"
                            >
                                info@netaprep.com
                            </a>

                        </div>

                        {/* OPTIONAL NOTICE */}
                        <div className="mt-5 pt-4 border-t border-neutral-200 text-xs text-neutral-500 leading-relaxed">
                            Please include your account email and a clear description of your issue when contacting.
                        </div>

                    </div>
                </div>
            )}





        </>
    );
}
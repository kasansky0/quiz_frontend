"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { useError } from "@/app/ErrorProvider";
import StatusBanner from "@/app/positiveBanner"
import Link from "next/link";


interface CreatePostProps {
    onSubmit: (post: { title: string; message: string }) => void;
    onCancel: () => void;
    isBlocked?: boolean;          // ✅ new prop
    blockMessage?: string;        // ✅ new prop
    blockSeconds?: number;        // ✅ new prop
}

export default function CreatePost({
                                       onSubmit,
                                       onCancel,
                                       isBlocked,
                                       blockMessage,
                                       blockSeconds,}: CreatePostProps) {
    const [message, setMessage] = useState("");
    const [title, setTitle] = useState("");
    const [passedNETA, setPassedNETA] = useState(false);
    const [errors, setErrors] = useState<{ title?: string; message?: string }>({});
    const [fade, setFade] = useState(false); // fade-in animation
    const [isSending, setIsSending] = useState(false);
    const { showError } = useError();
    const TITLE_LIMIT = 100;
    const MESSAGE_LIMIT = 500;

    useEffect(() => {
        const timer = setTimeout(() => setFade(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSending) return;

        const newErrors: { title?: string; message?: string } = {};

        if (!title.trim()) newErrors.title = "Topic is required";
        if (!message.trim()) newErrors.message = "Message is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Clean text
        const cleanedTitle = title.replace(/\n/g, " ");
        const cleanedMessage = message.replace(/\s*\n\s*/g, " ");

        // Show loading screen
        setIsSending(true);

        // Wait for onSubmit to complete (if async)
        setIsSending(true);

        try {
            await onSubmit({ title: cleanedTitle, message: cleanedMessage });
        } catch (err: any) {
            // Use showError from props or context if needed
            const msg = "Network error: " + (err?.message || err);
            showError(msg);     // ✅ display in global error banner
        } finally {
            setIsSending(false);
        }
    };

    const handlePassNETA = () => {
        setPassedNETA(true);
        if (!title.includes("✅ Passed NETA Level 2")) {
            setTitle((prev) => `✅ Passed NETA Level 2 ${prev}`);
        }
    };
















    return (
        <div className="w-full min-h-screen flex justify-center bg-black-200">

            <div className={`w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl transition-opacity duration-500 ease-in-out ${
                fade ? "opacity-100" : "opacity-0"
            }`}>

                <form
                    className="w-full flex flex-col space-y-4 bg-white border border-black/10 rounded-xl p-4 shadow-sm"
                    onSubmit={handleSubmit}
                >

                    {/* HEADER */}
                    <div className="flex items-center justify-between">

                        {/* Back */}
                        <button
                            type="button"
                            onClick={onCancel}
                            className="p-2 rounded-full hover:bg-black-200 border border-transparent hover:border-black-200 transition z-10"
                        >
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

                        {/* Center message */}
                        <Link
                            href="/position"
                            className="w-full text-center text-xs block active:bg-transparent focus:bg-transparent [-webkit-tap-highlight-color:transparent]"
                        >
                            <div className="flex flex-col items-center space-y-1">

                                {/* ICON + TITLE */}
                                <div className="font-semibold flex items-center justify-center gap-2 text-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-4 h-4 text-neutral-700 flex-shrink-0"
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

                                    <span className="leading-none">
                                                    Hiring NETA Technicians
                                                </span>
                                </div>

                                {/* LOCATION */}
                                <div className="text-xs text-center flex items-center justify-center gap-1 text-neutral-600">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-4 h-4 text-neutral-600 flex-shrink-0"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                                        />
                                    </svg>

                                    <span>Multiple locations</span>
                                </div>

                                {/* CTA */}
                                <div className="text-blue-400 text-xs flex items-center gap-1 group">
                                    <span>View positions</span>

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="w-3 h-3"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M3 10a.75.75 0 01.75-.75h10.69L10.22 5.03a.75.75 0 011.06-1.06l5.5 5.5a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 11-1.06-1.06l4.22-4.22H3.75A.75.75 0 013 10z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>

                            </div>
                        </Link>

                        {/* Post button (clean LinkedIn style) */}
                        <button
                            type="submit"
                            disabled={isSending}
                            className={`
                                px-4 py-1.5
                                rounded-full
                                text-sm font-semibold
                                transition
                                active:scale-[0.98]
                                ${
                                isSending
                                    ? "bg-[#7FB3E6] text-white cursor-not-allowed"
                                    : "bg-[#0a66c2] text-white hover:bg-[#004182]"
                            }
                                `}
                        >
                            Post
                        </button>

                    </div>

                    {/* TITLE */}
                    <div className="flex flex-col">
                        <Textarea
                            placeholder="Title..."
                            value={title}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= TITLE_LIMIT) setTitle(value);

                                if (errors.title) {
                                    setErrors((prev) => ({ ...prev, title: undefined }));
                                }
                            }}
                            rows={2}
                            className={`w-full rounded-xl px-3 py-2 text-lg font-semibold resize-none bg-transparent border ${
                                errors.title ? "border-red-500" : "border-black/10"
                            }`}
                        />
                        <span className="text-black/60 text-xs self-end">
                        {title.length}/{TITLE_LIMIT}
                    </span>
                    </div>

                    {/* BLOCK MESSAGE */}
                    {isBlocked && blockMessage && (
                        <div className="text-red-500 text-xs text-center">
                            {blockMessage}{" "}
                            {blockSeconds ? `Wait ${blockSeconds}s.` : null}
                        </div>
                    )}

                    {/* MESSAGE */}
                    <div className="flex flex-col">
                        <Textarea
                            placeholder="What do you want to talk about?"
                            value={message}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= MESSAGE_LIMIT) setMessage(value);

                                if (errors.message) {
                                    setErrors((prev) => ({ ...prev, message: undefined }));
                                }
                            }}
                            rows={10}
                            className={`w-full rounded-xl px-3 py-2 text-base resize-none bg-transparent border ${
                                errors.message ? "border-red-500" : "border-black/10"
                            }`}
                        />
                        <span className="text-black/60 text-xs self-end">
                        {message.length}/{MESSAGE_LIMIT}
                    </span>
                    </div>

                    {isSending && (
                        <StatusBanner type="loading" message="Sending post..." />
                    )}

                </form>
            </div>
        </div>
    );
}

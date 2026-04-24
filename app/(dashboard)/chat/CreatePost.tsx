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
                            className="p-2 rounded-full hover:bg-black/5 transition"
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
                            className="text-center text-xs sm:text-sm flex-1 px-2"
                        >
                            <div className="font-semibold">
                                💼 Hiring NETA Technicians
                            </div>
                            <div className="text-black/60 text-xs">
                                Multiple locations • Relocation assistance
                            </div>
                            <div className="text-blue-500 text-xs mt-1">
                                View positions →
                            </div>
                        </Link>

                        {/* Post button (clean LinkedIn style) */}
                        <button
                            type="submit"
                            disabled={isSending}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition
                        ${
                                isSending
                                    ? "bg-black/20 text-black/40 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
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

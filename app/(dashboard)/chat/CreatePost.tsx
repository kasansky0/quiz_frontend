"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { useError } from "@/app/ErrorProvider";
import StatusBanner from "@/app/positiveBanner"


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

        // Optionally hide form or reset fields after submission
        // setTitle("");
        // setMessage("");
        // setErrors({});
        // setIsSending(false); // You might leave it if parent navigates
    };

    const handlePassNETA = () => {
        setPassedNETA(true);
        if (!title.includes("✅ Passed NETA Level 2")) {
            setTitle((prev) => `✅ Passed NETA Level 2 ${prev}`);
        }
    };
















    return (
        <div className="w-full max-w-3xl min-h-screen flex flex-col space-y-4 rounded-xl bg-black">

            {isSending && (<StatusBanner type="loading" message="Sending post..." />)}

            <div className={`w-full max-w-3xl transition-opacity duration-500 ease-in-out ${fade ? "opacity-100" : "opacity-0"}`}>
                <form className="w-full flex flex-col space-y-4" onSubmit={handleSubmit}>


                    <div className="flex items-center justify-start">
                        <button
                            type="button"
                            onClick={onCancel}
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
                                    d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                            </svg>
                        </button>

                        <button
                            type="submit"
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
                                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                            </svg>
                        </button>

                        {/* Future Ads / Message */}
                        <div className="w-full text-center text-sm py-2">
                            Promoted: CBS Electrical Contractors <br/> Hiring NETA 2 Techs 📍Raleigh NC
                        </div>

                    </div>


                    {/* Topic Field */}
                    <div className="flex flex-col">
                        <Textarea
                            placeholder="Title..."
                            value={title}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= TITLE_LIMIT) setTitle(value);

                                if (errors.title) {
                                    setErrors((prev) => ({...prev, title: undefined}));
                                }
                            }}
                            rows={3}
                            className={`w-full rounded-xl px-3 py-2 text-lg font-semibold resize-none text-white bg-transparent border ${
                                errors.title ? "border-red-500" : "border-white"
                            }`}
                        />
                        {errors.title && (
                            <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                        )}
                        <span className="text-white/60 text-sm self-end">
                            {title.length}/{TITLE_LIMIT}
                        </span>
                    </div>


                    {/* --- Blocked Banner Between Title and Message --- */}
                    {isBlocked && blockMessage && (
                        <div className="mb-2 text-red-400 text-xs sm:text-sm text-center">
                            {blockMessage} {blockSeconds ? `Wait ${blockSeconds} second(s).` : null}
                        </div>
                    )}


                    {/* Main Body */}
                    <div className="flex flex-col">
                        <Textarea
                            placeholder="Body text..."
                            value={message}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= MESSAGE_LIMIT) setMessage(value);

                                if (errors.message) {
                                    setErrors((prev) => ({...prev, message: undefined}));
                                }
                            }}
                            rows={15}
                            className={`w-full rounded-xl px-2 py-2 text-base resize-none text-white bg-transparent border ${
                                errors.message ? "border-red-500" : "border-white"
                            }`}
                        />
                        {errors.message && (
                            <p className="text-red-500 text-xs mt-1">{errors.message}</p>
                        )}
                        <span className="text-white/60 text-sm self-end">
                            {message.length}/{MESSAGE_LIMIT}
                        </span>
                    </div>


                </form>
            </div>
        </div>
    );
}

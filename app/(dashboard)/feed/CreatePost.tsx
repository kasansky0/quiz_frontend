"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { useError } from "@/app/ErrorProvider";
import Link from "next/link";
import PostMediaPicker from "@/app/(dashboard)/feed/ImageAddCreatePost";


interface CreatePostProps {
    onSubmit: (post: {
        title: string;
        message: string;
        images: File[];
        tags: string[];
    }) => void;
    onCancel: () => void;
    isBlocked?: boolean;          // ✅ new prop
    blockMessage?: string;        // ✅ new prop
    blockSeconds?: number;        // ✅ new prop
}

export const existingTags = [
    // === GENERAL EQUIPMENT ===
    "breakers",
    "circuit-breakers",
    "switchgear",
    "switchboard",
    "panelboard",
    "transformer",
    "power-transformer",
    "distribution-transformer",
    "instrument-transformer",
    "ct",
    "pt",
    "current-transformer",
    "voltage-transformer",

    "cables",

    "substation",
    "data-center",

    "relays",
    "protective-relays",
    "microprocessor-relays",

    "switches",
    "disconnect-switches",
    "load-break-switches",
    "circuit-switchers",

    "generators",
    "synchronous-generators",
    "diesel-generators",

    "motors",
    "ac-motors",
    "dc-motors",
    "synchronous-motors",
    "induction-motors",
    "motor-starters",

    "ups",
    "uninterruptible-power-systems",

    "bess",
    "battery-energy-storage-systems",
    "batteries",

    "capacitors",
    "reactors",
    "resistors",

    "surge-protection",
    "spds",

    "grounding",
    "ground-fault",

    "metering",
    "meters",
    "power-metering",

    "testing",
    "commissioning",
    "maintenance",

    "calculations",
    "load-calculations",
    "short-circuit-analysis",
    "fault-analysis",

    // === SAFETY / FIELD ===
    "loto",
    "lockout-tagout",
    "confined-spaces",
    "respiratory-protection",
    "gloves",
    "ppe",
    "extinguishers",
    "fire-extinguishers",
    "clearances",
    "arc-flash-safety",

    // === INSULATION / DIAGNOSTICS ===
    "ir",
    "insulation-resistance",
    "tan-delta",
    "dissipation-factor",
    "ttr",
    "turns-ratio-test",
    "insulating-fluids",
    "dielectric-testing",

    // === INFRASTRUCTURE ===
    "busway",
    "outdoor-bus",
    "fiber-optic-cables",
    "communications-systems",

    // === RENEWABLE / MODERN ===
    "solar-pv-systems",
    "photovoltaic",
    "ev-charging-systems",
    "electric-vehicle-charging",

    // === NETA / STANDARDS ===
    "neta",
    "neta-1",
    "neta-2",
    "neta-3",
    "exam",

    // === STATES (WORK LOCATIONS) ===
    "alabama",
    "alaska",
    "arizona",
    "arkansas",
    "california",
    "colorado",
    "connecticut",
    "delaware",
    "florida",
    "georgia",
    "hawaii",
    "idaho",
    "illinois",
    "indiana",
    "iowa",
    "kansas",
    "kentucky",
    "louisiana",
    "maine",
    "maryland",
    "massachusetts",
    "michigan",
    "minnesota",
    "mississippi",
    "missouri",
    "montana",
    "nebraska",
    "nevada",
    "new-hampshire",
    "new-jersey",
    "new-mexico",
    "new-york",
    "north-carolina",
    "north-dakota",
    "ohio",
    "oklahoma",
    "oregon",
    "pennsylvania",
    "rhode-island",
    "south-carolina",
    "south-dakota",
    "tennessee",
    "texas",
    "utah",
    "vermont",
    "virginia",
    "washington",
    "west-virginia",
    "wisconsin",
    "wyoming"
];

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

    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");

    const [images, setImages] = useState<File[]>([]);

    const TITLE_LIMIT = 100;
    const MESSAGE_LIMIT = 1500;

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
            await onSubmit({
                title: cleanedTitle,
                message: cleanedMessage,
                images,
                tags
            });
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

    const addTagValue = (value: string) => {
        let clean = value
            .trim()
            .toLowerCase();

        if (!clean) return;

        clean = clean.replace(/\s+/g, "-");
        clean = clean.replace(/[^a-z0-9-]/g, "");
        clean = clean.replace(/-+/g, "-");
        clean = clean.replace(/^-+|-+$/g, "");

        if (!clean) {
            showError("Invalid tag");
            return;
        }

        if (clean.length < 2) {
            showError("Tag must be at least 2 characters");
            return;
        }

        if (clean.length > 30) {
            showError("Tag cannot exceed 30 characters");
            return;
        }

        if (tags.includes(clean)) {
            showError("Tag already added");
            return;
        }

        if (tags.length >= 5) {
            showError("Maximum 5 tags allowed");
            return;
        }

        setTags(prev => [...prev, clean]);
    };

    const addTag = () => {
        addTagValue(tagInput);
        setTagInput("");
    };

    const removeTag = (tag: string) => {
        setTags((prev) => prev.filter((t) => t !== tag));
    };

    const filteredTags =
        tagInput.length >= 2
            ? existingTags.filter(tag =>
                tag.includes(tagInput.toLowerCase())
            )
            : [];
















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
                                        className="w-4 h-4 text-blue-400 flex-shrink-0"
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
                                        className="w-4 h-4 text-blue-400 flex-shrink-0"
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
                                min-w-[90px]
                                px-4 py-1.5
                                rounded-full
                                text-sm font-semibold
                                transition
                                active:scale-[0.98]
                                flex items-center justify-center
                                ${
                                isSending
                                    ? "bg-[#7FB3E6] text-white cursor-not-allowed"
                                    : "bg-[#0a66c2] text-white hover:bg-[#004182]"
                            }
                                 `}
                        >
                            {isSending ? (
                                <span className="flex items-center gap-2">
                                Posting
                            </span>
                            ) : (
                                "Post"
                            )}
                        </button>

                    </div>

                    {/* TAGS */}
                    <div className="flex flex-col gap-2">

                        {/* INPUT */}
                        <div className="relative flex items-center px-3 py-2 border border-black/10 rounded-xl focus-within:border-[#0a66c2] bg-white">

                            <input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addTag();
                                    }
                                }}
                                placeholder="Add tags..."
                                className="flex-1 text-sm outline-none bg-transparent"
                            />

                            <button
                                type="button"
                                onClick={addTag}
                                className="text-xs font-semibold text-[#0a66c2] hover:underline"
                            >
                                Add
                            </button>

                            {/* DROPDOWN */}
                            {tagInput && filteredTags.length > 0 && (
                                <div
                                    className="
                                        absolute left-0 top-full mt-2
                                        w-full
                                        bg-white
                                        border border-black/10
                                        rounded-xl
                                        shadow-lg
                                        overflow-hidden
                                        z-50
                                        max-h-72
                                        overflow-y-auto
                                    "
                                >
                                    <div className="px-3 py-2 text-[11px] font-medium text-neutral-500 border-b border-black/5">
                                        Suggested tags
                                    </div>

                                    {filteredTags.slice(0, 8).map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => {
                                                addTagValue(tag);
                                                setTagInput("");
                                            }}
                                            className="
                                                w-full
                                                flex items-center gap-3
                                                px-4 py-3
                                                text-left
                                                hover:bg-neutral-50
                                                transition-colors
                                                border-b border-black/5
                                                last:border-b-0
                                            "
                                        >
                                            <div
                                                className="
                                                    w-8 h-8
                                                    rounded-full
                                                    bg-[#eef3f8]
                                                    text-[#0a66c2]
                                                    flex items-center justify-center
                                                    text-sm font-semibold
                                                    flex-shrink-0
                                                "
                                            >
                                                #
                                            </div>

                                            <div className="flex flex-col">
                                            <span className="text-sm font-medium text-neutral-900">
                                                {tag}
                                            </span>

                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SELECTED TAGS */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {tags.map((tag) => (
                                    <div
                                        key={tag}
                                        className="group flex items-center gap-1 px-3 py-1 rounded-full bg-[#f3f2ef] text-xs text-black/80 hover:bg-[#e9e5df] transition"
                                    >
                                        <span>#{tag}</span>

                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="ml-1 text-black/40 group-hover:text-red-500 transition"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* TITLE */}
                    <div className="flex flex-col">
                        <Textarea
                            placeholder="Add title..."
                            value={title}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= TITLE_LIMIT) setTitle(value);

                                if (errors.title) {
                                    setErrors((prev) => ({ ...prev, title: undefined }));
                                }
                            }}
                            rows={2}
                            className={`w-full rounded-xl px-3 py-2 text-lg resize-none bg-transparent border ${
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



                    {/* MEDIA PICKER (INSERT HERE) */}
                    <div className="!mt-0">
                        <PostMediaPicker images={images} setImages={setImages} />
                    </div>




                    <div className="mt-2 px-2 flex items-start gap-1 text-[11px] text-neutral-500 leading-snug">
                        <span className="text-neutral-400">•</span>
                        <span>
        Keep posts professional. Avoid sharing personal customer data, private job site details, or confidential information.
    </span>
                    </div>




                    {/* MESSAGE */}
                    <div className="flex flex-col">
                        <Textarea
                            placeholder="Add message..."
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
                </form>
            </div>



            {isSending && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">

                    <div className="w-64 p-4 rounded-xl bg-black/40 text-white/90 flex flex-col gap-3">

                        <div className="flex items-center gap-3 text-sm font-medium">
                            Posting...
                        </div>

                        {/* moving loader bar */}
                        <div className="h-1 w-full bg-white/20 overflow-hidden rounded relative">
                            <div className="absolute h-full w-1/3 bg-white/80 animate-[slide_1s_linear_infinite]" />
                        </div>

                    </div>

                    <style jsx>{`
                      @keyframes slide {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(300%); }
                      }
                    `}</style>

                </div>
            )}


        </div>
    );
}

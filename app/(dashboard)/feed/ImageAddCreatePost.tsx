"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useError } from "@/app/ErrorProvider";

type PostMediaPickerProps = {
    images: File[];
    setImages: (files: File[]) => void;
};

type PreviewImage = {
    file: File;
    url: string;
};

export default function PostMediaPicker({
                                            images,
                                            setImages,
                                        }: PostMediaPickerProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const { showError } = useError();

    const [previews, setPreviews] = useState<PreviewImage[]>([]);

    // =========================
    // VALIDATION RULES
    // =========================
    const MAX_IMAGES = 5;
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

    // =========================
    // FILE SIGNATURES (DUPLICATES)
    // =========================
    const existingFileKeys = useMemo(() => {
        return new Set(
            images.map(
                (f) => `${f.name}_${f.size}_${f.lastModified}_${f.type}`
            )
        );
    }, [images]);

    const getFileKey = (file: File) =>
        `${file.name}_${file.size}_${file.lastModified}_${file.type}`;

    // =========================
    // 🔥 STABLE URL CACHE (FIX FOR BROKEN IMAGES)
    // =========================
    const urlCacheRef = useRef(new Map<File, string>());

    useEffect(() => {
        const cache = urlCacheRef.current;

        const next: PreviewImage[] = [];

        for (const file of images) {
            let url = cache.get(file);

            if (!url) {
                url = URL.createObjectURL(file);
                cache.set(file, url);
            }

            next.push({ file, url });
        }

        setPreviews(next);

        // cleanup removed files
        const currentSet = new Set(images);

        for (const [file, url] of cache.entries()) {
            if (!currentSet.has(file)) {
                URL.revokeObjectURL(url);
                cache.delete(file);
            }
        }
    }, [images]);

    // =========================
    // HANDLE PICK
    // =========================
    const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;

        if (!input.files) return;

        const newFiles = Array.from(input.files);

        // 🔥 IMPORTANT: reset immediately (fixes same-file reselect bug)
        input.value = "";

        const remainingSlots = MAX_IMAGES - images.length;

        if (remainingSlots <= 0) {
            showError("You can only upload up to 5 images");
            return;
        }

        const validFiles: File[] = [];

        for (const file of newFiles) {
            if (validFiles.length >= remainingSlots) break;

            const key = getFileKey(file);

            if (!ALLOWED_TYPES.includes(file.type)) {
                showError(`"${file.name}" is not a supported image type`);
                continue;
            }

            if (file.size > MAX_SIZE) {
                showError(`"${file.name}" is too large (max 10MB)`);
                continue;
            }

            const alreadyExists = existingFileKeys.has(key);

            if (alreadyExists) {
                continue;
            }

            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        // =========================
        // 🚀 OPTIMIZE BEFORE STATE UPDATE
        // =========================
        const optimizedFiles = await Promise.all(
            validFiles.map(optimizeImage)
        );

        setImages([...images, ...optimizedFiles]);
    };

    const openPicker = () => {
        inputRef.current?.click();
    };

    const removeImage = (index: number) => {
        const removed = previews[index];

        if (removed) {
            URL.revokeObjectURL(removed.url);
        }

        const updated = images.filter((_, i) => i !== index);
        setImages(updated);
    };

    const moveImage = (index: number, direction: "left" | "right") => {
        const targetIndex = direction === "left" ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= images.length) return;

        const updated = [...images];

        [updated[index], updated[targetIndex]] = [
            updated[targetIndex],
            updated[index],
        ];

        // small trick to allow DOM paint before update feels instant
        requestAnimationFrame(() => {
            setImages(updated);
        });
    };

    async function optimizeImage(file: File): Promise<File> {
        const bitmap = await createImageBitmap(file);

        const MAX_WIDTH = 2048;
        const MAX_HEIGHT = 2048;

        let width = bitmap.width;
        let height = bitmap.height;

        const scale = Math.min(
            MAX_WIDTH / width,
            MAX_HEIGHT / height,
            1
        );

        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return file;

        ctx.drawImage(bitmap, 0, 0, width, height);

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/jpeg", 0.9);
        });

        if (!blob) return file;

        return new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            {
                type: "image/jpeg",
                lastModified: Date.now(),
            }
        );
    }

    return (
        <div className="flex flex-col gap-2 px-1">

            {/* TOP ROW */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={openPicker}
                    className="
                    flex items-center justify-center
                    w-9 h-9 rounded-full
                    border border-black/10
                    hover:bg-black/5
                    active:scale-95 transition
                "
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="w-5 h-5 text-black"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 16.5z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 15l-5.25-5.25a2.25 2.25 0 00-3.18 0L3 19.5"
                        />
                    </svg>
                </button>

                <span className="text-xs text-black/50 flex items-center gap-1">
                    {images.length === 0 ? (
                        "Add up to 5 images"
                    ) : (
                        <>
                            <span className="text-black/60 tabular-nums">
                                {images.length}
                            </span>

                            <span className="text-black/40">
                                / {MAX_IMAGES}
                            </span>
                        </>
                    )}
                </span>
            </div>

            {/* THUMBNAIL STRIP */}
            {previews.length > 0 && (
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth snap-x snap-mandatory">

                    {previews.map((p, index) => (
                        <div
                            key={p.file.name + p.file.size + p.file.lastModified}
                            className="
                                relative
                                flex-shrink-0
                                w-40 h-40 sm:w-44 sm:h-44 md:w-48 md:h-48
                                rounded-lg overflow-hidden
                                border border-black/10
                                group
                                transition-transform duration-300 ease-in-out
                                will-change-transform
                                snap-center
                            "
                        >
                            <img
                                src={p.url}
                                alt="preview"
                                className="w-full h-full object-cover"
                            />

                            {/* COVER LABEL */}
                            {index === 0 && (
                                <div
                                    className="
                                    absolute top-1 left-1
                                    px-1.5 py-0.5
                                    rounded
                                    bg-blue-600
                                    text-white
                                    text-[10px]
                                    font-medium
                                    z-20
                                "
                                >
                                    Cover
                                </div>
                            )}

                            {/* DELETE BUTTON */}
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="
                                    absolute top-2 right-2 z-30
                                    w-8 h-8
                                    rounded-full
                                    bg-white/90
                                    flex items-center justify-center
                                    shadow-sm
                                    hover:bg-white
                                    transition
                                "
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-4 h-4 text-black/80"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M9 3.75A2.25 2.25 0 0111.25 1.5h1.5A2.25 2.25 0 0115 3.75V4.5h4.5a.75.75 0 010 1.5h-.75l-.86 13.02A3.75 3.75 0 0114.15 22.5H9.85a3.75 3.75 0 01-3.74-3.48L5.25 6H4.5a.75.75 0 010-1.5H9V3.75zM10.5 4.5h3V3.75a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75V4.5z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>

                            {/* LEFT / RIGHT MOVE ARROWS (REORDER) */}
                            <div className="absolute bottom-1 left-1 right-1 flex justify-between px-1 z-30 opacity-0 group-hover:opacity-100 transition">

                                <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => moveImage(index, "left")}
                                    className="
                                    w-7 h-7
                                    rounded-full
                                    bg-white/90
                                    flex items-center justify-center
                                    disabled:opacity-30
                                    shadow
                                "
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className="w-4 h-4 text-black"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    disabled={index === previews.length - 1}
                                    onClick={() => moveImage(index, "right")}
                                    className="
                                    w-7 h-7
                                    rounded-full
                                    bg-white/90
                                    flex items-center justify-center
                                    disabled:opacity-30
                                    shadow
                                "
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className="w-4 h-4 text-black"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>

                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* HIDDEN INPUT */}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePick}
            />
        </div>
    );
}
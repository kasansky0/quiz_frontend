"use client";

import { useState } from "react";
import { Post } from "../../hooks/usePosts";
import { useSession } from "next-auth/react";
import { useError } from "@/app/ErrorProvider";


const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

type Props = {
    onResults: (posts: Post[], query: string, total: number) => void;
    onLoading: (loading: boolean) => void;
    onClear: (previousQuery?: string) => void;
};

export default function PostSearchBar({ onResults, onLoading, onClear }: Props) {
    const { data: session } = useSession();
    const [query, setQuery] = useState("");
    const { showError } = useError();

    const handleSearch = async () => {
        if (!session?.idToken || !query.trim()) return;

        onLoading(true);

        try {
            const res = await fetch(
                `${apiUrl}/posts/search?q=${encodeURIComponent(query)}&skip=0&limit=10`,
                {
                    headers: {
                        Authorization: `Bearer ${session.idToken}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                showError("You need to log in again.", true);
                onResults([], query, 0);
                return;
            }

            onResults(data.posts || [], query, data.total);
        } catch (err) {
            showError("You need to log in again.", true);
            onResults([], query, 0);
        } finally {
            onLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2 w-full mb-3 bg-white border border-black/10 rounded-full px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-blue-400 transition">

            {/* INPUT */}
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts..."
                className="flex-1 bg-transparent outline-none text-sm text-black placeholder:text-black/40"
            />

            {/* CLEAR (only show when typing) */}
            <button
                onClick={() => {
                    setQuery("");
                    onClear?.(query);
                }}
                className={`text-xs transition ${
                    query
                        ? "text-black/60 hover:text-black cursor-pointer"
                        : "text-black/20 cursor-default"
                }`}
            >
                Clear Search
            </button>

            {/* DIVIDER */}
            <div className="w-px h-4 bg-black/10" />

            {/* SEARCH BUTTON (icon style like LinkedIn) */}
            <button
                onClick={handleSearch}
                className="flex items-center justify-center text-blue-600 hover:text-blue-700 transition"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                >
                    <path
                        fillRule="evenodd"
                        d="M10.5 3.75a6.75 6.75 0 104.26 12.01l4.49 4.49a.75.75 0 101.06-1.06l-4.49-4.49A6.75 6.75 0 0010.5 3.75zM4.5 10.5a6 6 0 1112 0 6 6 0 01-12 0z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
        </div>
    );
}
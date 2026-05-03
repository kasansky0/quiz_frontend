"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import CreatePost from "./CreatePost";
import { useSession } from "next-auth/react";
import { Post, Comment } from "../../hooks/usePosts";
import { useUser } from "../../UserContext";
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { useError } from "@/app/ErrorProvider";
import DOMPurify from 'dompurify';
import ActivePost from "./ActivePost";
import Link from "next/link";
import { formatLocalDate } from "@/app/hooks/formatLocalDate";

type FetchPostsResult = {
    posts: Post[];
    total: number;
    error?: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

export default function ChatStats() {
    const [activePost, setActivePost] = useState<Post | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [creatingPost, setCreatingPost] = useState(false);
    const {userId} = useUser();
    const router = useRouter();
    const [loggedOut, setLoggedOut] = useState(false);
    const {showError, hideError} = useError();
    const handleBackToList = () => {
        setActivePost(null);

        requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
        });
    };
    const [listFade, setListFade] = useState(false);
    const [activePostComments, setActivePostComments] = useState<Comment[]>([]);
    const [serverError, setServerError] = useState<string | null>(null);
    const [showLoading, setShowLoading] = useState(true);
    const {data: session} = useSession();
    const [deletedCommentIds, setDeletedCommentIds] = useState<Set<string>>(new Set());
    const [postSkip, setPostSkip] = useState(0);
    const postLimit = 10; // number of posts to fetch per batch
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [totalPosts, setTotalPosts] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [newCommentPosts, setNewCommentPosts] = useState<Set<string>>(new Set());
    const [scrollY, setScrollY] = useState(0);

    const showOverlay = showLoading || !!serverError;

    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Network event listeners
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // --- Modify fetchPosts ---
    const fetchPosts = async (skip: number, limit: number) => {
        if (!session?.idToken) {
            setShowLoading(true);
            showError("You need to log in again.", true);
            return { posts: [], total: 0, error: "no_session" };
        }

        const idToken = session.idToken;

        if (!navigator.onLine) {
            // Keep loading forever until network is back
            setServerError("⚠️ No internet connection. Please check your WiFi.");
            setShowLoading(true);
            return { posts: [], total: 0, error: "offline" };
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) return { posts: [], total: 0, error: "API URL missing" };

        try {
            const res = await fetch(`${apiUrl}/posts/?skip=${skip}&limit=${limit}`, {
                headers: {
                    "Authorization": `Bearer ${idToken}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) return { posts: [], total: 0, error: data?.detail || "Fetch failed" };

            return { posts: data.posts || [], total: data.total || 0 };
        } catch (err) {
            setServerError("Network error");
            setShowLoading(true);
            return { posts: [], total: 0, error: "network_error" };
        }
    };

// --- Modify loadInitialPosts ---
    const loadInitialPosts = async () => {
        setServerError(null);
        setShowLoading(true);

        const data = await fetchPosts(0, postLimit);

        if (!data || data.error) {
            // Keep loading if offline
            if (data.error === "offline") return;
            setServerError(data.error);
            setShowLoading(true);
            showError("You need to log in again.", true);
            return;
        }

        setAllPosts(data.posts);
        setTotalPosts(data.total);
        setPostSkip(data.posts.length);
        setShowLoading(false); // hide only if network OK
    };

// --- Optional: auto retry when back online ---
    useEffect(() => {
        if (isOnline && showLoading) {
            loadInitialPosts(); // retry fetching posts
        }
    }, [isOnline]);

    useEffect(() => {
        loadInitialPosts();
    }, []);

    const loadMorePosts = async () => {
        if (loadingMore) return;
        setLoadingMore(true);
        try {
            const data = await fetchPosts(postSkip, postLimit);

            if (!data || !Array.isArray(data.posts)) {
                showError("Invalid server response");
                return;
            }

            setAllPosts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newPosts = data.posts.filter((p: Post) => !existingIds.has(p.id));
                return [...prev, ...newPosts]; // append to the end
            });
            setPostSkip(prev => prev + data.posts.length);
        } catch (err) {
            console.error("Failed to load more posts", err);
            showError("Failed to load more posts");
        } finally {
            setLoadingMore(false);
        }
    };

    // Fade-in effect
    useEffect(() => {
        const timer = setTimeout(() => setListFade(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // --- COMMENTS POLLING ---
    const commentsFetcher = async (url: string) => {
        if (!session?.idToken) {
            showError("You need to log in again.", true);
            return [];
        }
        const res = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${session.idToken}`,
                "Content-Type": "application/json",
            },
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
            // Instead of throwing, show error in UI
            showError(data?.detail || "Failed to fetch comments");
            return []; // return empty array to prevent crashes
        }

        return data;
    };
    const {data: polledComments} = useSWR<Comment[]>(
        activePost ? `${apiUrl}/posts/${activePost.id}/comments?skip=0&limit=25` : null,
        commentsFetcher,
        {refreshInterval: 300000, revalidateOnFocus: true, dedupingInterval: 1000}
    );

    useEffect(() => {
        if (!polledComments || !Array.isArray(polledComments)) return;

        // Replace entire comment state instead of appending
        const sorted = [...polledComments].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        setActivePostComments(sorted);
    }, [polledComments]);

    const handleActivatePost = (post: Post) => {
        setScrollY(window.scrollY);
        setActivePost(post);
        setActivePostComments([]);

        setNewCommentPosts(prev => {
            const next = new Set(prev);
            next.delete(post.id);
            return next;
        });

        requestAnimationFrame(() => {
            window.scrollTo(0, 0);
        });
    };

    const handleSessionExpired = async () => {
        setShowLoading(true);
        showError("You need to log in again.", true);
    };

    function LoggedOut() {
        const router = useRouter();
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-200 backdrop-blur-sm p-4">
                <div
                    className="bg-black-200 border border-black/10 shadow-lg rounded-2xl max-w-md w-full p-6 text-center backdrop-blur-md">
                    <h2 className="text-black text-lg font-semibold mb-2 drop-shadow-[0_0_12px_rgba(36,174,124,0.8)]">
                        Session Expired
                    </h2>
                    <p className="text-black text-sm mb-6">
                        Your session has expired. Please log in again to continue.
                    </p>
                    <div className="flex justify-center">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center justify-center bg-black-200 backdrop-blur-xl border border-black/10 rounded-xl shadow-lg px-4 h-8 text-sm text-black font-medium hover:bg-black-200 active:scale-95 transition"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    useEffect(() => {
        let interval: NodeJS.Timeout;
        let delay = 5000;
        let controller: AbortController | null = null;

        const poll = async () => {
            // ⛔ skip if tab not visible OR inside a post OR loading more
            if (document.hidden || activePost || loadingMore) {
                interval = setTimeout(poll, delay);
                return;
            }

            // Abort previous fetch if still running
            if (controller) controller.abort();
            controller = new AbortController();

            try {
                const data = await fetchPosts(0, postLimit);

                // ✅ ADD THIS
                if (!data || !Array.isArray(data.posts)) {
                    console.error("Invalid posts response:", data);
                    interval = setTimeout(poll, delay); // ✅ keep polling alive
                    return;
                }

                setAllPosts(prev => {
                    const map = new Map<string, Post>();
                    const updatedNewCommentPosts = new Set<string>();

                    const prevMap = new Map(prev.map(p => [p.id, p]));

                    data.posts.forEach((p: Post) => {
                        const old = prevMap.get(p.id);

                        if (
                            old &&
                            (p.commentCount ?? 0) > (old.commentCount ?? 0)
                        ) {
                            updatedNewCommentPosts.add(p.id);
                        }

                        map.set(p.id, p);
                    });

                    prev.forEach(p => {
                        if (!map.has(p.id)) map.set(p.id, p);
                    });

                    // update highlight state
                    if (updatedNewCommentPosts.size > 0) {
                        setNewCommentPosts(prevSet => {
                            const next = new Set(prevSet);
                            updatedNewCommentPosts.forEach(id => next.add(id));
                            return next;
                        });
                    }

                    return Array.from(map.values());
                });

                setTotalPosts(data.total);

                // ⬆️ gradually slow down polling
                delay = Math.min(delay + 5000, 60000);

            } catch (err: any) {
                if (err.name === "AbortError") {
                    // Fetch was aborted → ignore
                } else {
                    console.error("Post polling failed", err);
                }
            }

            interval = setTimeout(poll, delay);
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                delay = 5000; // reset polling speed
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        poll();

        return () => {
            clearTimeout(interval);
            if (controller) controller.abort();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [activePost, loadingMore, postLimit]);

    const handleCreatePost = async ({ title, message }: { title: string; message: string }) => {
        if (!session?.idToken) {
            showError("You need to log in again.", true);
            return;
        }

        const idToken = session.idToken;
        const sanitizedTitle = DOMPurify.sanitize(title.trim());
        const sanitizedMessage = DOMPurify.sanitize(message.trim());

        setCreatingPost(true); // ✅ use ONE loader only

        try {
            const res = await fetch(`${apiUrl}/posts/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
                body: JSON.stringify({ title: sanitizedTitle, message: sanitizedMessage }),
            });

            if (!res.ok) {
                if (res.status === 401) {
                    await handleSessionExpired();
                    return;
                }

                const err = await res.json().catch(() => null);

                let msg = "Failed to create post";
                if (err?.detail) msg = typeof err.detail === "string" ? err.detail : err.detail.error ?? msg;
                else if (err?.error) msg = err.error;

                showError(msg);
                return;
            }

            const newPost: Post = await res.json();

            globalMutate(
                `${apiUrl}/posts/`,
                (cachedData: { posts: Post[]; total: number } | undefined) => {
                    const existingPosts = cachedData?.posts ?? [];
                    const total = cachedData?.total ?? 0;
                    return { posts: [newPost, ...existingPosts], total: total + 1 };
                },
                false
            );

            setAllPosts(prev => {
                const map = new Map<string, Post>();
                [newPost, ...prev].forEach(p => map.set(p.id, p));
                return Array.from(map.values());
            });

        } catch (err: any) {
            console.error("Create post error:", err);
            showError("Network error while creating post");

        } finally {
            setCreatingPost(false); // ✅ ALWAYS RESET (single source of truth)
        }
    };

    const filteredPosts = useMemo(() => {
        const uniqueMap = new Map<string, Post>();
        allPosts.forEach(p => uniqueMap.set(p.id, p)); // keep last one
        const uniquePosts = Array.from(uniqueMap.values());

        return uniquePosts
            .filter(post => post.message.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                // Keep pinned posts on top
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                // Sort by timestamp descending (new → old)
                return new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime();
            });
    }, [allPosts, searchQuery]);

    if (loggedOut) return <LoggedOut/>;














    return (
        <div className="w-full relative sm:px-4">
            {/* Loading / Error Banner */}
            {(showLoading || serverError) && (
                <div className="flex-1 flex items-center justify-center min-h-screen text-black w-full">
                    {showLoading && (
                        <p className="text-xl flex items-center">
                            Loading
                            <span className="ml-2 flex space-x-1">
                            <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce"></span>
                            <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                            <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                        </span>
                        </p>
                    )}
                    {!showLoading && serverError && (
                        <p className="text-center px-4 text-black text-lg">{serverError}</p>
                    )}
                </div>
            )}

            {/* Main Content */}
            {!showLoading && allPosts.length > 0 && (
                <div className="w-full flex flex-col pb-10">
                    {creatingPost && (
                        <CreatePost
                            onSubmit={handleCreatePost}
                            onCancel={() => setCreatingPost(false)}
                            isBlocked={false}
                        />
                    )}

                    {!creatingPost && !activePost && (
                        <>
                            {/* Top bar */}
                            <div className="flex items-center justify-start relative w-full pb-3">
                                <button
                                    onClick={() => setCreatingPost(true)}
                                    className="p-2 rounded-full hover:bg-white border border-transparent hover:border-neutral-200 transition z-10"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 -960 960 960"
                                        className="w-8 h-8 fill-current"
                                    >
                                        <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h360v80H200v560h560v-360h80v360q0 33-23.5 56.5T760-120H200Zm120-160v-80h320v80H320Zm0-120v-80h320v80H320Zm0-120v-80h320v80H320Zm360-80v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z"/>
                                    </svg>
                                </button>

                                {/* Future Ads / Message */}
                                <Link
                                    href="/position"
                                    className="w-full mt-2 text-center text-xs block active:bg-transparent focus:bg-transparent [-webkit-tap-highlight-color:transparent]"
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

                                            <span>Multiple locations • Relocation assistance</span>
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
                            </div>

                            {/* Posts list */}
                            <div
                                className={`w-full transition-opacity duration-500 ease-in-out ${
                                    listFade ? "opacity-100" : "opacity-0"
                                }`}
                            >
                                <div className="space-y-2 w-full">
                                    {filteredPosts.map(post => {
                                        const netaLevel = post.neta4 ? 4 : post.neta3 ? 3 : post.neta2 ? 2 : null;
                                        return (
                                            <div
                                                key={post.id}
                                                onClick={() => handleActivatePost(post)}
                                                className={`
                                                relative cursor-pointer
                                                rounded-2xl p-3 w-full
    
                                                bg-white backdrop-blur-xl
                                                border border-black/5
    
                                                shadow-sm hover:shadow-md
                                                hover:border-black/10
                                                hover:translate-y-[-1px]
    
                                                transition-all duration-200
                                                active:scale-[0.99]
    
                                                ${newCommentPosts.has(post.id)
                                                    ? "ring-1 ring-yellow-400/40 bg-yellow-400/10"
                                                    : "hover:bg-black-300/40"
                                                }
                                            `}
                                            >
                                                <div className="flex items-center mb-0.5 w-full">
                                                    <div className="flex items-center gap-2 truncate w-full">

















                                                        <span className="flex items-center gap-1 text-sm sm:text-sm md:text-base font-bold truncate text-blue-400">
                                                            {/* NETA BADGE */}
                                                            {netaLevel && (
                                                                <span
                                                                    title={`NETA Level ${netaLevel} Verified`}
                                                                    className="flex items-center justify-center flex-shrink-0"
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        viewBox="0 0 64 64"
                                                                        className="w-5 h-5"
                                                                    >
                                                                        {/* Outer rounded square */}
                                                                        <rect
                                                                            x="6"
                                                                            y="6"
                                                                            width="52"
                                                                            height="52"
                                                                            rx="14"
                                                                            fill={
                                                                                netaLevel === 4
                                                                                    ? "#facc15" // gold
                                                                                    : netaLevel === 3
                                                                                        ? "#8b5cf6" // purple
                                                                                        : "#22c55e" // green
                                                                            }
                                                                        />

                                                                        {/* Inner */}
                                                                        <rect
                                                                            x="14"
                                                                            y="14"
                                                                            width="36"
                                                                            height="36"
                                                                            rx="10"
                                                                            fill="white"
                                                                        />

                                                                        {/* Text */}
                                                                        <text
                                                                            x="32"
                                                                            y="39"
                                                                            textAnchor="middle"
                                                                            fontSize="18"
                                                                            fontWeight="900"
                                                                            fill={
                                                                                netaLevel === 4
                                                                                    ? "#ca8a04"
                                                                                    : netaLevel === 3
                                                                                        ? "#8b5cf6"
                                                                                        : "#16a34a"
                                                                            }
                                                                            fontFamily="Arial, sans-serif"
                                                                        >
                                                                            {netaLevel === 4 ? "N4" : netaLevel === 3 ? "N3" : "N2"}
                                                                        </text>
                                                                    </svg>
                                                                </span>
                                                            )}

                                                            {/* Nickname */}
                                                            <span className="truncate">{post.nickname}</span>

                                                            {/* Your own user dot */}
                                                            {userId && post.userId === userId && (
                                                                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-500 opacity-80" />
                                                            )}
                                                        </span>





















                                                        <div className="flex items-center justify-center bg-black-200 backdrop-blur-xl border border-black/10 rounded-full shadow-lg px-2 h-5 min-w-[40px] truncate">
                                                            <svg
                                                                aria-hidden="true"
                                                                className="w-3 h-3 mr-1 text-black"
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path d="M10 1a9 9 0 00-9 9c0 1.947.79 3.58 1.935 4.957L.231 17.661A.784.784 0 00.785 19H10a9 9 0 009-9 9 9 0 00-9-9zm0 16.2H6.162c-.994.004-1.907.053-3.045.144l-.076-.188a36.981 36.981 0 002.328-2.087l-1.05-1.263C3.297 12.576 2.8 11.331 2.8 10c0-3.97 3.23-7.2 7.2-7.2s7.2 3.23 7.2 7.2-3.23 7.2-7.2 7.2z" />
                                                            </svg>

                                                            <span className="text-black text-sm font-medium">
                                                            {post.commentCount ?? 0}
                                                        </span>

                                                            {newCommentPosts.has(post.id) && (
                                                                <span className="ml-1 text-yellow-400 text-sm font-semibold">
                                                                +1
                                                            </span>
                                                            )}

                                                            {post.pinned && (
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 24 24"
                                                                    fill="currentColor"
                                                                    className="w-3 h-3 ml-1 text-green-800 opacity-90"
                                                                >
                                                                    <path d="M6 2a2 2 0 00-2 2v18l8-5 8 5V4a2 2 0 00-2-2H6z"/>
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <span className="text-black text-sm sm:text-sm md:text-base ml-auto whitespace-nowrap">
                                                    {formatLocalDate(post.timestamp, post.edited)}
                                                </span>
                                                </div>

                                                <h3 className="text-black font-bold mb-0.5 text-sm sm:text-base md:text-base line-clamp-3">
                                                    {post.title}
                                                </h3>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* LOAD MORE POSTS BUTTON */}
                            {allPosts.length < totalPosts && (
                                <div className="flex justify-center my-3 w-full">
                                    <button
                                        onClick={async () => {
                                            if (loadingMore) return;
                                            setLoadingMore(true);
                                            await loadMorePosts();
                                            setLoadingMore(false);
                                        }}
                                        disabled={loadingMore}
                                        style={{ touchAction: "manipulation" }}
                                        className={`
                                        w-full flex justify-center items-center gap-2
                                        py-3 rounded-xl
                                        text-white font-medium text-sm sm:text-base
                                        bg-blue-500 hover:bg-blue-500 active:bg-blue-500
                                        transition
                                        shadow-sm
                                        disabled:opacity-60 disabled:cursor-not-allowed
                                    `}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.8}
                                            stroke="currentColor"
                                            className={`w-5 h-5 transition-transform ${
                                                loadingMore ? "animate-spin" : ""
                                            }`}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                            />
                                        </svg>

                                        <span>
                                        {loadingMore ? "Loading..." : "Load More Posts"}
                                    </span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Active Post */}
                    <div
                        className={`transition-opacity duration-500 ease-in-out ${
                            listFade ? "opacity-100" : "opacity-0"
                        } w-full flex-1`}
                    >
                        {activePost && (
                            <ActivePost
                                deletedCommentIds={deletedCommentIds}
                                setDeletedCommentIds={setDeletedCommentIds}
                                post={activePost}
                                comments={{
                                    comments: activePostComments,
                                    total: Number(activePost.commentCount ?? 0),
                                }}
                                userId={userId}
                                onBack={handleBackToList}
                                totalComments={Number(activePost.commentCount ?? 0)}
                                onPostUpdate={(updatedPost: Post) => {
                                    setAllPosts(prev =>
                                        prev.map(p => (p.id === updatedPost.id ? updatedPost : p))
                                    );
                                }}
                                onPostDelete={(deletedPostId: string) => {
                                    setAllPosts(prev =>
                                        prev.filter(p => p.id !== deletedPostId)
                                    );
                                    setTotalPosts(prev => prev - 1);
                                }}
                                onCommentCountChange={(postId: string, newCount: number) => {
                                    if (activePost.id === postId) {
                                        setActivePost(prev =>
                                            prev ? { ...prev, commentCount: newCount } : prev
                                        );
                                    }
                                    setAllPosts(prev =>
                                        prev.map(p =>
                                            p.id === postId ? { ...p, commentCount: newCount } : p
                                        )
                                    );
                                }}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Active post outside main content still controlled */}
        </div>
    );
}
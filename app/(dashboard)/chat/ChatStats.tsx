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
    const handleBackToList = () => setActivePost(null);
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
            showError("Oops! You need to log in again. 😵‍💫", true);
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
            showError("Oops! You need to log in again. 🤨", true);
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
            showError("Oops! You need to log in again. 🫩", true);
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
        setActivePost(post);
        setActivePostComments([]);

        setNewCommentPosts(prev => {
            const next = new Set(prev);
            next.delete(post.id);
            return next;
        });
    };

    const handleSessionExpired = async () => {
        setShowLoading(true);
        showError("Oops! You need to log in again. 😷", true);
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
            showError("Oops! You need to log in again. 🇪🤯", true);
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
                <div className="flex-1 flex items-center justify-center pt-[56px] text-black w-full">
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
                            <div className="flex items-center justify-start relative w-full">
                                <button onClick={() => setCreatingPost(true)}>
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
                                    className="flex-1 text-center text-sm py-1 transition block active:bg-transparent focus:bg-transparent [-webkit-tap-highlight-color:transparent]"
                                >
                                    <div className="font-semibold">
                                        💼 Hiring NETA Technicians
                                    </div>

                                    <div className="text-xs mt-1">
                                        📍 Multiple locations • Relocation assistance
                                    </div>

                                    <div className="text-blue-400 text-xs mt-2">
                                        View positions →
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
                                    {filteredPosts.map(post => (
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
                                                    {post.nickname}

                                                    {userId && post.userId === userId && (
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.5}
                                                            stroke="currentColor"
                                                            className="size-4 text-amber-500"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                                                            />
                                                        </svg>
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
                                                            <span className="ml-1 text-yellow-400 text-sm font-bold">
                                                            📌
                                                        </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <span className="text-black text-sm sm:text-sm md:text-base ml-auto whitespace-nowrap">
                                                {formatLocalDate(post.timestamp, post.edited)}
                                            </span>
                                            </div>

                                            <h3 className="text-black font-bold mb-0.5 text-sm sm:text-base md:text-base line-clamp-2">
                                                {post.title}
                                            </h3>
                                        </div>
                                    ))}
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
                                        w-full sm:w-auto px-6 py-3
                                        flex items-center justify-center gap-2
                                        rounded-full font-medium text-sm sm:text-base
                                        text-white bg-blue-400
                                        hover:bg-blue-400 active:bg-blue-400
                                        shadow-sm
                                        transition-all duration-200
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
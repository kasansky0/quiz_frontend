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
            showError("Oops! You need to log in again. 🦾", true);
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
            showError("Oops! You need to log in again. 🍓", true);
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
            showError("Session expired. Please log in again.", true);
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
    };

    const handleSessionExpired = async () => {
        setShowLoading(true);
        showError("Oops! You need to log in again. 🎁", true);
    };

    function LoggedOut() {
        const router = useRouter();
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div
                    className="bg-black/70 border border-white/10 shadow-lg rounded-2xl max-w-md w-full p-6 text-center backdrop-blur-md">
                    <h2 className="text-white-400 text-lg font-semibold mb-2 drop-shadow-[0_0_12px_rgba(36,174,124,0.8)]">
                        Session Expired
                    </h2>
                    <p className="text-white-200 text-sm mb-6">
                        Your session has expired. Please log in again to continue.
                    </p>
                    <div className="flex justify-center">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center justify-center bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg px-4 h-8 text-sm text-white-300/80 font-medium hover:bg-dark-400 active:scale-95 transition"
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

                    // fresh data first
                    data.posts.forEach((p: Post) => map.set(p.id, p));

                    // keep existing posts
                    prev.forEach(p => {
                        if (!map.has(p.id)) map.set(p.id, p);
                    });

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

    const formatLocalDate = (dateString?: string, editedString?: string) => {
        if (!dateString) return "";
        let isoString = dateString.split(".")[0] + "Z";
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        let relativeTime = "";
        if (diffSeconds < 60) relativeTime = `${diffSeconds} seconds ago`;
        else if (diffMinutes < 60) relativeTime = `${diffMinutes} minutes ago`;
        else if (diffHours < 24) relativeTime = `${diffHours} hours ago`;
        else if (diffDays < 30) relativeTime = `${diffDays} days ago`;
        else {
            const diffMonths = Math.floor(diffDays / 30);
            if (diffMonths < 12) relativeTime = `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
            else {
                const diffYears = Math.floor(diffMonths / 12);
                relativeTime = `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
            }
        }

        let edited = false;
        if (editedString && editedString !== dateString) edited = true;

        return (
            <span>
                {relativeTime} {edited && <span className="text-white-500/60 text-[10px] ml-1">(Edited)</span>}
            </span>
        );
    };

    const handleCreatePost = async ({title, message}: { title: string; message: string }) => {
        if (!session?.idToken) {
            setShowLoading(true);
            showError("Oops! You need to log in again. 🇪🇸", true);
            return;
        }
        const idToken = session.idToken;
        const sanitizedTitle = DOMPurify.sanitize(title.trim());
        const sanitizedMessage = DOMPurify.sanitize(message.trim());

        try {
            const res = await fetch(`${apiUrl}/posts/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                },
                body: JSON.stringify({title: sanitizedTitle, message: sanitizedMessage}),
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
                    return {posts: [newPost, ...existingPosts], total: total + 1};
                },
                false
            );
            setAllPosts(prev => {
                const map = new Map<string, Post>();
                [newPost, ...prev].forEach(p => map.set(p.id, p)); // keep last one
                return Array.from(map.values());
            });
            setCreatingPost(false);
        } catch (err: any) {
            console.error("Create post error:", err);
            showError("Network error while creating post");
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
        <div className="w-full max-w-4xl mx-auto relative">
            {/* Loading / Error Banner */}
            {(showLoading || serverError) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white pointer-events-none">
                    {showLoading && (
                        <p className="text-xl flex items-center">
                            Loading
                            <span className="ml-2 flex space-x-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                </span>
                        </p>
                    )}
                    {!showLoading && serverError && (
                        <p className="text-center px-4 text-white text-lg">{serverError}</p>
                    )}
                </div>
            )}

            {/* Main Content */}
            {!showLoading && allPosts.length > 0 && (
                <div className="w-full max-w-4xl mx-auto flex flex-col pb-16">
                    {creatingPost && (
                        <CreatePost
                            onSubmit={handleCreatePost}
                            onCancel={() => setCreatingPost(false)}
                            isBlocked={false} // no block while loading already done
                        />
                    )}

                    {!creatingPost && !activePost && (
                        <>
                            {/* Posts list */}
                            <div className="flex items-center justify-start relative">
                                <button onClick={() => setCreatingPost(true)}>
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
                                            d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                        />
                                    </svg>
                                </button>
                                <div className="w-full text-center text-sm py-2">
                                    Promoted: CBS Electrical Contractors <br /> Hiring NETA 2 Techs 📍Raleigh NC
                                </div>
                            </div>

                            <div className={`mx-auto max-w-4xl transition-opacity duration-500 ease-in-out ${listFade ? "opacity-100" : "opacity-0"}`}>
                                <div className="space-y-4">
                                    {filteredPosts.map(post => (
                                        <div
                                            key={post.id}
                                            onClick={() => handleActivatePost(post)}
                                            className="relative px-1 sm:px-2 py-2 cursor-pointer rounded-xl bg-transparent hover:bg-dark-800 transition-colors duration-100"
                                        >
                                            <div className="flex items-center mb-1 w-full">
                                                <div className="flex items-center gap-2 truncate">
                                                <span className="flex items-center gap-1 text-sm sm:text-sm md:text-base font-semibold truncate text-blue-400">
                                                        {post.nickname}

                                                    {userId && post.userId === userId && (
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.5}
                                                            stroke="yellow"
                                                            className="size-4"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                                                            />
                                                        </svg>
                                                    )}
                                                </span>
                                                    <div className="flex items-center justify-center bg-black/70 backdrop-blur-xl border border-white/10 rounded-full shadow-lg px-3 h-6 min-w-[40px] truncate">
                                                        <svg aria-hidden="true" className="w-3 h-3 mr-1 text-white-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M10 1a9 9 0 00-9 9c0 1.947.79 3.58 1.935 4.957L.231 17.661A.784.784 0 00.785 19H10a9 9 0 009-9 9 9 0 00-9-9zm0 16.2H6.162c-.994.004-1.907.053-3.045.144l-.076-.188a36.981 36.981 0 002.328-2.087l-1.05-1.263C3.297 12.576 2.8 11.331 2.8 10c0-3.97 3.23-7.2 7.2-7.2s7.2 3.23 7.2 7.2-3.23 7.2-7.2 7.2z" />
                                                        </svg>
                                                        <span className="text-white-400 text-sm sm:text-sm md:text-base font-medium">{post.commentCount ?? 0}</span>
                                                        {post.pinned && (
                                                            <span className="text-yellow-400 text-sm sm:text-sm md:text-base font-bold ml-1 truncate">📌</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-white-500/60 text-sm sm:text-sm md:text-base ml-auto whitespace-nowrap">{formatLocalDate(post.timestamp, post.edited)}</span>
                                            </div>
                                            <h3 className="text-white-800 font-bold mb-1 text-sm sm:text-base md:text-lg line-clamp-2">{post.title}</h3>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* LOAD MORE POSTS BUTTON */}
                            {allPosts.length < totalPosts && (
                                <div className="flex justify-center my-4 w-full">
                                    <button
                                        onClick={async () => {
                                            setLoadingMore(true);
                                            await loadMorePosts();
                                            setLoadingMore(false);
                                        }}
                                        style={{ touchAction: "manipulation" }}
                                        className="w-full flex justify-center items-center py-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                                        disabled={loadingMore}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className={`w-6 h-6 text-blue-600 transition-transform ${loadingMore ? "animate-spin" : ""}`}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                        <span className="ml-2 text-blue-600 font-medium text-sm sm:text-base">{loadingMore ? "Loading..." : "Load More Posts"}</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Active Post */}
                    <div className={`transition-opacity duration-500 ease-in-out ${listFade ? "opacity-100" : "opacity-0"} w-full flex-1`}>
                        {activePost && (
                            <ActivePost
                                deletedCommentIds={deletedCommentIds}
                                setDeletedCommentIds={setDeletedCommentIds}
                                post={activePost}
                                comments={{ comments: activePostComments, total: Number(activePost.commentCount ?? 0) }}
                                userId={userId}
                                onBack={handleBackToList}
                                totalComments={Number(activePost.commentCount ?? 0)}
                                onPostUpdate={(updatedPost: Post) => {
                                    setAllPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
                                }}
                                onPostDelete={(deletedPostId: string) => {
                                    setAllPosts(prev => prev.filter(p => p.id !== deletedPostId));
                                    setTotalPosts(prev => prev - 1);
                                }}
                                onCommentCountChange={(postId: string, newCount: number) => {
                                    if (activePost.id === postId) {
                                        setActivePost(prev => prev ? { ...prev, commentCount: newCount } : prev);
                                    }
                                    setAllPosts(prev =>
                                        prev.map(p => (p.id === postId ? { ...p, commentCount: newCount } : p))
                                    );
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
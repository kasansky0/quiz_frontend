"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import CreatePost from "./CreatePost";
import { Post, Comment } from "../../hooks/usePosts";
import { useUser } from "../../UserContext";
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { useError } from "@/app/ErrorProvider";
import DOMPurify from 'dompurify';
import ActivePost from "./ActivePost";
import Link from "next/link";
import { formatLocalDate } from "@/app/hooks/formatLocalDate";
import PostThumbnail from "@/app/(dashboard)/feed/PostListThumbnail";
import PostSearchBar from "./PostSearchBar";
import PositionCard from "@/app/PositionCard";
import PostViews from "@/app/(dashboard)/feed/SeenPosts";

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

export default function ChatStats() {
    const [activePost, setActivePost] = useState<Post | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [creatingPost, setCreatingPost] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [loggedOut, setLoggedOut] = useState(false);
    const [listFade, setListFade] = useState(false);
    const [activePostComments, setActivePostComments] = useState<Comment[]>([]);
    const [serverError, setServerError] = useState<string | null>(null);
    const [showLoading, setShowLoading] = useState(true);
    const [deletedCommentIds, setDeletedCommentIds] = useState<Set<string>>(new Set());
    const [postSkip, setPostSkip] = useState(0);
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [totalPosts, setTotalPosts] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
    const [mode, setMode] = useState<"feed" | "search">("feed");
    const [searchQueryState, setSearchQueryState] = useState("");
    const clearLockRef = useRef(false);

    const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

    const togglePostExpand = (postId: string) => {
        setExpandedPosts(prev => {
            const next = new Set(prev);
            next.has(postId) ? next.delete(postId) : next.add(postId);
            return next;
        });
    };

    const handleSearchResults = (posts: Post[], query: string, total: number) => {
        setMode("search");
        setSearchQueryState(query);

        setAllPosts(posts);
        setPostSkip(posts.length);
        setTotalPosts(total);

        if (posts.length === 0) {
            showError("No posts found for this search.", false);
        }
    };

    const {userId} = useUser();
    const router = useRouter();
    const {showError, hideError} = useError();
    const handleBackToList = () => {
        setActivePost(null);
        requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
        });
    };
    const postLimit = 10; // number of posts to fetch per batch


    // 1.Network event listeners
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
                credentials: "include",
                headers: {
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
        if (mode !== "feed") return; // 🚨 critical guard

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

// --- 2. Optional: auto retry when back online ---
    useEffect(() => {
        if (isOnline && showLoading) {
            loadInitialPosts(); // retry fetching posts
        }
    }, [isOnline]);

    useEffect(() => {
        if (mode === "feed") {
            loadInitialPosts();
        }
    }, [mode]);

    const loadMorePosts = async () => {
        if (loadingMore) return;
        setLoadingMore(true);

        try {
            const data =
                mode === "search"
                    ? await fetchSearchPosts(searchQueryState, postSkip, postLimit)
                    : await fetchPosts(postSkip, postLimit);

            if (!data || !Array.isArray(data.posts)) {
                showError("Invalid server response");
                return;
            }

            setAllPosts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newPosts = data.posts.filter((p: Post) => !existingIds.has(p.id));
                return [...prev, ...newPosts];
            });

            setPostSkip(prev => prev + data.posts.length);
            setTotalPosts(data.total);
        } catch (err) {
            showError("Failed to load more posts");
        } finally {
            setLoadingMore(false);
        }
    };

    // 3. Fade-in effect
    useEffect(() => {
        const timer = setTimeout(() => setListFade(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // --- COMMENTS POLLING ---
    const commentsFetcher = async (url: string) => {
        const res = await fetch(url, {
            credentials: "include",
            headers: {
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

        setExpandedPosts(new Set());

        requestAnimationFrame(() => {
            window.scrollTo(0, 0);
        });
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
        if (mode === "feed") {
            loadInitialPosts();
        }
    }, [mode]);

    const handleCreatePost = async ({
                                        title,
                                        message,
                                        images,
                                        tags,
                                    }: {
        title: string;
        message: string;
        images: File[];
        tags: string[];
    }) => {
        const sanitizedTitle = DOMPurify.sanitize(title.trim());
        const sanitizedMessage = DOMPurify.sanitize(message.trim());

        setCreatingPost(true); // ✅ use ONE loader only

        try {

            // =========================
            // 1. UPLOAD IMAGES FIRST
            // =========================

            type UploadedImage = {
                url: string;
                thumbnail: string;
                public_id?: string;
            };

            let uploadedImages: UploadedImage[] = [];

            if (images && images.length > 0) {

                const formData = new FormData();

                images.forEach((image) => {
                    formData.append("files", image);
                });

                const mediaRes = await fetch(`${apiUrl}/media/upload`, {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                });

                if (!mediaRes.ok) {

                    if (mediaRes.status === 401) {
                        setShowLoading(true);
                        showError("You need to log in again.", true);
                        return;
                    }

                    const mediaErr = await mediaRes.json().catch(() => null);

                    let msg = "Failed to upload images";

                    if (mediaErr?.detail) {
                        msg =
                            typeof mediaErr.detail === "string"
                                ? mediaErr.detail
                                : mediaErr.detail.error ?? msg;
                    } else if (mediaErr?.error) {
                        msg = mediaErr.error;
                    }

                    showError(msg);
                    return;
                }

                const mediaData = await mediaRes.json();

                // expects backend returns:
                // { urls: ["https://..."] }

                uploadedImages = mediaData.images || [];
            }

            // =========================
            // 2. CREATE POST
            // =========================

            const res = await fetch(`${apiUrl}/posts/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: sanitizedTitle,
                    message: sanitizedMessage,
                    images: uploadedImages,
                    tags,
                }),
            });

            if (!res.ok) {

                if (res.status === 401) {
                    setShowLoading(true);
                    showError("You need to log in again.", true);
                    return;
                }

                const err = await res.json().catch(() => null);

                let msg = "Failed to create post";

                if (err?.detail) {
                    msg =
                        typeof err.detail === "string"
                            ? err.detail
                            : err.detail.error ?? msg;
                } else if (err?.error) {
                    msg = err.error;
                }

                showError(msg);
                return;
            }

            const newPost: Post = await res.json();

            globalMutate(
                `${apiUrl}/posts/`,
                (cachedData: { posts: Post[]; total: number } | undefined) => {

                    const existingPosts = cachedData?.posts ?? [];
                    const total = cachedData?.total ?? 0;

                    return {
                        posts: [newPost, ...existingPosts],
                        total: total + 1,
                    };
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
        allPosts.forEach(p => uniqueMap.set(p.id, p));

        const uniquePosts = Array.from(uniqueMap.values());

        return uniquePosts.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime();
        });
    }, [allPosts]);



    const fetchSearchPosts = async (query: string, skip: number, limit: number) => {
        const res = await fetch(
            `${apiUrl}/posts/search?q=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`,
            {
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const data = await res.json();
        if (!res.ok) return { posts: [], total: 0 };

        return data;
    };



    const handleClearSearch = () => {
        // 🚫 prevent unnecessary repeated clicks
        if (clearLockRef.current) return;
        clearLockRef.current = true;

        setSearchQueryState("");
        setServerError(null);

        // just switch mode — DO NOT fetch here
        setMode("feed");

        setTimeout(() => {
            clearLockRef.current = false;
        }, 300);
    };



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
            {!showLoading && (
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
                                <PositionCard />



                            </div>






                            <PostSearchBar
                                onResults={handleSearchResults}
                                onLoading={setShowLoading}
                                onClear={handleClearSearch}
                            />





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
                                            `}
                                            >










                                                <div className="flex w-full gap-3 items-stretch">

                                                    {/* LEFT SIDE */}
                                                    <div className="flex flex-col flex-1 min-w-0">

                                                        {/* TOP ROW: badge + nickname + stats + date */}
                                                        <div className="flex items-center gap-2 w-full">

                                                            {/* NICKNAME + BADGE AREA */}
                                                            <span className="flex items-center gap-1 text-sm sm:text-sm md:text-base font-bold truncate text-blue-400">

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
                                                                <span className="truncate">
                                                                    {post.nickname}
                                                                </span>

                                                                {/* Your own user dot */}
                                                                {userId && post.userId === userId && (
                                                                    <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-500 opacity-80" />
                                                                )}
                                                            </span>

                                                            {/* COMMENT COUNT */}
                                                            <div className="flex items-center justify-center bg-white backdrop-blur-xl border border-black/10 rounded-full shadow-lg px-2 h-5 min-w-[40px] truncate">

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

                                                        {/* TITLE */}
                                                        <h3 className="text-black font-bold mb-0.5 text-sm sm:text-base md:text-base line-clamp-4 mt-1">
                                                            {post.title}
                                                        </h3>

                                                        {/* TAGS */}
                                                        {Array.isArray(post.tags) && post.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1 mb-1 text-[11px] text-neutral-500">
                                                                {post.tags.slice(0, 5).map((tag, idx) => {
                                                                    if (typeof tag !== "string") return null;

                                                                    const cleanTag = tag.trim();
                                                                    if (!cleanTag) return null;

                                                                    const displayTag =
                                                                        cleanTag.length > 20
                                                                            ? `${cleanTag.slice(0, 15)}...`
                                                                            : cleanTag;

                                                                    return (
                                                                        <span
                                                                            key={`${cleanTag}-${idx}`}
                                                                            className="
                                                                                text-neutral-500
                                                                                hover:text-neutral-700
                                                                                transition-colors
                                                                                select-none
                                                                            "
                                                                            title={cleanTag}
                                                                        >
                                                                            #{displayTag}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}



                                                    </div>

                                                    {/* RIGHT SIDE: THUMBNAIL */}
                                                    <PostThumbnail
                                                        images={
                                                            post.images?.length
                                                                ? post.images.map((img: any) =>
                                                                    typeof img === "string"
                                                                        ? img
                                                                        : img?.thumbnail || img?.url || img?.secure_url
                                                                )
                                                                : []
                                                        }
                                                    />

                                                </div>

                                                {/* DATE + VIEWS ROW */}
                                                <div className="flex items-baseline justify-between text-xs sm:text-sm text-neutral-600 pt-3">

                                                    <div className="leading-none flex items-center">
                                                        <PostViews
                                                            uniqueViews={post.uniqueSeenUsers ?? 0}
                                                            totalViews={post.totalViews ?? 0}
                                                        />
                                                    </div>

                                                    <span className="leading-none">
                                                        Posted {formatLocalDate(post.timestamp, post.edited)}
                                                    </span>

                                                </div>





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
                                expandedPosts={expandedPosts}
                                togglePostExpand={togglePostExpand}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
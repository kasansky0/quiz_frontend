"use client";

import {Comment, Post} from "../../hooks/usePosts";
import { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import {useError} from "@/app/ErrorProvider";
import { chatApis } from '@/app/hooks/chatApis'; // adjust path as needed
import useSWR, { mutate as globalMutate } from "swr";
import { useSession, signOut, getSession } from "next-auth/react"; // ✅ add useSession
import { fetchWithToken } from "@/app/hooks/refreshToken";
import StatusBanner from "@/app/positiveBanner";
import { useRouter } from "next/navigation";
import Link from "next/link";




const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
const COMMENTS_PAGE_SIZE = 25;
const commentsKey = (postId: string, skip: number) => `${apiUrl}/posts/${postId}/comments?skip=${skip}&limit=${COMMENTS_PAGE_SIZE}`;

const fetcher = async (url: string) => {
    const session = await getSession();
    const idToken = session?.idToken;

    if (!idToken) throw new Error("No session");

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
        credentials: "include",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.json();
};

type Props = {
    post: Post;
    deletedCommentIds: Set<string>;
    setDeletedCommentIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    comments: { comments: Comment[]; total: number };
    userId?: string | null;
    onBack: () => void;
    totalComments: number;
    onPostUpdate?: (updatedPost: Post) => void;   // <-- new
    onPostDelete?: (deletedPostId: string) => void; // <-- new
    onCommentCountChange?: (postId: string, newCount: number) => void; // ← new
};

export default function ActivePost({ post, comments, userId, onBack, totalComments, onPostDelete, onPostUpdate, onCommentCountChange }: Props) {
    const { data: session, status } = useSession();

    // 1️⃣ While session is loading, just show a placeholder
    if (status === "loading") {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen text-black">
                <p className="text-xl flex items-center">
                    Loading
                    <span className="ml-2 flex space-x-1">
                          <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce"></span>
                          <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                          <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                        </span>
                </p>
            </div>
        );
    }

    // 2️⃣ If session is unauthenticated but userId prop exists,
    // you can still render UI and let buttons work
    if (status === "unauthenticated" && !userId) {
        return null;
    }
    const [commentMessage, setCommentMessage] = useState("");
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editMessage, setEditMessage] = useState("");
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentMessage, setEditCommentMessage] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [isBlocked, setIsBlocked] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
    const [blockSeconds, setBlockSeconds] = useState<number | null>(null);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);
    const { showError, hideError } = useError();
    const [activePost, setActivePost] = useState<Post>(post);
    const [fade, setFade] = useState(false);
    const [blockMessage, setBlockMessage] = useState<string | null>(null);
    const [showLoading, setShowLoading] = useState(true);
    const [commentsSkip, setCommentsSkip] = useState(0); // number of comments already loaded
    const commentsArray = comments?.comments ?? [];
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreComments, setHasMoreComments] = useState(totalComments > COMMENTS_PAGE_SIZE);
    const [displayedComments, setDisplayedComments] = useState<Comment[]>([]);
    const [statusBanner, setStatusBanner] = useState<{ message: string; type?: "loading" | "success" | "error" } | null>(null);
    const [isButtonLoading, setIsButtonLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [deletedCommentIds, setDeletedCommentIds] = useState<Set<string>>(new Set());
    const router = useRouter();
    const { fetchPostComments } = chatApis({ apiUrl });





    function NetaInline({ user }: { user: any }) {
        const level = user?.neta4 ? 4 : user?.neta3 ? 3 : user?.neta2 ? 2 : null;

        if (!level) return null;

        return (
            <span className="flex items-center justify-center flex-shrink-0">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 64 64"
                className="w-5 h-5"
            >
                {/* Outer hex */}
                <polygon
                    points="32,4 56,18 56,46 32,60 8,46 8,18"
                    fill="currentColor"
                    className={
                        level === 4
                            ? "text-blue-500"
                            : level === 3
                                ? "text-purple-500"
                                : "text-green-600"
                    }
                />

                {/* Inner */}
                <polygon
                    points="32,10 50,21 50,43 32,54 14,43 14,21"
                    fill="white"
                />

                {/* Text */}
                <text
                    x="32"
                    y="38"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="900"
                    fill={
                        level === 4
                            ? "#3b82f6"
                            : level === 3
                                ? "#8b5cf6"
                                : "#22c55e"
                    }
                    fontFamily="Arial, sans-serif"
                >
                    {level === 4 ? "N4" : level === 3 ? "N3" : "N2"}
                </text>
            </svg>
        </span>
        );
    }







    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const confirmDelete = () => {
        if (!pendingDeleteId) return;

        handleDeletePost(pendingDeleteId);

        setShowDeleteConfirm(false);
        setPendingDeleteId(null);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setPendingDeleteId(null);
    };







    const [showDeleteCommentConfirm, setShowDeleteCommentConfirm] = useState(false);
    const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState<string | null>(null);
    const confirmCommentDelete = () => {
        if (!pendingDeleteCommentId) return;

        const comment = displayedComments.find(
            c => c._id === pendingDeleteCommentId
        );

        if (!comment) return;

        handleDeleteComment(comment);

        setShowDeleteCommentConfirm(false);
        setPendingDeleteCommentId(null);
    };

    const cancelCommentDelete = () => {
        setShowDeleteCommentConfirm(false);
        setPendingDeleteCommentId(null);
    };









    const showStatusBanner = (message: string, type: "loading" | "success" | "error" = "loading") => {
        setStatusBanner({ message, type });
        setIsSending(true); // 🔒 lock

        setTimeout(() => {
            setStatusBanner(null);
            setIsSending(false); // 🔓 unlock AFTER banner
        }, 2000);
    };

// POLL LATEST COMMENTS FOR THE POST EVERY 1 SECOND AND TRACK ERRORS //
//    const { data: polledData, error } = useSWR(
//        commentsKey(post.id, 0), // always fetch from skip=0 to get latest
//        fetcher,
//        { refreshInterval: 300000 } // fetch every 1 minute
//    );

    const { data: polledData, error } = useSWR(
        commentsKey(post.id, 0),
        fetcher,
        {
            refreshInterval: 5000,
            fallbackData: comments, // use the comments prop you already have
            revalidateOnMount: false // prevents SWR from fetching immediately on mount
        }
    );

//LOAD NEXT PAGE OF COMMENTS FOR THE ACTIVE POST //
    const handleLoadMore = async () => {
        if (!activePost) return;

        try {
            const data = await fetchPostComments(activePost.id, commentsSkip, COMMENTS_PAGE_SIZE);

            if (!data || !data.comments.length) {
                setHasMoreComments(false);
                return;
            }

            setDisplayedComments(prev => {
                const sortedNew = [...data.comments].sort(
                    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );

                const updated = [...prev, ...sortedNew];

                setHasMoreComments(updated.length < totalComments);

                return updated;
            });

            setCommentsSkip(prev => prev + data.comments.length);
            setCurrentPage(prev => prev + 1);

        } catch (err) {
            setShowLoading(true);
            showError("Oops! You need to log in again.😎", true);
            router.push("/info");
        }
    };

// FORMAT DATE AS X TIME AGO AND INDICATE IF EDITED //
    const formatLocalDate = (dateString?: string, editedString?: string) => {
        if (!dateString) return "";

        // Parse original date
        let isoString = dateString.split(".")[0] + "Z";
        const date = new Date(isoString);
        const now = new Date();

        // Compute relative time
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

        // Check if edited exists and is different
        let edited = false;
        if (editedString && editedString !== dateString) {
            edited = true;
        }

        return (
            <span>
            {relativeTime} {edited && <span className="text-black text-[10px] ml-1">(Edited)</span>}
        </span>
        );
    };

// Add comment to active activePost
    const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

// ENSURE LOAIDNG INDICATOR SHOWS FOR AT LEAST 1.5 SECONDS BEFORE HIDING //
    useEffect(() => {
        const timer = setTimeout(() => setShowLoading(false), 1500); // 3 seconds minimum
        return () => clearTimeout(timer);
    }, []);

// TOGGLE LOADING STATE INDICATOR BASED ON WHETHER COMMENTS HAVE BEEN RECEIVED OR POLLED //
    useEffect(() => {
        if (commentsArray?.length || polledData?.comments?.length) {
            setShowLoading(false);
        }
    }, [commentsArray, polledData]);

// MERGE NEWLY POLLED COMMENTS WITH DISPLAYED COMMENTS, REMOVE DUPS, SORT BY TIME, UPDATE PAGINATION //

    useEffect(() => {
        if (!polledData?.comments?.length) return;

        const polledComments = polledData.comments as Comment[]; // ✅ cast to Comment[]

        setDisplayedComments(prev => {
            // 0️⃣ Filter out deleted comments so they don't reappear
            const filteredPolled = polledComments.filter(c => !deletedCommentIds.has(c._id));

            // 1️⃣ Merge old + new comments
            const merged = [...prev, ...filteredPolled];

            // 2️⃣ Deduplicate by _id
            const dedupedMap = new Map<string, Comment>();
            merged.forEach(c => dedupedMap.set(c._id, c));

            // 3️⃣ Sort by timestamp ascending (old → new)
            const sorted = Array.from(dedupedMap.values()).sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            // 4️⃣ Reverse so newest is at bottom
            const reversed = sorted.reverse();

            // 5️⃣ Update commentsSkip
            setCommentsSkip(reversed.length);

            return reversed;
        });
    }, [polledData, deletedCommentIds]);

// SYNC AND SORT DISPLAY COMMENTS ON NEW DATA //
    useEffect(() => {
        if (!commentsArray.length) return;

        const filteredComments = commentsArray.filter(
            c => !deletedCommentIds.has(c._id)
        );

        setDisplayedComments(filteredComments.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));

        setCommentsSkip(filteredComments.length);
        setCurrentPage(1);
        setHasMoreComments(totalComments > COMMENTS_PAGE_SIZE);
    }, [commentsArray, deletedCommentIds, totalComments]);

// TRIGGER FADE IN ANIMATION ON MOUNT //
    useEffect(() => {
        const timer = setTimeout(() => setFade(true), 50);
        return () => clearTimeout(timer);
    }, []);

// BLOCKED USER COUNTDOWN //
    useEffect(() => {
        if (!isBlocked || blockSeconds === null) return;

        const timer = setInterval(() => {
            setBlockSeconds(prev => {
                if (prev === null || prev <= 1) {
                    setIsBlocked(false);
                    hideError();
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isBlocked, blockSeconds, hideError]);



    useEffect(() => {
        const el = commentInputRef.current;
        if (!el) return;

        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    }, [commentMessage]);



    const placeholderText = isBlocked
        ? `Blocked for ${blockSeconds}s...`
        : "Add a comment...";

















// COMMENT ADD //
    const handleAddComment = async (message: string) => {

        if (!userId || !session?.idToken) {
            setShowLoading(true);
            showError("Oops! You need to log in again. 😨", true)
            // optionally include a login button in banner
            return;
        }

        if (!activePost || !message.trim() || !userId || isSending || isBlocked) return;

        const sanitizedMessage = DOMPurify.sanitize(message.trim());

        try {
            showStatusBanner("Sending...", "loading");
            const res = await fetchWithToken(`${apiUrl}/posts/${activePost.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: sanitizedMessage }),
            });
            setCommentMessage("");

            // Handle null / network failure
            if (!res) {
                setShowLoading(true);
                showError("Oops! You need to log in again. 😠", true);
                showStatusBanner("Failed to send comment", "error");
                return;
            }

            if (!res.success) {
                const err = res.data || {};
                const detail = err?.detail || {};

                // normalize backend shape
                const type = detail?.type;
                const message = detail?.error || err?.error || res?.message;

                // 🔴 BLOCKED USER
                if (detail?.blocked || type === "blocked") {
                    const msg = message || "You are temporarily blocked. Please wait.";
                    setBlockMessage(msg);
                    if (detail?.remaining) setBlockSeconds(detail.remaining);
                    setIsBlocked(true);
                    showError(msg);
                    return;
                }

                // 🔴 RATE LIMIT
                if (res.status === 429 || type === "rate_limit") {
                    const seconds = detail?.remaining || 60;
                    setIsBlocked(true);
                    setBlockSeconds(seconds);
                    showError(`Slow down. Wait ${seconds} second${seconds !== 1 ? "s" : ""}.`);
                    return;
                }

                // 🔴 PROFANITY / VALIDATION ERROR
                if (type === "profanity" || type === "validation_error") {
                    showError(message || "Please avoid inappropriate language.");
                    return;
                }

                // 🔴 AUTH / SESSION EXPIRED
                if (type === "auth" || res.status === 401) {
                    setShowLoading(true);
                    showError("Oops! You need to log in again. 🫡", true);
                    return;
                }

                // 🔴 FALLBACK (REAL ERROR ONLY)
                showError(message || "Something went wrong.");
                return;
            }

            const newComment: Comment = await res.data;

            // 🔹 Extra SWR fetch trigger 2 seconds after comment is added
            setTimeout(() => {
                globalMutate(commentsKey(activePost.id, 0)); // trigger re-fetch for this post's comments
            }, 1000);

            // COMMENT ADD
            onCommentCountChange?.(activePost.id, (totalComments || 0) + 1);


            setCurrentPage(1);
            setCommentsSkip(prev => prev + 1);
            setCommentMessage("");
            if (commentInputRef.current) commentInputRef.current.style.height = "auto";
            hideError();

        } catch (err: any) {
            console.error("Failed to post comment:", err);
            setShowLoading(true);
            showError("Oops! You need to log in again. 😞", true);
        }
    };



// COMMENT DELETE //

    const handleDeleteComment = async (comment: Comment) => {
        if (!activePost || !comment._id) return;

        const previousComments = [...displayedComments]; // backup for rollback

        // ✅ Track deleted comment
        setDeletedCommentIds(prev => new Set(prev).add(comment._id));

        try {
            // add to deleted set in parent
            setDeletedCommentIds(prev => new Set(prev).add(comment._id));

            // 1️⃣ Optimistically remove comment from UI
            setDisplayedComments(prev =>
                prev.filter(c => c._id !== comment._id)
            );

            // Update activePost locally
            setActivePost(prev =>
                prev
                    ? { ...prev, comments: prev.comments?.filter(c => c._id !== comment._id) }
                    : prev
            );

            // 2️⃣ Mutate the SWR keys exactly like edit does
            globalMutate(
                `${apiUrl}/posts/`,
                (cachedData: { posts: Post[]; total: number } | undefined) => {
                    if (!cachedData) return cachedData;
                    const updatedPosts = cachedData.posts.map(p =>
                        p.id === activePost.id
                            ? { ...p, comments: p.comments?.filter(c => c._id !== comment._id) }
                            : p
                    );
                    return { ...cachedData, posts: updatedPosts };
                },
                false
            );

            globalMutate(
                `${apiUrl}/posts/${activePost.id}`,
                (cachedPost: Post | undefined) => {
                    if (!cachedPost) return cachedPost;
                    return {
                        ...cachedPost,
                        comments: cachedPost.comments?.filter(c => c._id !== comment._id)
                    };
                },
                false
            );

            // 2️⃣b Trigger re-fetch for server validation
            setTimeout(() => {
                globalMutate(commentsKey(activePost.id, 0)); // fetch latest from server
            }, 1000);

            globalMutate(
                commentsKey(activePost.id, 0),
                (cachedComments: { comments: Comment[]; total: number } | undefined) => {
                    if (!cachedComments) return cachedComments;
                    return {
                        ...cachedComments,
                        comments: cachedComments.comments.filter(c => c._id !== comment._id),
                        total: cachedComments.total - 1
                    };
                },
                false
            );

            // 3️⃣ Call backend
            const res = await fetchWithToken(
                `${apiUrl}/posts/${activePost.id}/comments/${comment._id}`,
                { method: "DELETE" }
            );

            if (!res || !res.success) {
                // rollback on failure
                setDeletedCommentIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(comment._id);
                    return newSet;
                });

                setDisplayedComments(previousComments);
                setActivePost(prev =>
                    prev ? { ...prev, comments: previousComments } : prev
                );
                showError("Oops! You need to log in again.😎", true);
            }
        } catch (err) {
            setDeletedCommentIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(comment._id);
                return newSet;
            });

            setDisplayedComments(previousComments);
            setActivePost(prev =>
                prev ? { ...prev, comments: previousComments } : prev
            );
            console.error("Delete comment error:", err);
            showError("⚠️ Network error.");
        }
    };


// COMMENT EDIT //

    const handleEditComment = async () => {
        if (!activePost || !editingCommentId) return;

        let trimmed = editCommentMessage.trim();

        // ✅ enforce 500-character limit
        if (trimmed.length > 500) {
            trimmed = trimmed.slice(0, 500);
            setEditCommentMessage(trimmed); // update state so input reflects limit
        }

        // Sanitize after trimming
        const sanitizedMessage = DOMPurify.sanitize(trimmed);

        // 🗑️ If empty → DELETE instead of PATCH
        if (trimmed === "") {
            const res = await fetchWithToken(`${apiUrl}/posts/${activePost.id}/comments/${editingCommentId}`, {
                method: "DELETE",
            });

            // handle null / network failure
            if (!res) {
                showError("We couldn't update your comment. Please check your connection and try again.");
                return;
            }

            if (!res.success) {
                if (res.status === 401) {
                    setShowLoading(true);
                    showError("Oops! You need to log in again. 😀", true);
                    return;
                }
                showError("We couldn't update your comment. Please try again.");
                return;
            }

            setEditingCommentId(null);
            setEditCommentMessage("");
            return;
        }

        // ✏️ Otherwise → normal edit
        const res = await fetchWithToken(`${apiUrl}/posts/${activePost.id}/comments/${editingCommentId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: sanitizedMessage }),
        });

        if (!res) {
            showError("Network error: unable to reach server.");
            return;
        }

        if (!res.success) {
            if (res.status === 401) {
                setShowLoading(true);
                showError("Oops! You need to log in again. 😖", true);
                return;
            }
            showError("We couldn't update your comment. Please try again.");
            return;
        }

        const updatedComment: Comment = await res.data;


        // update visible comments
        setDisplayedComments(prev =>
            prev.map(c => (c._id === updatedComment._id ? updatedComment : c))
        );

        // update active post
        setActivePost(prev => {
            if (!prev || !prev.comments) return prev;

            return {
                ...prev,
                comments: prev.comments.map(c =>
                    c._id === updatedComment._id ? updatedComment : c
                )
            };
        });
        globalMutate(`${apiUrl}/posts/`, (cachedData: { posts: Post[]; total: number } | undefined) => {
            if (!cachedData) return { posts: [], total: 0 };

            const newPosts = cachedData.posts.map(p =>
                p.id === activePost.id
                    ? {
                        ...p,
                        comments: (p.comments || []).map(c =>
                            c._id === updatedComment._id ? updatedComment : c
                        )
                    }
                    : p
            );

            return { ...cachedData, posts: newPosts };
        }, false);

        setEditingCommentId(null);
    };

// COMMENT EDIT //

    const startEditComment = (comment: Comment) => {
        setEditingCommentId(comment._id);
        setEditCommentMessage(comment.message);
    };

















// POST DELETE AND UPDATE UI //

    const handleDeletePost = async (postId: string) => {

        try {
            const res = await fetchWithToken(`${apiUrl}/posts/${postId}`, {
                method: "DELETE",
            });

            if (!res) {
                showError("We couldn't delete the post. Please check your internet and try again.");
                return;
            }

            if (!res.success) {
                if (res.status === 401) {
                    setShowLoading(true);
                    showError("Oops! You need to log in again. 🤪", true);
                    return;
                }
                showError("We couldn't delete the post. Please try again.");
                return;
            }

            // Push change to parent
            onPostDelete?.(postId);

            // ✅ Optimistically update SWR cache
            globalMutate(`${apiUrl}/posts/`, (cachedData: { posts: Post[]; total: number } | undefined) => {
                if (!cachedData) return { posts: [], total: 0 };

                const newPosts = cachedData.posts.filter(p => p.id !== postId);
                return { posts: newPosts, total: cachedData.total - 1 }; // decrease total
            });

            onBack(); // optional: go back to list

        } catch (err: any) {
            console.error("Delete post error:", err);
            showError("We couldn't delete the post. Please try again.");
        }
    };

// POST EDIT SAVE EDITS TO A POST AND UPDATE UI //

    const handleEditPost = async () => {
        if (!editingPostId) return;

        // Sanitize input
        const sanitizedTitle = DOMPurify.sanitize(editTitle.trim());
        const sanitizedMessage = DOMPurify.sanitize(editMessage.trim());

        try {
            const res = await fetchWithToken(`${apiUrl}/posts/${editingPostId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: sanitizedTitle,
                    message: sanitizedMessage,
                }),
            });

            if (!res) {
                showError("We couldn't save your changes. Please check your internet and try again.");
                return;
            }

            if (!res.success) {
                if (res.status === 401) {
                    setShowLoading(true);
                    showError("Oops! You need to log in again. 🥳", true);
                    return;
                }
                showError("We couldn't save your changes. Please try again.");
                return;
            }

            const updatedPost: Post = await res.data;

            // Push change to parent
            onPostUpdate?.(updatedPost);

            // ✅ Optimistically update SWR cache
            globalMutate(`${apiUrl}/posts/`, (cachedData: { posts: Post[]; total: number } | undefined) => {
                if (!cachedData) return { posts: [], total: 0 };

                const newPosts = cachedData.posts.map(p => (p.id === updatedPost.id ? updatedPost : p));
                return { ...cachedData, posts: newPosts };
            }, false);

            // ✅ Update local activePost so UI reflects changes immediately
            setActivePost(updatedPost);

            // ✅ Exit edit mode
            setEditingPostId(null);
            hideError();

        } catch (err: any) {
            console.error("Edit post error:", err);
            showError("We couldn't save your changes. Please try again.");
        }
    };

// POST EDIT INITIALIZE POST EDITING (POPULATE FORM) //

    const startEditPost = (post: Post) => {
        setEditingPostId(post.id);
        setEditTitle(post.title);
        setEditMessage(post.message);
    };



























































    return (
        <div className={`transition-opacity duration-500 ease-in-out ${fade ? "opacity-100" : "opacity-0"}`}>

            {showLoading ? (
                <div className="flex-1 flex items-center justify-center min-h-screen text-black">
                    <p className="text-xl flex items-center">
                        Loading
                        <span className="ml-2 flex space-x-1">
                          <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce"></span>
                          <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                          <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                        </span>
                    </p>
                    {blockMessage && (
                        <p className="mt-4 text-red-400 text-sm text-center">{blockMessage}</p>
                    )}
                </div>
            ) : (





                <div className="flex flex-col w-full">


                    {/* Back button like Reddit, aligned left */}
                    <div className="flex items-center justify-start">
                        <button
                            onClick={onBack}
                            title="Back"
                            className="p-2 rounded-full hover:bg-white border border-transparent hover:border-neutral-200 transition z-10"
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

                        {/* Future Ads / Message */}
                        <Link
                            href="/position"
                            className="w-full text-center text-xs block active:bg-transparent focus:bg-transparent [-webkit-tap-highlight-color:transparent]"
                        >
                            <div className="flex flex-col items-center space-y-1 pb-3">

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



                        <div className="space-y-3 pb-16">

                            {/* Post */}
                            <div className="z-10 sm:px-4 py-4 px-4 rounded-xl bg-white border border-black/10 shadow-sm mb-2">


                                <div className="flex justify-between items-center pb-3">
                                    {/* Nickname on the left */}
                                    <div className="flex items-center gap-2">

                                        {/* BADGE */}
                                        <NetaInline user={activePost} />

                                        {/* NICKNAME */}
                                        <span className="text-sm sm:text-sm md:text-base font-semibold truncate text-blue-400">
                                            {activePost.nickname}
                                        </span>

                                        {/* OWNER DOT */}
                                        {userId && activePost.userId === userId && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 opacity-80 flex-shrink-0" />
                                        )}
                                    </div>


                                    {/* Back button + Delete button on the right */}
                                    <div className="flex items-center gap-1">


                                        {userId && activePost.userId === userId && (
                                            editingPostId === activePost.id ? (
                                                <>


                                                    <button
                                                        onClick={() => setEditingPostId(null)}
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.5}
                                                            stroke="currentColor"
                                                            className="w-6 h-6"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                            />
                                                        </svg>
                                                    </button>

                                                    <button
                                                        onClick={handleEditPost}
                                                        disabled={!editMessage.trim()}
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.5}
                                                            stroke="currentColor"
                                                            className="w-6 h-6"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                            />
                                                        </svg>
                                                    </button>


                                                </>
                                            ) : (
                                                // Normal: show Edit + Delete
                                                <>


                                                    <button
                                                        onClick={() => startEditPost(activePost)}
                                                        className="p-1 text-black hover:text-black rounded-full"
                                                        title="Edit Post"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.5}
                                                            stroke="currentColor"
                                                            className="w-5 h-5"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                                            />
                                                        </svg>
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setPendingDeleteId(activePost.id);
                                                            setShowDeleteConfirm(true);
                                                        }}
                                                        className="p-2 rounded-full active:bg-black/10"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.5}
                                                            stroke="currentColor"
                                                            className="w-5 h-5"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                                            />
                                                        </svg>
                                                    </button>
                                                </>
                                            )
                                        )}
                                    </div>
                                </div>


                                {editingPostId === activePost.id ? (
                                    <div className="space-y-2">
                                        {/* Edit Title */}
                                        <textarea
                                            value={editTitle}
                                            style={{ WebkitOverflowScrolling: "touch" }}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value.length <= 100) setEditTitle(value); // 100 char limit
                                            }}
                                            rows={3}
                                            placeholder="Edit title..."
                                            className="bg-transparent w-full rounded-xl bg-black-200 border border-black/10 px-2 py-1 text-sm sm:text-sm md:text-base text-black resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
                                        />
                                        <div className="text-black text-xs text-right">
                                            {editTitle.length}/100
                                        </div>

                                        {/* Edit Message */}
                                        <textarea
                                            value={editMessage}
                                            style={{ WebkitOverflowScrolling: "touch" }}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value.length <= 500) setEditMessage(value); // 500 char limit
                                            }}
                                            rows={11}
                                            placeholder="Edit message..."
                                            className="bg-transparent w-full rounded-xl bg-black-200 border border-black/10 px-2 py-1 text-sm sm:text-sm md:text-base text-black resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
                                        />
                                        <div className="text-black text-xs text-right">
                                            {editMessage.length}/500
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Topic / Title */}
                                        <h3 className="text-black font-bold mb-3 text-sm sm:text-base md:text-base">
                                            {activePost.title}
                                        </h3>

                                        {/* Message */}
                                        <p className="text-black break-words text-sm sm:text-sm md:text-base">
                                            {activePost.message}
                                        </p>
                                    </>
                                )}


                            </div>


                            {/* Add comment */}
                            <div className="z-10 w-full bg-white border border-black/10 rounded-xl shadow-sm p-2 mt-2">

                                {/* 🚨 Block Banner */}
                                {isBlocked && blockMessage && (
                                    <div className="mb-2 text-red-400 text-xs sm:text-sm text-center">
                                        {blockMessage} {blockSeconds ? `Wait ${blockSeconds}s.` : null}
                                    </div>
                                )}

                                <form
                                    className="flex items-end gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (!commentMessage.trim() || isBlocked) return;
                                        handleAddComment(commentMessage.trim());
                                        requestAnimationFrame(() => setCommentMessage(""));
                                    }}
                                >
                                    {/* Input box */}
                                    <textarea
                                        ref={commentInputRef}
                                        placeholder={placeholderText}
                                        rows={1}
                                        className="
                                            flex-1
                                            resize-none
                                            bg-black-200
                                            border border-black/10
                                            rounded-xl
                                            px-3 py-2
                                            text-sm sm:text-base
                                            text-black
                                            placeholder-black/50
                                            focus:outline-none
                                            focus:ring-2
                                            focus:ring-blue-400/30
                                            focus:bg-white
                                            transition
                                            min-h-[42px]
                                        "
                                        value={commentMessage}
                                        onChange={(e) => {
                                            if (isSending) return;
                                            const value = e.target.value;
                                            if (value.length <= 500) setCommentMessage(value);
                                            else setCommentMessage(value.slice(0, 500));
                                        }}
                                        disabled={isBlocked || isSending}
                                    />

                                    {/* Send button */}
                                    <button
                                        type="submit"
                                        disabled={!commentMessage.trim() || isBlocked || isSending}
                                        className="
                                            h-[42px] w-[42px]
                                            flex items-center justify-center
                                            rounded-xl
                                            bg-blue-500
                                            hover:bg-blue-600
                                            disabled:opacity-40
                                            transition
                                        "
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="white"
                                            className="w-5 h-5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9 12.75 11.25 15 15 9.75"
                                            />
                                        </svg>
                                    </button>
                                </form>

                                {/* Status */}
                                {statusBanner && (
                                    <div className="mt-2">
                                        <StatusBanner
                                            message={statusBanner.message}
                                            type={statusBanner.type}
                                            onClose={() => setStatusBanner(null)}
                                            inline={true}
                                        />
                                    </div>
                                )}
                            </div>




                                {/* Comments */}



                                <div
                                    id="comments-container"
                                    className="space-y-3"
                                >
                                    {displayedComments.map((comment) => {


                                            const isOwner = userId && comment.userId === userId;
                                            const isEditing = editingCommentId === comment._id;

                                            return (
                                                <div
                                                    key={comment._id || `${comment.userId}-${comment.timestamp}`}
                                                    className={`w-full flex ${isOwner ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div
                                                        className={`relative block w-full sm:px-4 py-4 px-4 rounded-xl
                                                                            ${isOwner ? `mr-auto bg-white border border-black/10` : "mr-auto bg-white border border-black/10"}`}

                                                    >
                                                        {/* nickname + edit/delete */}
                                                        <div className="flex justify-between gap-5 mb-1">
                                                            <div className="flex items-center gap-2 text-sm sm:text-sm md:text-base font-bold text-blue-400">

                                                                {/* BADGE */}
                                                                <NetaInline user={comment} />

                                                                {/* NICKNAME */}
                                                                <span className="truncate min-w-0">
                                                                    {comment.nickname}
                                                                </span>

                                                                {/* DOT */}
                                                                {isOwner && (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 opacity-80 flex-shrink-0" />
                                                                )}

                                                            </div>

                                                            {isOwner && (
                                                                <div
                                                                    className="flex items-center gap-2">
                                                                    {!isEditing && (
                                                                        <div className="flex items-center gap-1">
                                                                            <button
                                                                                onClick={() => startEditComment(comment)}
                                                                                className="p-2 rounded-full active:bg-black/10"
                                                                                style={{ touchAction: "manipulation" }}
                                                                                title="Edit Comment"
                                                                            >
                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    fill="none"
                                                                                    viewBox="0 0 24 24"
                                                                                    strokeWidth={1.5}
                                                                                    stroke="currentColor"
                                                                                    className="w-5 h-5"
                                                                                >
                                                                                    <path strokeLinecap="round"
                                                                                          strokeLinejoin="round"
                                                                                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
                                                                                </svg>
                                                                            </button>

                                                                            <button
                                                                                onClick={() => {
                                                                                    setPendingDeleteCommentId(comment._id);
                                                                                    setShowDeleteCommentConfirm(true);
                                                                                }}
                                                                                className="p-2 rounded-full active:bg-red-100"
                                                                                style={{ touchAction: "manipulation" }}
                                                                                title="Delete Comment"
                                                                            >
                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    fill="none"
                                                                                    viewBox="0 0 24 24"
                                                                                    strokeWidth={1.5}
                                                                                    stroke="currentColor"
                                                                                    className="w-5 h-5"
                                                                                >
                                                                                    <path strokeLinecap="round"
                                                                                          strokeLinejoin="round"
                                                                                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                                                                                </svg>
                                                                            </button>
                                                                        </div>

                                                                    )}

                                                                    {isEditing && (
                                                                        <div className="flex items-center gap-1">
                                                                            <button
                                                                                onClick={() => setEditingCommentId(null)}
                                                                                title="Cancel"
                                                                            >
                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    fill="none"
                                                                                    viewBox="0 0 24 24"
                                                                                    strokeWidth={1.5}
                                                                                    stroke="currentColor"
                                                                                    className="w-6 h-6"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                                                    />
                                                                                </svg>
                                                                            </button>

                                                                            <button
                                                                                onClick={handleEditComment}
                                                                                title="Save"
                                                                            >
                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    fill="none"
                                                                                    viewBox="0 0 24 24"
                                                                                    strokeWidth={1.5}
                                                                                    stroke="currentColor"
                                                                                    className="w-6 h-6"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                                                    />
                                                                                </svg>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* comment text */}
                                                        <p
                                                            contentEditable={isEditing}
                                                            suppressContentEditableWarning
                                                            className={`text-black break-words whitespace-pre-wrap
                                                                                ${isEditing ? "text-base border border-black px-2 py-1" : "text-sm sm:text-sm md:text-base"}
                                                                                bg-transparent rounded-xl`}
                                                            ref={(el) => {
                                                                if (el && isEditing && el.innerText !== editCommentMessage) {
                                                                    el.innerText = editCommentMessage || comment.message;
                                                                }
                                                            }}
                                                            onInput={(e) => {
                                                                const text = (e.currentTarget as HTMLDivElement).innerText;
                                                                setEditCommentMessage(text.slice(0, 500)); // limit to 500
                                                                // optional: immediately truncate the contentEditable to match
                                                                if (text.length > 500) {
                                                                    (e.currentTarget as HTMLDivElement).innerText = text.slice(0, 500);
                                                                    // move caret to the end
                                                                    const range = document.createRange();
                                                                    const sel = window.getSelection();
                                                                    range.selectNodeContents(e.currentTarget);
                                                                    range.collapse(false);
                                                                    sel?.removeAllRanges();
                                                                    sel?.addRange(range);
                                                                }
                                                            }}
                                                        >
                                                            {!isEditing && comment.message}
                                                        </p>

                                                        {/* timestamp */}
                                                        <div
                                                            className="mt-1 text-right text-black text-[8px] sm:text-[10px] md:text-[12px]">
                                                            {formatLocalDate(comment.timestamp, comment.edited)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                </div>
                            {/* Load more button */}
                            {hasMoreComments && (
                                <button
                                    onClick={async () => {
                                        if (isButtonLoading) return; // 🔒 HARD BLOCK (prevents spam clicks)

                                        setIsButtonLoading(true);

                                        const start = Date.now();

                                        try {
                                            await handleLoadMore();

                                            // force spinner to be visible at least 400–600ms
                                            const elapsed = Date.now() - start;
                                            const minTime = 500;

                                            if (elapsed < minTime) {
                                                await new Promise((r) => setTimeout(r, minTime - elapsed));
                                            }
                                        } finally {
                                            setIsButtonLoading(false);
                                        }
                                    }}
                                    style={{ touchAction: "manipulation" }}
                                    className="w-full flex justify-center items-center gap-2
                                    py-3 rounded-xl
                                    text-white font-medium text-sm sm:text-base
                                    bg-blue-500 hover:bg-blue-500 active:bg-blue-500
                                    transition
                                    shadow-sm
                                    disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {/* Icon: spins when loading */}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className={`w-6 h-6 text-white transition-transform ${
                                            isButtonLoading ? "animate-spin" : ""
                                        }`}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                        />
                                    </svg>
                                    <span className="ml-2 text-white font-medium text-sm sm:text-base">
                                      {isButtonLoading ? "Loading..." : "Load more Comments"}
                                    </span>
                                </button>
                            )}
                        </div>



                </div>
            )}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-[92%] max-w-md rounded-2xl shadow-xl border border-black/10 p-5">

                        {/* Title */}
                        <h2 className="text-base font-semibold text-black">
                            Confirm deletion
                        </h2>

                        {/* Message */}
                        <p className="text-sm text-black/70 mt-2 leading-relaxed">
                            Are you sure you want to delete this post? This action can’t be undone.
                        </p>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 mt-5">

                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 text-sm font-medium text-black/70 bg-black/5 hover:bg-black/10 rounded-full transition"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition"
                            >
                                Delete
                            </button>

                        </div>
                    </div>
                </div>
            )}
            {showDeleteCommentConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-[92%] max-w-md rounded-2xl shadow-xl border border-black/10 p-5">

                        {/* Title */}
                        <h2 className="text-base font-semibold text-black">
                            Confirm deletion
                        </h2>

                        {/* Message */}
                        <p className="text-sm text-black/70 mt-2 leading-relaxed">
                            Are you sure you want to delete this comment? This action can’t be undone.
                        </p>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 mt-5">

                            <button
                                onClick={cancelCommentDelete}
                                className="px-4 py-2 text-sm font-medium text-black/70 bg-black/5 hover:bg-black/10 rounded-full transition"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmCommentDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition"
                            >
                                Delete
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
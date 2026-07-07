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
import StatLoaderIcon from "@/components/ui/StatLoaderIcon";
import { motion, AnimatePresence } from "framer-motion";
import PostMedia from "./ActivePostMedia"
import PositionCard from "@/app/PositionCard";




const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
const COMMENTS_PAGE_SIZE = 25;
const commentsKey = (postId: string, skip: number) => `${apiUrl}/posts/${postId}/comments?skip=${skip}&limit=${COMMENTS_PAGE_SIZE}`;

const fetcher = async (url: string) => {
    const session = await getSession();
    const idToken = session?.idToken;

    if (!idToken) throw new Error("No session");

    const res = await fetch(url, {
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
    onCommentCountChange?: (postId: string, newCount: number) => void;
    expandedPosts: Set<string>;
    togglePostExpand: (postId: string) => void;
};

export default function ActivePost({ post, comments, userId, onBack, totalComments, onPostDelete, onPostUpdate, onCommentCountChange, expandedPosts, togglePostExpand }: Props) {
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
    const [statusBanner, setStatusBanner] = useState<{
        message: string | null;
        type?: "loading" | "success" | "error";
    } | null>(null);
    const [isButtonLoading, setIsButtonLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [deletedCommentIds, setDeletedCommentIds] = useState<Set<string>>(new Set());
    const router = useRouter();
    const { fetchPostComments } = chatApis({ apiUrl });
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeletingComment, setIsDeletingComment] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingComment, setIsSavingComment] = useState(false);

    const [isImageOpen, setIsImageOpen] = useState(false);

    const commentsTopRef = useRef<HTMLDivElement | null>(null);

    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

    const toggleCommentExpand = (id: string) => {
        setExpandedComments(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };




    const [replyingTo, setReplyingTo] = useState<{
        commentId: string;
        nickname: string;
        preview: string;
    } | null>(null);



    const handleMention = (nickname: string) => {
        const mention = `@${nickname} `;

        // Prevent duplicate mention
        if (commentMessage.includes(mention)) {
            return;
        }

        const el = commentInputRef.current;
        if (!el) return;

        const start = el.selectionStart ?? commentMessage.length;
        const end = el.selectionEnd ?? commentMessage.length;

        const newValue =
            commentMessage.slice(0, start) +
            mention +
            commentMessage.slice(end);

        setCommentMessage(newValue);

        requestAnimationFrame(() => {
            el.focus();

            const pos = start + mention.length;
            el.setSelectionRange(pos, pos);
        });
    };




    const [expandedPost, setExpandedPost] = useState(false);

    const POST_PREVIEW_LENGTH = 300;

    const shouldTruncatePost =
        activePost.message.length > POST_PREVIEW_LENGTH;

    const displayedPostMessage =
        expandedPost || !shouldTruncatePost
            ? activePost.message
            : activePost.message.slice(0, POST_PREVIEW_LENGTH) + "...";




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
                {/* Outer rounded square */}
                <rect
                    x="6"
                    y="6"
                    width="52"
                    height="52"
                    rx="14"
                    fill={
                        level === 4
                            ? "#facc15" // gold
                            : level === 3
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
                        level === 4
                            ? "#ca8a04" // darker gold
                            : level === 3
                                ? "#8b5cf6" // purple
                                : "#16a34a" // darker green
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
    const confirmDelete = async () => {
        try {
            setIsDeleting(true);

            await handleDeletePost(activePost.id);

            setShowDeleteConfirm(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setPendingDeleteId(null);
    };







    const [showDeleteCommentConfirm, setShowDeleteCommentConfirm] = useState(false);
    const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState<string | null>(null);
    const confirmCommentDelete = async () => {
        if (!pendingDeleteCommentId) return;

        const comment = displayedComments.find(
            c => c._id === pendingDeleteCommentId
        );

        if (!comment) return;

        try {
            setIsDeletingComment(true); // 🔥 START SPINNER

            await handleDeleteComment(comment);

            setShowDeleteCommentConfirm(false);
            setPendingDeleteCommentId(null);

        } finally {
            setIsDeletingComment(false); // 🔥 STOP SPINNER
        }
    };

    const cancelCommentDelete = () => {
        setShowDeleteCommentConfirm(false);
        setPendingDeleteCommentId(null);
    };









    const showStatusBanner = (
        message: string | null = null,
        type: "loading" | "success" | "error" = "loading"
    ) => {
        setStatusBanner({ message, type });
        setIsSending(true);

        setTimeout(() => {
            setStatusBanner(null);
            setIsSending(false);
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
            refreshInterval: 60000,
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
            showError("You need to log in again.", true);
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

        // ✅ ADD THIS HERE (early exit if nothing changed at top)
        if (polledData?.comments?.[0]?._id === displayedComments?.[0]?._id) return;

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
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isBlocked, blockSeconds]);



    useEffect(() => {
        const el = commentInputRef.current;
        if (!el) return;

        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    }, [commentMessage]);



    const placeholderText = isBlocked
        ? `Please wait ${blockSeconds}s...`
        : "Add a comment...";

















// COMMENT ADD //
    const handleAddComment = async (message: string) => {

        if (!userId || !session?.idToken) {
            setShowLoading(true);
            showError("You need to log in again.", true)
            // optionally include a login button in banner
            return;
        }

        if (!activePost || !message.trim() || !userId || isSending || isBlocked) return;

        const sanitizedMessage = DOMPurify.sanitize(message.trim());

        try {
            showStatusBanner();

            const payload = {
                message: sanitizedMessage,
                replyTo: replyingTo
                    ? {
                        commentId: replyingTo.commentId
                    }
                    : null
            };

            console.log("🚀 Sending comment payload:", payload);

            const res = await fetchWithToken(`${apiUrl}/posts/${activePost.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            setCommentMessage("");

            // Handle null / network failure
            if (!res) {
                setShowLoading(true);
                showError("You need to log in again.", true);
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
                    showError(`Please wait ${seconds} second${seconds !== 1 ? "s" : ""}.`);
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
                    showError("You need to log in again.", true);
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
            onCommentCountChange?.(
                activePost.id,
                (activePost.commentCount ?? 0) + 1
            );


            setCurrentPage(1);
            setCommentsSkip(prev => prev + 1);
            setCommentMessage("");
            setReplyingTo(null);
            if (commentInputRef.current) commentInputRef.current.style.height = "auto";
            hideError();

        } catch (err: any) {
            console.error("Failed to post comment:", err);
            setShowLoading(true);
            showError("You need to log in again.", true);
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

            onCommentCountChange?.(
                activePost.id,
                Math.max(0, (activePost.commentCount ?? 0) - 1)
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
                const detail = res?.data?.detail;

                // 🔴 BLOCKED USER
                if (res?.status === 403 || detail?.blocked || detail?.type === "blocked") {
                    showError("You are blocked.");
                } else {
                    showError("You need to log in again.", true);
                }

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

                return;
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

        if (isSavingComment) return; // 🚫 prevent spam clicks

        setIsSavingComment(true); // 🔵 start loading

        try {

            let trimmed = editCommentMessage.trim();

            // ✅ enforce 1500-character limit
            if (trimmed.length > 1500) {
                trimmed = trimmed.slice(0, 1500);
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
                        showError("You need to log in again.", true);
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

            if (!res || !res.success) {
                const detail = res?.data?.detail;

                // 🔴 BLOCKED USER
                if (res?.status === 403 || detail?.blocked || detail?.type === "blocked") {
                    showError("You are blocked.");
                    return;
                }

                // 🔴 AUTH / SESSION EXPIRED
                if (res?.status === 401 || detail?.type === "auth") {
                    setShowLoading(true);
                    showError("You need to log in again.", true);
                    return;
                }

                // 🔴 NETWORK FAILURE (no response at all)
                if (!res) {
                    showError("Network error: unable to reach server.");
                    return;
                }

                // 🔴 GENERIC ERROR
                showError(
                    detail?.error ||
                    "We couldn't update your comment. Please try again."
                );

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
        } finally {
            setIsSavingComment(false);
        }
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
                    showError("You need to log in again.", true);
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

        if (isSaving) return; // 🔴 ADD THIS HERE (BLOCK SPAM CLICKS)

        setIsSaving(true); // 🔵 ADD THIS HERE (START LOADING LOCK)

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
                showError("Network error: unable to reach server.");
                return;
            }

            if (!res.success) {
                const detail = res?.data?.detail;

                // 🔴 BLOCKED USER
                if (res.status === 403 || detail?.blocked || detail?.type === "blocked") {
                    showError("You are blocked.");
                    return;
                }

                // 🔴 AUTH / SESSION EXPIRED
                if (res.status === 401 || detail?.type === "auth") {
                    setShowLoading(true);
                    showError("You need to log in again.", true);
                    return;
                }

                // 🔴 GENERIC FALLBACK ERROR
                showError(
                    detail?.error ||
                    "We couldn't save your changes. Please try again."
                );

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
        } finally {
            setIsSaving(false); // 🟢 ADD THIS HERE (UNLOCK BUTTON ALWAYS)
        }
    };

// POST EDIT INITIALIZE POST EDITING (POPULATE FORM) //

    const startEditPost = (post: Post) => {
        setEditingPostId(post.id);
        setEditTitle(post.title);
        setEditMessage(post.message);
    };








    function CommentText({
                             message,
                             isExpanded,
                             onToggle,
                         }: {
        message: string;
        isExpanded: boolean;
        onToggle: () => void;
    }) {
        const LIMIT = 300;
        const shouldTruncate = message.length > LIMIT;

        const handleToggle = (e: React.MouseEvent) => {
            const selection = window.getSelection();
            if (selection && selection.toString().length > 0) return;

            onToggle();
        };

        const previewText =
            !isExpanded && shouldTruncate
                ? message.slice(0, LIMIT)
                : message;

        return (
            <div className="relative text-black break-words whitespace-pre-wrap">
                {/* TEXT BLOCK */}
                <div
                    onClick={shouldTruncate ? handleToggle : undefined}
                    className="cursor-pointer"
                >
                    <p className="text-sm sm:text-sm md:text-base select-text">
                        {previewText}
                        {!isExpanded && shouldTruncate ? "..." : ""}
                    </p>

                    {/* FADE (ONLY FOR PREVIEW MODE) */}
                    {!isExpanded && shouldTruncate && (
                        <div className="absolute bottom-6 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    )}
                </div>

                {/* BUTTON */}
                {shouldTruncate && (
                    <button
                        onClick={onToggle}
                        className="mt-1 text-sm text-blue-500 hover:text-blue-600 font-medium transition"
                    >
                        {isExpanded ? "Show less" : "See more"}
                    </button>
                )}
            </div>
        );
    }









    function PostExpandableText({
                                    message,
                                    isExpanded,
                                    onToggle,
                                }: {
        message: string;
        isExpanded: boolean;
        onToggle: () => void;
    }) {
        const LIMIT = 500;
        const shouldTruncate = message.length > LIMIT;

        const handleToggle = (e: React.MouseEvent) => {
            const selection = window.getSelection();
            if (selection && selection.toString().length > 0) return;

            onToggle();
        };

        return (
            <div className="relative text-black break-words whitespace-pre-wrap">
                {/* TEXT BLOCK */}
                <div
                    onClick={shouldTruncate ? handleToggle : undefined}
                    className={`cursor-pointer ${
                        isExpanded
                            ? ""
                            : "max-h-[6.5rem] overflow-hidden relative will-change-[max-height]"
                    }`}
                >
                    <p className="text-sm sm:text-sm md:text-base select-text">
                        {message}
                    </p>

                    {/* FADE GRADIENT */}
                    {!isExpanded && shouldTruncate && (
                        <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    )}
                </div>

                {/* BUTTON */}
                {shouldTruncate && (
                    <button
                        onClick={onToggle}
                        className="mt-1 text-sm text-blue-500 hover:text-blue-600 font-medium transition"
                    >
                        {isExpanded ? "Show less" : "See more"}
                    </button>
                )}
            </div>
        );
    }


    const scrollToTop = () => {
        const el = commentsTopRef.current;
        if (!el) return;

        const yOffset = -80; // adjust this value
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;

        window.scrollTo({
            top: y,
            behavior: "smooth",
        });
    };



























































    return (
        <div className={`transition-opacity duration-500 ease-in-out ${fade ? "opacity-100" : "opacity-0"}`}>

            <div ref={commentsTopRef} />

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
                        <PositionCard />

                    </div>



                        <div className="space-y-3 pb-16">

                            {/* Post */}
                            <div className="z-10 sm:px-4 py-4 px-4 rounded-xl bg-white border border-black/10 shadow-sm mb-2">


                                <div className="flex justify-between items-center">
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
                                                        disabled={!editMessage.trim() || isSaving}
                                                        className={`
                                                        w-9 h-9
                                                        flex items-center justify-center
                                                        rounded-full
                                                        transition
                                                        ${isSaving
                                                            ? "opacity-60 cursor-not-allowed"
                                                            : "hover:scale-105 active:scale-95"
                                                        }
                                                        `}
                                                    >
                                                        {isSaving ? (
                                                            <StatLoaderIcon />
                                                        ) : (
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
                                                        )}
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
                                                if (value.length <= 1500) setEditMessage(value); // 1500 char limit
                                            }}
                                            rows={11}
                                            placeholder="Edit message..."
                                            className="bg-transparent w-full rounded-xl bg-black-200 border border-black/10 px-2 py-1 text-sm sm:text-sm md:text-base text-black resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
                                        />
                                        <div className="text-black text-xs text-right">
                                            {editMessage.length}/1500
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Topic / Title */}
                                        <h3 className="text-black font-bold text-sm sm:text-base md:text-base">
                                            {activePost.title}
                                        </h3>







                                        {/* TAGS */}
                                        {Array.isArray(activePost.tags) && activePost.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-x-2 gap-y-1 mb-2 text-[11px] text-neutral-500">
                                                {activePost.tags.slice(0, 5).map((tag, idx) => {
                                                    if (typeof tag !== "string") return null;

                                                    const cleanTag = tag.trim();
                                                    if (!cleanTag) return null;

                                                    return (
                                                        <span
                                                            key={`${cleanTag}-${idx}`}
                                                            className="
                                                                text-neutral-500
                                                                hover:text-neutral-700
                                                                transition-colors
                                                                select-none
                                                            "
                                                        >
                                                            #{cleanTag}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}







                                        <PostMedia
                                            images={(activePost?.images ?? [])
                                                .map((img) =>
                                                    typeof img === "string"
                                                        ? img
                                                        : img?.secure_url ?? img?.url ?? img?.thumbnail
                                                )
                                                .filter((img): img is string => Boolean(img))}
                                            tags={activePost?.tags ?? []}
                                            onOpenChange={setIsImageOpen}
                                        />



                                        {/* Message */}
                                        <div className="mt-2">
                                            <PostExpandableText
                                                message={activePost.message}
                                                isExpanded={expandedPosts.has(activePost.id)}
                                                onToggle={() => togglePostExpand(activePost.id)}
                                            />
                                        </div>
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

                                {replyingTo && (
                                    <div className="mb-2 rounded-lg bg-black/5 p-2 text-xs">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold text-blue-500">
                                                    Replying to @{replyingTo.nickname}
                                                </div>

                                                <div className="text-black/60 truncate">
                                                    {replyingTo.preview}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setReplyingTo(null)}
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                ✕
                                            </button>
                                        </div>
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
                                        value={commentMessage}
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
                                            max-h-[140px]
                                            overflow-y-auto
                                            min-h-[42px]
                                        "
                                        onChange={(e) => {
                                            if (isSending) return;

                                            const value = e.target.value;

                                            // keep your limit logic
                                            if (value.length <= 1500) {
                                                setCommentMessage(value);
                                            } else {
                                                setCommentMessage(value.slice(0, 1500));
                                            }

                                            // auto-grow until max height, then scroll
                                            const el = e.target;
                                            el.style.height = "auto";
                                            el.style.height = Math.min(el.scrollHeight, 140) + "px";
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
                                        {isSending ? (
                                            <div className="text-white [&>svg]:text-white">
                                                <StatLoaderIcon />
                                            </div>
                                        ) : (
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
                                        )}
                                    </button>
                                </form>

                                {/* Status */}
                                <div className="mt-1">
                                    {statusBanner && (
                                        <StatusBanner
                                            message={statusBanner.message ?? ""}
                                            type={statusBanner.type}
                                            onClose={() => setStatusBanner(null)}
                                            inline={true}
                                        />
                                    )}
                                </div>
                            </div>




                                {/* Comments */}



                                <div
                                    id="comments-container"
                                    className="space-y-3"
                                >
                                    <AnimatePresence initial={false}>
                                        {displayedComments.map((comment) => {


                                            const isOwner = userId && comment.userId === userId;
                                            const isEditing = editingCommentId === comment._id;

                                            return (
                                                <motion.div
                                                    key={comment._id || `${comment.userId}-${comment.timestamp}`}
                                                    initial={{ opacity: 0, x: isOwner ? 20 : -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: isOwner ? 20 : -20 }}
                                                    transition={{ duration: 0.25, ease: "easeOut" }}
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
                                                                <span
                                                                    className="truncate min-w-0 cursor-pointer hover:underline"
                                                                    onClick={() => handleMention(comment.nickname)}
                                                                >
                                                                    {comment.nickname}
                                                                </span>

                                                                <button
                                                                    onClick={() => {
                                                                        setReplyingTo({
                                                                            commentId: comment._id,
                                                                            nickname: comment.nickname,
                                                                            preview: comment.message.slice(0, 80)
                                                                        });

                                                                        commentInputRef.current?.focus();
                                                                    }}
                                                                    className="rounded-full p-1 text-black/60 hover:bg-black/10 hover:text-black"
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        className="h-5 w-5"
                                                                        viewBox="0 -960 960 960"
                                                                        fill="currentColor"
                                                                    >
                                                                        <path d="M760-200v-160q0-50-35-85t-85-35H273l144 144-57 56-240-240 240-240 57 56-144 144h367q83 0 141.5 58.5T840-360v160h-80Z" />
                                                                    </svg>
                                                                </button>

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
                                                                                disabled={!editCommentMessage.trim() || isSavingComment}
                                                                                className={`transition ${
                                                                                    isSavingComment ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                                                                                }`}
                                                                            >
                                                                                {isSavingComment ? (
                                                                                    <StatLoaderIcon />
                                                                                ) : (
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
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Reply indicator */}
                                                        {comment.replyTo && (
                                                            <div className="mb-2 text-xs text-gray-500">
                                                                {" "}
                                                                <span className="font-semibold text-blue-500">
                                                                    @{comment.replyTo.nickname}
                                                                </span>

                                                                <div className="truncate text-black/60">
                                                                    {comment.replyTo.preview}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* comment text */}
                                                        <div
                                                            className={`
                                                            text-black break-words whitespace-pre-wrap
                                                            bg-transparent rounded-xl
                                                            ${isEditing
                                                                ? "text-base border border-black px-2 py-1 max-h-[200px] overflow-y-auto"
                                                                : "text-sm sm:text-sm md:text-base"
                                                            }
                                                         `}
                                                        >
                                                            {isEditing ? (
                                                                <div
                                                                    contentEditable
                                                                    suppressContentEditableWarning
                                                                    className="outline-none min-h-[60px]"
                                                                    ref={(el) => {
                                                                        if (el && el.innerText !== editCommentMessage) {
                                                                            el.innerText = editCommentMessage || comment.message;
                                                                        }
                                                                    }}
                                                                    onInput={(e) => {
                                                                        const text = (e.currentTarget as HTMLDivElement).innerText;

                                                                        setEditCommentMessage(text.slice(0, 1500));

                                                                        if (text.length > 1500) {
                                                                            (e.currentTarget as HTMLDivElement).innerText = text.slice(0, 1500);

                                                                            const range = document.createRange();
                                                                            const sel = window.getSelection();
                                                                            range.selectNodeContents(e.currentTarget);
                                                                            range.collapse(false);
                                                                            sel?.removeAllRanges();
                                                                            sel?.addRange(range);
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <CommentText
                                                                    message={comment.message}
                                                                    isExpanded={expandedComments.has(comment._id)}
                                                                    onToggle={() => toggleCommentExpand(comment._id)}
                                                                />
                                                            )}
                                                        </div>

                                                        {/* timestamp */}
                                                        <div
                                                            className="mt-1 text-right text-black text-[8px] sm:text-[10px] md:text-[12px]">
                                                            {formatLocalDate(comment.timestamp, comment.edited)}
                                                        </div>
                                                    </div>
                                            </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
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
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <StatLoaderIcon />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete"
                                )}
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
                                disabled={isDeletingComment}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isDeletingComment ? (
                                    <>
                                        <StatLoaderIcon />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete"
                                )}
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {!isImageOpen && (
                <div className="fixed bottom-32 right-6 z-50">
                    <button
                        onClick={scrollToTop}
                        className="
                            w-11 h-11
                            flex items-center justify-center
                            rounded-full
                            bg-white
                            border border-neutral-200
                            shadow-md
                            text-neutral-700
                            hover:bg-neutral-50
                            active:scale-95
                            transition
                        "
                        title="Go to top"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M6 16l6-6 6 6"
                                stroke="currentColor"
                                strokeWidth="2"
                            />
                            <path
                                d="M6 10l6-6 6 6"
                                stroke="currentColor"
                                strokeWidth="2"
                            />
                        </svg>
                    </button>
                </div>
            )}

        </div>
    );
}
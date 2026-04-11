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
        return <div>Loading post...</div>;
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
            refreshInterval: 300,
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
            {relativeTime} {edited && <span className="text-white-500/60 text-[10px] ml-1">(Edited)</span>}
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
        } else {
            setShowLoading(true);
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
                const err = res.data || { error: res.message };
                const detail = err?.detail;

                // Backend blocked message (rate-limit or admin block)
                if (detail?.blocked) {
                    const message = detail.error || "You are temporarily blocked. Please wait.";
                    setBlockMessage(message);
                    if (detail.remaining) setBlockSeconds(detail.remaining);
                    setIsBlocked(true);
                    showError(message); // only string
                    return;
                }

                // Rate limiting (429) without block
                if (res.status === 429) {
                    const seconds = detail?.remaining || 60;
                    setIsBlocked(true);
                    setBlockSeconds(seconds);
                    showError(`Slow down. Wait ${seconds} second${seconds > 1 ? "s" : ""}.`);
                    return;
                }

                // Fallback for session / other errors
                setShowLoading(true);
                const message = detail?.error || err.error || "Oops! You need to log in again. 🥲";
                showError(message, true);
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

        const confirmed = window.confirm("Are you sure you want to delete this comment?");
        if (!confirmed) return;

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
                showError("Refresh the page or log in again.");
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
            showError("We couldn't delete your comment. Please try again.");
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

        // ✅ Add confirmation before deleting
        const confirmed = window.confirm("Are you sure you want to delete this post?");
        if (!confirmed) return;

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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
                    <p className="text-xl flex items-center">
                        Loading
                        <span className="ml-2 flex space-x-1">
                          <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce"></span>
                          <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                          <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
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

                        {/* Future Ads / Message */}
                        <div className="w-full text-center text-sm py-2">
                            Promoted: CBS Electrical Contractors <br/> Hiring NETA 2 Techs 📍Raleigh NC
                        </div>

                    </div>



                        <div className="space-y-3 pb-16">

                            {/* Post */}
                            <div className="z-10 sm:px-2 py-2 rounded-xl bg-transparent mb-2">


                                <div className="flex justify-between items-center pb-3">
                                    {/* Nickname on the left */}
                                    <div className="flex items-center justify-center">
                                        <span className="flex items-center gap-1 text-sm sm:text-sm md:text-base font-semibold truncate text-blue-400">
                                            {activePost.nickname}

                                            {userId && activePost.userId === userId && (
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
                                    </div>


                                    {/* Back button + Delete button on the right */}
                                    <div className="flex items-center gap-0.1">


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
                                                        className="p-1 text-white-300 hover:text-white-400 rounded-full"
                                                        title="Edit Post"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.5}
                                                            stroke="currentColor"
                                                            className="w-4 h-4"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                                            />
                                                        </svg>
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeletePost(activePost.id)}
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.5}
                                                            stroke="currentColor"
                                                            className="w-4 h-4"
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
                                            className="bg-transparent w-full rounded-xl bg-black/70 border border-white/10 px-2 py-1 text-sm sm:text-sm md:text-base text-white resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
                                        />
                                        <div className="text-white/60 text-xs text-right">
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
                                            className="bg-transparent w-full rounded-xl bg-black/70 border border-white/10 px-2 py-1 text-sm sm:text-sm md:text-base text-white resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
                                        />
                                        <div className="text-white/60 text-xs text-right">
                                            {editMessage.length}/500
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Topic / Title */}
                                        <h3 className="text-white-800 font-bold mb-3 text-sm sm:text-base md:text-lg">
                                            {activePost.title}
                                        </h3>

                                        {/* Message */}
                                        <p className="text-white-100/90 break-words text-sm sm:text-sm md:text-base">
                                            {activePost.message}
                                        </p>
                                    </>
                                )}


                            </div>


                            {/* Add comment */}
                            <div className="z-10 w-full bg-black/80 backdrop-blur-xl shrink-0">

                                {/* 🚨 Block Banner */}
                                {isBlocked && blockMessage && (
                                    <div className="mb-2 text-red-400 text-xs sm:text-sm text-center">
                                        {blockMessage} {blockSeconds ? `Wait ${blockSeconds} second(s).` : null}
                                    </div>
                                )}



                                <form
                                    className="flex items-center gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (!commentMessage.trim() || isBlocked) return;
                                        handleAddComment(commentMessage.trim());
                                        requestAnimationFrame(() => {
                                            setCommentMessage("");
                                        });
                                    }}
                                >
                                                    <textarea
                                                        ref={commentInputRef}
                                                        style={{ WebkitOverflowScrolling: "touch" }}
                                                        placeholder={placeholderText}
                                                        className={`
                                                          my-1
                                                          flex-1
                                                          min-h-[40px]
                                                          rounded-xl
                                                          bg-transparent
                                                          px-3
                                                          py-2
                                                          text-sm sm:text-sm md:text-base
                                                          text-white
                                                          placeholder:text-[10px] sm:placeholder:text-xs md:placeholder:text-sm
                                                          placeholder-white/80
                                                          border
                                                          border-white
                                                          focus:outline-none
                                                          focus:ring-2
                                                          focus:ring-white/20
                                                          resize-none
                                                          overflow-hidden
                                                          ${isSending ? "opacity-50 cursor-not-allowed" : ""}
                                                        `}
                                                        rows={1}
                                                        value={commentMessage}
                                                        onChange={(e) => {
                                                            if (isSending) return; // 🔒 HARD BLOCK
                                                            const value = e.target.value;
                                                            if (value.length <= 500) setCommentMessage(value);
                                                            else setCommentMessage(value.slice(0, 500));
                                                        }}
                                                        disabled={isBlocked || isSending}
                                                    />

                                    <button
                                        type="submit"
                                        disabled={!commentMessage.trim() || isBlocked || isSending}
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


                                </form>
                                {/* --- Inline Status Banner --- */}
                                {statusBanner && (
                                    <StatusBanner
                                        message={statusBanner.message}
                                        type={statusBanner.type}
                                        onClose={() => setStatusBanner(null)}
                                        inline={true} // show above textarea
                                    />
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
                                                        className={`relative block w-full px-1 sm:px-2 pt-3 rounded-xl
                                                                            ${isOwner ? `ml-auto bg-transparent` : "mr-auto bg-black/50"}`}

                                                    >
                                                        {/* nickname + edit/delete */}
                                                        <div className="flex justify-between gap-5 mb-1">
                                                                            <span
                                                                                className="flex items-center gap-1 text-sm sm:text-sm md:text-base font-bold truncate text-blue-400">
                                                                                    {comment.nickname}

                                                                                {/* reactions go here */}
                                                                                {(comment.reactions?.length ?? 0) > 0 && (
                                                                                    <span className="ml-2 flex gap-1">
                                                                                        {comment.reactions?.map((r, idx) => (
                                                                                            <span
                                                                                                key={`${r.emoji}-${idx}`}>{r.emoji}</span>
                                                                                        ))}
                                                                                    </span>
                                                                                )}

                                                                                {isOwner && (
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

                                                            {isOwner && (
                                                                <div
                                                                    className="flex items-center justify-center w-7 h-7 bg-black/50 rounded-lg">
                                                                    {!isEditing && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => startEditComment(comment)}
                                                                                className="p-1 text-white-300 hover:text-white-400 rounded-full"
                                                                                title="Edit Comment"
                                                                            >
                                                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                                                     fill="none" viewBox="0 0 24 24"
                                                                                     strokeWidth={1.5} stroke="currentColor"
                                                                                     className="w-4 h-4">
                                                                                    <path strokeLinecap="round"
                                                                                          strokeLinejoin="round"
                                                                                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
                                                                                </svg>
                                                                            </button>

                                                                            <button
                                                                                onClick={() => handleDeleteComment(comment)}
                                                                                title="Delete Comment"
                                                                            >
                                                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                                                     fill="none" viewBox="0 0 24 24"
                                                                                     strokeWidth={1.5} stroke="currentColor"
                                                                                     className="w-4 h-4">
                                                                                    <path strokeLinecap="round"
                                                                                          strokeLinejoin="round"
                                                                                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                                                                                </svg>
                                                                            </button>
                                                                        </>

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
                                                                                    className="w-4 h-4"
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
                                                                                    className="w-4 h-4"
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
                                                            className={`text-white-100 break-words whitespace-pre-wrap
                                                                                ${isEditing ? "text-base border border-white px-2 py-1" : "text-sm sm:text-sm md:text-base"}
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
                                                            className="mt-1 text-right text-white-500/60 text-[8px] sm:text-[10px] md:text-[12px]">
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
                                    onClick={() => {
                                        setIsButtonLoading(true); // start visual loading
                                        setTimeout(() => {
                                            setIsButtonLoading(false); // stop loading after 1s (or any delay)
                                            handleLoadMore(); // still call your real handler
                                        }, 5000); // 5 second delay
                                    }}
                                    style={{ touchAction: "manipulation" }}
                                    className="w-full flex justify-center items-center py-3 bg-blue-50 hover:bg-blue-100 rounded-xl mt-2 transition"
                                >
                                    {/* Icon: spins when loading */}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className={`w-6 h-6 text-blue-600 transition-transform ${
                                            isButtonLoading ? "animate-spin" : ""
                                        }`}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                        />
                                    </svg>
                                    <span className="ml-2 text-blue-600 font-medium text-sm sm:text-base">
                                      {isButtonLoading ? "Loading..." : "Load More"}
                                    </span>
                                </button>
                            )}
                        </div>



                </div>
            )}
        </div>
    );
}
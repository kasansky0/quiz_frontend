"use client";

import {Comment, Post} from "../../hooks/usePosts";
import { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import {useError} from "@/app/ErrorProvider";
import {signOut} from "next-auth/react";
import { chatApis } from '@/app/hooks/chatApis'; // adjust path as needed
import useSWR, { mutate as globalMutate } from "swr";








const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
const COMMENTS_PAGE_SIZE = 10;
const commentsKey = (postId: string, skip: number) => `${apiUrl}/posts/${postId}/comments?skip=${skip}&limit=${COMMENTS_PAGE_SIZE}`;

const fetcher = (url: string) =>
    fetch(url, { credentials: "include" }).then(res => res.json());


type Props = {
    post: Post;
    comments: { comments: Comment[]; total: number }
    userId?: string | null;
    onBack: () => void;
    totalComments: number;
};

export default function ActivePost({ post, comments, userId, onBack, totalComments }: Props) {
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
    const { fetchPostComments } = chatApis({ apiUrl });
    const [commentsSkip, setCommentsSkip] = useState(0); // number of comments already loaded
    const COMMENTS_PAGE_SIZE = 10;
    const commentsArray = comments?.comments ?? [];
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreComments, setHasMoreComments] = useState(totalComments > COMMENTS_PAGE_SIZE);
    const [displayedComments, setDisplayedComments] = useState<Comment[]>([]);



















// ENSURE LOAIDNG INDICATOR SHOWS FOR AT LEAST 1.5 SECONDS BEFORE HIDING //
    useEffect(() => {
        const timer = setTimeout(() => setShowLoading(false), 1500); // 3 seconds minimum
        return () => clearTimeout(timer);
    }, []);


// POLL LATEST COMMENTS FOR THE POST EVERY 1 SECOND AND TRACK ERRORS //
    const { data: polledData, error } = useSWR(
        commentsKey(post.id, 0), // always fetch from skip=0 to get latest
        fetcher,
        { refreshInterval: 1000 } // fetch every 5 seconds
    );


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

        setDisplayedComments(prev => {
            // Merge old + new comments
            const merged = [...prev, ...polledData.comments];

            // Deduplicate by _id
            const dedupedMap = new Map<string, Comment>();
            merged.forEach(c => dedupedMap.set(c._id, c));

            // Sort by timestamp ascending (old → new)
            const sorted = Array.from(dedupedMap.values()).sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            // Reverse the sequence if you want newest at the bottom visually
            const reversed = sorted.reverse();

            setCommentsSkip(reversed.length);
            return reversed;
        });
    }, [polledData]);


// SYNC AND SORT DISPLAY COMMENTS ON NEW DATA //

    useEffect(() => {
        if (!commentsArray.length) return;

        setDisplayedComments([...commentsArray].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));

        // Increment skip by the number of comments we just received
        setCommentsSkip(commentsArray.length);

        setCurrentPage(1);
        setHasMoreComments(totalComments > COMMENTS_PAGE_SIZE);
    }, [commentsArray, totalComments]);


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
            showError("Failed to load more comments. Please try again.");
        }
    };


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


// HELPER SESSION EXPIRE HANDLER //

    const handleSessionExpired = async () => {
        await signOut({ redirect: false }); // clear session
        setCooldownSeconds(null);
        hideError();
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

















// COMMENT ADD //

    const handleAddComment = async (message: string) => {
        if (!activePost || !message.trim() || !userId || isSending || isBlocked) return;
        setIsSending(true);

        const sanitizedMessage = DOMPurify.sanitize(message.trim());

        try {
            // 1️⃣ Send to backend first
            const res = await fetch(`${apiUrl}/posts/${activePost.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: sanitizedMessage }),
                credentials: "include",
            });

            // 2️⃣ Handle errors exactly as before
            if (!res.ok) {
                if (res.status === 401) {
                    await handleSessionExpired();
                    return;
                }

                const err = await res.json().catch(() => null);

                // 🚨 If backend says rate limit
                if (res.status === 429) {
                    const errDetail = err?.detail;
                    if (errDetail?.blocked) {
                        setBlockMessage(errDetail.error); // show backend message
                        if (errDetail.remaining) setBlockSeconds(errDetail.remaining);
                        setIsBlocked(true);
                        return;
                    }

                    const seconds = errDetail?.remaining || 10;
                    setIsBlocked(true);
                    setBlockSeconds(seconds);
                    showError(`Slow down. Wait ${seconds} second${seconds > 1 ? "s" : ""}.`);
                    return;
                }

                showError(err?.detail || err?.error || "Failed to post comment.");
                return;
            }

            // 3️⃣ Receive the comment from backend (with real _id)
            const newComment: Comment = await res.json();

            // 5️⃣ Update SWR cache only, post will sync automatically
            globalMutate(
                `${apiUrl}/posts/`,
                (posts: Post[] = []) =>
                    posts.map(p =>
                        p.id === activePost?.id
                            ? { ...p, comments: [newComment, ...(p.comments ?? [])] }
                            : p
                    ),
                false
            );

            setCurrentPage(1);

            // 7️⃣ Increment skip
            setCommentsSkip(prev => prev + 1);

            // 9️⃣ Reset input and hide error
            setCommentMessage("");
            if (commentInputRef.current) commentInputRef.current.style.height = "auto";
            hideError();
        } catch (err) {
            // Do nothing here — no red error banner
            console.error("Failed to post comment:", err);
        } finally {
            setIsSending(false);
        }
    };


// COMMENT DELETE //

    const handleDeleteComment = async (comment: Comment) => {
        if (!activePost) return;
        if (!comment._id) return;
        if (cooldownSeconds) return; // disable during cooldown

        // 1️⃣ Optimistic UI update — remove comment immediately
        setDisplayedComments(prev => prev.filter(c => c.id !== comment.id));

        try {
            const res = await fetch(`${apiUrl}/posts/${activePost.id}/comments/${comment.id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                if (res.status === 401) {
                    await handleSessionExpired();
                    return;
                }

                // Start cooldown banner
                const cooldown = 5;
                setCooldownSeconds(cooldown);

                if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);

                let remaining = cooldown;
                showError(`Slow down. Please wait ${remaining} second${remaining > 1 ? "s" : ""}.`);

                cooldownIntervalRef.current = setInterval(() => {
                    remaining -= 1;
                    if (remaining <= 0) {
                        clearInterval(cooldownIntervalRef.current!);
                        cooldownIntervalRef.current = null;
                        setCooldownSeconds(null);
                        hideError();
                    } else {
                        showError(`Slow down. Please wait ${remaining} second${remaining > 1 ? "s" : ""}.`);
                    }
                }, 1000);

                // Optional rollback: refetch comments
                const data = await fetchPostComments(activePost.id, 0, COMMENTS_PAGE_SIZE);
                setDisplayedComments(data?.comments || []);

                return;
            }

            // ✅ Optionally, update SWR cache for posts if you track comment counts
            globalMutate(`${apiUrl}/posts/`, (posts: Post[] = []) =>
                posts.map(p =>
                    p.id === activePost.id
                        ? { ...p, totalComments: (p.totalComments || 1) - 1 } // adjust if you track count
                        : p
                )
            );

        } catch (err) {
            console.error(err);
            // Optionally rollback optimistic update here too
            const data = await fetchPostComments(activePost.id, 0, COMMENTS_PAGE_SIZE);
            setDisplayedComments(data?.comments || []);
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
            const res = await fetch(
                `${apiUrl}/posts/${activePost.id}/comments/${editingCommentId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!res.ok) {
                if (res.status === 401) {
                    await handleSessionExpired();
                    return;
                }
                showError("Delete comment failed"); // 🔴 show banner
                return;
            }

            setEditingCommentId(null);
            setEditCommentMessage("");
            return;
        }

        // ✏️ Otherwise → normal edit
        const res = await fetch(
            `${apiUrl}/posts/${activePost.id}/comments/${editingCommentId}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: sanitizedMessage }),
                credentials: "include",
            }
        );

        if (!res.ok) {
            if (res.status === 401) {
                await handleSessionExpired();
                return;
            }
            showError("Edit comment failed"); // 🔴 show banner
            return;
        }

        const updatedComment: Comment = await res.json();


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
        globalMutate(`${apiUrl}/posts/`, (prev: Post[] = []) =>
            prev.map(p =>
                p.id === activePost.id
                    ? { ...p, comments: (p.comments || []).map(c =>
                            c._id === updatedComment._id ? updatedComment : c
                        ),
                    }
                    : p
            )
        );

        setEditingCommentId(null);
    };

// COMMENT EDIT //

    const startEditComment = (comment: Comment) => {
        setEditingCommentId(comment._id);
        setEditCommentMessage(comment.message);
    };

















// POST DELETE AND UPDATE UI //

    const handleDeletePost = async (postId: string) => {
        const res = await fetch(`${apiUrl}/posts/${postId}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) {
            if (res.status === 401) await handleSessionExpired();
            showError("Delete failed"); // 🔴 show banner
            return;
        }

        globalMutate(`${apiUrl}/posts/`, (posts: Post[] = []) =>
            posts.filter(p => p.id !== postId)
        );

        onBack();
    };

// POST EDIT SAVE EDITS TO A POST AND UPDATE UI //

    const handleEditPost = async () => {
        if (!editingPostId) return;

        // Sanitize input
        const sanitizedTitle = DOMPurify.sanitize(editTitle.trim());
        const sanitizedMessage = DOMPurify.sanitize(editMessage.trim());

        const res = await fetch(`${apiUrl}/posts/${editingPostId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: sanitizedTitle, message: sanitizedMessage }),
            credentials: "include",
        });

        if (!res.ok) {
            if (res.status === 401) await handleSessionExpired();
            const err = await res.json().catch(() => null);
            showError(err?.detail || err?.error || "Edit failed");
            return;
        }

        const updatedPost: Post = await res.json();

        globalMutate(
            `${apiUrl}/posts/`,
            (posts: Post[] = []) =>
                posts.map(p =>
                    p.id === updatedPost.id ? updatedPost : p
                ),
            false
        );

        // ✅ Update local activePost so UI reflects changes immediately
        setActivePost(updatedPost);

        // ✅ Update active post and exit edit mode
        setEditingPostId(null);
        hideError();
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
                <div className="min-h-screen flex flex-col items-center justify-center text-white bg-black">
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





            <div className="flex flex-col w-full h-full min-h-0">


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
                    </div>


                    <div className="flex flex-col h-full min-h-0 w-full">
                        <div className="flex-1 overflow-y-auto space-y-3 p-2 pb-16 hide-scrollbar">

                            {/* Post */}
                            <div className="z-10 px-1 sm:px-2 py-2 rounded-xl bg-transparent mb-2">


                                <div className="flex justify-between items-center pb-3">
                                    {/* Nickname on the left */}
                                    <div className="flex items-center justify-center">
                                                        <span
                                                            className="text-sm sm:text-sm md:text-base font-semibold truncate text-blue-400"
                                                        >
                                                            {activePost.nickname}
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
                                    }}
                                >
                                                    <textarea
                                                        ref={commentInputRef}
                                                        onInput={(e) => {
                                                            const el = e.currentTarget;
                                                            el.style.height = "auto";
                                                            el.style.height = el.scrollHeight + "px";
                                                        }}
                                                        placeholder={
                                                            isBlocked
                                                                ? `Blocked for ${blockSeconds}s...`
                                                                : "Add a comment..."
                                                        }
                                                        className="
                                                            flex-1
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
                                                          "
                                                        rows={1}
                                                        value={commentMessage}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            if (value.length <= 500) setCommentMessage(value);
                                                            else setCommentMessage(value.slice(0, 500));
                                                        }}
                                                        disabled={isBlocked}
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
                            </div>


                            {/* Comments */}

                            <div className="flex flex-col flex-1 min-h-0 w-full">


                                {/* Comments */}
                                <div
                                    id="comments-container"
                                    className="flex-1 space-y-3 overscroll-contain hide-scrollbar"
                                >
                                    {displayedComments.map((comment) => {

                                        console.log("Rendering comment:", comment);

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
                            </div>
                            {/* Load more button */}
                            {hasMoreComments && (
                                <button
                                    onClick={handleLoadMore}
                                    className="w-full flex justify-center items-center py-3 bg-blue-50 hover:bg-blue-100 rounded-xl mt-2 transition"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-6 h-6 text-blue-600"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                        />
                                    </svg>
                                    <span className="ml-2 text-blue-600 font-medium text-sm sm:text-base">Load More</span>
                                </button>
                            )}
                        </div>





                    </div>

                </div>
            )}
        </div>
    );
}
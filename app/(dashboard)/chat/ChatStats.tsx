"use client";

import { useState, useEffect, useRef } from "react";
import CreatePost from "./CreatePost";
import { signOut } from "next-auth/react";
import { Post, Comment } from "../../hooks/usePosts";  // <-- import these
import { useUser } from "../../UserContext";
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { useError } from "@/app/ErrorProvider";
import { useMemo } from "react";
import DOMPurify from 'dompurify';




const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ChatStats() {
    const [activePost, setActivePost] = useState<Post | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [creatingPost, setCreatingPost] = useState(false);
    const [commentMessage, setCommentMessage] = useState("");
    const commentsEndRef = useRef<HTMLDivElement>(null);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editMessage, setEditMessage] = useState("");
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentMessage, setEditCommentMessage] = useState("");
    const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
    const lastLocalUpdateRef = useRef<number>(0);
    const { userId } = useUser();
    const router = useRouter(); // initialize router for back button
    const [loggedOut, setLoggedOut] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [blockSeconds, setBlockSeconds] = useState<number | null>(null);
    const [isBlocked, setIsBlocked] = useState(false);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);
    const [isSending, setIsSending] = useState(false);
    const { showError, hideError } = useError();
    const handleOpenPost = (post: Post) => { setActivePost(post); };
    const handleBackToList = () => { setActivePost(null); };
    const [listFade, setListFade] = useState(false);   // for posts list
    const [postFade, setPostFade] = useState(false);   // for active post





    useEffect(() => {
        const timer = setTimeout(() => setListFade(true), 50); // fade in after 50ms
        return () => clearTimeout(timer);
    }, []);

























    const fetcher = (url: string) =>
        fetch(url, { credentials: "include" }).then(res => res.json());

    const { data: posts = [], error: postsError } = useSWR<Post[]>(`${apiUrl}/posts/`, fetcher, {
        refreshInterval: 10000,
    });









    const startEditComment = (comment: Comment) => {
        setEditingCommentId(comment.id);
        setEditCommentMessage(comment.message);
    };















    // Whenever activePost changes, reset editing states if post is closed
    useEffect(() => {
        if (!activePost) {
            setEditingPostId(null);
            setEditingCommentId(null);
            setEditMessage("");
            setEditCommentMessage("");
        }
    }, [activePost]);







    useEffect(() => {
        if (!activePost) return;

        const updated = posts.find((p: Post) => p.id === activePost.id);
        if (!updated) return;

        setActivePost(prev => {
            if (!prev) return prev;

            // keep only valid local comments
            const localOnlyComments = prev.comments.filter(
                (c: Comment & { _isLocal?: boolean }) => // <-- added type assertion
                    c._isLocal &&
                    c.id &&                            // must have id
                    c.message &&                       // must have comment text
                    !updated.comments.some(uc => uc.id === c.id)
            );

            return {
                ...prev,
                comments: [...updated.comments, ...localOnlyComments],
            };
        });
    }, [posts]);










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

            lastLocalUpdateRef.current = Date.now();

            const updatedPost = {
                ...activePost,
                comments: activePost.comments.filter(c => c.id !== editingCommentId),
            };

            setActivePost(updatedPost);
            globalMutate(`${apiUrl}/posts/`, (prev: Post[] = []) =>
                prev.map(p => (p.id === updatedPost.id ? updatedPost : p))
            );

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

        lastLocalUpdateRef.current = Date.now();

        const updatedPost = {
            ...activePost,
            comments: activePost.comments.map(c =>
                c.id === updatedComment.id ? updatedComment : c
            ),
        };

        setActivePost(updatedPost);
        globalMutate(`${apiUrl}/posts/`, (prev: Post[] = []) =>
            prev.map(p => (p.id === updatedPost.id ? updatedPost : p))
        );

        setEditingCommentId(null);
    };











    const handleSessionExpired = async () => {
        await signOut({ redirect: false }); // clear session
        setLoggedOut(true); // optional if you want local state
        setCooldownSeconds(null);
        hideError();
    };


    const startEditPost = (post: Post) => {
        setEditingPostId(post.id);
        setEditTitle(post.title);     // <-- prefill title
        setEditMessage(post.message); // <-- prefill message
    };


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

        // ✅ Update active post and exit edit mode
        setActivePost(updatedPost);
        setEditingPostId(null);
        hideError();
    };









    function LoggedOut() {
        const router = useRouter();

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div className="bg-black/70 border border-white/10 shadow-lg rounded-2xl max-w-md w-full p-6 text-center backdrop-blur-md">
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

        setActivePost(null);
    };



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



    const handleDeleteComment = async (commentId: string) => {
        if (!activePost) return;

        if (cooldownSeconds) return; // disable during cooldown

        try {
            const res = await fetch(`${apiUrl}/posts/${activePost.id}/comments/${commentId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                if (res.status === 401) {
                    await handleSessionExpired();
                    return;
                }

                // ✅ Start a unified cooldown banner
                const cooldown = 5;
                setCooldownSeconds(cooldown);

                // Clear previous interval if exists
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

                return;
            }

            // ✅ Success
            lastLocalUpdateRef.current = Date.now();
            const updatedPost = {
                ...activePost,
                comments: activePost.comments.filter(c => !c.deleted),
            };
            setActivePost(updatedPost);
            globalMutate(`${apiUrl}/posts/`, (posts: Post[] = []) =>
                posts.map(p => (p.id === updatedPost.id ? updatedPost : p))
            );

        } catch (err) {
            console.error(err);
            // handle network errors similarly using cooldownIntervalRef
        }
    };




    // Create post
    const handleCreatePost = async ({ title, message }: { title: string; message: string }) => {
        const sanitizedTitle = DOMPurify.sanitize(title.trim());
        const sanitizedMessage = DOMPurify.sanitize(message.trim());

        const res = await fetch(`${apiUrl}/posts/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: sanitizedTitle, message: sanitizedMessage }),
            credentials: "include",
        });

        if (!res.ok) {
            if (res.status === 401) await handleSessionExpired();
            const err = await res.json().catch(() => null);
            showError(err?.detail || err?.error || "Failed to create post");
            return;
        }

        const newPost: Post = await res.json();

        // Optimistically update SWR cache
        globalMutate(
            `${apiUrl}/posts/`,
            (posts: Post[] = []) => [newPost, ...posts],
            false
        );
        setCreatingPost(false);
    };




    // Add comment to active post

    const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


    const handleAddComment = async (message: string) => {
        if (!activePost || !message.trim() || !userId || isSending || isBlocked) return;
        setIsSending(true);

        const sanitizedMessage = DOMPurify.sanitize(message.trim());

        try {
            const res = await fetch(`${apiUrl}/posts/${activePost.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: sanitizedMessage }),
                credentials: "include",
            });

            if (!res.ok) {
                if (res.status === 401) {
                    await handleSessionExpired();
                    return;
                }

                const err = await res.json().catch(() => null);

                // 🚨 If backend says rate limit
                if (res.status === 429) {
                    const seconds = err?.detail?.remaining || 10

                    setIsBlocked(true);
                    setBlockSeconds(seconds);

                    showError(`Slow down. Wait ${seconds} second${seconds > 1 ? "s" : ""}.`);
                    return;
                }

                showError(err?.detail || err?.error || "Failed to post comment.");
                return;
            }

            const newComment: Comment = await res.json();

            // ✅ Update SWR cache only, activePost will sync automatically
            globalMutate(
                `${apiUrl}/posts/`,
                (posts: Post[] = []) =>
                    posts.map(p =>
                        p.id === activePost?.id
                            ? { ...p, comments: [newComment, ...p.comments] }
                            : p
                    ),
                false
            );

            setCommentMessage("");
            if (commentInputRef.current) commentInputRef.current.style.height = "auto";
            hideError();
        } catch (err) {
            console.error(err);
            showError("Network error. Try again.");
        } finally {
            setIsSending(false);
        }
    };

// ✅ Countdown effect
    useEffect(() => {
        if (isBlocked && blockSeconds !== null) {
            if (blockSeconds <= 0) {
                setIsBlocked(false);
                setBlockSeconds(null);
                hideError(); // <-- add this
                return;
            }

            const timer = setTimeout(() => {
                setBlockSeconds(prev => (prev !== null ? prev - 1 : null));
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [isBlocked, blockSeconds, hideError]);











    const filteredPosts = useMemo(() => {
        return posts
            .filter(post =>
                post.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.comments.some(comment =>
                    comment.message.toLowerCase().includes(searchQuery.toLowerCase())
                )
            )
            .sort((a, b) => {
                // Pinned posts first
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;

                // Newest posts first (fallback to 0 if timestamp missing)
                return (new Date(b.timestamp ?? 0).getTime()) - (new Date(a.timestamp ?? 0).getTime());
            });
    }, [posts, searchQuery]);




    // Scroll to bottom when comments change
    useEffect(() => {
        if (commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [activePost?.comments.length]);



    if (loggedOut) return <LoggedOut />;











































    return (

        <div className="flex-1 flex flex-col items-center justify-start w-full min-h-0">








            <div className="w-full max-w-4xl mx-auto flex flex-col h-full min-h-0">




                {creatingPost && (
                    <CreatePost
                        onSubmit={handleCreatePost} // now correctly expects {title, message}
                        onCancel={() => setCreatingPost(false)}
                    />
                )}






                {!creatingPost && !activePost && (
                    <>




                            <div className="w-full flex items-center gap-3">

                                {/* Create Post Button */}
                                <button
                                    onClick={() => setCreatingPost(true)}
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
                                            d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                        />
                                    </svg>
                                </button>
                            </div>











                        <div className={`mx-auto max-w-4xl transition-opacity duration-500 ease-in-out ${listFade ? "opacity-100" : "opacity-0"}`}>

                            <div className="flex-1 overflow-y-auto space-y-4">
                                {filteredPosts.map((post, idx) => (
                                    <div
                                        key={`${post.id}-${idx}`}
                                        onClick={() => handleOpenPost(post)}
                                        className="relative px-1 sm:px-2 py-2 cursor-pointer rounded-xl bg-transparent hover:bg-dark-800 transition-colors duration-100"
                                    >






                                        <div className="flex items-center mb-1 w-full">
                                            {/* Left side: nickname + comments */}
                                            <div className="flex items-center gap-2 truncate">
                                                <span className="text-sm sm:text-sm md:text-base font-semibold truncate text-blue-400">
                                                    {post.nickname}
                                                </span>

                                                {/* Comments bubble + pinned */}
                                                <div className="flex items-center justify-center bg-black/70 backdrop-blur-xl
                                                    border border-white/10 rounded-full shadow-lg
                                                    px-3 h-6 min-w-[40px] truncate">
                                                    <svg
                                                        aria-hidden="true"
                                                        className="w-3 h-3 mr-1 text-white-400"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M10 1a9 9 0 00-9 9c0 1.947.79 3.58 1.935 4.957L.231 17.661A.784.784 0 00.785 19H10a9 9 0 009-9 9 9 0 00-9-9zm0 16.2H6.162c-.994.004-1.907.053-3.045.144l-.076-.188a36.981 36.981 0 002.328-2.087l-1.05-1.263C3.297 12.576 2.8 11.331 2.8 10c0-3.97 3.23-7.2 7.2-7.2s7.2 3.23 7.2 7.2-3.23 7.2-7.2 7.2z" />
                                                    </svg>

                                                    <span className="text-white-400 text-sm sm:text-sm md:text-base font-medium">
                                                        {post.comments.length}
                                                    </span>

                                                    {post.pinned && (
                                                        <span className="text-yellow-400 text-sm sm:text-sm md:text-base font-bold ml-1 truncate">
                                                            📌
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Timestamp right-aligned */}
                                            <span className="text-white-500/60 text-sm sm:text-sm md:text-base ml-auto whitespace-nowrap">
                                                {formatLocalDate(post.timestamp, post.edited)}
                                            </span>
                                        </div>

                                        <h3 className="text-white-800 font-bold mb-1 text-sm sm:text-base md:text-lg line-clamp-2">
                                            {post.title}
                                        </h3>
                                    </div>







                                ))}
                            </div>
                        </div>


                    </>
                )}







                <div className={`mx-auto max-w-4xl transition-opacity duration-500 ease-in-out ${listFade ? "opacity-100" : "opacity-0"}`}>
                    {activePost && (
                        <div className="flex flex-col w-full h-full min-h-0">




                            {/* Back button like Reddit, aligned left */}
                            <div className="flex items-center justify-start">
                                <button
                                    onClick={handleBackToList}
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
                                <div className="flex-1 overflow-y-auto space-y-3 p-2 hide-scrollbar">

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
                                        {isBlocked && blockSeconds !== null && (
                                            <div className="mb-2 text-red-400 text-xs sm:text-sm text-center">
                                                You are posting too fast. Wait {blockSeconds} second(s).
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
                                            {[...activePost.comments]
                                                .filter(c => !c.deleted) // <-- filter out deleted comments
                                                .sort((a, b) => {
                                                    // Pinned comments first
                                                    if (a.pinned && !b.pinned) return -1;
                                                    if (!a.pinned && b.pinned) return 1;

                                                    // Otherwise, newest first
                                                    return (new Date(b.timestamp ?? 0).getTime()) - (new Date(a.timestamp ?? 0).getTime());
                                                })

                                                .map((comment) => {
                                                    const isOwner = userId && comment.userId === userId;
                                                    const isEditing = editingCommentId === comment.id;

                                                    return (
                                                        <div
                                                            key={comment.id ?? Math.random().toString(36).substr(2, 9)}
                                                            className={`w-full flex ${isOwner ? "justify-end" : "justify-start"}`}
                                                        >
                                                            <div
                                                                className={`relative block w-full px-1 sm:px-2 pt-3 rounded-xl
                                                                    ${isOwner ? `ml-auto bg-transparent` : "mr-auto bg-black/50"}`}

                                                            >
                                                                {/* nickname + edit/delete */}
                                                                <div className="flex justify-between gap-5 mb-1">
                                                                    <span className="flex items-center gap-1 text-sm sm:text-sm md:text-base font-bold truncate text-blue-400">
                                                                            {comment.nickname}

                                                                        {/* reactions go here */}
                                                                        {(comment.reactions?.length ?? 0) > 0 && (
                                                                            <span className="ml-2 flex gap-1">
                                                                                {comment.reactions?.map((r, idx) => (
                                                                                    <span key={r.id ?? idx}>{r.emoji}</span>
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
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" > <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /> </svg>
                                                                                    </button>

                                                                                    <button
                                                                                        onClick={() => handleDeleteComment(comment.id)}
                                                                                        title="Delete Comment"
                                                                                    >
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" > <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /> </svg>
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
                                                                <div className="mt-1 text-right text-white-500/60 text-[8px] sm:text-[10px] md:text-[12px]">
                                                                    {formatLocalDate(comment.timestamp, comment.edited)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>


















                            </div>

                        </div>

                    )}
            </div>





            </div>
        </div>
    );
}

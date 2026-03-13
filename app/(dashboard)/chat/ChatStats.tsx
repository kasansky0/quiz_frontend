"use client";

import { useState, useEffect, useRef } from "react";
import CreatePost from "./CreatePost";
import { signOut } from "next-auth/react";
import { Post } from "../../hooks/usePosts";  // <-- import these
import { useUser } from "../../UserContext";
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { useError } from "@/app/ErrorProvider";
import { useMemo } from "react";
import DOMPurify from 'dompurify';
import ActivePost from "./ActivePost";
import { chatApis } from '@/app/hooks/chatApis'; // adjust path as needed




const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ChatStats() {
    const [activePost, setActivePost] = useState<Post | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [creatingPost, setCreatingPost] = useState(false);
    const { userId } = useUser();
    const router = useRouter(); // initialize router for back button
    const [loggedOut, setLoggedOut] = useState(false);
    const { showError, hideError } = useError();
    const handleBackToList = () => { setActivePost(null); };
    const [listFade, setListFade] = useState(false);   // for posts list
    const [loadingComments, setLoadingComments] = useState(false);
    const [activePostComments, setActivePostComments] = useState<Comment[]>([]);
    const [serverError, setServerError] = useState<string | null>(null);
    const [showLoading, setShowLoading] = useState(true);







    const { posts, setPosts, fetchPostComments, commentSkips } = chatApis({ apiUrl });






    const handleActivatePost = async (post: Post) => {
        setLoadingComments(true);

        // Reset skip for this post so first batch always starts at 0
        commentSkips[post.id] = 0;

        // fetch comments separately
        const comments = await fetchPostComments(post.id, 0, 10);
        console.log("Fetched comments:", comments);

        setActivePost(post); // post itself doesn't have comments
        setActivePostComments(comments ?? []); // save them in a separate state

        setLoadingComments(false);
    };







    useEffect(() => {
        const timer = setTimeout(() => setListFade(true), 50); // fade in after 50ms
        return () => clearTimeout(timer);
    }, []);







    useEffect(() => {
        const timer = setTimeout(() => setShowLoading(false), 1500); // 3 seconds minimum
        return () => clearTimeout(timer);
    }, []);



















    const fetcher = (url: string) =>
        fetch(url, { credentials: "include" }).then(res => res.json());

    const { data: fetchedPosts, isLoading: postsLoading } = useSWR<Post[]>(
        `${apiUrl}/posts/`,
        fetcher,
        { refreshInterval: 10000, revalidateOnFocus: true, dedupingInterval: 5000 }
    );





    // Log posts whenever they change
    useEffect(() => {
        console.log("Posts data from backend:", posts);
    }, [posts]);


















































    const handleSessionExpired = async () => {
        await signOut({ redirect: false });
        setLoggedOut(true);
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
            if (res.status === 401) {
                await handleSessionExpired();
                return;
            }

            const err = await res.json().catch(() => null);

            // Convert backend error into a string for the banner
            let msg = "Failed to create post";
            if (err?.detail) {
                if (typeof err.detail === "string") msg = err.detail;
                else if (typeof err.detail === "object" && err.detail.error) msg = err.detail.error;
            } else if (err?.error) {
                msg = err.error;
            }

            setServerError(msg);
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



















    useEffect(() => {
        console.log("Posts data from backend:", fetchedPosts);
    }, [fetchedPosts]);

    const filteredPosts = useMemo(() => {
        if (!fetchedPosts) return [];
        return fetchedPosts
            .filter(post =>
                post.message.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return (new Date(b.timestamp ?? 0).getTime()) - (new Date(a.timestamp ?? 0).getTime());
            });
    }, [fetchedPosts, searchQuery]);




    if (loggedOut) return <LoggedOut />;











































    return (

        <div className="flex-1 flex flex-col items-center justify-start w-full min-h-0">

            {(showLoading || !fetchedPosts || postsLoading) ? (
                <div className="min-h-screen flex items-center justify-center text-white bg-black">
                    <p className="text-xl flex items-center">
                        Loading
                        <span className="ml-2 flex space-x-1">
                          <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce"></span>
                          <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                          <span className="w-2 h-2 bg-white rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                        </span>
                    </p>
                </div>
            ) : (



                    <div className="w-full max-w-4xl mx-auto flex flex-col h-full min-h-0">




                        {creatingPost && (
                            <CreatePost
                                onSubmit={handleCreatePost} // now correctly expects {title, message}
                                onCancel={() => setCreatingPost(false)}
                                isBlocked={!!serverError}                     // show blocked banner if serverError exists
                                blockMessage={serverError || undefined}       // message to display
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
                                        {filteredPosts.map(post => (
                                            <div
                                                key={post.id}
                                                onClick={() => handleActivatePost(post)}
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
                                                                {post.commentCount ?? 0}
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







                        <div className={`transition-opacity duration-500 ease-in-out ${listFade ? "opacity-100" : "opacity-0"} w-full flex-1`}>
                            {activePost && (
                                <>
                                    <ActivePost
                                        post={activePost}
                                        comments={activePostComments}
                                        userId={userId}
                                        onBack={handleBackToList}
                                        totalComments={activePost.commentCount ?? 0}
                                    />
                                </>
                            )}
                    </div>

            </div>
            )}
        </div>
    );
}

"use client";

import {useCallback, useEffect, useState} from "react";
import {signIn, signOut} from "next-auth/react";
import {usePosts} from "@/app/hooks/usePosts";
import { useError } from "@/app/ErrorProvider";


interface UseChatPostsProps {
    apiUrl: string;
    mainView?: string;
}


export function chatApis({ apiUrl, mainView }: UseChatPostsProps) {
    const {posts, setPosts, lastLocalUpdateRef} = usePosts([]);
    const [loggedOut, setLoggedOut] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
    const [errorState, setErrorState] = useState<string | null>(null);
    const { showError, hideError } = useError();


    // Track how many comments we've fetched per post
    const [commentSkips, setCommentSkips] = useState<Record<string, number>>({});


    const handleSessionExpired = async () => {
        await signOut({redirect: false}); // clear session
        setLoggedOut(true); // optional if you want local state
        setCooldownSeconds(null);
        setErrorState(null);
    };








    const fetchPostComments = useCallback(
        async (postId: string, skipOverride?: number, limit = 10) => {
            if (!apiUrl || !postId) return null;

            const skip = skipOverride ?? commentSkips[postId] ?? 0;

            try {
                const res = await fetch(
                    `${apiUrl}/posts/${postId}/comments?skip=${skip}&limit=${limit}`,
                    { method: "GET", credentials: "include" }
                );

                if (!res.ok) {
                    if (res.status === 401) handleSessionExpired();
                    return null;
                }

                const data = await res.json(); // { comments: [], total: number }

                setPosts(prev =>
                    prev.map(p => {
                        if (p.id === postId) {
                            const existingComments = p.comments || [];
                            return {
                                ...p,
                                comments:
                                    skip === 0 ? data.comments : [...existingComments, ...data.comments],
                                commentCount: data.total,
                            };
                        }
                        return p;
                    })
                );

                // Update skip for next fetch only if skipOverride was not used
                if (skipOverride === undefined) {
                    setCommentSkips(prev => ({ ...prev, [postId]: skip + data.comments.length }));
                }

                return data;
            } catch (err) {
                // Network error happened, but we won’t log it to console
                return null;
            }
        },
        [apiUrl, commentSkips, setPosts]
    );


    return {
        posts,
        setPosts,
        loggedOut,
        errorState,
        fetchPostComments, // ✅ you need this for "Load More"
        commentSkips,      // optional: useful for UI to decide if "Load More" should be shown
    };


}











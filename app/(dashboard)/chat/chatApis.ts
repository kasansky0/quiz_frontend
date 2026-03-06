"use client";

import {useCallback, useEffect, useState} from "react";
import {signIn, signOut} from "next-auth/react";
import {usePosts} from "@/app/hooks/usePosts";

interface UseChatPostsProps {
    apiUrl: string;
    mainView?: string;
}


export function chatApis({ apiUrl, mainView }: UseChatPostsProps) {
    const {posts, setPosts, lastLocalUpdateRef} = usePosts([]);
    const [loggedOut, setLoggedOut] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
    const [errorState, setErrorState] = useState<string | null>(null);


    const handleSessionExpired = async () => {
        await signOut({redirect: false}); // clear session
        setLoggedOut(true); // optional if you want local state
        setCooldownSeconds(null);
        setErrorState(null);
    };


    const fetchPosts = useCallback(async () => {
        if (!apiUrl) return;

        // 🛑 skip polling if local update was recent
        if (Date.now() - lastLocalUpdateRef.current < 3000) return;

        try {
            const res = await fetch(`${apiUrl}/posts/`, {
                method: "GET",
                credentials: "include",
            });

            if (!res.ok) {
                if (res.status === 401) {
                    handleSessionExpired(); // ✅ no await needed
                } else {
                    console.error(`Failed to fetch posts: HTTP ${res.status}`);
                }
                return;
            }

            const data = await res.json();
            setPosts(data);
        } catch (err) {
            console.error("❌ Fetch posts failed (network/auth):", err);

            // Treat network failure as session loss
            handleSessionExpired();
        }
    }, [apiUrl]);



    // Polling effect
    useEffect(() => {
        fetchPosts(); // initial fetch

        const interval = setInterval(fetchPosts, 10000); // poll every 10s
        return () => clearInterval(interval);
    }, [fetchPosts]);


    return { posts, setPosts, loggedOut, errorState, fetchPosts };


}











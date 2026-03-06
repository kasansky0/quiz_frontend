"use client";

import { useState, useRef } from "react";

export interface Comment {
    id: string;
    userId: string;
    nickname: string;
    message: string;
    timestamp?: string;
}

export interface Post {
    id: string;
    title: string;
    userId: string;
    nickname: string;
    message: string;
    timestamp?: string;
    comments: Comment[];
    pinned?: boolean;
}

export function usePosts(initialPosts: Post[] = []) {
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const lastLocalUpdateRef = useRef<number>(Date.now());

    return { posts, setPosts, lastLocalUpdateRef };
}

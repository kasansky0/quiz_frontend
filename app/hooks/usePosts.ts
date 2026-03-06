"use client";

import { useState, useRef } from "react";

export interface Comment {
    id: string;
    userId: string;
    nickname: string;
    message: string;
    timestamp?: string;
    edited?: string;       // timestamp of last edit
    pinned?: boolean;      // whether comment is pinned
    _isLocal?: boolean;  // used in useEffect to keep local-only comments
    deleted?: boolean;   // used in handleDeleteComment to filter out deleted comments
    reactions?: { id?: string; emoji: string }[]; // optional reactions array
}

export interface Post {
    id: string;
    title: string;
    userId: string;
    nickname: string;
    message: string;
    edited?: string;
    timestamp?: string;
    comments: Comment[];
    pinned?: boolean;
}

export function usePosts(initialPosts: Post[] = []) {
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const lastLocalUpdateRef = useRef<number>(Date.now());

    return { posts, setPosts, lastLocalUpdateRef };
}

"use client";

import { useState, useRef } from "react";

export interface Comment {
    _id: string;
    id: string;
    userId: string;
    nickname: string;
    message: string;
    timestamp: string;
    edited?: string;       // timestamp of last edit
    pinned?: boolean;      // whether comment is pinned
    _isLocal?: boolean;  // used in useEffect to keep local-only comments
    deleted?: boolean;   // used in handleDeleteComment to filter out deleted comments
    reactions?: { id?: string; emoji: string }[]; // optional reactions array
    neta2?: boolean;
    neta3?: boolean;
    neta4?: boolean;
}

export interface PostImage {
    url?: string;
    thumbnail?: string;
    secure_url?: string;
}

export interface Post {
    _id: string;
    id: string;
    title: string;
    userId: string;
    nickname: string;
    message: string;
    edited?: string;
    timestamp?: string;
    comments: Comment[];
    pinned?: boolean;
    commentCount?: number;
    neta2?: boolean;
    neta3?: boolean;
    neta4?: boolean;
    likes: number;
    likedByUser?: boolean;
    images?: (string | PostImage)[];
    tags?: string[];
    uniqueSeenUsers?: number;
    totalViews?: number;
}

export function usePosts(initialPosts: Post[] = []) {
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const lastLocalUpdateRef = useRef<number>(Date.now());

    return { posts, setPosts, lastLocalUpdateRef };
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";

import { Post, Comment } from "@/app/hooks/usePosts";
import ActivePost from "@/app/(dashboard)/feed/ActivePost";
import { useUser } from "@/app/UserContext";
import { useError } from "@/app/ErrorProvider";

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

export default function PostPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const { userId } = useUser();
    const { showError } = useError();

    const postId = Array.isArray(id) ? id[0] : id;

    // -----------------------------
    // STATE (moved from feed page)
    // -----------------------------
    const [post, setPost] = useState<Post | null>(null);
    const [activePostComments, setActivePostComments] = useState<Comment[]>([]);
    const [deletedCommentIds, setDeletedCommentIds] = useState<Set<string>>(new Set());
    const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

    // -----------------------------
    // FETCH SINGLE POST
    // -----------------------------
    const fetchPost = async (url: string) => {
        const res = await fetch(url, {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            showError(data?.detail || "Failed to fetch post");
            return null;
        }

        return data;
    };

    const { data: postData, isLoading: postLoading } = useSWR<Post>(
        postId ? `${apiUrl}/posts/${postId}` : null,
        fetchPost,
        {
            revalidateOnFocus: true,
        }
    );

    useEffect(() => {
        if (!postData) return;
        setPost(postData);
    }, [postData]);

    // -----------------------------
    // COMMENTS FETCHER
    // -----------------------------
    const commentsFetcher = async (url: string) => {
        const res = await fetch(url, {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            showError(data?.detail || "Failed to fetch comments");
            return [];
        }

        return data;
    };

    const { data: polledComments } = useSWR<Comment[]>(
        postId
            ? `${apiUrl}/posts/${postId}/comments?skip=0&limit=25`
            : null,
        commentsFetcher,
        {
            refreshInterval: 300000,
            revalidateOnFocus: true,
            dedupingInterval: 1000,
        }
    );

    useEffect(() => {
        if (!polledComments || !Array.isArray(polledComments)) return;

        const sorted = [...polledComments].sort(
            (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
        );

        setActivePostComments(sorted);
    }, [polledComments]);

    // -----------------------------
    // POST UPDATE HANDLERS (same as feed page)
    // -----------------------------
    const handlePostUpdate = (updatedPost: Post) => {
        setPost(updatedPost);
    };

    const handlePostDelete = (deletedPostId: string) => {
        router.push("/");
    };

    const handleCommentCountChange = (postId: string, newCount: number) => {
        if (!post) return;

        setPost(prev =>
            prev ? { ...prev, commentCount: newCount } : prev
        );
    };

    const togglePostExpand = (postId: string) => {
        setExpandedPosts(prev => {
            const next = new Set(prev);
            next.has(postId) ? next.delete(postId) : next.add(postId);
            return next;
        });
    };

    // -----------------------------
    // LOADING STATE
    // -----------------------------
    if (postLoading || !post) {
        return (
            <div className="min-h-screen flex items-center justify-center text-black">
                <div className="text-center space-y-2">
                    <p className="text-lg font-medium">Loading post...</p>
                    <p className="text-xs text-gray-500">ID: {postId}</p>
                </div>
            </div>
        );
    }

    // -----------------------------
    // FINAL RENDER (MOVED ACTIVE POST)
    // -----------------------------
    return (
        <div className="w-full min-h-screen bg-white">
            <ActivePost
                post={post}
                comments={{
                    comments: activePostComments,
                    total: Number(post.commentCount ?? 0),
                }}
                userId={userId}
                deletedCommentIds={deletedCommentIds}
                setDeletedCommentIds={setDeletedCommentIds}
                totalComments={Number(post.commentCount ?? 0)}
                expandedPosts={expandedPosts}
                togglePostExpand={togglePostExpand}
                onBack={() => router.back()}
                onPostUpdate={handlePostUpdate}
                onPostDelete={handlePostDelete}
                onCommentCountChange={handleCommentCountChange}
            />
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";

type UserStats = {
    name: string;
    email: string;
    image: string;
    nickname: string;
    platform_stats?: any;
};

type ProfileActivity = {
    posts: any[];
    comments: any[];
};

export default function ProfilePage() {
    const [user, setUser] = useState<UserStats | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const base = process.env.NEXT_PUBLIC_API_URL;

                // 🔥 CALL YOUR EXISTING BACKEND DIRECTLY

                const [userRes, profileRes] = await Promise.all([
                    fetch(`${base}/user/`, {
                        method: "POST",
                        credentials: "include", // IMPORTANT (auth cookie)
                    }),
                    fetch(`${base}/profile/`, {
                        method: "GET",
                        credentials: "include",
                    }),
                ]);

                if (!userRes.ok || !profileRes.ok) {
                    throw new Error("Failed to load profile data");
                }

                const userData = await userRes.json();
                const profileData: ProfileActivity = await profileRes.json();

                setUser(userData);
                setPosts(profileData.posts ?? []);
                setComments(profileData.comments ?? []);
            } catch (err) {
                console.error("Profile load failed:", err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Failed to load user
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center px-4 py-10">
            <div className="w-full max-w-3xl space-y-6">

                {/* HEADER */}
                <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-5">
                    <img
                        src={user.image}
                        className="w-20 h-20 rounded-full object-cover border"
                    />

                    <div>
                        <h1 className="text-2xl font-semibold">{user.name}</h1>
                        <p className="text-gray-500">{user.email}</p>

                        <div className="mt-2 px-3 py-1 bg-gray-100 rounded-full inline-block">
                            {user.nickname}
                        </div>
                    </div>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow">
                        <p className="text-gray-500 text-sm">Posts</p>
                        <p className="text-2xl font-bold">{posts.length}</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow">
                        <p className="text-gray-500 text-sm">Comments</p>
                        <p className="text-2xl font-bold">{comments.length}</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow">
                        <p className="text-gray-500 text-sm">Total Activity</p>
                        <p className="text-2xl font-bold">
                            {posts.length + comments.length}
                        </p>
                    </div>
                </div>

                {/* POSTS */}
                <div className="bg-white p-6 rounded-2xl shadow">
                    <h2 className="font-semibold mb-3">Your Posts</h2>
                    <div className="space-y-3">
                        {posts.map((post: any) => (
                            <div key={post.id} className="border-b pb-3">
                                <p className="font-semibold">{post.title}</p>
                                <p className="text-sm text-gray-500">
                                    {post.message}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COMMENTS */}
                <div className="bg-white p-6 rounded-2xl shadow">
                    <h2 className="font-semibold mb-3">Your Comments</h2>
                    <div className="space-y-3">
                        {comments.map((comment: any) => (
                            <div key={comment.id} className="border-b pb-3">
                                <p className="text-sm">{comment.message}</p>
                                <p className="text-xs text-gray-400">
                                    Post ID: {comment.postId}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
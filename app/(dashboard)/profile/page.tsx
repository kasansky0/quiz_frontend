"use client";

import { useEffect, useMemo, useState } from "react";

type UserStats = {
    name: string;
    email: string;
    image: string;
    nickname: string;
    seenQuestions?: Record<
        string,
        { answered_correctly: boolean; seen_at: any }[]
    >;
};

export default function ProfilePage() {
    const [user, setUser] = useState<UserStats | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        totalSeen: 0,
        correct: 0,
        wrong: 0,
        accuracy: 0,
    });

    useEffect(() => {
        async function load() {
            const base = process.env.NEXT_PUBLIC_API_URL;

            const [u, p] = await Promise.all([
                fetch(`${base}/user/`, {
                    method: "POST",
                    credentials: "include",
                }),
                fetch(`${base}/profile/`, {
                    credentials: "include",
                }),
            ]);

            const userData = await u.json();
            const profileData = await p.json();

            setUser(userData);
            setPosts(profileData.posts ?? []);
            setComments(profileData.comments ?? []);

            const seen = userData.seenQuestions ?? {};

            const uniqueQuestionIds = Object.keys(seen);

            let totalSeen = 0;
            let correct = 0;
            let wrong = 0;

            for (const qId of uniqueQuestionIds) {
                const entries = seen[qId];

                for (const entry of entries) {
                    totalSeen++;

                    if (entry.answered_correctly) correct++;
                    else wrong++;
                }
            }

            const total = correct + wrong;
            const accuracy = total ? Math.round((correct / total) * 100) : 0;

            setStats({
                totalSeen: total,
                correct,
                wrong,
                accuracy,
            });

            setLoading(false);
        }

        load();
    }, []);

    const uniqueQuestions = useMemo(() => {
        if (!user?.seenQuestions) return [];
        return Object.keys(user.seenQuestions);
    }, [user]);

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
        <div className="min-h-screen bg-gray-100 flex justify-center px-4 py-6">
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* LEFT SIDEBAR */}
                <div className="md:col-span-3 space-y-4">

                    {/* PROFILE CARD */}
                    <div className="bg-white rounded-xl shadow p-4 text-center">
                        <img
                            src={user.image}
                            className="w-20 h-20 mx-auto rounded-full border object-cover"
                        />

                        <h1 className="mt-3 font-semibold text-lg">
                            {user.name}
                        </h1>

                        <p className="text-sm text-gray-500">
                            {user.email}
                        </p>

                        <div className="mt-2 text-xs bg-gray-100 inline-block px-2 py-1 rounded-full">
                            {user.nickname}
                        </div>
                    </div>

                    {/* QUICK STATS */}
                    <div className="bg-white rounded-xl shadow p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Posts</span>
                            <span className="font-semibold">{posts.length}</span>
                        </div>

                        <div className="flex justify-between">
                            <span>Comments</span>
                            <span className="font-semibold">{comments.length}</span>
                        </div>

                        <div className="flex justify-between">
                            <span>Questions Seen</span>
                            <span className="font-semibold">{stats.totalSeen}</span>
                        </div>

                        <div className="flex justify-between">
                            <span>Correct / Wrong</span>
                            <span className="font-semibold">
                            {stats.correct} / {stats.wrong}
                        </span>
                        </div>
                    </div>

                    {/* ACCURACY */}
                    <div className="bg-white rounded-xl shadow p-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span>Accuracy</span>
                            <span className="font-semibold">
                            {stats.accuracy}%
                        </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${stats.accuracy}%` }}
                            />
                        </div>
                    </div>

                    {/* QUESTIONS SUMMARY */}
                    <div className="bg-white rounded-xl shadow p-4">
                        <h2 className="text-sm font-semibold mb-2">
                            Questions Seen
                        </h2>

                        <div className="space-y-1 text-xs text-gray-600 max-h-40 overflow-y-auto">
                            {uniqueQuestions.map((q) => (
                                <div
                                    key={q}
                                    className="bg-gray-50 px-2 py-1 rounded"
                                >
                                    Question #{q}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CENTER FEED */}
                <div className="md:col-span-6 space-y-4">

                    {/* POSTS FEED */}
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            className="bg-white rounded-xl shadow p-4"
                        >
                            <h3 className="font-semibold text-base">
                                {post.title}
                            </h3>

                            <p className="text-sm text-gray-600 mt-1">
                                {post.message}
                            </p>
                        </div>
                    ))}

                    {/* COMMENTS FEED */}
                    {comments.map((c) => (
                        <div
                            key={c.id}
                            className="bg-white rounded-xl shadow p-4"
                        >
                            <p className="text-sm">{c.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Post #{c.postId}
                            </p>
                        </div>
                    ))}
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="md:col-span-3 space-y-4">

                    {/* INSIGHTS */}
                    <div className="bg-white rounded-xl shadow p-4">
                        <h2 className="font-semibold text-sm mb-3">
                            Insights
                        </h2>

                        <div className="text-sm space-y-2">
                            <div className="flex justify-between">
                                <span>Engagement</span>
                                <span className="font-semibold">
                                {posts.length + comments.length}
                            </span>
                            </div>

                            <div className="flex justify-between">
                                <span>Accuracy</span>
                                <span className="font-semibold">
                                {stats.accuracy}%
                            </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
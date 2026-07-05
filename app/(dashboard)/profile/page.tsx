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
        <div className="min-h-screen bg-gray-50 flex justify-center px-4 py-10">
            <div className="w-full max-w-3xl space-y-6">

                {/* HEADER */}
                <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-5">
                    <img
                        src={user.image}
                        className="w-20 h-20 rounded-full object-cover border"
                    />
                    <div>
                        <h1 className="text-2xl font-semibold">
                            {user.name}
                        </h1>
                        <p className="text-gray-500">{user.email}</p>

                        <div className="mt-2 px-3 py-1 bg-gray-100 rounded-full inline-block">
                            {user.nickname}
                        </div>
                    </div>
                </div>

                {/* STATS ROW 1 */}
                <div className="bg-white p-4 rounded-2xl shadow space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span>Posts / Comments</span>
                        <span className="font-semibold">
                            {posts.length} / {comments.length}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span>Questions Seen / Correct / Wrong</span>
                        <span className="font-semibold">
                            {stats.totalSeen} / {stats.correct} / {stats.wrong}
                        </span>
                    </div>
                </div>

                {/* ACCURACY BAR */}
                <div className="bg-white p-4 rounded-2xl shadow">
                    <div className="flex justify-between mb-2 text-sm">
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

                {/* UNIQUE QUESTIONS SCROLL */}
                <div className="bg-white p-6 rounded-2xl shadow">
                    <h2 className="font-semibold mb-3">
                        Questions You’ve Seen
                    </h2>

                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                        {uniqueQuestions.map((q) => (
                            <div
                                key={q}
                                className="text-sm bg-gray-50 p-2 rounded"
                            >
                                Question ID: {q}
                            </div>
                        ))}
                    </div>
                </div>

                {/* POSTS SCROLL */}
                <div className="bg-white p-6 rounded-2xl shadow">
                    <h2 className="font-semibold mb-3">Your Posts</h2>

                    <div className="max-h-48 overflow-y-auto space-y-3 pr-2">
                        {posts.map((post) => (
                            <div key={post.id} className="border-b pb-2">
                                <p className="font-semibold">
                                    {post.title}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {post.message}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COMMENTS SCROLL */}
                <div className="bg-white p-6 rounded-2xl shadow">
                    <h2 className="font-semibold mb-3">
                        Your Comments
                    </h2>

                    <div className="max-h-48 overflow-y-auto space-y-3 pr-2">
                        {comments.map((c) => (
                            <div key={c.id} className="border-b pb-2">
                                <p className="text-sm">{c.message}</p>
                                <p className="text-xs text-gray-400">
                                    Post ID: {c.postId}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
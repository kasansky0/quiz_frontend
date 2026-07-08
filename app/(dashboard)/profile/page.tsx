"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NotificationBell from "./NotificationBell";

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
    const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

    const togglePost = (id: string) => {
        setExpandedPosts((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

    const toggleComment = (id: string) => {
        setExpandedComments((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const [stats, setStats] = useState({
        totalSeen: 0,
        correct: 0,
        wrong: 0,
        accuracy: 0,
    });

    useEffect(() => {
        async function load() {
            const base = process.env.NEXT_PUBLIC_API_URL;

            const [u, p, n] = await Promise.all([
                fetch(`${base}/user/`, {
                    method: "POST",
                    credentials: "include",
                }),

                fetch(`${base}/profile/`, {
                    credentials: "include",
                }),

                fetch(`${base}/notifications/`, {
                    credentials: "include",
                }),
            ]);

            const userData = await u.json();
            const profileData = await p.json();
            const notificationData = await n.json();

            setUser(userData);
            setPosts(profileData.posts ?? []);
            setComments(profileData.comments ?? []);

            const unreadCount = (notificationData ?? []).filter(
                (notification: any) => notification.seen === false
            ).length;

            setUnreadNotificationCount(unreadCount);

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
                totalSeen,
                correct,
                wrong,
                accuracy,
            });

            setLoading(false);
        }

        load();
    }, []);

    const formatLocalDate = (dateString?: string) => {
        if (!dateString) return "";

        let isoString = dateString.split(".")[0] + "Z";

        const date = new Date(isoString);
        const now = new Date();

        const diffMs = now.getTime() - date.getTime();

        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60)
            return `${diffSeconds} seconds ago`;

        if (diffMinutes < 60)
            return `${diffMinutes} minutes ago`;

        if (diffHours < 24)
            return `${diffHours} hours ago`;

        if (diffDays < 30)
            return `${diffDays} days ago`;

        const diffMonths = Math.floor(diffDays / 30);

        if (diffMonths < 12)
            return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;

        const diffYears = Math.floor(diffMonths / 12);

        return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black-200 text-black">
                <p className="text-xl flex items-center">
                    Loading
                    <span className="ml-2 flex space-x-1">
                    <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce"></span>
                    <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-black rounded-full animate-dot-bounce [animation-delay:0.4s]"></span>
                </span>
                </p>
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
        <div className="min-h-screen bg-gray-100 flex justify-center px-3 py-6 sm:px-4 sm:py-10">
            <div className="w-full max-w-xl space-y-5 sm:space-y-8">

                {/* HEADER */}
                <div className="bg-white rounded-2xl shadow p-6 relative">

                    <div className="absolute top-5 right-5">
                        <NotificationBell unreadCount={unreadNotificationCount} />
                    </div>

                    <div className="flex items-center gap-3 pr-10">
                        <img
                            src={user.image}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border shrink-0"
                        />

                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-semibold truncate">
                                {user.name}
                            </h1>

                            <p className="text-sm text-gray-500 truncate">
                                {user.email}
                            </p>

                            <div className="mt-2 px-3 py-1 bg-gray-100 rounded-full inline-block text-sm">
                                {user.nickname}
                            </div>
                        </div>
                    </div>

                </div>

                {/* QUESTION STATS */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-2xl shadow">
                        <p className="text-gray-500 text-xs sm:text-sm">Seen</p>
                        <p className="text-xl sm:text-2xl font-bold">{stats.totalSeen}</p>
                    </div>

                    <div className="bg-white p-3 rounded-2xl shadow">
                        <p className="text-gray-500 text-xs sm:text-sm">Correct</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">
                            {stats.correct}
                        </p>
                    </div>

                    <div className="bg-white p-3 rounded-2xl shadow">
                        <p className="text-gray-500 text-xs sm:text-sm">Wrong</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-500">
                            {stats.wrong}
                        </p>
                    </div>
                </div>

                {/* ACCURACY BAR */}
                <div className="bg-white p-4 rounded-2xl shadow">
                    <div className="flex justify-between mb-2 text-sm">
                        <span>Accuracy</span>
                        <span className="font-semibold">{stats.accuracy}%</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${stats.accuracy}%` }}
                        />
                    </div>
                </div>

                {/* SEEN QUESTIONS (REAL CONTENT) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                        Questions You've Seen
                    </h2>

                    <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                        {user.seenQuestions &&
                            Object.entries(user.seenQuestions)
                                .sort(([, attemptsA]: any, [, attemptsB]: any) => {
                                    const lastA = attemptsA?.[attemptsA.length - 1]?.seen_at
                                        ? new Date(attemptsA[attemptsA.length - 1].seen_at).getTime()
                                        : 0;

                                    const lastB = attemptsB?.[attemptsB.length - 1]?.seen_at
                                        ? new Date(attemptsB[attemptsB.length - 1].seen_at).getTime()
                                        : 0;

                                    return lastB - lastA; // newest first
                                })
                                .map(([qId, attempts]: any) => {
                                    const lastAttempt = attempts?.[attempts.length - 1];
                                    const preview = lastAttempt?.question_preview;

                                    if (!preview) return null;

                                    return (
                                        <div key={qId} className="border-b pb-3">
                                            <p className="font-semibold">
                                                {preview.length > 79
                                                    ? preview.slice(0, 79) + "..."
                                                    : preview}
                                            </p>

                                            <p className="text-sm text-gray-600">
                                                Last answer:{" "}
                                                {lastAttempt?.answered_correctly
                                                    ? "Correct"
                                                    : "Wrong"}
                                            </p>

                                            <p className="text-xs text-gray-400">
                                                Attempts: {attempts.length}
                                            </p>
                                        </div>
                                    );
                                })}
                    </div>
                </div>

                {/* POSTS SCROLL */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 flex justify-between">
                        <span>Your Posts</span>
                        <span className="text-gray-400">{posts.length}</span>
                    </h2>

                    <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                        {posts.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-6">
                                You haven’t posted anything yet.
                            </p>
                        ) : (
                            posts.map((post) => {
                                const isExpanded = expandedPosts[post.id];
                                const shouldTruncate = post.message?.length > 180;

                                return (
                                    <div key={post.id} className="border-b pb-3">
                                        <Link href={`/post/${post.id}`} className="inline-block">
                                            <span className="font-semibold text-blue-600 hover:underline cursor-pointer">
                                                {post.title}
                                            </span>
                                        </Link>

                                        <div className="relative">
                                            <p
                                                className={`text-sm text-gray-500 whitespace-pre-wrap ${
                                                    !isExpanded && shouldTruncate ? "line-clamp-3" : ""
                                                }`}
                                            >
                                                {post.message}
                                            </p>

                                            {/* FADE ONLY IF TRUNCATED + NOT EXPANDED */}
                                            {!isExpanded && shouldTruncate && (
                                                <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                                            )}
                                        </div>

                                        {shouldTruncate && (
                                            <button
                                                onClick={() => togglePost(post.id)}
                                                className="text-blue-500 text-xs mt-1"
                                            >
                                                {isExpanded ? "Show less" : "See more"}
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* COMMENTS SCROLL */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 flex justify-between">
                        <span>Your Comments</span>
                        <span className="text-gray-400">{comments.length}</span>
                    </h2>

                    <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                        {comments.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-6">
                                You haven’t added any comments yet.
                            </p>
                        ) : (
                            comments.map((c) => {
                                const isExpanded = expandedComments[c.id];
                                const shouldTruncate = c.message?.length > 180;

                                return (
                                    <Link
                                        href={`/post/${c.postId}#comment-${c.id}`}
                                        key={c.id}
                                        className="block border-b pb-3"
                                    >
                                        <div className="bg-white rounded-xl shadow-sm p-4">

                                            {/* COMMENT */}
                                            <div className="relative">

                                                <p
                                                    className={`text-sm text-black whitespace-pre-wrap ${
                                                        !isExpanded && shouldTruncate
                                                            ? "line-clamp-3"
                                                            : ""
                                                    }`}
                                                >
                                                    {c.message}
                                                </p>

                                                {!isExpanded && shouldTruncate && (
                                                    <div
                                                        className="
                                                            absolute
                                                            bottom-0
                                                            left-0
                                                            w-full
                                                            h-10
                                                            bg-gradient-to-t
                                                            from-white
                                                            to-transparent
                                                            pointer-events-none
                                                        "
                                                    />
                                                )}

                                            </div>

                                            {shouldTruncate && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        toggleComment(c.id);
                                                    }}
                                                    className="text-blue-500 text-xs mt-1"
                                                >
                                                    {isExpanded ? "Show less" : "See more"}
                                                </button>
                                            )}

                                            {/* DATE */}
                                            <p className="text-xs text-gray-400 mt-3">
                                                {formatLocalDate(c.timestamp)}
                                            </p>

                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
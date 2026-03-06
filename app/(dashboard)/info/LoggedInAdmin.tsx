"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useError } from "@/app/ErrorProvider";


const apiUrl = "http://localhost:8000/api";


function LoggedOut() {
    const router = useRouter();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-black/70 border border-green-400/40 shadow-lg rounded-2xl max-w-md w-full p-6 text-center backdrop-blur-md">
                <h2 className="text-white-400 text-lg font-semibold mb-2 drop-shadow-[0_0_12px_rgba(36,174,124,0.8)]">
                    Session Expired
                </h2>

                <p className="text-white-200 text-sm mb-6">
                    Your session has expired. Please log in again to continue.
                </p>

            </div>
        </div>
    );
}

function FullScreenMessage({ text }: { text: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <p className="text-sm sm:text-base">{text}</p>
        </div>
    );
}

interface SeenQuestion {
    answered_correctly: boolean;
    seen_at: string;
}

interface UserData {
    _id: string;
    email: string;
    created_at: string;
    google_id: string;
    image: string | null;
    ip_address: string;
    last_login: string;
    name: string;
    nickname: string;
    seenQuestions: Record<string, SeenQuestion[]>;
    totalOnlineTime: number;
    userPercentage: number;
    user_id: string;
    last_updated: string;
}

export default function LoggedInAdmin() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [sessionExpired, setSessionExpired] = useState(false);
    const [users, setUsers] = useState<UserData[]>([]);
    const [usersLoading, setUsersLoading] = useState<boolean>(true);
    const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
    const [currentUserIndex, setCurrentUserIndex] = useState(0);
    const userRefs = useRef<(HTMLDivElement | null)[]>([]);
    const { showError } = useError();
    const userName = session?.user?.name ?? "Unknown";


    useEffect(() => {
        if (!session) return;

        const fetchUsers = async () => {
            setUsersLoading(true);

            try {
                const res = await fetch(`${apiUrl}/info/users`, {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                });

                // 🔴 If unauthorized → show LoggedOut
                if (res.status === 401 || res.status === 403) {
                    setSessionExpired(true);
                    return;
                }

                if (!res.ok) {
                    showError("Fetch failed"); // 🔴 show banner
                    return;
                }

                const data = await res.json();

                if (!data?.users) {
                    setSessionExpired(true);
                    return;
                }

                setUsers(data.users);

            } catch (err) {
                console.error(err);
                setSessionExpired(true); // 🔴 network/backend error
            } finally {
                setUsersLoading(false);
            }
        };

        fetchUsers();
    }, [session]);


    if (status === "loading") return <FullScreenMessage text="Loading..." />;
    if (status === "unauthenticated") return <FullScreenMessage text="Please log in to view the admin dashboard." />;

    const scrollToUser = (index: number) => {
        const ref = userRefs.current[index];
        if (ref) {
            ref.scrollIntoView({ behavior: "smooth", block: "start" });
            setCurrentUserIndex(index);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setCurrentUserIndex(0);
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });

    const formatTime = (dateString: string) =>
        new Date(dateString).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        });

    // Sort users by last_login descending
    const sortedUsers = [...users].sort(
        (a, b) => new Date(b.last_login).getTime() - new Date(a.last_login).getTime()
    );

    if (sessionExpired) {
        return <LoggedOut />;
    }

    return (
        <div className="min-h-screen bg-black text-white relative">
            <div className="mx-auto max-w-2xl p-4 sm:p-10">
                {/* Header */}
                <h1 className="text-2xl sm:text-3xl font-bold text-white-400 mb-2">
                    Admin Dashboard
                </h1>
                <p className="text-white-200 text-sm sm:text-base mb-2">Logged in as {userName}</p>

                {!usersLoading && users.length > 0 && (
                    <>
                        {/* Total Users */}
                        <p className="text-white-300 text-sm sm:text-base mb-2">
                            Total Users: <strong>{users.length}</strong>
                        </p>

                        {/* Total Created Per Month */}
                        <div className="text-white-300 text-sm sm:text-base mb-2 space-y-1">
                            {(() => {
                                // Get all months
                                const monthNames = [
                                    "January", "February", "March", "April", "May", "June",
                                    "July", "August", "September", "October", "November", "December"
                                ];

                                // Group users by month/year
                                const usersByMonth: Record<string, number> = {};

                                users.forEach(u => {
                                    const d = new Date(u.created_at);
                                    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`; // e.g., "December 2025"
                                    usersByMonth[key] = (usersByMonth[key] || 0) + 1;
                                });

                                // Sort keys by date
                                const sortedKeys = Object.keys(usersByMonth).sort((a, b) => {
                                    const [monthA, yearA] = a.split(" ");
                                    const [monthB, yearB] = b.split(" ");
                                    const dateA = new Date(`${monthA} 1, ${yearA}`);
                                    const dateB = new Date(`${monthB} 1, ${yearB}`);
                                    return dateA.getTime() - dateB.getTime();
                                });

                                return sortedKeys.map(key => (
                                    <p key={key}>
                                        {key}: <strong>{usersByMonth[key]}</strong>
                                    </p>
                                ));
                            })()}
                        </div>
                    </>
                )}


                {/* Users */}
                {usersLoading ? (
                    <p className="text-sm sm:text-base text-gray-400">Loading users…</p>
                ) : users.length === 0 ? (
                    <p className="text-sm sm:text-base">No users found</p>
                ) : (
                    sortedUsers.map((user, index) => (
                        <div
                            key={user.user_id}
                            ref={(el) => {
                                userRefs.current[index] = el;
                            }}
                            className="bg-gray-900 p-3 sm:p-6 rounded mb-4 sm:mb-6 border border-green-500 text-sm sm:text-base"
                        >
                            {/* User info */}
                            {/* User info with profile image */}
                            <div className="flex items-center mb-3 sm:mb-4">
                                <div className="mr-4">
                                    {typeof user.image === "string" && user.image.length > 0 ? (
                                        <img
                                            src={user.image}
                                            alt={user.name}
                                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border border-green-400/30"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-sm sm:text-lg border border-green-400/30">
                                            {(() => {
                                                if (!user.name) return "?";

                                                const parts = user.name.trim().split(" ");
                                                const firstInitial = parts[0]?.charAt(0).toUpperCase() || "";
                                                const lastInitial =
                                                    parts.length > 1
                                                        ? parts[parts.length - 1].charAt(0).toUpperCase()
                                                        : "";

                                                return firstInitial + lastInitial;
                                            })()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold">{user.name}</p>
                                    <p className="font-bold">({user.nickname})</p>
                                    <p className="text-gray-400 text-xs sm:text-sm">{user.email}</p>
                                </div>
                            </div>

                            <p className="font-bold text-yellow-400 mb-1">
                                <strong>Last Login:</strong> {formatDate(user.last_login)} {formatTime(user.last_login)}
                            </p>
                            <p className="font-bold text-blue-400 mb-2">
                                <strong>Created At:</strong> {formatDate(user.created_at)}
                            </p>
                            <p>
                                <strong>Total Online Time:</strong> {Math.floor(user.totalOnlineTime / 3600)}h{" "}
                                {Math.floor((user.totalOnlineTime % 3600) / 60)}m
                            </p>
                            <p><strong>User Percentage:</strong> {user.userPercentage}</p>
                            <p><strong>IP Address:</strong> {user.ip_address}</p>

                            {/* Seen Questions Table */}
                            <h3 className="text-white-400 font-bold mt-3 mb-2 text-sm sm:text-base">
                                Seen Questions ({Object.keys(user.seenQuestions).length} unique, {Object.values(user.seenQuestions).flat().length} total attempts)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left border border-gray-700 text-xs sm:text-sm">
                                    <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="px-2 sm:px-4 py-1 sm:py-2">Question ID</th>
                                        <th className="px-2 sm:px-4 py-1 sm:py-2">Attempts</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {Object.entries(user.seenQuestions).map(([qid, attemptsRaw]) => {
                                        const key = `${user.user_id}-${qid}`;
                                        const attempts: SeenQuestion[] = Array.isArray(attemptsRaw)
                                            ? attemptsRaw
                                            : Object.values(attemptsRaw || {});
                                        const sortedAttempts = [...attempts].sort(
                                            (a, b) => new Date(b.seen_at).getTime() - new Date(a.seen_at).getTime()
                                        );
                                        const isExpanded = !!expandedQuestions[key];
                                        const displayedAttempts = isExpanded ? sortedAttempts : sortedAttempts.slice(0, 10);

                                        return (
                                            <tr key={key} className="border-b border-gray-700 align-top">
                                                <td className="px-2 sm:px-4 py-1 sm:py-2">{qid}</td>
                                                <td className="px-2 sm:px-4 py-1 sm:py-2">
                                                    <div className="flex flex-col">
                                                        {displayedAttempts.map((a, i) => (
                                                            <div key={i} className="mb-1">
                                                                {a.answered_correctly ? "✅" : "❌"} at {formatDate(a.seen_at)} {formatTime(a.seen_at)}
                                                            </div>
                                                        ))}

                                                        {attempts.length > 10 && (
                                                            <button
                                                                className={`text-xs mt-1 hover:underline ${isExpanded ? 'text-red-400' : 'text-white-400'}`}
                                                                onClick={() => setExpandedQuestions(prev => ({ ...prev, [key]: !prev[key] }))}
                                                            >
                                                                {isExpanded ? 'Collapse' : `Show all (${attempts.length} attempts)`}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Sticky navigation buttons */}
            {users.length > 0 && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50
                bg-black/70 backdrop-blur-sm p-2 sm:p-3 rounded
                grid grid-cols-2 gap-2 sm:gap-4">



                    {/* Previous */}
                    <button
                        onClick={() => scrollToUser(Math.max(0, currentUserIndex - 1))}
                        className="
                          flex items-center justify-center
                          bg-black/70 backdrop-blur-xl
                          border border-green-400/20
                          rounded-full shadow-lg
                          px-4 h-8 min-w-[80px]
                          frame-shimmer
                          transition
                          hover:bg-green-500/10
                          active:scale-95
                          text-white-300 text-sm font-medium
                        "
                    >
                        ↑ Prev
                    </button>

                    {/* Next */}
                    <button
                        onClick={() => scrollToUser(Math.min(users.length - 1, currentUserIndex + 1))}
                        className="
                          flex items-center justify-center
                          bg-black/70 backdrop-blur-xl
                          border border-green-400/20
                          rounded-full shadow-lg
                          px-4 h-8 min-w-[80px]
                          frame-shimmer
                          transition
                          hover:bg-green-500/10
                          active:scale-95
                          text-green-300 text-sm font-medium
                        "
                    >
                        ↓ Next
                    </button>

                </div>

            )}
        </div>
    );
}

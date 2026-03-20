"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useError } from "@/app/ErrorProvider";
import { fetchWithToken, handleSessionExpired } from "@/app/hooks/refreshToken";



interface LimiterHit {
    user_id?: string;
    nickname?: string;
    email?: string;
    ip?: string;
    endpoint?: string;
    limit?: number;
    createdAt?: string;
}

interface AdminLoggedIn {
    timestamp: string;
    userId?: string;
    email: string;
    nickname: string;
    ip: string;
    success: boolean;
    reason?: string;
}

interface ApiCall {
    timestamp: string;
    endpoint: string;
    user?: string;
    count_in_last_10_min?: number; // <-- add this
}

interface BlockedIp {
    ip: string;
    reason?: string;
    createdAt?: string; // <-- Add this
}

interface BlockedUser {
    email: string;
    reason: string;
}

interface AdminSummary {
    total_requests: number;
    apicall_history: ApiCall[];
    blocked_ips: BlockedIp[];
    blocked_users: BlockedUser[];
    admin_logged_in: AdminLoggedIn[];
    limiter_hits: LimiterHit[];
}



const apiUrl = process.env.NEXT_PUBLIC_API_URL;


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
    const topRef = useRef<HTMLDivElement | null>(null);
    const { showError } = useError();
    const userName = session?.user?.name ?? "Unknown";
    const [blockUserId, setBlockUserId] = useState<string>("");
    const fetchedRef = useRef(0);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [summary, setSummary] = useState<AdminSummary | null>(null);



    useEffect(() => {
        if (status !== "authenticated") return; // wait for NextAuth to finish
        if (fetchedRef.current >= 2) return;
        fetchedRef.current += 1;

        const fetchUsers = async () => {
            setUsersLoading(true);
            try {
                const res = await fetchWithToken(`${apiUrl}/info/users`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                // ✅ Handle null first
                if (!res) {
                    showError("⚠️ Unable to reach the server. Please check your connection and try again.");
                    return;
                }

                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    if (res.status === 401 || res.status === 403) {
                        await handleSessionExpired(); // uses the same logic as in add comment
                        return;
                    }
                    showError(err?.detail || `Failed to fetch users: ${res.status}`);
                    setUsers([]);
                    return;
                }

                const data = await res.json();
                if (!Array.isArray(data?.users)) {
                    showError("No users returned from backend");
                    setUsers([]);
                    return;
                }

                setUsers(data.users);

                // ✅ Set summary from backend
                if (data.summary) {
                    setSummary(data.summary);
                }

            } catch (err) {
                console.error("Fetch error:", err);
                showError("Network error fetching users");
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

    // Add this inside LoggedInAdmin, above your JSX
    const formatLocalDate = (dateString?: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

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
        <div ref={topRef} className="min-h-screen bg-black text-white relative">
            <div className="mx-auto max-w-2xl p-4 sm:p-10">
                {/* Header */}
                <h1 className="text-2xl sm:text-3xl mb-2 font-bold text-white-400">
                    Logs
                </h1>





                {/* Recent Limiter Hits */}
                {summary?.limiter_hits && summary.limiter_hits.length > 0 && (
                    <div className="mb-6 text-sm sm:text-base text-white space-y-2">
                        <h3 className="font-bold text-white-400 mb-2">Recent Limiter Hits:</h3>

                        <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
                            {summary.limiter_hits.map((hit, i) => (
                                <div
                                    key={i}
                                    className="bg-black/90 p-4 sm:p-6 rounded-xl border border-white/20 text-sm sm:text-base shadow-sm"
                                >
                                    <div className="text-yellow-500 font-bold">
                                        {hit.nickname ?? hit.email ?? hit.user_id ?? "Unknown User"}
                                    </div>

                                    <div className="text-gray-400 text-xs">
                                        IP: {hit.ip} <br /> Endpoint: {hit.endpoint}
                                    </div>

                                    <div className="text-gray-400 text-xs">
                                        [{formatLocalDate(hit.createdAt)}]
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}






                {/* Recent Admin Logins */}
                {summary?.admin_logged_in && summary.admin_logged_in.length > 0 && (
                    <div className="mb-6 text-sm sm:text-base text-white space-y-1">
                        <h3 className="font-bold text-white-400 mb-1">Recent Admin Logins:</h3>
                        {summary.admin_logged_in.map((login, i) => (
                            <div key={i} className="mb-2">
                                <div className="text-yellow-500 font-bold">{login.nickname}</div>
                                <div className="text-gray-400 text-xs">
                                    ({login.email}) <br /> IP: {login.ip} | {login.success ? "✅ Success" : "❌ Failed"}
                                </div>
                                <div className="text-gray-400 text-xs">
                                    [{formatLocalDate(login.timestamp)}]
                                </div>
                                {login.reason && (
                                    <div className="text-red-400 text-xs">Reason: {login.reason}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}




                {summary && (() => {
                    const apicalls = summary.apicall_history?.filter(c => Object.keys(c).length > 0) || [];
                    const blockedIps = summary.blocked_ips?.filter(ip => Object.keys(ip).length > 0) || [];
                    const blockedUsers = summary.blocked_users?.filter(u => Object.keys(u).length > 0) || [];

                    return (
                        <div className="mb-6 text-sm sm:text-base text-white space-y-2">

                            {/* Total Requests */}
                            <div className="inline-block text-white py-1 rounded-full">
                                Total API Requests: <span className="text-yellow-500 font-bold">{summary.total_requests ?? 0}</span>
                            </div>

                            <br/>

                            {/* Blocked IPs */}
                            <div className="inline-block text-white py-1 rounded-full">
                                Blocked IPs:{" "}
                                {blockedIps.length > 0
                                    ? blockedIps.map((ip, i) => (
                                        <span key={i}>
                                    <span className="text-yellow-500 font-bold">{ip.ip}</span> {ip.reason ? `(${ip.reason})` : ""} {ip.createdAt ? `[${formatLocalDate(ip.createdAt)}]` : ""}
                                            {i < blockedIps.length - 1 ? ", " : ""}
                                    </span>
                                    ))
                                    : <span className="text-yellow-500 font-bold">None</span>}
                            </div>

                            <br/>


                            {/* Blocked Users */}
                            <div className="inline-block text-white py-1 rounded-full">
                                Blocked Users:{" "}
                                {blockedUsers.length > 0
                                    ? blockedUsers.map((u, i) => (
                                        <span key={i}>
                                 <span className="text-yellow-500 font-bold">{u.email}</span>
                                            {i < blockedUsers.length - 1 ? ", " : ""}
                                </span>
                                    ))
                                    : <span className="text-yellow-500 font-bold">None</span>}
                            </div>

                            <br/>

                            {/* Last API Calls */}
                            <div className="text-white">
                                <h3 className="mb-2">Last API Calls:</h3>

                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                    {apicalls.length > 0 ? (
                                        [...apicalls]
                                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                            .map((call, i) => {
                                                const date = new Date(call.timestamp);
                                                const formattedTime = `${date
                                                    .getHours()
                                                    .toString()
                                                    .padStart(2, "0")}:${date
                                                    .getMinutes()
                                                    .toString()
                                                    .padStart(2, "0")}`;

                                                const count = call.count_in_last_10_min ?? 0;

                                                // 🔥 Determine color based on digits
                                                let colorClass = "text-yellow-500"; // default (1–2 digits)

                                                if (count >= 100 && count < 1000) {
                                                    colorClass = "text-yellow-500";
                                                } else if (count >= 1000) {
                                                    colorClass = "text-red-500";
                                                }

                                                return (
                                                    <div
                                                        key={i}
                                                        className="bg-black/80 border border-white/20 rounded-lg p-3 text-sm shadow-sm"
                                                    >
                                                        <div className="text-gray-300">
                                                            Time: {formattedTime}
                                                        </div>

                                                        <div>
                                                            Calls:{" "}
                                                            <span className={`${colorClass} font-bold`}>
                                                                {count || "—"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                    ) : (
                                        <div className="text-yellow-500 font-bold">No API calls</div>
                                    )}
                                </div>
                            </div>

                        </div>
                    );
                })()}







                {/* --- Block User by Email --- */}
                <div className="my-6 flex items-center">
                    {/* Wrapper for input + button */}
                    <div className="flex items-center bg-transparent">
                        <input
                            type="text"
                            placeholder="Block User"
                            value={blockUserId}
                            onChange={(e) => setBlockUserId(e.target.value)}
                            className="text-white placeholder-white bg-transparent focus:outline-none"
                            style={{
                                width: blockUserId.length > 0 ? `${blockUserId.length + 1}ch` : '90px', // dynamic width
                                minWidth: '90px',
                                display: 'inline-block', // ensures input only takes needed width
                            }}
                        />

                        {/* Button immediately next to text, no margin */}
                        <button
                            onClick={async () => {
                                if (!blockUserId) return alert("Enter a user ID");
                                try {
                                    const res = await fetchWithToken(`${apiUrl}/posts/admin/block-user`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            user_id: blockUserId,
                                            admin_key: "YOUR_SECRET_ADMIN_KEY",
                                        }),
                                    });
                                    if (!res) {
                                        showError("⚠️ Network error. Please try again.");
                                        return;
                                    }
                                    if (!res.ok) {
                                        const err = await res.json().catch(() => null);
                                        if (res.status === 401 || res.status === 403) {
                                            await handleSessionExpired();
                                            return;
                                        }
                                        showError(`Failed: ${err?.detail || "Unknown error"}`);
                                        return;
                                    }
                                    const result = await res.json();
                                    alert(`✅ User blocked until ${new Date(result.blocked_until).toLocaleString()}`);
                                    setBlockUserId("");
                                } catch (err) {
                                    console.error(err);
                                    alert("Error occurred while blocking user.");
                                }
                            }}
                            className="text-white hover:text-green-400 flex items-center justify-center ml-1" // small spacing
                            style={{ display: 'inline-flex' }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-6 h-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                                />
                            </svg>
                        </button>
                    </div>
                </div>



                {/* Archive Deleted SVG */}
                <div className="mb-6">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="white"
                        className="w-6 h-6 cursor-pointer text-blue-600 hover:text-blue-700"
                        onClick={async () => {
                            if (!confirm("Are you sure you want to archive all deleted posts and comments?")) return;

                            try {
                                const res = await fetchWithToken(`${apiUrl}/posts/admin/archive-deleted`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                });

                                // ✅ TypeScript-safe null check
                                if (!res) {
                                    showError("⚠️ Network error. Please try again.");
                                    return;
                                }

                                // Now TypeScript knows res is not null
                                if (!res.ok) {
                                    const err = await res.json().catch(() => null);
                                    if (res.status === 401 || res.status === 403) {
                                        await handleSessionExpired();
                                        return;
                                    }
                                    showError(`Failed: ${err?.detail || "Unknown error"}`);
                                    return;
                                }

                                const result = await res.json();
                                alert(`Archived ${result.posts_archived} posts and ${result.comments_archived} comments.`);
                            } catch (err) {
                                console.error(err);
                                alert("Error occurred while archiving.");
                            }
                        }}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                        />
                    </svg>
                </div>



                {!usersLoading && users.length > 0 && (
                    <>
                        {/* Total Users */}
                        <p className="text-white-300 text-sm sm:text-base mb-2">
                            Total Users: <strong className="text-yellow-500">{users.length}</strong>
                        </p>

                        {/* Total Created Per Month */}
                        <div className="text-white-300 text-sm sm:text-base mb-2 flex flex-wrap gap-3">
                            {(() => {
                                const monthNames = [
                                    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                    "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"
                                ];

                                const usersByMonth: Record<string, number> = {};

                                users.forEach(u => {
                                    const d = new Date(u.created_at);
                                    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
                                    usersByMonth[key] = (usersByMonth[key] || 0) + 1;
                                });

                                const sortedKeys = Object.keys(usersByMonth).sort((a, b) => {
                                    const [monthA, yearA] = a.split(" ");
                                    const [monthB, yearB] = b.split(" ");
                                    const dateA = new Date(`${monthA} 1, ${yearA}`);
                                    const dateB = new Date(`${monthB} 1, ${yearB}`);
                                    return dateA.getTime() - dateB.getTime();
                                });

                                return sortedKeys.map(key => (
                                    <span key={key} className="inline-block">
                        {key}: <strong className="text-yellow-500">{usersByMonth[key]}</strong>
                    </span>
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
                            className="bg-black/90 p-4 sm:p-6 rounded-xl mb-4 sm:mb-6 border border-white text-sm sm:text-base"
                        >
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
                                    <div>
                                        <p className="font-bold cursor-pointer text-blue-400 hover:underline"
                                           onClick={() => setSelectedUser(user)}>
                                            {user.name}
                                        </p>
                                    </div>
                                    <p className="font-bold">({user.nickname})</p>
                                    <p className="text-gray-400 text-xs sm:text-sm">{user.email}</p>
                                    <p className="text-gray-400 text-xs sm:text-sm flex items-center gap-1 flex-nowrap">
                                        <strong className="whitespace-nowrap">User ID:</strong>

                                        <span className="whitespace-nowrap">{user._id}</span>

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="1.5"
                                            className="w-4 h-4 cursor-pointer hover:text-green-400 shrink-0"
                                            onClick={() => {
                                                setBlockUserId(user._id);
                                                topRef.current?.scrollIntoView({ behavior: "smooth" });
                                            }}
                                        >
                                            <title>"Copy user ID"</title>
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8 16h8M8 12h8M8 8h8M4 6.75A2.75 2.75 0 0 1 6.75 4h10.5A2.75 2.75 0 0 1 20 6.75v10.5A2.75 2.75 0 0 1 17.25 20H6.75A2.75 2.75 0 0 1 4 17.25V6.75Z"
                                            />
                                        </svg>
                                    </p>
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

                        </div>
                    ))
                )}


                {/*
                {selectedUser && (
                    <div className="mt-6 p-4 bg-gray-900 rounded border border-green-500">
                        <h2 className="text-lg font-bold text-white mb-2">
                            Seen Questions for {selectedUser.name}
                        </h2>

                        {Object.keys(selectedUser.seenQuestions).length === 0 ? (
                            <p>No questions seen yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left border border-gray-700 text-xs sm:text-sm">
                                    <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="px-2 sm:px-4 py-1 sm:py-2">Question ID</th>
                                        <th className="px-2 sm:px-4 py-1 sm:py-2">Attempts</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {Object.entries(selectedUser.seenQuestions).map(([qid, attemptsRaw]) => {
                                        const attempts: SeenQuestion[] = Array.isArray(attemptsRaw)
                                            ? attemptsRaw
                                            : Object.values(attemptsRaw || {});
                                        return (
                                            <tr key={qid} className="border-b border-gray-700 align-top">
                                                <td className="px-2 sm:px-4 py-1 sm:py-2">{qid}</td>
                                                <td className="px-2 sm:px-4 py-1 sm:py-2">
                                                    {attempts.map((a, i) => (
                                                        <div key={i}>
                                                            {a.answered_correctly ? "✅" : "❌"} at {formatDate(a.seen_at)} {formatTime(a.seen_at)}
                                                        </div>
                                                    ))}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <button
                            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            onClick={() => setSelectedUser(null)}
                        >
                            Close
                        </button>
                    </div>
                )}

                */}


            </div>

            {/* Sticky navigation buttons */}
            {users.length > 0 && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50
                bg-black/70 backdrop-blur-sm p-2 sm:p-3 rounded
                grid grid-cols-2 gap-2 sm:gap-4">


                </div>

            )}
        </div>
    );
}

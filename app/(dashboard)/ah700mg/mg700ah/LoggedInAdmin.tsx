"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useError } from "@/app/ErrorProvider";
import { fetchWithToken } from "@/app/hooks/refreshToken";


interface Application {
    _id: string;
    userId: string;
    company: string;
    jobTitle: string;
    jobLocation: string;
    name: string;
    email: string;
    location: string;
    availability: string;
    certifications: string;
    travel: string; // 'y' / 'n'
    overtime: string; // 'y' / 'n'
    readyToMove: string; // 'y' / 'n'
    background: boolean;
    experience: string; // number as string
    position: string;
    message: string;
    consent: boolean;
    submitted_at: string;
    isApproved: boolean;
}

interface HiringAd {
    _id: string;
    userId: string;
    company: string;
    title: string;
    location: string;
    pay: {
        min: number;
        max: number;
    };
    type: string;
    travel: string;
    overtime: string;
    relocation: string;
    status: AdStatus;
    createdAt: string;
    publishedAt?: string | null;
}


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

interface EmployerUser {
    name: string;
    email: string;
    companyName: string;
}

interface AdminSummary {
    total_requests: number;
    apicall_history: ApiCall[];
    blocked_ips: BlockedIp[];
    blocked_users: BlockedUser[];
    admin_logged_in: AdminLoggedIn[];
    limiter_hits: LimiterHit[];
    applications?: Application[];
    hiring_ads?: HiringAd[];
    employer_users?: EmployerUser[];
}

interface UserQuestionStats {
    user_id: string;
    total_seen: number;
    total_correct: number;
    total_wrong: number;
}

type AdStatus = "pending" | "approved" | "published" | "archived";



const apiUrl = process.env.NEXT_PUBLIC_API_URL;


function LoggedOut() {
    const router = useRouter();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white backdrop-blur-sm p-4">
            <div className="bg-white border border-green-500/40 shadow-lg rounded-2xl max-w-md w-full p-6 text-center backdrop-blur-md">
                <h2 className="text-black text-lg font-semibold mb-2 drop-shadow-[0_0_12px_rgba(36,174,124,0.8)]">
                    Session Expired
                </h2>

                <p className="text-black text-sm mb-6">
                    Your session has expired. Please log in again to continue.
                </p>

            </div>
        </div>
    );
}

function FullScreenMessage({ text }: { text: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white text-black">
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
    is_paid: boolean;
}

export default function LoggedInAdmin() {
    const { data: session, status } = useSession();
    const router = useRouter();
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
    const [spanWidth, setSpanWidth] = useState(90);
    const spanRef = useRef<HTMLSpanElement>(null);
// ✅ ADD this right under:
    const paidUsersCount = users.filter(user => user.is_paid).length;


    const [userStatsMap, setUserStatsMap] = useState<Record<string, UserQuestionStats>>({});
    const [loadingStatsUserId, setLoadingStatsUserId] = useState<string | null>(null);


// 👇 USERS ACTIVE TODAY (based on last_login local date)
    const usersVisitedToday = users.filter(user => {
        if (!user.last_login) return false;

        const lastLogin = new Date(user.last_login);
        const now = new Date();

        return (
            lastLogin.getFullYear() === now.getFullYear() &&
            lastLogin.getMonth() === now.getMonth() &&
            lastLogin.getDate() === now.getDate()
        );
    }).length;


    const applicationCounts = summary?.applications?.reduce(
        (acc, app) => {
            if (app.isApproved) acc.approved += 1;
            else acc.pending += 1;
            return acc;
        },
        {
            approved: 0,
            pending: 0,
        }
    );

    const adCounts = summary?.hiring_ads?.reduce(
        (acc, ad) => {
            acc[ad.status] = (acc[ad.status] || 0) + 1;
            return acc;
        },
        {
            pending: 0,
            approved: 0,
            published: 0,
            archived: 0,
        } as Record<AdStatus, number>
    );

    const statusStyles: Record<AdStatus, string> = {
        pending: "bg-amber-500/20 text-amber-300 border-amber-500",
        approved: "bg-sky-500/20 text-sky-300 border-sky-500",
        published: "bg-emerald-500/20 text-emerald-300 border-emerald-500",
        archived: "bg-red-500/10 text-red-400 border-red-500",
    };

    const statuses: AdStatus[] = ["pending", "approved", "published", "archived"]

    useEffect(() => {
        if (spanRef.current) {
            const width = spanRef.current.offsetWidth + 5; // small buffer
            setSpanWidth(width);
        }
    }, [blockUserId]);



    // Helper function
    const isTrue = (value: any) => {
        if (typeof value === "boolean") return value;
        if (typeof value === "string") return value.toLowerCase() === "true";
        return false;
    };



    useEffect(() => {
        if (status !== "authenticated") return; // wait for NextAuth to finish
        if (fetchedRef.current >= 2) return;
        fetchedRef.current += 1;

        const fetchUsers = async () => {
            setUsersLoading(true);
            try {
                const res = await fetchWithToken(`${apiUrl}/info/users`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                // ✅ Handle null first
                if (!res) {
                    showError("⚠️ Unable to reach the server. Please check your connection and try again.");
                    return;
                }

                if (!res.success) {
                    const err = res.data;
                    if (res.status === 401 || res.status === 403) {
                        showError("Your session is invalid or expired. Please refresh the page.");
                        return;
                    }
                    showError(err?.detail || `Failed to fetch users: ${res.status}`);
                    setUsers([]);
                    return;
                }

                const data = await res.data;

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
    }, []);


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

    const handleApprove = async (applicationId: string) => {
        try {
            const res = await fetchWithToken(`${apiUrl}/posts/admin/approve-application`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    application_id: applicationId,
                }),
            });

            if (!res) {
                showError("Network error");
                return;
            }

            if (!res.success) {
                const err = await res.data;

                if (res.status === 401 || res.status === 403) {
                    showError("Your session is invalid or expired. Please refresh the page.");
                    return;
                }

                showError(err?.detail || "Failed to approve application");
                return;
            }

            const data = await res.data;

            alert("Application approved!");

            setSummary(prev => {
                if (!prev) return prev;

                return {
                    ...prev,
                    applications: prev.applications?.map(app =>
                        app._id === applicationId
                            ? { ...app, isApproved: true }
                            : app
                    ),
                };
            });

        } catch (err) {
            console.error(err);
            showError("Error approving application");
        }
    };


    const handleAdStatus = async (adId: string, status: AdStatus) => {
        const ok = confirm(`Are you sure you want to change status to "${status}"?`);
        if (!ok) return;

        try {
            const res = await fetchWithToken(
                `${apiUrl}/posts/admin/update-ad-status`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ad_id: adId,
                        status,
                    }),
                }
            );

            console.log("RAW FETCH RESPONSE:", res);

            if (!res?.success) {
                showError(res?.data?.detail || "Failed to update ad status");
                return;
            }

            setSummary(prev => {
                if (!prev) return prev;

                return {
                    ...prev,
                    hiring_ads: prev.hiring_ads?.map(ad =>
                        ad._id === adId ? { ...ad, status } : ad
                    ),
                };
            });

            alert(`Ad status updated to "${status}"`);
        } catch (err) {
            console.error(err);
            showError("Something went wrong");
        }
    };





    const formatAdExpiry = (createdAt?: string | Date) => {
        if (!createdAt) return "";

        const parseDate = (d: string | Date) => {
            if (d instanceof Date) return d;
            if (typeof d === "string") return new Date(d.split(".")[0] + "Z");
            return new Date();
        };

        const date = parseDate(createdAt);

        const expiry = new Date(date);
        expiry.setDate(expiry.getDate() + 30); // 30-day lifetime

        const now = new Date();

        const diffMs = expiry.getTime() - now.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        let relativeTime = "";

        if (diffMs <= 0) {
            relativeTime = "Expired";
        } else if (diffSeconds < 60) {
            relativeTime = `${diffSeconds} second${diffSeconds !== 1 ? "s" : ""}`;
        } else if (diffMinutes < 60) {
            relativeTime = `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
        } else if (diffHours < 24) {
            relativeTime = `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
        } else if (diffDays < 30) {
            relativeTime = `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
        } else {
            const diffMonths = Math.floor(diffDays / 30);
            if (diffMonths < 12) {
                relativeTime = `${diffMonths} month${diffMonths !== 1 ? "s" : ""}`;
            } else {
                const diffYears = Math.floor(diffMonths / 12);
                relativeTime = `${diffYears} year${diffYears !== 1 ? "s" : ""}`;
            }
        }

        return <span>{relativeTime}</span>;
    };






    // ✅ REPLACE your current adsWithExpiry block with this:
// Makes summary use EXACT same parsing + expiry math as actual ad cards

    const adsWithExpiry =
        summary?.hiring_ads?.map(ad => {
            if (!ad.createdAt) {
                return {
                    ...ad,
                    expiryDate: new Date(),
                    diffMs: 0,
                    diffDays: 0,
                    isExpired: true,
                    isExpiringSoon: false,
                    relativeTime: "Expired",
                };
            }

            // ✅ SAME parser as formatAdExpiry
            const parseDate = (d: string | Date) => {
                if (d instanceof Date) return d;
                if (typeof d === "string") return new Date(d.split(".")[0] + "Z");
                return new Date();
            };

            const created = parseDate(ad.createdAt);

            // ✅ SAME 30 day expiry
            const expiry = new Date(created);
            expiry.setDate(expiry.getDate() + 30);

            const now = new Date();

            const diffMs = expiry.getTime() - now.getTime();
            const diffSeconds = Math.floor(diffMs / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);

            let relativeTime = "";

            if (diffMs <= 0) {
                relativeTime = "Expired";
            } else if (diffSeconds < 60) {
                relativeTime = `${diffSeconds}s`;
            } else if (diffMinutes < 60) {
                relativeTime = `${diffMinutes}m`;
            } else if (diffHours < 24) {
                relativeTime = `${diffHours}h`;
            } else {
                relativeTime = `${diffDays}d`;
            }

            return {
                ...ad,
                expiryDate: expiry,
                diffMs,
                diffDays,
                isExpired: diffMs <= 0,
                isExpiringSoon: diffMs > 0 && diffDays <= 5,
                relativeTime,
            };
        }) || [];


// ✅ SORT remains same
    const sortedExpiringAds = [...adsWithExpiry].sort(
        (a, b) => a.expiryDate.getTime() - b.expiryDate.getTime()
    );


    const expiringAds = adsWithExpiry.reduce(
        (acc, ad) => {
            if (ad.isExpired) acc.expired += 1;
            else if (ad.isExpiringSoon) acc.expiringSoon += 1;
            return acc;
        },
        {
            expiringSoon: 0,
            expired: 0,
        }
    );


    const fetchUserQuestionStats = async (userId: string) => {
        try {
            const res = await fetchWithToken(
                `${apiUrl}/info/user-stats/${userId}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res) {
                showError("Network error fetching user stats");
                return null;
            }

            if (!res.success) {
                const err = await res.data;

                if (res.status === 401 || res.status === 403) {
                    showError("Session expired or unauthorized");
                    return null;
                }

                showError(err?.detail || "Failed to fetch stats");
                return null;
            }

            const data: UserQuestionStats = await res.data;
            return data;

        } catch (err) {
            console.error(err);
            showError("Error fetching user stats");
            return null;
        }
    };


    const fetchAndStoreUserStats = async (userId: string) => {
        if (userStatsMap[userId]) return;

        setLoadingStatsUserId(userId);

        const stats = await fetchUserQuestionStats(userId);

        if (stats) {
            setUserStatsMap(prev => ({
                ...prev,
                [userId]: stats
            }));
        }

        setLoadingStatsUserId(null);
    };


    const lastLoggedInUser =
        [...users]
            .sort(
                (a, b) =>
                    new Date(b.last_login).getTime() -
                    new Date(a.last_login).getTime()
            )[0];

























    return (
        <div ref={topRef} className="min-h-screen bg-black-200 text-black relative">
            <div className="mx-auto max-w-4xl px-4 sm:px-8 py-6 sm:py-10 space-y-6">
                {/* Header */}
                <h1 className="text-2xl sm:text-3xl font-bold text-black mb-4">
                    Logs
                </h1>




                <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-gray-300">
                    {/* --- Block User by Email --- */}
                    <div className="flex items-center gap-2">
                        {/* Wrapper for input + button */}
                        <div className="flex items-center bg-white px-2 py-1">
                            {/* Hidden span for measuring text width */}
                            <span
                                ref={spanRef}
                                className="invisible absolute whitespace-pre text-black"
                            >
                              {blockUserId || "Block User"}
                            </span>

                            {/* Input */}
                            <input
                                type="text"
                                placeholder="Block User"
                                value={blockUserId}
                                onChange={(e) => setBlockUserId(e.target.value)}
                                className="text-black placeholder-black bg-transparent focus:outline-none"
                                style={{
                                    width: `${spanWidth}px`,
                                    minWidth: "90px",
                                }}
                            />

                            {/* Button immediately next to text, no margin */}
                            <button
                                onClick={async () => {
                                    if (!blockUserId) return alert("Enter a user ID");
                                    try {
                                        const res = await fetchWithToken(`${apiUrl}/posts/admin/block-user`, {
                                            method: "POST",
                                            credentials: "include",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                user_id: blockUserId,
                                                admin_key: "YOUR_SECRET_ADMIN_KEY",
                                            }),
                                        });
                                        if (!res) {
                                            showError("⚠️ Network error.");
                                            return;
                                        }
                                        if (!res.success) {
                                            const err = await res.data.catch(() => null);
                                            if (res.status === 401 || res.status === 403) {
                                                showError("Your session is invalid or expired. Please refresh the page.");
                                                return;
                                            }
                                            showError(`Failed: ${err?.detail || "Unknown error"}`);
                                            return;
                                        }
                                        const result = await res.data;
                                        alert(`✅ User blocked until ${new Date(result.blocked_until).toLocaleString()}`);
                                        setBlockUserId("");
                                    } catch (err) {
                                        console.error(err);
                                        alert("Error occurred while blocking user.");
                                    }
                                }}
                                className="text-black hover:text-green-500 flex items-center justify-center ml-1" // small spacing
                                style={{ display: 'inline-flex' }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="black"
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
                    <div className="p-2 rounded-xl hover:bg-white transition">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="black"
                            className="w-6 h-6 cursor-pointer text-blue-600 hover:text-blue-700"
                            onClick={async () => {
                                if (!confirm("Are you sure you want to archive all deleted posts and comments?")) return;

                                try {
                                    const res = await fetchWithToken(`${apiUrl}/posts/admin/archive-deleted`, {
                                        method: "POST",
                                        credentials: "include",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                    });

                                    // ✅ TypeScript-safe null check
                                    if (!res) {
                                        showError("⚠️ Network error.");
                                        return;
                                    }

                                    // Now TypeScript knows res is not null
                                    if (!res.success) {
                                        const err = await res.data.catch(() => null);
                                        if (res.status === 401 || res.status === 403) {
                                            showError("Your session is invalid or expired. Please refresh the page.");
                                            return;
                                        }
                                        showError(`Failed: ${err?.detail || "Unknown error"}`);
                                        return;
                                    }

                                    const result = await res.data;
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
                </div>









                <div className="mt-3 bg-white rounded-xl border border-gray-300 p-3 text-sm">
                    <div className="flex flex-col gap-2">

                        <div>
                            <span className="text-black">Last Login:</span>{" "}
                            <span className="font-bold text-blue-500">
                {lastLoggedInUser
                    ? `${lastLoggedInUser.name} (${lastLoggedInUser.email})`
                    : "—"}
            </span>
                        </div>

                        <div>
                            <span className="text-black">Pending applications:</span>{" "}
                            <span className="font-bold text-amber-500">
                {applicationCounts?.pending ?? 0}
            </span>
                        </div>

                        <div>
                            <span className="text-black">Paid users:</span>{" "}
                            <span className="font-bold text-green-500">
                {paidUsersCount}
            </span>
                        </div>

                    </div>
                </div>










                {/* TOP SUMMARY BAR */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">

                    {/* Applications */}
                    <div className="bg-white rounded-xl border border-gray-300 p-3 text-center">
                        <p className="text-xs text-black">Applications</p>
                        <p className="text-lg font-bold text-black">
                            {summary?.applications?.length ?? 0}
                        </p>
                        <div className="flex flex-col gap-2 mt-1">
                            <div className="flex items-center justify-between text-xs text-red-400">
                                <span>Pending:</span>
                                <span className="font-semibold">
                                    {applicationCounts?.pending ?? 0}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-green-500">
                                <span>Approved:</span>
                                <span className="font-semibold">
                                    {applicationCounts?.approved ?? 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Ads */}
                    <div className="bg-white rounded-xl border border-gray-300 p-3 text-center">

                        <p className="text-xs text-black">Hiring Ads</p>

                        <p className="text-lg font-bold text-black mb-2">
                            {summary?.hiring_ads?.length ?? 0}
                        </p>

                        <div className="flex flex-col gap-1 text-xs text-left">

                            <div className="flex items-center justify-between w-full">
                                <span className="text-amber-500">Pending:</span>
                                <span className="text-amber-500 font-semibold text-right">
                                    {adCounts?.pending ?? 0}
                                </span>
                            </div>

                            <div className="flex items-center justify-between w-full">
                                <span className="text-emerald-500">Published:</span>
                                <span className="text-emerald-500 font-semibold text-right">
                                    {adCounts?.published ?? 0}
                                </span>
                            </div>

                            <div className="flex items-center justify-between w-full">
                                <span className="text-sky-500">Approved:</span>
                                <span className="text-sky-500 font-semibold text-right">
                                    {adCounts?.approved ?? 0}
                                </span>
                            </div>

                            <div className="flex items-center justify-between w-full">
                                <span className="text-red-400">Archived:</span>
                                <span className="text-red-400 font-semibold text-right">
                                    {adCounts?.archived ?? 0}
                                </span>
                            </div>

                        </div>

                    </div>

                    {/* Expiring Ads */}
                    <div className="bg-white rounded-xl border border-gray-300 p-3 text-center">

                        <p className="text-xs text-black">Ad Expiry</p>

                        {/* counters */}
                        <div className="flex flex-col gap-1 mt-2 text-xs text-left">

                            <div className="flex items-center justify-between">
                                <span className="text-orange-400">Expiring (≤5d):</span>
                                <span className="text-orange-400 font-semibold">
                                    {expiringAds?.expiringSoon ?? 0}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-red-500">Expired:</span>
                                <span className="text-red-500 font-semibold">
                                    {expiringAds?.expired ?? 0}
                                </span>
                            </div>
                        </div>

                        {/* divider */}
                        <div className="border-t border-gray-200 my-2"></div>

                        {/* scrollable list */}
                        <div className="max-h-40 overflow-y-auto text-left space-y-2 pr-1">

                            {sortedExpiringAds.slice(0, 20).map((ad) => (
                                <div
                                    key={ad._id}
                                    className="text-xs flex items-center justify-between"
                                >
                                    <div className="truncate pr-2">
                                        <p className="text-gray-500 text-[10px]">
                                            {ad.company}
                                        </p>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        {ad.isExpired ? (
                                            <span className="text-red-500 font-semibold">
                                                Expired
                                            </span>
                                        ) : (
                                            <span
                                                className={
                                                    ad.isExpiringSoon
                                                        ? "text-orange-400 font-semibold"
                                                        : "text-black"
                                                }
                                            >
                                                {ad.relativeTime}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>

                    {/* Users & Employers */}
                    <div className="bg-white rounded-xl border border-gray-300 p-3 text-center">

                        <p className="text-xs text-black">Users</p>

                        {/* counters */}
                        <div className="flex flex-col gap-1 mt-2 text-xs text-center">

                            <p className="text-lg font-bold text-black mb-2">
                                {users.length}
                            </p>

                            <div className="flex items-center justify-between">
                                <span className="text-blue-500">
                                    On {new Date().toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })}:
                                </span>

                                                            <span className="text-blue-500 font-semibold">
                                    {usersVisitedToday}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-green-500">Paid:</span>
                                <span className="text-green-500 font-semibold">
                                    {paidUsersCount}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-black">Employers:</span>
                                <span className="text-black font-semibold">
                                    {summary?.employer_users?.length ?? 0}
                                </span>
                            </div>

                        </div>

                    </div>

                </div>










                {/* Applications */}
                {summary?.applications && summary.applications.length > 0 && (
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-300 space-y-3">
                        <h3 className="font-bold text-black mb-2">
                            Applications: ({summary.applications.length})

                            <div className="mt-2 flex gap-4 text-xs text-black">
                                <div>
                                    Approved:{" "}
                                    <span className="text-green-500 font-semibold">
                                        {applicationCounts?.approved}
                                    </span>
                                </div>

                                <div>
                                    Pending:{" "}
                                    <span className="text-red-400 font-semibold">
                                        {applicationCounts?.pending}
                                    </span>
                                </div>
                            </div>
                        </h3>

                        <div className="max-h-[420px] overflow-y-auto space-y-3 pr-2">
                            {[...summary.applications]
                                .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
                                .map((app, i) => (
                                    <div key={i} className="bg-white p-3 rounded-xl border border-gray-300 transition">
                                        <p className="text-black text-xs mt-1">
                                            Submitted at: {formatLocalDate(app.submitted_at)}
                                        </p>
                                        <p className="flex items-center gap-3">
                                            <span className="font-bold text-yellow-500">Approved:</span>

                                            {app.isApproved ? (
                                                <span className="text-green-500 font-bold">Yes</span>
                                            ) : (
                                                <span className="text-red-400 font-bold">No</span>
                                            )}

                                            {!app.isApproved && (
                                                <svg
                                                    onClick={() => handleApprove(app._id)}
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 -960 960 960"
                                                    className="w-5 h-5 fill-green-500 cursor-pointer hover:fill-green-500"
                                                >
                                                    <path d="m381-240 424-424-57-56-368 367-169-170-57 57 227 226Zm0 113L42-466l169-170 170 170 366-367 172 168-538 538Z" />
                                                </svg>
                                            )}
                                        </p>
                                        <p>
                                            <span className="font-bold text-yellow-500">Name:</span> {app.name}
                                        </p>
                                        <p>
                                            <span className="font-bold text-yellow-500">Email:</span> {app.email}
                                        </p>
                                        <p>
                                            <span className="font-bold text-yellow-500">Company:</span> {app.company || "-"}
                                        </p>
                                        <p>
                                            <span className="font-bold text-yellow-500">Job Title:</span> {app.jobTitle || "-"}
                                        </p>
                                        <p>
                                            <span className="font-bold text-yellow-500">Job Location:</span> {app.jobLocation || "-"}
                                        </p>
                                        <p>
                                            <span className="font-bold text-yellow-500">Veteran?:</span>{" "}
                                            {isTrue(app.background) ? "✅" : "❌"}
                                        </p>
                                        <p>
                                            <span className="font-bold text-yellow-500">Location:</span> {app.location}
                                        </p>
                                        <p>
                                            <span className="font-bold text-yellow-500">Availability:</span> {app.availability}
                                        </p>
                                        <p>
                                            <span className="font-bold text-yellow-500">Certifications:</span> {app.certifications}
                                        </p>
                                        <p>
                                            <span className="font-bold text-yellow-500">Travel:</span> {app.travel}
                                        </p>
                                        <p>
                                            <span className="font-bold text-yellow-500">Overtime:</span> {app.overtime}
                                        </p>
                                        <p>
                                            <span className="font-bold text-yellow-500">Ready to Move:</span> {app.readyToMove}
                                        </p>
                                        <p>
                                            <span className="font-bold text-yellow-500">Experience:</span> {app.experience} years
                                        </p>
                                        <p>
                                            <span className="font-bold text-yellow-500">Position:</span> {app.position}
                                        </p>
                                        <p>
                                            <span className="font-bold text-yellow-500">Consent:</span> {app.consent ? "Yes" : "No"}
                                        </p>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}












                {/* Employer Users */}
                {summary?.employer_users && summary.employer_users.length > 0 && (
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-300 space-y-3">
                        <h3 className="font-bold text-black mb-2">
                            Employer Users: ({summary.employer_users.length})
                        </h3>

                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {summary.employer_users.map((user, i) => (
                                <div
                                    key={i}
                                    className="bg-white p-3 rounded-xl border border-gray-300 hover:bg-white transition"
                                >
                                    <p>
                                        <span className="font-bold text-yellow-500">Company:</span>{" "}
                                        {user.companyName}
                                    </p>
                                    <p>
                                        <span className="font-bold text-yellow-500">Name:</span>{" "}
                                        {user.name}
                                    </p>

                                    <p>
                                        <span className="font-bold text-yellow-500">Email:</span>{" "}
                                        {user.email}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}













                {/* Hiring Ads */}
                {summary?.hiring_ads && summary.hiring_ads.length > 0 && (
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-300 space-y-3">
                        <h3 className="font-bold text-black mb-2">
                            Hiring Ads: ({summary.hiring_ads.length})
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-black">
                                <div>Pending: <span className="text-amber-400">{adCounts?.pending}</span></div>
                                <div>Approved: <span className="text-sky-400">{adCounts?.approved}</span></div>
                                <div>Published: <span className="text-emerald-400">{adCounts?.published}</span></div>
                                <div>Archived: <span className="text-red-400">{adCounts?.archived}</span></div>
                            </div>
                        </h3>

                        <div className="max-h-[420px] overflow-y-auto space-y-3 pr-2">
                            {[...summary.hiring_ads]
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((ad, i) => (
                                    <div key={i} className="bg-white p-3 rounded-xl border border-gray-300 hover:bg-white transition">

                                        <p className="text-black text-xs mt-1">
                                            Created at: {formatLocalDate(ad.createdAt)}
                                        </p>

                                        <p className="text-red-400 text-xs mt-1">
                                            Expires in: {formatAdExpiry(ad.createdAt)}
                                        </p>

                                        <p>
                                            <span className="font-bold text-yellow-500">Company:</span>{" "}
                                            {ad.company}
                                        </p>

                                        <p>
                                            <span className="font-bold text-yellow-500">Title:</span>{" "}
                                            {ad.title}
                                        </p>

                                        <p>
                                            <span className="font-bold text-yellow-500">Location:</span>{" "}
                                            {ad.location}
                                        </p>

                                        <p>
                                            <span className="font-bold text-yellow-500">Type:</span>{" "}
                                            {ad.type}
                                        </p>

                                        <p>
                                            <span className="font-bold text-yellow-500">Pay:</span>{" "}
                                            ${ad.pay?.min} - ${ad.pay?.max}
                                        </p>

                                        <p>
                                            <span className="font-bold text-yellow-500">Travel:</span>{" "}
                                            {ad.travel}
                                        </p>

                                        <p>
                                            <span className="font-bold text-yellow-500">Overtime:</span>{" "}
                                            {ad.overtime}
                                        </p>

                                        <p>
                                            <span className="font-bold text-yellow-500">Relocation:</span>{" "}
                                            {ad.relocation}
                                        </p>

                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="font-bold text-yellow-500">Status:</span>

                                            {statuses.map((status) => {
                                                const isActive = ad.status === status;

                                                return (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleAdStatus(ad._id, status)}
                                                        className={`text-xs px-2 py-1 rounded border transition
                                                            ${
                                                            isActive
                                                                ? statusStyles[status] // 👈 dynamic color per status
                                                                : "bg-white text-black border-gray-300 hover:border-gray-300"
                                                        }
                                                                `}
                                                    >
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}








                {/* Recent Limiter Hits */}
                {summary?.limiter_hits && summary.limiter_hits.length > 0 && (
                    <div className="bg-white p-4 sm:p-6 rounded-xl mb-2 border border-gray-300 text-sm sm:text-base">
                        <h3 className="font-bold text-black">
                            Recent Limiter Hits: ({summary.limiter_hits.length} unique IP{summary.limiter_hits.length > 1 ? "s" : ""})
                        </h3>

                        <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
                            {summary.limiter_hits.map((hit, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-xl text-sm sm:text-base"
                                >
                                    <div className="flex items-center mb-3 sm:mb-4">
                                        <div>
                                            <div>
                                                <p className="font-bold text-yellow-500">
                                                    {hit.nickname ?? hit.email ?? hit.user_id ?? "Unknown User"}
                                                </p>
                                            </div>
                                            <p className="text-blue-400 text-xs sm:text-sm">IP: {hit.ip}</p>
                                            <p className="text-black text-xs sm:text-sm">Endpoint: {hit.endpoint}</p>
                                            <p className="text-red-500 text-xs sm:text-sm">
                                                [{formatLocalDate(hit.createdAt)}]
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}








                {/* Recent Admin Logins */}
                {summary?.admin_logged_in && summary.admin_logged_in.length > 0 && (
                    <div className="bg-white p-4 sm:p-6 rounded-xl mb-2 border border-gray-300 text-sm sm:text-base">
                        <h3 className="font-bold text-black mb-1">
                            Recent Admin Logins: ({summary.admin_logged_in.length})
                        </h3>

                        {/* 👇 scroll container */}
                        <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
                            {summary.admin_logged_in.map((login, i) => (
                                <div key={i} className="mb-2">
                                    <div className="text-yellow-500 font-bold">
                                        {login.nickname}
                                    </div>

                                    <div className="text-black text-xs">
                                        ({login.email}) <br />
                                        IP: {login.ip} |{" "}
                                        {login.success ? "✅ Success" : "❌ Failed"}
                                    </div>

                                    <div className="text-black text-xs">
                                        [{formatLocalDate(login.timestamp)}]
                                    </div>

                                    {login.reason && (
                                        <div className="text-red-400 text-xs">
                                            Reason: {login.reason}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}








                {summary && (() => {
                    const apicalls = summary.apicall_history?.filter(c => Object.keys(c).length > 0) || [];
                    const blockedIps = summary.blocked_ips?.filter(ip => Object.keys(ip).length > 0) || [];
                    const blockedUsers = summary.blocked_users?.filter(u => Object.keys(u).length > 0) || [];

                    return (
                        <div className="text-sm sm:text-base text-black space-y-2">

                            {/* Total Requests */}
                            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-300 text-sm sm:text-base">
                                Total API Requests: <span className="text-yellow-500 font-bold">{summary.total_requests ?? 0}</span>
                            </div>

                            {/* Blocked IPs */}
                            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-300 space-y-3">
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


                            {/* Blocked Users */}
                            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-300 space-y-3">
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

                            {/* Last API Calls */}
                            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-300 space-y-3">
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
                                                        className="bg-white rounded-xl text-sm shadow-sm flex items-center gap-4"
                                                    >
                                                        <div className="text-black">
                                                            Time: {formattedTime}
                                                        </div>

                                                        <div>
                                                            Calls: <span className={`${colorClass} font-bold`}>{count || "—"}</span>
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













                {!usersLoading && users.length > 0 && (
                    <div className="bg-white p-4 sm:p-6 my-2 rounded-xl border border-gray-300 text-sm sm:text-base">
                        {/* Total Users */}
                        <p className="text-black text-sm sm:text-base mb-2">
                            Total Users: <strong className="text-yellow-500">{users.length}</strong>
                        </p>

                        {/* Total Created Per Month */}
                        <div className="text-black text-sm sm:text-base mb-2 flex flex-col gap-3">
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
                    </div>
                )}







                {/* Paid Users */}
                {users.length > 0 && (
                    <div className="bg-white p-4 sm:p-6 my-2 rounded-xl border border-gray-300 text-sm sm:text-base">

                        <p className="text-black text-sm sm:text-base mb-2">
                            Paid Users: <strong className="text-green-500">{paidUsersCount}</strong>
                        </p>

                        <div className="max-h-40 overflow-y-auto pr-2 space-y-1">

                            {users
                                .filter(user => user.is_paid)
                                .map(user => (
                                    <div
                                        key={user.user_id}
                                        className="flex items-center justify-between text-xs sm:text-sm"
                                    >
                        <span className="text-green-500 truncate">
                            {user.email}
                        </span>

                                        <span className="text-black ml-2 shrink-0">
                            ({user.nickname})
                        </span>
                                    </div>
                                ))}

                        </div>

                    </div>
                )}








                {/* Users */}
                {usersLoading ? (
                    <p className="text-sm sm:text-base text-black">Loading users…</p>
                ) : users.length === 0 ? (
                    <p className="text-sm sm:text-base">No users found</p>
                ) : (
                    sortedUsers.map((user, index) => (
                        <div
                            key={user.user_id}
                            ref={(el) => {
                                userRefs.current[index] = el;
                            }}
                            className="bg-white p-5 sm:p-6 rounded-xl border border-gray-300 space-y-3 hover:bg-white transition"
                        >
                            {/* User info with profile image */}
                            <div className="flex items-center mb-3 sm:mb-4">
                                <div className="mr-4">
                                    {typeof user.image === "string" && user.image.length > 0 ? (
                                        <img
                                            src={user.image}
                                            alt={user.name}
                                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border border-green-500/30"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center text-black font-semibold text-sm sm:text-lg border border-green-500/30">
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
                                    <p className="text-black text-xs sm:text-sm">{user.email}</p>
                                    <p className="text-black text-xs sm:text-sm flex items-center gap-1 flex-nowrap">
                                        <strong className="whitespace-nowrap">User ID:</strong>

                                        <span className="whitespace-nowrap">{user._id}</span>

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="black"
                                            strokeWidth="1.5"
                                            className="w-4 h-4 cursor-pointer hover:text-green-500 shrink-0"
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



                            <div className="mt-2">
                                {userStatsMap[user.user_id] ? (
                                    <div className="border-t border-gray-100 pt-3">

                                        {/* SINGLE KPI ROW */}
                                        <div className="flex items-center justify-between text-xs text-gray-600">

                                            {/* Accuracy */}
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                                    Accuracy
                                                </p>
                                                <p className="text-sm font-bold text-blue-600">
                                                    {userStatsMap[user.user_id].total_seen > 0
                                                        ? (
                                                            (userStatsMap[user.user_id].total_correct /
                                                                userStatsMap[user.user_id].total_seen) *
                                                            100
                                                        ).toFixed(1)
                                                        : 0}
                                                    %
                                                </p>
                                            </div>

                                            <div className="w-px h-6 bg-gray-200" />

                                            {/* Seen */}
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                                    Seen
                                                </p>
                                                <p className="font-semibold text-gray-900">
                                                    {userStatsMap[user.user_id].total_seen}
                                                </p>
                                            </div>

                                            <div className="w-px h-6 bg-gray-200" />

                                            {/* Correct */}
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                                    Correct
                                                </p>
                                                <p className="font-semibold text-green-600">
                                                    {userStatsMap[user.user_id].total_correct}
                                                </p>
                                            </div>

                                            <div className="w-px h-6 bg-gray-200" />

                                            {/* Wrong */}
                                            <div className="flex flex-col items-center">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                                                    Wrong
                                                </p>
                                                <p className="font-semibold text-red-500">
                                                    {userStatsMap[user.user_id].total_wrong}
                                                </p>
                                            </div>

                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fetchAndStoreUserStats(user.user_id)}
                                        className="mt-2 w-full text-xs font-medium text-gray-700 border border-gray-200 rounded-xl py-2 hover:bg-gray-50 transition"
                                    >
                                        {loadingStatsUserId === user.user_id
                                            ? "Loading analytics..."
                                            : "View Question Analytics"}
                                    </button>
                                )}
                            </div>




                            <p>
                                <strong>Paid User:</strong>{" "}
                                {user.is_paid ? (
                                    <span className="text-green-500 font-bold">Yes</span>
                                ) : (
                                    <span className="text-red-400 font-bold">No</span>
                                )}
                            </p>
                            <p>
                                <strong>IP Address:</strong>{" "}
                                <a
                                    href={`https://whatismyipaddress.com/ip/${user.ip_address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline break-all"
                                >
                                    {user.ip_address}
                                </a>
                            </p>

                        </div>
                    ))
                )}





            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";


type Notification = {
    _id: string;
    commentId: string;
    parentCommentId: string;
    postId: string;
    userId: string;
    replyUserId: string;
    replyNickname: string;
    message: string;
    preview: string;
    seen: boolean;
    timestamp: string;
};



export default function NotificationsPage() {

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const [expandedNotifications, setExpandedNotifications] = useState<Record<string, boolean>>({});

    const toggleNotification = (id: string) => {
        setExpandedNotifications((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };



    // FORMAT DATE AS X TIME AGO AND INDICATE IF EDITED
    const formatLocalDate = (dateString?: string, editedString?: string) => {
        if (!dateString) return "";

        let isoString = dateString.split(".")[0] + "Z";

        const date = new Date(isoString);
        const now = new Date();

        const diffMs = now.getTime() - date.getTime();

        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);


        let relativeTime = "";

        if (diffSeconds < 60)
            relativeTime = `${diffSeconds} seconds ago`;

        else if (diffMinutes < 60)
            relativeTime = `${diffMinutes} minutes ago`;

        else if (diffHours < 24)
            relativeTime = `${diffHours} hours ago`;

        else if (diffDays < 30)
            relativeTime = `${diffDays} days ago`;

        else {

            const diffMonths = Math.floor(diffDays / 30);

            if (diffMonths < 12)
                relativeTime = `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;

            else {

                const diffYears = Math.floor(diffMonths / 12);

                relativeTime =
                    `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;

            }
        }


        const edited =
            editedString &&
            editedString !== dateString;


        return (
            <span>
                {relativeTime}

                {edited && (
                    <span className="text-black text-[10px] ml-1">
                        (Edited)
                    </span>
                )}

            </span>
        );
    };



    useEffect(() => {

        async function loadNotifications() {

            const base = process.env.NEXT_PUBLIC_API_URL;


            try {

                const response = await fetch(
                    `${base}/notifications/`,
                    {
                        credentials: "include",
                    }
                );


                const data = await response.json();


                setNotifications(data ?? []);



                await fetch(
                    `${base}/notifications/read-all`,
                    {
                        method: "PATCH",
                        credentials: "include",
                    }
                );


            } catch(error) {

                console.error(
                    "Failed to load notifications",
                    error
                );

            } finally {

                setLoading(false);

            }

        }


        loadNotifications();


    }, []);




    if (loading) {

        return (
            <div className="flex-1 flex items-center justify-center min-h-screen text-black">
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




    return (

        <div className="min-h-screen bg-gray-100 flex justify-center px-4 py-10">


            <div className="w-full max-w-xl space-y-3">


                {/* HEADER */}

                <div className="flex items-center gap-3">


                    <Link
                        href="/profile"
                        title="Back"
                        className="
                    p-2
                    rounded-full
                    hover:bg-white
                    border
                    border-transparent
                    hover:border-neutral-200
                    transition
                    "
                    >

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-8 h-8"
                        >

                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 19.5 8.25 12l7.5-7.5"
                            />

                        </svg>


                    </Link>


                    <h1 className="text-xl font-semibold">
                        Notifications
                    </h1>


                </div>




                {notifications.length === 0 ? (

                    <div className="bg-white rounded-xl border p-10 text-center text-gray-500">
                        No notifications
                    </div>


                ) : (

                    notifications.map((notification) => {

                        const isExpanded =
                            expandedNotifications[notification._id];

                        const shouldTruncate =
                            notification.message?.length > 180;


                        return (

                            <Link
                                key={notification._id}
                                href={`/post/${notification.postId}`}
                                className="block"
                            >

                                <div
                                    className={`
                                relative
                                bg-white
                                rounded-xl
                                border
                                shadow-sm
                                p-4
                                transition
                                hover:bg-gray-50
                                ${
                                        !notification.seen
                                            ? "border-blue-200 bg-blue-50/30"
                                            : "border-black/10"
                                    }
                                `}
                                >


                                    {/* UNREAD DOT */}

                                    {!notification.seen && (

                                        <div
                                            className="
                                        absolute
                                        top-4
                                        right-4
                                        w-2.5
                                        h-2.5
                                        rounded-full
                                        bg-blue-600
                                        "
                                        />

                                    )}




                                    {/* WHO REPLIED */}

                                    <p className="text-sm">

                                    <span className="font-semibold text-blue-500">
                                        {notification.replyNickname}
                                    </span>

                                        {" replied"}

                                    </p>





                                    {/* ORIGINAL COMMENT */}

                                    <p
                                        className="
                                    mt-3
                                    text-xs
                                    text-gray-400
                                    italic
                                    line-clamp-2
                                    "
                                    >
                                        "{notification.preview}"
                                    </p>





                                    {/* REPLY MESSAGE */}

                                    <div className="relative">


                                        <p
                                            className={`
                                        mt-3
                                        text-base
                                        font-medium
                                        text-black
                                        whitespace-pre-wrap
                                        ${
                                                !isExpanded && shouldTruncate
                                                    ? "line-clamp-3"
                                                    : ""
                                            }
                                        `}
                                        >
                                            {notification.message}
                                        </p>



                                        {/* FADE ONLY IF TRUNCATED + NOT EXPANDED */}

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
                                                toggleNotification(notification._id);
                                            }}
                                            className="
                                        text-blue-500
                                        text-xs
                                        mt-1
                                        "
                                        >

                                            {isExpanded
                                                ? "Show less"
                                                : "See more"}

                                        </button>

                                    )}






                                    {/* TIME */}

                                    <p className="text-xs text-gray-400 mt-3">

                                        {formatLocalDate(notification.timestamp)}

                                    </p>



                                </div>


                            </Link>


                        );

                    })

                )}



            </div>


        </div>

    );

}
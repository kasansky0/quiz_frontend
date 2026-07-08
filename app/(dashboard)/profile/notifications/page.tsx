"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = {
    id: string;
    fromNickname: string;
    message: string;
    preview: string;
    postId: string;
    seen: boolean;
    timestamp: string;
};


export default function NotificationsPage() {

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        async function loadNotifications() {

            const base = process.env.NEXT_PUBLIC_API_URL;

            try {

                // Get notifications first
                const response = await fetch(
                    `${base}/notifications/`,
                    {
                        credentials: "include",
                    }
                );


                const data = await response.json();


                setNotifications(data ?? []);



                // Mark all notifications as seen after fetching
                await fetch(
                    `${base}/notifications/read-all`,
                    {
                        method: "PATCH",
                        credentials: "include",
                    }
                );


            } catch (error) {

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
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                Loading...
            </div>
        );
    }



    return (
        <div className="min-h-screen bg-gray-100 flex justify-center px-4 py-10">

            <div className="w-full max-w-xl">


                {/* HEADER */}
                <div className="bg-white rounded-t-xl border p-5">

                    <Link
                        href="/profile"
                        className="text-blue-600 text-sm hover:underline"
                    >
                        ← Back to profile
                    </Link>


                    <h1 className="text-xl font-semibold mt-4">
                        Notifications
                    </h1>

                </div>



                {/* LIST */}
                <div className="bg-white border border-t-0 rounded-b-xl divide-y">


                    {notifications.length === 0 ? (

                        <div className="p-10 text-center text-gray-500">
                            No notifications
                        </div>

                    ) : (

                        notifications.map((notification) => (

                            <Link
                                key={notification.id}
                                href={`/post/${notification.postId}`}
                            >

                                <div
                                    className={`
                                    flex
                                    items-start
                                    gap-4
                                    p-5
                                    hover:bg-gray-50
                                    transition
                                    cursor-pointer
                                    ${!notification.seen ? "bg-blue-50/40" : ""}
                                    `}
                                >

                                    {/* CONTENT */}

                                    <div className="flex-1">


                                        <p className="text-sm">

                                            <span className="font-semibold">
                                                {notification.fromNickname}
                                            </span>{" "}

                                            <span className="text-gray-700">
                                                {notification.message}
                                            </span>

                                        </p>



                                        <p className="text-sm text-gray-500 mt-1">
                                            "{notification.preview}"
                                        </p>



                                        <p className="text-xs text-gray-400 mt-2">
                                            {notification.timestamp}
                                        </p>


                                    </div>



                                    {/* UNREAD DOT */}

                                    {!notification.seen && (

                                        <div
                                            className="
                                            w-2.5
                                            h-2.5
                                            rounded-full
                                            bg-blue-600
                                            mt-3
                                            shrink-0
                                            "
                                        />

                                    )}


                                </div>

                            </Link>

                        ))

                    )}


                </div>


            </div>

        </div>
    );
}